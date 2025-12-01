import './Profile.css'
import { useEffect, useState } from 'react'
import { FaUserCircle, FaEye, FaEyeSlash } from 'react-icons/fa'
import { MdAdminPanelSettings } from 'react-icons/md'
import api from '../api'
import { encryptDataWithAes, encryptKeyWithRsa, generateCsr } from '../Functions/Functions'
import Loading from './Loading'

const Profile = ({ setProfile, setModalValues, shouldChangePassword }) => {
  const [passwordData, setPasswordData] = useState({
    oldPass: '',
    newPass: '',
    confirmPass: ''
  })

  const [showPassword, setShowPassword] = useState({
    oldPass: false,
    newPass: false,
    confirmPass: false
  })

  const [loading, setLoading] = useState(null)
  const [uObj, setUObj] = useState(null)

  const closeProfile = () => setProfile(null)

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData(prev => ({ ...prev, [name]: value }))
  }

  const toggleShowPassword = (field) => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }))
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordData.newPass.trim() == "" || passwordData.confirmPass.trim() == "" || passwordData.oldPass.trim() == "") {
      setModalValues(prev => ({
        ...prev,
        showModal: true,
        message: "❌ Sahələr doldurulmaldıır",
        isQuestion: false
      }));
      return;
    }
    if (passwordData.newPass !== passwordData.confirmPass) {
      setModalValues(prev => ({
        ...prev,
        showModal: true,
        message: "❌ Parol və təkrarı uyğun gəlmir",
        isQuestion: false
      }));
      return;
    }

    if (
      passwordData.confirmPass.trim().length < 8 ||
      !/[a-z]/.test(passwordData.confirmPass.trim()) ||
      !/[A-Z]/.test(passwordData.confirmPass.trim()) ||
      !/[^A-Za-z0-9]/.test(passwordData.confirmPass.trim())
    ) {
      throw new Error(
        `❌ "Şifrə tələblərə cavab vermir! Şifrə ən az 8 simvoldan ibarət olmalı, böyük, kiçik hərf və simvol daxil etməlidir."`
      );
    }


    try {
      setLoading(true);
      const token = localStorage.getItem("myUserDocumentToken");
      const serverPublicKeyBase64 = localStorage.getItem("serverPublicKey");
      const clientPrivateKeyBase64 = localStorage.getItem("clientPrivateKey");

      if (!token) throw new Error("❌ Token tapılmadı");
      if (!serverPublicKeyBase64) throw new Error("❌ Server public key tapılmadı");
      if (!clientPrivateKeyBase64) throw new Error("❌ Client private key tapılmadı");

      if (!uObj) throw new Error("❌ User məlumatları tapılmadı");

      const oldCsr = await generateCsr({
        name: uObj?.name,
        surname: uObj?.surname,
        father: uObj?.father,
        fin: uObj?.fin,
        password: passwordData?.oldPass
      });

      const newCsr = await generateCsr({
        name: uObj?.name,
        surname: uObj?.surname,
        father: uObj?.father,
        fin: uObj?.fin,
        password: passwordData?.confirmPass
      });

      const requestDataJson = {
        username: uObj?.username,
        oldPassword: passwordData?.oldPass,
        oldCsr: oldCsr,
        newPassword: passwordData?.confirmPass,
        newCsr: newCsr
      };


      const aesKey = await window.crypto.subtle.generateKey(
        { name: "AES-CBC", length: 256 },
        true,
        ["encrypt", "decrypt"]
      );
      const rawAesKeyBuffer = await window.crypto.subtle.exportKey("raw", aesKey);


      const { cipherText, iv } = await encryptDataWithAes(requestDataJson, aesKey);

      const encryptedKey = await encryptKeyWithRsa(rawAesKeyBuffer, serverPublicKeyBase64);

      const requestBody = { cipherText, key: encryptedKey, iv };

      const response = await api.put(
        '/auth/updateMe',
        requestBody,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );


      setModalValues(prev => ({
        ...prev,
        showModal: true,
        message: "Parol uğurla yeniləndi ✅",
        isQuestion: false
      }));

      setLoading(false);
      setProfile(null);

      if (uObj?.shouldChangePassword) {
        localStorage.clear();
      }

    } catch (error) {
      setModalValues(prev => ({
        ...prev,
        showModal: true,
        message: "Xəta baş verdi ❌",
        isQuestion: false
      }));
      setLoading(false);
    }
  };


  const callUser = () => {
    setUObj(JSON.parse(localStorage.getItem("userObj")))
  }

  useEffect(() => {
    callUser()
  }, [])


  return (
    <>
      {loading ? <Loading loadingMessage="Məlumatlar dəyişdirilir..." /> :
        <div className={`profile-page ${shouldChangePassword ? 'dark-profile' : ''}`}>
          <div className="profile-card-row">
            {
              !shouldChangePassword && (
                <div className="profile-info-card">
                  <button className="close-btn-profile" onClick={closeProfile}>✖</button>
                  <div className="avatar"><FaUserCircle className="avatar-icon" /></div>
                  <h2 className="username">{uObj?.name} {uObj?.surname}</h2>
                  <p className="position">{uObj?.position}</p>

                  <div className="info-section">
                    <div><strong>FIN:</strong> {uObj?.fin}</div>
                    <div><strong>Rütbə:</strong> {uObj?.rank?.description}</div>
                    <div><strong>Təşkilat:</strong> {uObj?.management?.name}</div>
                    <div><strong>Təbəqə:</strong> {uObj?.managementRank?.desc}</div>
                    <div><strong>Vəzifə:</strong> {uObj?.position}</div>
                    <div><strong>Qoşulma tarixi:</strong> {new Date(uObj?.joinedDate).toLocaleDateString()}</div>
                  </div>

                  {uObj?.admin && <div className="admin-badge"><MdAdminPanelSettings /> Admin</div>}
                </div>
              )
            }

            <form className="password-section-card" onSubmit={handlePasswordSubmit}>
              <h3>Parolu yenilə</h3>

              {["oldPass", "newPass", "confirmPass"].map((field, idx) => (
                <div className="password-input-wrapper" key={field}>
                  <input
                    type={showPassword[field] ? "text" : "password"}
                    name={field}
                    placeholder={
                      field === "oldPass" ? "Köhnə parol" :
                        field === "newPass" ? "Yeni parol" :
                          "Yeni parol təkrar"
                    }
                    value={passwordData[field]}
                    onChange={handlePasswordChange}
                  />
                  <span className="password-toggle-icon" onClick={() => toggleShowPassword(field)}>
                    {showPassword[field] ? <FaEye /> : <FaEyeSlash />}
                  </span>
                </div>
              ))}

              <button type="submit" className="update-btn">Yenilə</button>
            </form>
          </div>
        </div>
      }
    </>
  )
}

export default Profile
