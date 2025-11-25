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

        if (!csr) throw new Error('❌ CSR yaradıla bilmədi');

        const requestDataJson = {
            pdfBase64,
            csr
        };

        setDcryptdStrng(requestDataJson)

        setReceiver(true)

    } catch (err) {
        setModalValues(prev => (
            {
                ...prev,
                message: `❌ Sənəd göndərilərkən xəta baş verdi. Yenidən yoxlayın (İmza problemi) 
                ${err?.response?.data?.errorDescription === "Tag mismatch" ? "⚠️ Parol Yanlışdır!" : err?.response?.data?.errorDescription}`,
                isQuestion: false,
                showModal: true
            }
        ))
    }
    finally {
        setLoading(false)
    }

}
