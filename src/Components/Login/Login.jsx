import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../Images/Logos/logo.png';
import './Login.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import {
    encryptDataWithAes,
    encryptKeyWithRsa,
    decryptDataWithAes,
    decryptKeyWithRsa,
    repairSecretKey2,
    cleanBase64,
    decryptWithSecretKey,
    importRSAPrivateKey,
    generateCsr
} from '../Functions/Functions';
import api from '../api';
import Loading from '../Modals/Loading';

const Login = ({ setToken, setItem, setModalValues, setUserObj }) => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [errMsg, setErrMsg] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("Daxil ol");

    const fetchServerPublicKey = async () => {
        try {
            const keyBase64 = await api.get('/pki/getServerPublicKey')
            localStorage.setItem("serverPublicKey", keyBase64?.data);
            return keyBase64?.data;
        } catch (err) {
            setModalValues(prev => (
                {
                    ...prev,
                    message: `❌ Server Public Key-i yükləmə xətası: 
                    \n⚠️${err?.response?.data?.errorDescription || err
                        }. \nYenidən yoxlayın!`,
                    isQuestion: false,
                    showModal: true
                }
            ))
            return null;
        }
    };

    const login = async (e) => {
        e.preventDefault();
        setErrMsg(null);
        setError("Daxil olunur...");

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!username || !password) {
            setErrMsg("İstifadəçi adı və ya parol boş qala bilməz");
            return;
        }

        try {
            const serverPublicKeyBase64 = localStorage.getItem("serverPublicKey") || await fetchServerPublicKey();
            if (!serverPublicKeyBase64) return setErrMsg("Server public key yoxdur!");

            const clientKey = await window.crypto.subtle.generateKey(
                { name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
                true,
                ["encrypt", "decrypt"]
            );

            const pkcs8Buffer = await window.crypto.subtle.exportKey("pkcs8", clientKey.privateKey);

            function arrayBufferToBase64(buffer) {
                const bytes = new Uint8Array(buffer);
                let binary = '';
                for (let i = 0; i < bytes?.length; i++) binary += String.fromCharCode(bytes[i]);
                return btoa(binary);
            }

            const privateKeyBase64 = arrayBufferToBase64(pkcs8Buffer);
            localStorage.setItem("clientPrivateKey", privateKeyBase64);

            const exportedPublicKey = await window.crypto.subtle.exportKey("spki", clientKey.publicKey);
            const clientPublicKeyBase64 = arrayBufferToBase64(exportedPublicKey);

            const requestDataJson = { username, password, clientPublicKey: clientPublicKeyBase64 };
            const aesKey = await window.crypto.subtle.generateKey({ name: "AES-CBC", length: 256 }, true, ["encrypt", "decrypt"]);
            const rawAesKeyBuffer = await window.crypto.subtle.exportKey("raw", aesKey);

            const { cipherText, iv } = await encryptDataWithAes(requestDataJson, aesKey);
            const encryptedKey = await encryptKeyWithRsa(rawAesKeyBuffer, serverPublicKeyBase64);

            const response = await api.put("/auth/signIn", { cipherText, key: encryptedKey, iv }, { headers: { 'Content-Type': 'application/json' } });
            if (!response?.data?.data?.cipherText) return setErrMsg("❌ Cavab formatı doğru deyil");

            function base64ToArrayBuffer(b64) {
                const binary = atob(b64);
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
                return bytes.buffer;
            }

            const pkcs8ArrayBuffer = base64ToArrayBuffer(localStorage.getItem("clientPrivateKey"));
            const importedPrivateKey = await window.crypto.subtle.importKey(
                "pkcs8",
                pkcs8ArrayBuffer,
                { name: "RSA-OAEP", hash: "SHA-256" },
                false,
                ["decrypt"]
            );

            const decryptedKeyBuffer = await decryptKeyWithRsa(response?.data?.data?.key, importedPrivateKey);
            const decryptedString = await decryptDataWithAes(response?.data?.data?.cipherText, response?.data?.data?.iv, decryptedKeyBuffer);
            const responseModel = JSON.parse(decryptedString);

            localStorage.setItem("salt", responseModel?.salt);
            localStorage.setItem("iv", responseModel?.iv);
            localStorage.setItem("privateKeyRslt", responseModel?.privateKey)
            localStorage.setItem("myUserDocumentToken", responseModel?.accessToken);
            localStorage.setItem("tokenExpiration", responseModel?.tokenExpiration);
            localStorage.setItem("firstLogin", 1);

            setItem({ pswd: password })

            const token = responseModel?.accessToken
            if (!token) return;

            const fetchUserData = async () => {
                try {

                    setLoading(true);

                    const response = await api.get('/auth/getMe', {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    localStorage.setItem("userObj", JSON.stringify(response?.data?.data));
                    setUserObj(JSON.stringify(response?.data?.data))

                    function base64UrlToBase64(base64Url) {
                        let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                        while (base64.length % 4) base64 += '=';
                        return base64;
                    }

                    const csr = await generateCsr({
                        name: response?.data?.data?.name,
                        surname: response?.data?.data?.surname,
                        father: response?.data?.data?.father,
                        fin: response?.data?.data?.fin,
                        password: password
                    });

                    localStorage.setItem("csr", csr)

                    if (!csr) throw new Error('❌ "CSR yaradıla bilmədi"');

                    const secretKey = await repairSecretKey2(csr, localStorage.getItem("salt"));

                    const ivBase64 = cleanBase64(base64UrlToBase64(localStorage.getItem("iv")));
                    const cipherBase64 = cleanBase64(base64UrlToBase64(localStorage.getItem("privateKeyRslt")));

                    const decryptedBytes = await decryptWithSecretKey(secretKey, ivBase64, cipherBase64);

                    const privateKey = await importRSAPrivateKey(decryptedBytes);

                    const pkcs8 = await crypto.subtle.exportKey("pkcs8", privateKey);
                    const bytes = new Uint8Array(pkcs8);

                    let bin = "";
                    bytes.forEach(b => bin += String.fromCharCode(b));

                    localStorage.setItem("privateKeyLast", btoa(bin));
                    navigate("/")
                } catch (err) {
                    setErrMsg("İstifadəçi məlumatları alınarkən xəta baş verdi.");
                    navigate("/login", { replace: true });
                } finally {
                    setLoading(false);
                }
            };

            fetchUserData();
            setToken(responseModel?.accessToken);
            navigate("/");
            setError("Daxil ol")

        } catch (err) {
            setErrMsg(`❌ Xəta baş verdi:
                    \n⚠️${err?.response?.data?.errorDescription || err
                }. \n${err?.response?.data?.errorDescription.includes("hesab")
                    || err?.response?.data?.errorDescription.includes("locked") ? "" : ""
                } Yenidən yoxlayın!`);
        }
    };

    return (
        loading ? <Loading loadingMessage={"Məlumatlar əldə edilir..."} /> :
            <div className="login-container">
                <form onSubmit={login}>
                    <div className="login-header">
                        <img src={logo} alt="logo" />
                        <h1>Elektron Sənəd Dövriyyəsi</h1>
                    </div>

                    <label htmlFor="username">
                        <span>İstifadəçi adı</span>
                        <input type="text" id="username" placeholder="İstifadəçi adınızı daxil edin" />
                    </label>

                    <label htmlFor="password">
                        <span>Parol</span>
                        <div className="password-wrapper">
                            <input type={showPassword ? "text" : "password"} id="password" placeholder="Parolunuzu daxil edin" autoComplete="off" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                    </label>

                    <button type="submit">{error}</button>
                    {errMsg && <div className="error-message">{errMsg}</div>}
                </form>
            </div>
    );
};

export default Login;
