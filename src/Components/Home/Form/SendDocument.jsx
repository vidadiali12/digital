import api from "../../api";
import { encryptDataWithAes, encryptKeyWithRsa } from "../../Functions/Functions";

export const sendDoc = async ({
    description,
    receiver,
    setLoading,
    mainItem,
    dcryptdStrng,
    mainForm,
    setShowForm,
    setModalValues,
    setReceiver,
    setShowDocument
}) => {
    try {
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

        if (mainItem?.id == null) throw new Error("hi Excel data çevrilərkən problem yaşandı. Yenidən yoxlayın");
        if (mainItem?.title === "İstifadəçi yaradılması") {
            if (mainForm.length == 0) {
                throw new Error("hi Excel data çevrilərkən problem yaşandı. Yenidən yoxlayın");
            }
        }

        const requestDataJson = {
            pdfBase64: dcryptdStrng?.pdfBase64,
            receiverId: receiver?.id,
            chapterId: mainItem?.id,
            description: description,
            forum: {
                forms: mainForm
            },
            userCsr: dcryptdStrng?.csr
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
            '/doc/sendDoc',
            { cipherText, key: encryptedKey, iv },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        setShowForm(false)
        setShowDocument(false)
        setReceiver(false)
        const responseData = response?.data?.data;

        setModalValues(prev => (
            {
                ...prev,
                message: "Sənəd uğurla göndərildi ✅",
                isQuestion: false,
                showModal: true
            }
        ))

        setTimeout(() => {
            window.location.reload()
        }, 1200)
    } catch (err) {
        setModalValues(prev => (
            {
                ...prev,
                message: `❌ Sənəd göndərilərkən xəta baş verdi. Yenidən yoxlayın ${err}`,
                isQuestion: false,
                showModal: true
            }
        ));
        setLoading(false);
    }
}