import React, { useEffect, useState } from 'react'
import api from '../../api'
import Loading from '../../Modals/Loading'
import './AddTitle.css'
import { useNavigate } from 'react-router-dom'
import { FaTimes } from 'react-icons/fa'

const AddTitle = ({ setShowTitle, userObj, typeOfOperation, item, setModalValues }) => {
    const navigate = useNavigate();

    useEffect(() => {
        if (userObj && userObj?.admin === false) {
            navigate("/");
            localStorage.clear();
        }
    }, [userObj, navigate]);

    const [loading, setLoading] = useState(false);
    const [titleValue, setTitleValue] = useState(item?.title || "");
    const [containsForm, setContainsForm] = useState(item?.containsForm || false);
    const [titleEvents, setTitleEvents] = useState(null);
    const [titleEventId, setTitleEventId] = useState(null);

    const handleClose = () => {
        setShowTitle(null);
        setTitleValue("");
        setContainsForm(false);
    };

    const handleChangeTitle = (e) => {
        setTitleValue(e.target.value);
    };

    const handleChangeFormCheckbox = (e) => {
        setContainsForm(e.target.checked);
    };

    const addTitle = async () => {
        const token = localStorage.getItem("myUserDocumentToken");
        if (!token) return;

        if (titleEventId === null || titleEventId == "") {
            setModalValues(prev => ({
                ...prev,
                message: `⚠️ Tip seçilməlidir!`,
                isQuestion: false,
                showModal: true
            }));
            return;
        }

        const titleData = {
            title: titleValue?.trim(),
            containsForm,
            eventId: titleEventId
        };

        if (!titleData.title) {
            setModalValues(prev => ({
                ...prev,
                message: `⚠️ Başlıq boş ola bilməz`,
                isQuestion: false,
                showModal: true
            }))
            return;
        }

        setLoading(true);
        try {
            const url =
                typeOfOperation === "createTitle"
                    ? '/admin/chapter/createChapter'
                    : `/admin/chapter/updateChapter/${item?.id}`;

            const hdrs = {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            };

            const resTitle =
                typeOfOperation === "createTitle"
                    ? await api.post(url, titleData, hdrs)
                    : await api.put(url, titleData, hdrs);

            setLoading(false);
            setShowTitle(null);
            setModalValues(prev => ({
                ...prev,
                message: `${typeOfOperation === "createTitle"
                    ? 'Başlıq uğurla əlavə edildi! ✅'
                    : 'Başlıq uğurla dəyişdirildi! ✅'}`,
                isQuestion: false,
                showModal: true
            }));
            setTimeout(() => window.location.reload(), 1500);
            setTitleEventId(null);
        } catch (err) {
            setModalValues(prev => ({
                ...prev,
                message: `❌ Proses zamanı xəta baş verdi: \n⚠️ ${err?.response?.data?.errorDescription || err}.\nYenidən yoxlayın`,
                showModal: true,
                isQuestion: false,
            }));
            setLoading(false);
        }
    };

    const callTitleEvents = async () => {
        try {
            setLoading(true)
            const token = localStorage.getItem("myUserDocumentToken");
            if (!token) return;
            const hdrs = {
                headers: {
                    Authorization: `Bearer ${token}`
                },
            };
            const resEvents = await api.get('/chapter/getChapterEvents', hdrs);
            setTitleEvents(resEvents?.data?.data);
            setLoading(false)

        } catch (err) {
            setModalValues(prev => ({
                ...prev,
                message: `❌ Proses zamanı xəta baş verdi: \n⚠️ ${err?.response?.data?.errorDescription || err}.\nYenidən yoxlayın`,
                showModal: true,
                isQuestion: false,
            }));
            setLoading(false)
        }
    }

    const changeTitleEvent = (id) => {
        setTitleEventId(Number(id));
    }

    useEffect(() => {
        setTitleEventId(Number(item?.eventId))
        callTitleEvents();
    }, []);

    return (
        loading ? (
            <Loading loadingMessage={"Proses davam edir..."} />
        ) : (
            userObj?.admin && (
                <section
                    className="addtitle-section"
                    onClick={(e) => {
                        if (e.target.classList.contains('addtitle-section')) handleClose();
                    }}
                >
                    <div className="addtitle-card">
                        <button className="close-btn-title" onClick={handleClose}>
                            <FaTimes />
                        </button>

                        <div className="addtitle-container">
                            <div className='input-select'>
                                <select className='addtitle-select' value={titleEventId} onChange={(e) => changeTitleEvent(e?.target?.value)}>
                                    <option value="">Əməliyyat tipi seç</option>
                                    {
                                        titleEvents?.map((titleEvent) => {
                                            return <option value={titleEvent?.id}>
                                                {titleEvent?.event}
                                            </option>
                                        })
                                    }
                                </select>
                                <input
                                    type="text"
                                    placeholder="Başlıq yaz"
                                    id="titleElement"
                                    className="addtitle-input"
                                    value={titleValue}
                                    onChange={handleChangeTitle}
                                />
                            </div>
                            <label className="form-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={containsForm}
                                    onChange={handleChangeFormCheckbox}
                                />
                                Bu başlıqda form olacaq:
                            </label>
                            <button onClick={addTitle} className="addtitle-btn">
                                {typeOfOperation === "createTitle"
                                    ? "Başlıq əlavə et"
                                    : "Başlığı yenilə"}
                            </button>
                        </div>
                    </div>
                </section>
            )
        )
    );
};

export default AddTitle;
