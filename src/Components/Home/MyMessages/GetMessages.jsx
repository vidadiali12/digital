import React, { useEffect, useState } from "react";
import api from "../../api";
import Loading from "../../Modals/Loading";
import { FaFilePdf, FaCheckCircle, FaRegCircle } from "react-icons/fa";
import { FiTrash } from "react-icons/fi";
import "./Messages.css";
import GetDocument from "./GetDocument";

const GetMessages = ({ setModalValues }) => {
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [showDocument, setShowDocument] = useState(null);
    const [choosenDoc, setChoosenDoc] = useState(null);
    const [unReadStyle, setUnReadStyle] = useState('');

    const getMessages = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("myUserDocumentToken");
            if (!token) throw new Error("Token tapılmadı");

            const res = await api.get("/doc/getReceivedDocs", {
                params: { page, pageSize },
                headers: { Authorization: `Bearer ${token}` },
            });

            setMessages(res.data.data || []);
            if (res.data.data.read) {
                setUnReadStyle('un-read-style')
            }
            setTotalPages(res.data.totalPages || 1);
        } catch (err) {
            setModalValues(prev=>({
                ...prev,
                message: "❌ Sənədlər yüklənərkən xəta baş verdi...",
                isQuestion: false,
                showModal: true
            }))
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getMessages();
    }, [page]);

    const goNext = () => {
        if (page < totalPages) setPage(page + 1);
    };

    const goPrev = () => {
        if (page > 1) setPage(page - 1);
    };


    const goDocument = (msgId) => {
        const msg = messages?.find(ms => Number(ms.id) === Number(msgId))
        setChoosenDoc(msg)
        setShowDocument(true)
    }


    return loading ? (
        <Loading loadingMessage={"Sənədlər yüklənir..."} />
    ) : (
        <section className="all-messages-container">
            <h2 className="all-messages-title">Göndərilən sənədlər</h2>

            <div className="all-messages-header">
                <span className="header-index">#</span>
                <span className="header-pdf full-width">Sənəd</span>
                <span className="header-receiver full-width-3">Göndərən</span>
                <span className="header-management">İdarə</span>
                <span className="header-title full-width">Başlıq</span>
                <span className="header-chapter full-width">Mövzu</span>
                <span className="header-date ">Tarix</span>
                <span className="header-status">Status</span>
                <span className="header-delete">Sil</span>
            </div>

            {messages.length === 0 ? (
                <div className="all-messages-empty">Məlumat yoxdur</div>
            ) : (
                messages.map((msg, index) => (
                    <div key={msg.id} className="all-messages-row">
                        <span className={`index-cell ${unReadStyle}`}>{(page - 1) * pageSize + index + 1}</span>

                        <button className="pdf-cell full-width" onClick={() => goDocument(msg.id)}>
                            <FaFilePdf className="pdf-icon" />
                            <span className={`see-text ${unReadStyle}`}>Sənədi gör</span>
                        </button>

                        <span className={`receiver-cell full-width-3 ${unReadStyle}`}>
                            {msg.sender?.rank?.description} {msg.sender?.name} {msg.sender?.surname}
                        </span>
                        <span className={`management-cell ${unReadStyle}`}>{msg.sender?.management?.name}</span>
                        <span className={`title-cell full-width ${unReadStyle}`}>{msg.description}</span>
                        <span className={`chapter-cell full-width ${unReadStyle}`}>{msg.chapter || "—"}</span>
                        <span className={`date-cell ${unReadStyle}`}>{msg.date}</span>

                        <span className="status-cell">
                            {msg.read ? (
                                <FaCheckCircle className="status-read" />
                            ) : (
                                <FaRegCircle className="status-unread" />
                            )}
                        </span>
                        <span className="delete-cell">
                            <FiTrash size={20} className="delete-icon-delete" />
                        </span>
                    </div>
                ))
            )}

            <div className="all-messages-pagination">
                <button className="all-messages-btn" onClick={goPrev} disabled={page === 1}>
                    Əvvəlki
                </button>
                <span className="all-messages-page-info">
                    {page} / {totalPages}
                </span>
                <button className="all-messages-btn" onClick={goNext} disabled={page === totalPages}>
                    Növbəti
                </button>
            </div>

            {
                showDocument && (
                    <GetDocument setShowDocument={setShowDocument} setModalValues={setModalValues} choosenDoc={choosenDoc} />
                )
            }

        </section>
    );
};

export default GetMessages;
