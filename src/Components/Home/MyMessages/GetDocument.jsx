import React, { useEffect } from "react";
import "./GetDocument.css";
import api from "../../api";

const GetDocument = ({ setShowDocument, setModalValues, choosenDoc }) => {
  const callDoc = async () => {
    if(!choosenDoc?.documentNo) return;
    try {
      const rsp = await api.get(`/doc/getDocumentDetails/${choosenDoc.documentNo}`);
      console.log(rsp.data.data)
    } catch (err) {

    }
  }
  useEffect(() => {
    callDoc()
  }, [choosenDoc])
  return (
    <div className="modal-overlay" onClick={() => setShowDocument(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Document Viewer</h2>
        <p>Burada sənəd məzmunu göstəriləcək...</p>
        <button onClick={() => setShowDocument(false)}>Close</button>
      </div>
    </div>
  );
};

export default GetDocument;
