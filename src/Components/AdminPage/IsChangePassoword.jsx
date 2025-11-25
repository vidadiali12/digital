import React, { useState } from 'react'
import CreateForm from './CreateForm'

const IsChangePassoword = ({ user, ep, setModalValues, setShowSelect }) => {
    const [showForm, setShowForm] = useState(null)
    const [changePassword, setChangePassword] = useState(null)
    const [formData, setFormData] = useState({})
    
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
    return (
        <div>
            <div>
                <button onClick={changePass}>Parolu dəyiş</button>
                <button onClick={changeOthers}>Digər məlumatları dəyiş</button>
            </div>
            {
                showForm && (
                    <CreateForm
                        formData={formData}
                        setFormData={setFormData}
                        setShowForm={setShowForm}
                        ep={ep} isAdmin={false}
                        setModalValues={setModalValues}
                        changePassword={changePassword}
                        user={user}
                    />
                )
            }
        </div>
    )
}

export default IsChangePassoword