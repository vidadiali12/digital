import React, { useState, useEffect } from 'react'
import CreateForm from './CreateForm'
import './IsChangePassword.css'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import Loading from '../Modals/Loading'


const IsChangePassoword = ({ user, ep, setModalValues, setShowSelect }) => {
    const [showForm, setShowForm] = useState(null)
    const [changePassword, setChangePassword] = useState(null)
    const [formData, setFormData] = useState({})
    const [loading, setLoading] = useState(false)

    const navigate = useNavigate();


    const [userObj, setUserObj] = useState({})

    useEffect(() => {
        const uObj = JSON.parse(localStorage.getItem("userObj"))
        setUserObj(uObj)
        if (uObj && uObj?.admin === false) {
            navigate("/")
            localStorage.clear()
        }
    }, [navigate])

    const changePass = () => {
        setChangePassword(true)
        setShowForm(true)
        setFormData({
            name: user?.name,
            surname: user?.surname,
            fatherName: user?.father,
            password: "",
            fin: user?.fin
        })
    }
    const changeOthers = () => {
        setChangePassword(false)
        setShowForm(true)
        setFormData({
            position: user?.position,
            username: user?.username,
            rankId: user?.rank?.id,
            managementRankId: user?.managementRank?.id,
            managementId: user?.management?.id
        })
    }

    const changeLock = async (isLocked) => {
        setLoading(true)
        const token = localStorage.getItem("myUserDocumentToken");
        if (!token) return;
        const hdrs = {
            headers: {
                Authorization: `Bearer ${token}`,
            }
        }
        console.log(isLocked)
        try {
            if (!isLocked) {
                await api.put(`/admin/user/lockUser/${user?.id}`, hdrs)
            } else {
                await api.put(`/admin/user/unlockUser/${user?.id}`, hdrs)
            }
            setLoading(false)
            setModalValues(prev => (
                {
                    ...prev,
                    message: `✅ İstifadəçi hesabının vəziyyəti uğurla dəyişdirildi.`,
                    isQuestion: false,
                    showModal: true
                })
            )
            setTimeout(() => {
                window.location.reload()
            }, 1200)
        }
        catch (err) {
            setModalValues(prev => (
                {
                    ...prev,
                    message: `❌ İstifadəçi hesabının vəziyyətini dəyişərkən xəta baş verdi.\n⚠️ ${err?.response?.data?.errorDescription || err} \nYenidən yoxlayın `,
                    isQuestion: false,
                    showModal: true
                })
            )
            setLoading(false)
        }
    }
    return (
        loading ? <Loading loadingMessage={"Hesab məlumatları dəyişdirilir..."} /> :
            <div className="icp-overlay">
                <div className="icp-modal">
                    <div className="icp-top">
                        <div className="icp-title">Hesab məlumatlarını yenilə</div>
                        <div className="icp-actions">
                            <button className="icp-btn ghost" onClick={() => setShowSelect(false)}>Bağla</button>
                        </div>
                    </div>

                    <div className="icp-content">
                        <div className="icp-left">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button className="icp-btn primary" onClick={changePass}>Parol və əsas məlumatları dəyiş</button>
                                    <button className="icp-btn ghost" onClick={changeOthers}>Digər məlumatları dəyiş</button>
                                </div>
                                <button className="icp-btn primary" onClick={() => changeLock(user?.locked)}>
                                    {
                                        user?.locked ? 'Hesabı aktiv et' : 'Hesabı deaktiv et'
                                    }
                                </button>
                            </div>

                            {showForm && (
                                <div style={{ marginTop: 12 }}>
                                    <CreateForm
                                        formData={formData}
                                        setFormData={setFormData}
                                        setShowForm={setShowForm}
                                        ep={ep} isAdmin={false}
                                        setModalValues={setModalValues}
                                        changePassword={changePassword}
                                        user={user}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="icp-right">
                            <div className="icp-hint">
                                <b>{userObj?.name} {userObj?.surname}</b> <br /> <br />
                                <b>{user?.name} {user?.surname}</b> <span>adlı istifadəçinin</span>
                                <div style={{ marginTop: 6, fontSize: 13 }}>
                                    hesab məlumatlarını buradan tez dəyişə bilərsiz.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
    )
}

export default IsChangePassoword
