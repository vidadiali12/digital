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

        const titleData = { 
            title: titleValue?.trim(),
            containsForm
        };

        if (!titleData.title) {
            alert("⚠ Başlıq boş ola bilməz");
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

    return (
        loading ? (
            <Loading loadingMessage={"Başlıq əlavə olunur..."} />
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
                            <input
                                type="text"
                                placeholder="Başlıq yaz"
                                id="titleElement"
                                className="addtitle-input"
                                value={titleValue}
                                onChange={handleChangeTitle}
                            />
                            <label className="form-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={containsForm}
                                    onChange={handleChangeFormCheckbox}
                                />
                                Bu başlıqda form olacaq
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
