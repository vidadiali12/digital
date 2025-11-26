import { FaUser, FaUserShield } from 'react-icons/fa';
import './CreateUser.css';
import { useEffect, useState } from 'react';
import CreateForm from './CreateForm';
import { useNavigate } from 'react-router-dom';

const CreateUser = ({ modalValues, setModalValues }) => {

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

    const [showForm, setShowForm] = useState(null)
    const [ep, setEp] = useState(null)
    const [isAdmin, setIsAdmin] = useState(null);
    const [formData, setFormData] = useState({})

    const CreateUser = (userType) => {
        if (userType === 'admin') {
            setFormData({
                name: "",
                surname: "",
                fatherName: "",
                position: "",
                username: "",
                password: "",
                rankId: "",
                csr: "",
                fin: "",
                adminUsername: "",
                adminPassword: ""
            })
            setEp('/admin/createAdmin')
            setIsAdmin(true)
        }
        else {
            setFormData({
                name: "",
                surname: "",
                fatherName: "",
                position: "",
                username: "",
                password: "",
                rankId: "",
                csr: "",
                fin: "",
                managementRankId: "",
                managementId: ""
            })
            setEp('/admin/createUser')
            setIsAdmin(false)
        }
        setShowForm(true)
    }

    return (
        userObj?.admin && (
            <div className="create-user-page">
                <header className="create-user-header">
                    <h1>Yeni İstifadəçi Yarat</h1>
                </header>

                <div className="create-user-actions">
                    <div onClick={() => CreateUser("user")} className="create-user-card">
                        <FaUser className="card-icon" />
                        <h2>Adi istifadəçi yarat</h2>
                        <p>Sadə istifadəçi əlavə et və idarə et</p>
                    </div>

                    <div onClick={() => CreateUser("admin")} className="create-user-card">
                        <FaUserShield className="card-icon" />
                        <h2>Admin istifadəçi yarat</h2>
                        <p>Yüksək səlahiyyətli admin əlavə et</p>
                    </div>
                </div>

                {
                    showForm && (
                        <CreateForm
                            formData={formData}
                            setFormData={setFormData}
                            setShowForm={setShowForm}
                            ep={ep} isAdmin={isAdmin}
                            setModalValues={setModalValues}
                            changePassword={true}
                            user={null} />
                    )
                }
            </div>
        )
    );
};

export default CreateUser;
