import { useEffect, useState } from "react";
import { FaEdit, FaTrashAlt, FaPlus } from "react-icons/fa";
import "./Departments.css";
import Loading from "../../Modals/Loading";
import api from "../../api";
import { useNavigate } from "react-router-dom";

const Departments = ({ setModalValues, setUpdateItem, setAddItem, setItem, setTypeOfItem }) => {

    const [userObj, setUserObj] = useState({})

    const navigate = useNavigate();
    useEffect(() => {
        const uObj = JSON.parse(localStorage.getItem("userObj"))
        setUserObj(uObj)
        if (uObj && uObj?.admin === false) {
            navigate("/")
            localStorage.clear()
        }
    }, [navigate])

    const [loading, setLoading] = useState(null)
    const [departments, setDepartments] = useState([]);

    const handleAdd = () => {
        setTypeOfItem("department")
        setAddItem(true);
    };

    const handleDelete = (id) => {
        setItem(departments.find(e => e?.id === id))
        setModalValues(prev => ({
            ...prev,
            message: `Bu İdarəni silməyə əminsiz?`,
            showModal: true,
            isQuestion: true,
            type: "deleteDepartment"
        }))
    };

    const handleEdit = (id) => {
        setItem(departments.find(e => e?.id === id))
        setTypeOfItem("department")
        setUpdateItem(true)
    };

    useEffect(() => {
        const callDepartments = async () => {
            try {
                setLoading(true)

                const token = localStorage.getItem("myUserDocumentToken");
                if (!token) throw new Error("Token tapılmadı");


                const hdrs = {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }

                const departmentsRes = await api.get('/manage/getDepartments', { headers: hdrs })
                setDepartments(departmentsRes?.data?.data)
                console.log(departmentsRes?.data?.data)
                setLoading(false)
            } catch (err) {
                console.error("Error fetching data:", err);
                setLoading(false)
                setModalValues(prev => ({
                    ...prev,
                    message: `❌ Məlumatlar alınarkən xəta baş verdi: \n${err?.response?.data?.errorDescription || err}.\nYenidən yoxlayın`,
                    showModal: true,
                    isQuestion: false,
                }))
            }
        }

        callDepartments();
    }, [])

    return (
        loading ? <Loading loadingMessage={"Məlumatlar analiz edilir..."} /> :
            userObj?.admin && (
                <div className="departments-page">
                    <header className="departments-header">
                        <h1>İdarələr</h1>
                        <button className="add-btn" onClick={handleAdd}>
                            <FaPlus /> Yeni İdarə
                        </button>
                    </header>

                    <table className="departments-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Baş İdarə</th>
                                <th>Ad</th>
                                <th>Təsvir</th>
                                <th>Əməliyyatlar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {departments.map((dept, i) => (
                                <tr key={dept?.id}>
                                    <td>{i + 1}</td>
                                    <td>MN</td>
                                    <td>{dept?.departmentName}</td>
                                    <td>{dept?.departmentDesc}</td>
                                    <td className="actions">
                                        <button
                                            className="edit-btn"
                                            onClick={() => handleEdit(dept?.id)}
                                            title="Redaktə et"
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            className="delete-btn"
                                            onClick={() => handleDelete(dept?.id)}
                                            title="Sil"
                                        >
                                            <FaTrashAlt />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )
    );
};

export default Departments;
