import React, { useEffect, useState } from "react";
import "./GetDocument.css";
import api from "../../api";
import { FiX } from "react-icons/fi";
import { IoIosShareAlt } from "react-icons/io";
import { FaEdit } from "react-icons/fa";
import { decryptDataWithAes, decryptKeyWithRsa, encryptDataWithAes, encryptKeyWithRsa } from "../../Functions/Functions";
import GetReceivers from "../Form/GetReceivers";
import { sendDoc } from "../Form/SendDocument";
import WithPassword from "../Form/WithPassword";
import { signDoc } from "../Form/signDocument";
import Loading from "../../Modals/Loading";
import Form from "../Form/Form";


const GetDocument = ({ setShowDocument, setModalValues, choosenDoc, whoIs, item }) => {
  const [docElements, setDocElements] = useState(null);
  const [signDetail, setSignDetail] = useState([]);
  const [pdfUrl, setPdfUrl] = useState("");
  const [showForm, setShowForm] = useState(null)
  const [loading, setLoading] = useState(null)
  const [dcryptdStrng, setDcryptdStrng] = useState("")
  const [showPasswordAlert, setShowPasswordAlert] = useState(null)
  const [receiver, setReceiver] = useState(null)
  const [pdfBase64, setPdfBase64] = useState("");
  const [docList, setDocList] = useState(null);

  const callDoc = async () => {
    if (!choosenDoc?.id) return;
    setLoading(true);
    try {
      const tokenGet = localStorage.getItem("myUserDocumentToken");
      if (!tokenGet) return;

      const hdrs = { Authorization: `Bearer ${tokenGet}` };

      const rsp = await api.get(`/doc/getDocumentDetails/${choosenDoc.id}`, { headers: hdrs });
      const element = rsp.data.data;
      setDocElements(element);

      const importedServerPrivateKeyB64 = localStorage.getItem("privateKeyLast");
      if (!importedServerPrivateKeyB64) throw new Error("Private key tapılmadı");

      const pkcs8ArrayBuffer = Uint8Array.from(atob(importedServerPrivateKeyB64), c => c.charCodeAt(0));
      const importedPrivateKey = await window.crypto.subtle.importKey("pkcs8", pkcs8ArrayBuffer, { name: "RSA-OAEP", hash: "SHA-256" }, false, ["decrypt"]);
      const decryptedKeyBuffer = await decryptKeyWithRsa(element.encAesKey, importedPrivateKey);
      const decryptedBase64 = await decryptDataWithAes(element.encPdfData, element.encIv, decryptedKeyBuffer);
      setDcryptdStrng(decryptedBase64);

      const binary = atob(decryptedBase64);
      const byteArray = Uint8Array.from(binary, c => c.charCodeAt(0));
      setArrayBuffer(byteArray)
      const blob = new Blob([byteArray], { type: "application/pdf" });
      setPdfUrl(URL.createObjectURL(blob));
      const base64String = btoa(new Uint8Array(byteArray).reduce((data, byte) => data + String.fromCharCode(byte), ""));
      setPdfBase64(base64String);

      if (element.hasForum) {
        try {
          const docsList = await api.get(`/doc/form/getDocForm/${choosenDoc?.id}`, { headers: hdrs });
          const docsListRes = docsList.data.data;
          const importedPrivateKeyB64PK = localStorage.getItem("clientPrivateKey");
          if (!importedPrivateKeyB64PK) throw new Error("Private key tapılmadı");

          const pkcs8ArrayBufferPK = Uint8Array.from(atob(importedPrivateKeyB64PK), c => c.charCodeAt(0));
          const importedPrivateKeyPK = await window.crypto.subtle.importKey("pkcs8", pkcs8ArrayBufferPK, { name: "RSA-OAEP", hash: "SHA-256" }, false, ["decrypt"]);

          const decryptedDocList = await decryptKeyWithRsa(docsListRes?.key, importedPrivateKeyPK);
          const decryptedList = await decryptDataWithAes(docsListRes?.cipherText, docsListRes?.iv, decryptedDocList);
          setDocList(JSON.parse(decryptedList));
        } catch (err) {
          setModalValues(prev => ({
            ...prev,
            message: '❌ İstifadəçilər alınarkən xəta baş verdi. Yenidən yoxlayın!',
            isQuestion: false,
            showModal: true
          }))
        }
      }

      try {
        const serverPublicKeyBase64 = localStorage.getItem("serverPublicKey");
        const aesKey = await window.crypto.subtle.generateKey({ name: "AES-CBC", length: 256 }, true, ["encrypt", "decrypt"]);
        const rawAesKeyBuffer = await window.crypto.subtle.exportKey("raw", aesKey);
        const { cipherText, iv } = await encryptDataWithAes(decryptedBase64, aesKey);
        const encryptedKey = await encryptKeyWithRsa(rawAesKeyBuffer, serverPublicKeyBase64);

        const sigRsp = await api.post("/doc/verifyDoc", { cipherText, key: encryptedKey, iv }, { headers: { Authorization: `Bearer ${tokenGet}` } });
        setSignDetail(sigRsp?.data?.data || []);

        if (whoIs === "getDoc") {
          try {
            await api.put(`/doc/readDoc/${choosenDoc?.id}`, { headers: { Authorization: tokenGet } });
          } catch (err) {
            console.error(err);
          }
        }
      } catch (err) {
        setModalValues(prev => ({
          ...prev,
          message: '❌ PDF məlumatları alınarkən xəta baş verdi. Yenidən yoxlayın!',
          isQuestion: false,
          showModal: true
        }))
      }

    } catch (err) {
      setModalValues(prev => ({
        ...prev,
        message: '❌ Sənəd məlumatları alınarkən xəta baş verdi. Yenidən yoxlayın!',
        isQuestion: false,
        showModal: true
      }))
    } finally {
      setLoading(false);
    }
  };



  const closeDetails = () => {
    setShowDocument(false)
    if (whoIs === "getDoc" && !docElements?.read) {
      window.location.reload()
    }
  }

  const shareDoc = () => {
    setShowPasswordAlert(true)
  }

  useEffect(() => {
    callDoc();
  }, [choosenDoc]);

  const sendDocumend = async (receiver, description) => {
    const mainForm = docList?.forms;
    await sendDoc({
      description,
      receiver,
      setLoading,
      itemId: docElements?.chapter?.id,
      dcryptdStrng,
      mainForm,
      setShowForm,
      setModalValues,
      setReceiver,
      setShowDocument
    });
  }

  const signDocument = async (pwd) => {
    await signDoc({
      pwd,
      pdfBase64,
      setLoading,
      setShowPasswordAlert,
      setDcryptdStrng,
      setReceiver,
      setModalValues
    })
  };


  const editAndShareDoc = () => {
    setShowForm(true)
  }

  return (
    loading ? <Loading loadingMessage={"Üzərində iş gedir..."} /> : <div className="doc-modal">
      <div className="doc-container">

        <FiX className="close-modal-btn" onClick={closeDetails} />

        < div className="left-panel" >
          <h3 className="section-title">Sənəd</h3>

          <div className="share-box">
            <IoIosShareAlt className="share-box-icons" onClick={shareDoc} />
            <FaEdit className="share-box-icons" onClick={editAndShareDoc} />
          </div>

          <div className="pdf-wrapper">
            <embed
              src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
              type="application/pdf"
              width="100%"
              height="100%"
            />
          </div>

          {
            docElements && (
              <div className="doc-info">

                <h4 className="info-title">Sənəd məlumatları</h4>
                <p><span className="label">Sənəd No:</span> {docElements?.documentNo}</p>
                <p><span className="label">Tarix:</span> {docElements?.date}</p>

                <div className="info-box">
                  <div className="info-title-box">
                    <h4 className="info-title">Göndərən</h4>
                    <p><span className="label">Ad Soyad Ata adı:</span> {docElements?.sender.name} {docElements?.sender?.surname} {docElements?.sender?.father}</p>
                    <p><span className="label">Vəzifə:</span> {docElements?.sender?.position}</p>
                    <p><span className="label">İdarə:</span> {docElements?.sender?.management?.name}</p>
                    <p><span className="label">Rütbə:</span> {docElements?.sender?.rank?.description}</p>
                  </div>

                  <div className="info-title-box">
                    <h4 className="info-title">Qəbul edən</h4>
                    <p><span className="label">Ad Soyad Ata adı:</span> {docElements?.receiver?.name} {docElements?.receiver?.surname} {docElements?.receiver?.father}</p>
                    <p><span className="label">Vəzifə:</span> {docElements?.receiver?.position}</p>
                    <p><span className="label">İdarə:</span> {docElements?.receiver?.management?.name}</p>
                    <p><span className="label">Rütbə:</span> {docElements?.receiver?.rank?.description}</p>
                  </div>
                </div>

              </div>
            )
          }
        </div >

        <div className="right-panel">
          <h3 className="section-title">İmzalar</h3>
          {signDetail?.map((sig, index) => {
            const ok = sig?.verified && sig?.timestampVerified;
            return (
              <div key={index} className={`sign-card ${ok ? "ok" : "error"}`}>
                <div className="sign-header">
                  <span className="sign-index">İmza #{index + 1}</span>
                  <span className="sign-status">{ok ? "✔" : "✖"}</span>
                </div>

                <p><span className="label">Ad / Soyad / Ata / Fin:</span> {sig?.signerName?.commonName}</p>
                <p><span className="label">Tarix:</span> {sig?.date}</p>
                <p><span className="label">Səbəb:</span> {sig?.reason}</p>
                <p><span className="label">Yer:</span> {sig?.location}</p>

                {!ok && (
                  <div className="error-msg">
                    {!sig?.verified && "İmza etibarsızdır. "}
                    {!sig?.timestampVerified && "Timestamp təsdiqlənmədi. "}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div >
      {
        showPasswordAlert && (
          <WithPassword visible={showPasswordAlert} onSend={signDocument} onClose={() => setShowPasswordAlert(false)} />
        )
      }
      {
        receiver && (
          <GetReceivers
            visible={receiver}
            onClose={() => setReceiver(false)}
            pdf={pdfUrl}
            onSend={sendDocumend}
            setModalValues={setModalValues}
          />
        )
      }

      {
        showForm && (
          <Form userObj={JSON.parse(localStorage.getItem("userObj"))} item={item} setShowForm={setShowForm} setModalValues={setModalValues} fromDocDetail={docList?.forms} chapter={docElements?.chapter} />
        )
      }
    </div >
  );
};

export default GetDocument;
