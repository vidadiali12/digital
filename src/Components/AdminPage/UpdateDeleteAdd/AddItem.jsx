import React, { useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import './AddItem.css';
import api from '../../api';
import Loading from '../../Modals/Loading';
import { useNavigate } from 'react-router-dom';

const AddItem = ({ userObj, setModalValues, setAddItem, typeOfItem }) => {

    const navigate = useNavigate();
    useEffect(() => {
        if (userObj && userObj.admin === false) {
            navigate("/")
            localStorage.removeItem("myUserDocumentToken");
            localStorage.removeItem("tokenExpiration");
        }
    }, [userObj, navigate])

    const [loading, setLoading] = useState(false);
    const [sections, setSections] = useState([]);
    const [selectedSection, setSelectedSection] = useState('');
    const [formData, setFormData] = useState({ name: '', desc: '', hasUnit: false });

    console.log("🔹 typeOfItem:", typeOfItem);

    useEffect(() => {
        const fetchSection = async () => {
            try {
                const token = localStorage.getItem('myUserDocumentToken');
                if (!token) return;

                const url =
                    typeOfItem === 'department'
                        ? '/manage/getHeadDepartments'
                        : typeOfItem === 'headUnit'
                            ? '/manage/getDepartments'
                            : '/manage/getAllHeadUnits';

                const response = await api.get(url, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setSections(response.data.data || []);
            } catch (err) {
                console.error("❌ Bölmələr alınmadı:", err);
                setModalValues((prev) => ({
                    ...prev,
                    message: `❌ ${typeOfItem} məlumatları alınarkən xəta baş verdi.`,
                    showModal: true,
                    isQuestion: false,
                }));
            }
        };

        fetchSection();
    }, [typeOfItem, setModalValues]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (e) => {
        const { name, checked } = e.target;
        setFormData((prev) => ({ ...prev, [name]: checked }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);

        const token = localStorage.getItem('myUserDocumentToken');
        if (!token) return;

        const payload =
            typeOfItem === 'department'
                ? {
                    departmentName: formData.name,
                    departmentDesc: formData.desc,
                    headDepartmentId: selectedSection,
                }
                : typeOfItem === 'headUnit'
                    ? {
                        name: formData.name,
                        description: formData.desc,
                        departmentId: selectedSection,
                        hasUnit: formData.hasUnit,
                    }
                    : {
                        name: formData.name,
                        description: formData.desc,
                        headUnitId: selectedSection,
                    };

        try {
            const url =
                typeOfItem === 'department'
                    ? '/manage/addDepartment'
                    : typeOfItem === 'headUnit'
                        ? '/manage/addHeadUnit'
                        : '/manage/addUnit';

            console.log("📤 Göndərilən payload:", payload);
            await api.post(url, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setModalValues((prev) => ({
                ...prev,
                message: `${typeOfItem === 'department'
                    ? 'İdarə'
                    : typeOfItem === 'headUnit'
                        ? 'Baş bölmə'
                        : 'Bölmə'
                    } uğurla əlavə olundu ✅`,
                showModal: true,
                isQuestion: false,
            }));

            setFormData({ name: '', desc: '', hasUnit: false });
            setSelectedSection('');
            setAddItem(null);
            setLoading(false);
            setTimeout(() => window.location.reload(), 1500);
        } catch (err) {
            console.log(err);
            setLoading(false);
            setModalValues((prev) => ({
                ...prev,
                message: `❌ Xəta baş verdi \n${err.response?.data?.errorDescription || err.message
                    }`,
                showModal: true,
                isQuestion: false,
            }));
        }
    };

    const onClose = () => {
        setFormData({ name: '', desc: '', hasUnit: false });
        setAddItem(null);
    };

    return loading ? (
        <Loading loadingMessage={'Yeni data əlavə olunur...'} />
    ) : (
        userObj?.admin && (
            <div className="additem-backdrop">
                <div className="additem-card">
                    <button className="close-btn" onClick={onClose}>
                        <FaTimes />
                    </button>

                    <h2>
                        Yeni{' '}
                        {typeOfItem === 'department'
                            ? 'İdarə'
                            : typeOfItem === 'headUnit'
                                ? 'Baş bölmə'
                                : 'Bölmə'}{' '}
                        Əlavə Et
                    </h2>

                    <form onSubmit={handleSubmit} className="additem-form">
                        <div className="form-group">
                            <label>
                                Bağlı olduğu{' '}
                                {typeOfItem === 'department'
                                    ? 'Baş idarə'
                                    : typeOfItem === 'headUnit'
                                        ? 'İdarə'
                                        : 'Baş bölmə'}
                            </label>
                            <select
                                value={selectedSection}
                                onChange={(e) => setSelectedSection(e.target.value)}
                                required
                                className="add-item-input"
                            >
                                <option value="">
                                    {typeOfItem === 'department'
                                        ? 'Baş idarə'
                                        : typeOfItem === 'headUnit'
                                            ? 'İdarə'
                                            : 'Baş bölmə'} {' '}
                                    seçin
                                </option>
                                {sections.map((sec) => {
                                    if (sec.hasUnit && typeOfItem === "unit") {
                                        return <option key={sec.id} value={sec.id}>
                                            {sec.name}
                                        </option>
                                    }
                                    else if (typeOfItem !== "unit") {
                                        return <option key={sec.id} value={sec.id}>
                                            {typeOfItem === 'department'
                                                ? sec.name
                                                : typeOfItem === 'headUnit'
                                                    ? sec.departmentName
                                                    : sec.name}
                                        </option>
                                    }
                                })}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>
                                {typeOfItem === 'department'
                                    ? 'İdarə'
                                    : typeOfItem === 'headUnit'
                                        ? 'Baş bölmə'
                                        : 'Bölmə'}
                                nin qısa adı
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Ad daxil edin"
                                required
                                className="add-item-input"
                            />
                        </div>

                        <div className="form-group">
                            <label>
                                {typeOfItem === 'department'
                                    ? 'İdarə'
                                    : typeOfItem === 'headUnit'
                                        ? 'Baş bölmə'
                                        : 'Bölmə'}
                                nin tam adı
                            </label>
                            <input
                                type="text"
                                name="desc"
                                value={formData.desc}
                                onChange={handleChange}
                                placeholder="Təsviri daxil edin"
                                required
                                className="add-item-input"
                            />
                        </div>

                        {typeOfItem === 'headUnit' && (
                            <div className="form-group checkbox-group">
                                <input
                                    className='check-box'
                                    type="checkbox"
                                    name="hasUnit"
                                    checked={formData.hasUnit}
                                    onChange={handleCheckboxChange}
                                />
                                <label>Baş bölməyə bağlı bölmələr olacaq</label>
                            </div>
                        )}
                        <button type="submit" className="add-btn">
                            Əlavə Et
                        </button>
                    </form>
                </div>
            </div>
        )
    );
};

export default AddItem;
