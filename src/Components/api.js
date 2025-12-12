import axios from "axios";
import {
  encryptDataWithAes,
  encryptKeyWithRsa,
  decryptDataWithAes,
  decryptKeyWithRsa
} from "./Functions/Functions";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://localhost:9098',
  withCredentials: true,
});

const rawApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://localhost:9098',
  withCredentials: true,
});

let isRefreshing = false;
let refreshPromise = null;

api.interceptors.request.use(async (config) => {
  let token = localStorage.getItem("myUserDocumentToken");
  let expiration = localStorage.getItem("tokenExpiration");
  const firstLogin = localStorage.getItem("firstLogin");

  if (token && expiration) {
    const now = new Date();
    const [weekday, monthStr, ed, time, gmt, ey] = expiration.split(" ");
    const [eh, emin, second] = time.split(":").map(Number);
    const monthMap = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
    const expDate = new Date(ey, monthMap[monthStr], Number(ed), eh, emin, second);

    let diffMinutes = (expDate - now) / 1000 / 60;

    if (firstLogin) {
      if (emin <= now.getMinutes() && eh === now.getHours()) {
        diffMinutes = emin - now.getMinutes() + 15;
      } else if (eh !== now.getHours()) {
        diffMinutes = 15 - (60 - emin + now.getMinutes());
      }
      diffMinutes = Math.max(0, diffMinutes);
    }

    console.log(expDate, now)
    console.log(diffMinutes)
    if (diffMinutes <= 1) {
      if (!isRefreshing) {
        localStorage.removeItem("firstLogin");
        isRefreshing = true;

        refreshPromise = (async () => {
          try {
            const serverPublicKeyBase64 = localStorage.getItem("serverPublicKey");
            if (!serverPublicKeyBase64) throw new Error("Server public key tapılmadı");

            const clientPrivateKeyBase64 = localStorage.getItem("clientPrivateKey");
            if (!clientPrivateKeyBase64) throw new Error("Client private key tapılmadı");

            function base64ToArrayBuffer(b64) {
              const binary = atob(b64);
              const bytes = new Uint8Array(binary.length);
              for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
              return bytes.buffer;
            }

            const clientPrivateKeyArrayBuffer = base64ToArrayBuffer(clientPrivateKeyBase64);

            const requestDataJson = { accessToken: token };

            const aesKey = await window.crypto.subtle.generateKey(
              { name: "AES-CBC", length: 256 },
              true,
              ["encrypt", "decrypt"]
            );
            const rawAesKeyBuffer = await window.crypto.subtle.exportKey("raw", aesKey);

            const { cipherText, iv } = await encryptDataWithAes(requestDataJson, aesKey);
            if (!iv) throw new Error("AES IV tapılmadı");

            const encryptedKey = await encryptKeyWithRsa(rawAesKeyBuffer, serverPublicKeyBase64);

            const response = await rawApi.put("/auth/renewToken", { cipherText, key: encryptedKey, iv }, {
              headers: { 'Content-Type': 'application/json' }
            });

            if (!response.data.data?.cipherText) throw new Error("Cavab formatı doğru deyil");

            const importedPrivateKey = await window.crypto.subtle.importKey(
              "pkcs8",
              clientPrivateKeyArrayBuffer,
              { name: "RSA-OAEP", hash: "SHA-256" },
              false,
              ["decrypt"]
            );

            const decryptedKeyBuffer = await decryptKeyWithRsa(response?.data?.data?.key, importedPrivateKey);

            const decryptedString = await decryptDataWithAes(response?.data?.data?.cipherText, response?.data?.data?.iv, decryptedKeyBuffer);

            const responseModel = JSON.parse(decryptedString);

            localStorage.setItem("myUserDocumentToken", responseModel?.accessToken);
            localStorage.setItem("tokenExpiration", responseModel?.tokenExpiresIn);

            console.log("✅ Token yeniləndi:", responseModel?.tokenExpiresIn);

          } catch (err) {
            console.log("❌ Token yenilənmədi:", err);
            localStorage.clear()
          } finally {
            isRefreshing = false;
            refreshPromise = null;
          }
        })();
      }

      await refreshPromise;
    }

    config.headers.Authorization = `Bearer ${localStorage.getItem("myUserDocumentToken")}`;
  }

  return config;
}, (error) => Promise.reject(error));

export { refreshPromise };
export default api;
