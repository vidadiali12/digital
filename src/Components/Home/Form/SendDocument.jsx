import api from "../../api";
import { Client } from "@stomp/stompjs";
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
        if (mainItem?.containsForm) {
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
        }, 1200);
    } catch (err) {
        setModalValues(prev => (
            {
                ...prev,
                message: `❌ Sənəd göndərilərkən xəta baş verdi. \n⚠️ ${err?.response?.data?.errorDescription || err} \nYenidən yoxlayın`,
                isQuestion: false,
                showModal: true
            }
        ));
        if (err?.response?.data?.errorDescription?.toLowerCase().includes("wrong password")) {
            setReceiver(false)
        }
        setLoading(false);
    }

    // setLoading(true);

    // try {
    //     // 1️⃣ Token və server public key yoxlanışı
    //     const token = localStorage.getItem("myUserDocumentToken");
    //     if (!token) throw new Error("Token tapılmadı");

    //     const serverPublicKeyBase64 = localStorage.getItem("serverPublicKey");
    //     if (!serverPublicKeyBase64) throw new Error("Server public key tapılmadı");

    //     // 2️⃣ AES açar yaradılır
    //     const aesKey = await window.crypto.subtle.generateKey(
    //         { name: "AES-CBC", length: 256 },
    //         true,
    //         ["encrypt", "decrypt"]
    //     );
    //     const rawAesKeyBuffer = await window.crypto.subtle.exportKey("raw", aesKey);

    //     // 3️⃣ Request JSON hazırlanır
    //     if (mainItem?.id == null) throw new Error("hi Excel data çevrilərkən problem yaşandı. Yenidən yoxlayın");
    //     if (mainItem?.containsForm && mainForm.length === 0) throw new Error("hi Excel data çevrilərkən problem yaşandı. Yenidən yoxlayın");

    //     const requestDataJson = {
    //         pdfBase64: dcryptdStrng?.pdfBase64,
    //         receiverId: receiver?.id,
    //         chapterId: mainItem?.id,
    //         description: description,
    //         forum: { forms: mainForm },
    //         userCsr: dcryptdStrng?.csr
    //     };

    //     // 4️⃣ AES + RSA şifrələmə
    //     const { cipherText, iv } = await encryptDataWithAes(requestDataJson, aesKey);
    //     const encryptedKey = await encryptKeyWithRsa(rawAesKeyBuffer, serverPublicKeyBase64);

    //     // 5️⃣ STOMP WebSocket client
    //     const client = new Client({
    //         brokerURL: 'ws://localhost:9098/ws', // Lokal test üçün plain ws:// istifadə et
    //         connectHeaders: { Authorization: `Bearer ${token}` },
    //         debug: (str) => console.log(str),
    //         reconnectDelay: 5000
    //     });

    //     client.onConnect = () => {
    //         console.log('STOMP WebSocket bağlantısı açıldı');

    //         // Subscribe
    //         client.subscribe(`/topic/dm.${userId}.${username}`, (message) => {
    //             const body = JSON.parse(message.body);
    //             console.log('Server cavabı:', body);

    //             setShowForm(false);
    //             setShowDocument(false);
    //             setReceiver(false);
    //             setModalValues(prev => ({
    //                 ...prev,
    //                 message: "Sənəd uğurla göndərildi ✅",
    //                 isQuestion: false,
    //                 showModal: true
    //             }));

    //             setTimeout(() => window.location.reload(), 1200);
    //         });

    //         // Send
    //         const payload = JSON.stringify({ cipherText, key: encryptedKey, iv });
    //         client.publish({ destination: '/dm.send', body: payload });
    //     };

    //     client.onStompError = (frame) => {
    //         console.error('STOMP xəta:', frame.headers['message'], frame.body);
    //         setModalValues(prev => ({
    //             ...prev,
    //             message: `❌ Sənəd göndərilərkən xəta baş verdi. \n⚠️ ${frame.headers['message'] || frame.body}`,
    //             isQuestion: false,
    //             showModal: true
    //         }));
    //         setLoading(false);
    //     };

    //     client.onWebSocketClose = (event) => {
    //         console.log('STOMP WebSocket bağlantısı bağlandı', event);
    //         setLoading(false);
    //     };

    //     client.activate();

    // } catch (err) {
    //     console.error(err);
    //     setModalValues(prev => ({
    //         ...prev,
    //         message: `❌ Sənəd göndərilərkən xəta baş verdi. \n⚠️ ${err?.message || err}`,
    //         isQuestion: false,
    //         showModal: true
    //     }));
    //     setLoading(false);
    // }

}