import React, { useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import './Update.css';
import api from '../../api';
import Loading from '../../Modals/Loading';
import { useNavigate } from 'react-router-dom';

const Update = ({ userObj, setModalValues, setUpdateItem, item, typeOfItem }) => {

    const navigate = useNavigate();
    useEffect(() => {
        if (userObj && userObj.admin === false) {
            navigate("/")
            localStorage.removeItem("myUserDocumentToken");
            localStorage.removeItem("tokenExpiration");
        }
    }, [userObj, navigate])

    const [loading, setLoading] = useState(null);
    const [section, setSection] = useState([])
    const [selectedId, setSelectedId] = useState(
        typeOfItem === "department"
            ? item.headDepartmentId
            : typeOfItem === "headUnit"
                ? item.departmentId
                : item.headUnitId)

    const [formData, setFormData] = useState({
        name: item.name || item.departmentName || '',
        desc: item.description || item.departmentDesc || '',
        hasUnit: item.hasUnit || false
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }

    const changeSection = (e) => {
        setSelectedId(e.target.value)
    }
    const handleCheckboxChange = (e) => {
        const { name, checked } = e.target;
        setFormData((prev) => ({ ...prev, [name]: checked }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true)

        const token = localStorage.getItem('myUserDocumentToken');
        if (!token) return;

        const url = typeOfItem === "department" ? "/manage/updateDepartment/" : typeOfItem === "headUnit" ? "/manage/updateHeadUnit/" : "/manage/updateUnit/"

        const payload = typeOfItem === "department" ? {
            departmentName: formData.name,
            departmentDesc: formData.desc,
            headDepartmentId: selectedId
        } : typeOfItem === "headUnit" ? {
            name: formData.name,
            description: formData.desc,
            departmentId: selectedId,
            hasUnit: formData.hasUnit
        } : {
            name: formData.name,
            description: formData.desc,
            headUnitId: selectedId
        };

        try {
            const response = await api.put(`${url}${item.id}`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setModalValues(prev => ({
                ...prev,
                message: "Məlumatlar uğurla dəyişdirildi ✅",
                showModal: true,
                isQuestion: false,
            }))
            setLoading(false)
            setFormData({});
            setUpdateItem(null);

            setTimeout(() => {
                window.location.reload()
            }, 1500);

        } catch (err) {
            setLoading(false)
            setModalValues(prev => ({
                ...prev,
                message: `❌ Xəta baş verdi \n${err.response.data.errorDescription}`,
                showModal: true,
                isQuestion: false,
            }))
        }
    }

    const onClose = () => {
        setFormData({})
        setUpdateItem(false)
    }


    useEffect(() => {
        const fetchAllData = async () => {
            try {
                setLoading(true)

                const token = localStorage.getItem("myUserDocumentToken");
                if (!token) throw new Error("Token tapılmadı");

                const hdrs = {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }

                const url = typeOfItem === "department" ? "/manage/getHeadDepartments" : typeOfItem === "headUnit" ? "/manage/getDepartments" : "/manage/getAllHeadUnits"

                const resSection = await api.get(url, { headers: hdrs });
                console.log("data::: ", resSection.data.data)

                setSection(resSection.data.data);
                setLoading(false)

            } catch (err) {
                console.error("Error fetching data:", err);
                setLoading(false)
                setModalValues(prev => ({
                    ...prev,
                    message: `❌ Məlumatlar alınarkən xəta baş verdi: \n${err.response.data.errorDescription}.\nYenidən yoxlayın`,
                    showModal: true,
                    isQuestion: false,
                }))
            }
        };

        fetchAllData();
    }, []);

    console.log("item", item)
    return (
        loading ? <Loading loadingMessage={"Məlumatlar dəyişirilir..."} /> :
            userObj?.admin && (
                <div className="update-backdrop">
                    <div className="update-card">
                        <button className="close-btn-update" onClick={onClose}><FaTimes /></button>
                        <h2>Məlumatları Yenilə</h2>
                        <form onSubmit={handleSubmit} className="update-form">
                            <div className="form-group">
                                <label>Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Ad daxil edin"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <input
                                    type="text"
                                    name="desc"
                                    value={formData.desc}
                                    onChange={handleChange}
                                    placeholder="Təsviri daxil edin"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <select
                                    value={
                                        selectedId || 'choose-section'
                                    }
                                    onChange={changeSection}
                                >
                                    <option value="choose-section" disabled>
                                        Seçim et
                                    </option>

                                    {section.map((sec) => (
                                        <option value={sec.id} key={sec.id}>
                                            {typeOfItem === "headUnit" ? sec.departmentName : sec.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {typeOfItem === 'headUnit' && (
                                <div className="form-group checkbox-group-update">
                                    <input
                                        className='check-box-update'
                                        type="checkbox"
                                        name="hasUnit"
                                        checked={formData.hasUnit}
                                        onChange={handleCheckboxChange}
                                    />
                                    <label>Baş bölməyə bağlı bölmələr olacaq</label>
                                </div>
                            )}
                            <button type="submit" className="update-btn">Yenilə</button>
                        </form>
                    </div>
                </div>
            )
    );
}

export default Update;