import { generateCsr } from "../../Functions/Functions";

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
                ${err?.response?.data?.errorDescription === "Tag mismatch"
                        ? "\n⚠️ Parol Yanlışdır!" :
                        `\n${err?.response?.data?.errorDescription}`}`,
                isQuestion: false,
                showModal: true
            }
        ))
    }
    finally {
        setLoading(false)
    }

}
