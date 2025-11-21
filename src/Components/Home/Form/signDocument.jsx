import api from "../../api";
import { decryptDataWithAes, decryptKeyWithRsa, encryptDataWithAes, encryptKeyWithRsa, generateCsr } from "../../Functions/Functions";

export const signDoc = async ({
    pwd,
    pdfBase64,
    setLoading,
    setShowPasswordAlert,
    setDcryptdStrng,
    setReceiver,
    setModalValues
}) => {
    try {
        setShowPasswordAlert(false);
        setLoading(true)

        const token = localStorage.getItem("myUserDocumentToken");
        if (!token) throw new Error("Token tapılmadı");

        const serverPublicKeyBase64 = localStorage.getItem("serverPublicKey");
        if (!serverPublicKeyBase64) throw new Error("Server public key tapılmadı");

        const aesKey = await window.crypto.subtle.generateKey(
            { name: "AES-CBC", length: 256 },
            true,
            ["encrypt", "decrypt"]
        );
        const rawAesKeyBuffer = await window.crypto.subtle.exportKey("raw", aesKey);

        const csr = await generateCsr({
            name: JSON.parse(localStorage.getItem("userObj"))?.name,
            surname: JSON.parse(localStorage.getItem("userObj"))?.surname,
            father: JSON.parse(localStorage.getItem("userObj"))?.father,
            fin: JSON.parse(localStorage.getItem("userObj"))?.fin,
            password: pwd
        });

        if (!csr) throw new Error('❌ "CSR yaradıla bilmədi"');

        const requestDataJson = {
            pdfBase64,
            csr,
        };

        const { cipherText, iv } = await encryptDataWithAes(
            requestDataJson,
            aesKey
        );

        const encryptedKey = await encryptKeyWithRsa(
            rawAesKeyBuffer,
            serverPublicKeyBase64
        );

        const response = await api.post(
            '/doc/signDoc',
            { cipherText, key: encryptedKey, iv },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const responseData = response.data.data;

        const importedServerPrivateKeyB64 = localStorage.getItem("clientPrivateKey");
        if (!importedServerPrivateKeyB64) throw new Error("❌ Private key tapılmadı!");

        function base64ToArrayBuffer(b64) {
            const binary = atob(b64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            return bytes.buffer;
        }

        const pkcs8ArrayBuffer = base64ToArrayBuffer(importedServerPrivateKeyB64);

        const importedPrivateKey = await window.crypto.subtle.importKey(
            "pkcs8",
            pkcs8ArrayBuffer,
            { name: "RSA-OAEP", hash: "SHA-256" },
            false,
            ["decrypt"]
        );


        const decryptedKeyBuffer = await decryptKeyWithRsa(responseData.key, importedPrivateKey);
        const decryptedString = await decryptDataWithAes(responseData.cipherText, responseData.iv, decryptedKeyBuffer);

        setDcryptdStrng(decryptedString)

        setReceiver(true)

    } catch (err) {
        setModalValues(prev => (
            {
                ...prev,
                message: `❌ Sənəd göndərilərkən xəta baş verdi. Yenidən yoxlayın (İmza problemi) ${err}`,
                isQuestion: false,
                showModal: true
            }
        ))
    }
    finally {
        setLoading(false)
    }

}
