import React, { useEffect, useRef, useState } from "react";
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
import { FiDownload } from 'react-icons/fi';

import * as pdfjsLib from "pdfjs-dist/build/pdf";
import workerSrc from "pdfjs-dist/build/pdf.worker?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;



const GetDocument = ({ showDocument, setShowDocument, setModalValues, choosenDoc, whoIs, item, connectNow, setConnectNow }) => {
  const [docElements, setDocElements] = useState(null);
  const [signDetail, setSignDetail] = useState([]);
  const [pdfUrl, setPdfUrl] = useState("");
  const [showForm, setShowForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dcryptdStrng, setDcryptdStrng] = useState("");
  const [showPasswordAlert, setShowPasswordAlert] = useState(false);
  const [receiver, setReceiver] = useState(false);
  const [pdfBase64, setPdfBase64] = useState("");
  const [docList, setDocList] = useState(null);

  const [userItem, setUserItem] = useState(null);

  async function renderPdfToCanvas(pdfBase64) {
    if (!pdfBase64) return;

    const pdfWrapper = document.getElementsByClassName("pdf-wrapper")[0];
    if (!pdfWrapper) return;

    pdfWrapper.innerHTML = "";

    try {
      const pdfData = Uint8Array.from(atob(pdfBase64), c => c.charCodeAt(0));
      const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;

      const wrapperWidth = pdfWrapper.offsetWidth || 600;

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);

        const viewport = page.getViewport({ scale: 1 });
        const scale = wrapperWidth / viewport.width;
        const scaledViewport = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;
        canvas.style.width = "100%";
        canvas.style.display = "block";
        canvas.style.marginBottom = "16px";

        pdfWrapper.appendChild(canvas);

        await page.render({
          canvasContext: context,
          viewport: scaledViewport,
        }).promise;
      }
      console.log("PDF rendered successfully!");
    } catch (err) {
      console.error("PDF render error:", err);
    }
  }


  const downloadPdf = () => {
    try {
      const binaryString = atob(dcryptdStrng);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const blob = new Blob([bytes], { type: "application/pdf" });

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${docElements?.documentNo || "document"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

    } catch (err) {
      console.error("PDF endirilərkən xəta:", err);
      setModalValues(prev => ({
        ...prev,
        message: '❌ PDF endirilərkən xəta baş verdi!',
        isQuestion: false,
        showModal: true
      }));
    }
  };

  function cleanBase64(str) {
    return str?.replace(/[\r\n\t ]+/g, "").replace(/^"+|"+$/g, "").trim();
  }

  function base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  async function importPrivateKey() {
    const privateB64 = localStorage.getItem("clientPrivateKey");
    if (!privateB64) throw new Error("Private key tapılmadı!");
    const pkcs8 = base64ToArrayBuffer(privateB64);
    return await window.crypto.subtle.importKey(
      "pkcs8",
      pkcs8,
      { name: "RSA-OAEP", hash: "SHA-256" },
      false,
      ["decrypt"]
    );
  }

  async function firstDecrypt(responseData) {
    const privateKey = await importPrivateKey();
    const decryptedAES = await decryptKeyWithRsa(responseData.encAesKey, privateKey);
    const decryptedText = await decryptDataWithAes(responseData.encPdfData, responseData.encIv, decryptedAES);
    return cleanBase64(decryptedText);
  }

  async function encryptForSecondRequest(data, serverPublicKey) {
    const aesKey = await window.crypto.subtle.generateKey(
      { name: "AES-CBC", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
    const rawKey = await window.crypto.subtle.exportKey("raw", aesKey);
    const { cipherText, iv } = await encryptDataWithAes(data, aesKey);
    const encryptedKey = await encryptKeyWithRsa(rawKey, serverPublicKey);
    return { cipherText, key: encryptedKey, iv };
  }

  async function secondDecrypt(responseData) {
    const privateKey = await importPrivateKey();
    const decryptedAES = await decryptKeyWithRsa(responseData.key, privateKey);
    const decryptedText = await decryptDataWithAes(responseData.cipherText, responseData.iv, decryptedAES);
    return cleanBase64(decryptedText);
  }

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
      const importedPrivateKey = await window.crypto.subtle.importKey(
        "pkcs8",
        pkcs8ArrayBuffer,
        { name: "RSA-OAEP", hash: "SHA-256" },
        false,
        ["decrypt"]
      );
      const decryptedKeyBuffer = await decryptKeyWithRsa(element.encAesKey, importedPrivateKey);
      const decryptedBase64 = await decryptDataWithAes(element.encPdfData, element.encIv, decryptedKeyBuffer);
      setDcryptdStrng(decryptedBase64);

      const byteArray = Uint8Array.from(atob(decryptedBase64), c => c.charCodeAt(0));
      setPdfBase64(btoa(new Uint8Array(byteArray).reduce((data, byte) => data + String.fromCharCode(byte), "")));

      const serverPublicKeyBase64 = localStorage.getItem("serverPublicKey");
      const encrypted2 = await encryptForSecondRequest(decryptedBase64, serverPublicKeyBase64);
      const readableResp = await api.post("/doc/getReadableContent", encrypted2, { headers: hdrs });
      const decryptedPdfB64 = await secondDecrypt(readableResp.data.data);

      setPdfUrl(decryptedPdfB64);

      if (element.hasForum) {
        try {
          const docsList = await api.get(`/doc/form/getDocForm/${choosenDoc?.id}`, { headers: hdrs });
          const docsListRes = docsList.data.data;
          const importedPrivateKeyPK = await importPrivateKey();
          const decryptedDocList = await decryptKeyWithRsa(docsListRes?.key, importedPrivateKeyPK);
          const decryptedList = await decryptDataWithAes(docsListRes?.cipherText, docsListRes?.iv, decryptedDocList);
          console.log(JSON.parse(decryptedList))
          setDocList(JSON.parse(decryptedList));
        } catch {
          setModalValues(prev => ({
            ...prev,
            message: '❌ İstifadəçilər alınarkən xəta baş verdi. Yenidən yoxlayın!',
            isQuestion: false,
            showModal: true
          }));
        }
      }

      try {
        const aesKeyVerify = await window.crypto.subtle.generateKey({ name: "AES-CBC", length: 256 }, true, ["encrypt", "decrypt"]);
        const rawAesKeyBufferVerify = await window.crypto.subtle.exportKey("raw", aesKeyVerify);
        const { cipherText, iv } = await encryptDataWithAes(decryptedBase64, aesKeyVerify);
        const encryptedKeyVerify = await encryptKeyWithRsa(rawAesKeyBufferVerify, serverPublicKeyBase64);

        const sigRsp = await api.post("/doc/verifyDoc", { cipherText, key: encryptedKeyVerify, iv }, { headers: hdrs });
        setSignDetail(sigRsp?.data?.data || []);

        if (whoIs === "getDoc") {
          await api.put(`/doc/readDoc/${choosenDoc?.id}`, { headers: { Authorization: tokenGet } });
        }
      } catch {
        console.error("İmzalar alınmadı");
      }

    } catch (err) {
      setModalValues(prev => ({
        ...prev,
        message: '❌ Sənəd məlumatları alınarkən xəta baş verdi. Yenidən yoxlayın!',
        isQuestion: false,
        showModal: true
      }));
    } finally {
      setLoading(false);
    }
  };

  const closeDetails = () => {
    setShowDocument(false);
    if (whoIs === "getDoc" && !docElements?.read) window.location.reload();
  };

  const shareDoc = () => setShowPasswordAlert(true);

  const callUserInfo = () => {
    const uItem = localStorage.getItem("userObj");
    if (!uItem) return;
    setUserItem(JSON.parse(uItem));
  }

  useEffect(() => {
    callDoc();
    callUserInfo();
  }, [choosenDoc]);

  useEffect(() => {
    if (!showDocument || !pdfUrl) return;
    const waitForWrapper = () => {
      const pdfWrapper = document.getElementsByClassName("pdf-wrapper")[0];
      if (pdfWrapper && pdfWrapper.offsetWidth > 0) {
        renderPdfToCanvas(pdfUrl);
      } else {
        requestAnimationFrame(waitForWrapper);
      }
    };

    waitForWrapper();
  }, [pdfUrl, showDocument]);

  const sendDocumend = async (receiver, description) => {
    const mainForm = docList?.forms;
    await sendDoc({
      description,
      receiver,
      setLoading,
      mainItem: docElements?.chapter,
      dcryptdStrng,
      mainForm,
      setShowForm,
      setModalValues,
      setReceiver,
      setShowDocument
    });
  };

  const signDocument = async (pwd) => {
    await signDoc({
      pwd,
      pdfBase64,
      setLoading,
      setShowPasswordAlert,
      setDcryptdStrng,
      setReceiver,
      setModalValues
    });
  };

  const toDutySystem = async () => {
    if (connectNow) {
      try {
        const token = localStorage.getItem("myUserDocumentToken");
        if (!token) return;
        const hdrs = { Authorization: `Bearer ${token}` };

        await api.post(`/form/redirectDocForm/${choosenDoc?.id}`, hdrs);
        setModalValues(prev => (
          {
            ...prev,
            isQuestion: false,
            showModal: true,
            message: 'Sənəd Növbətçi sisteminə uğurla yönləndirildi! ✅'
          }
        ))
        setShowDocument(false)
      } catch (err) {
        setModalValues(prev => (
          {
            ...prev,
            isQuestion: false,
            showModal: true,
            message: `❌ Xəta baş verdi: ${err?.response?.data?.errorDescription || err
              }`
          }
        ))
      }
    }
    else {
      setModalValues(prev => (
        {
          ...prev,
          isQuestion: false,
          showModal: true,
          message: '⚠️ Bağlantı mövcud deyil! Bərpa et və yenidən yoxla!'
        }
      ))
    }
  }

  const editAndShareDoc = () => setShowForm(true);

  return (
    loading ? <Loading loadingMessage={"Üzərində iş gedir..."} /> :
      <div className="doc-modal">
        <div className="doc-container">
          <FiX className="close-modal-btn" onClick={closeDetails} />

          <div className="left-panel">
            <h3 className="section-title">Sənəd</h3>
            <div className="share-box">
              <IoIosShareAlt className="share-box-icons" onClick={shareDoc} />
              <FaEdit className="share-box-icons" onClick={editAndShareDoc} />
              <FiDownload className="share-box-icons" onClick={downloadPdf} />
              {
                userItem?.admin &&
                docElements?.hasForum &&
                [2, 3, 4].includes(docElements?.chapter?.eventId) && (
                  <span onClick={toDutySystem} style={{ color: "white", cursor: "pointer" }}>
                    NS yönləndir
                  </span>
                )
              }
            </div>

            <div className="pdf-wrapper" ></div>

            {docElements && (
              <div className="doc-info">
                <h4 className="info-title">Sənəd məlumatları</h4>
                <p><span className="label">Sənəd No:</span> {docElements?.documentNo}</p>
                <p><span className="label">Tarix:</span> {docElements?.date}</p>

                <div className="info-box">
                  <div className="info-title-box">
                    <h4 className="info-title">Göndərən</h4>
                    <p className={`${!docElements?.sender?.name && 'deleted-user'}`}><span className={`label`}>Ad Soyad Ata adı: </span>
                      {docElements?.sender?.name ? docElements?.sender?.name : "Bu istifadəçi silinib"} {docElements?.sender?.surname} {docElements?.sender?.father}</p>
                    <p><span className="label">Vəzifə: </span> {docElements?.sender?.position}</p>
                    <p><span className="label">İdarə: </span> {docElements?.sender?.management?.name}</p>
                    <p><span className="label">Rütbə: </span> {docElements?.sender?.rank?.description}</p>
                  </div>
                  <div className="info-title-box">
                    <h4 className="info-title">Qəbul edən</h4>
                    <p className={`${!docElements?.receiver?.name && 'deleted-user'}`}><span className={`label`}>Ad Soyad Ata adı: </span>
                      {docElements?.receiver?.name ? docElements?.receiver?.name : "Bu istifadəçi silinib"} {docElements?.receiver?.surname} {docElements?.receiver?.father}</p>
                    <p><span className="label">Vəzifə: </span> {docElements?.receiver?.position}</p>
                    <p><span className="label">İdarə: </span> {docElements?.receiver?.management?.name}</p>
                    <p><span className="label">Rütbə: </span> {docElements?.receiver?.rank?.description}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

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
        </div>

        {showPasswordAlert && (
          <WithPassword visible={showPasswordAlert} onSend={signDocument} onClose={() => setShowPasswordAlert(false)} />
        )}

        {receiver && (
          <GetReceivers
            visible={receiver}
            onClose={() => setReceiver(false)}
            pdf={pdfUrl}
            onSend={sendDocumend}
            setModalValues={setModalValues}
          />
        )}

        {showForm && (
          <Form uObj={JSON.parse(localStorage.getItem("userObj"))} item={item} setShowForm={setShowForm} setModalValues={setModalValues} fromDocDetail={docList?.forms} chapter={docElements?.chapter} />
        )}
      </div>
  );
};

export default GetDocument;
