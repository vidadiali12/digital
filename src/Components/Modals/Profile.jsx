import './Profile.css'
import { useState } from 'react'
import { FaUserCircle, FaEye, FaEyeSlash } from 'react-icons/fa'
import { MdAdminPanelSettings } from 'react-icons/md'
import api from '../api'
import { encryptDataWithAes, encryptKeyWithRsa, generateCsr, repairSecretKey } from '../Functions/Functions'
import Loading from './Loading'

const Profile = ({ userObj, setProfile, modalValues, setModalValues }) => {
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

    if (passwordData.newPass !== passwordData.confirmPass) {
      setModalValues(prev => ({
        ...prev,
        showModal: true,
        message: "Yeni parollar uyğun gəlmir ❌",
        isQuestion: false
      }));
      return;
    }

    try {
      setLoading(true);
      console.clear();
      console.log("🟢 [STEP 1] Password update started...");

      // --- TOKEN və AÇARLAR ---
      const token = localStorage.getItem("myUserDocumentToken");
      const serverPublicKeyBase64 = localStorage.getItem("serverPublicKey");
      const clientPrivateKeyBase64 = localStorage.getItem("clientPrivateKey");

      if (!token) throw new Error("❌ Token tapılmadı");
      if (!serverPublicKeyBase64) throw new Error("❌ Server public key tapılmadı");
      if (!clientPrivateKeyBase64) throw new Error("❌ Client private key tapılmadı");

      const clientPrivateKeyJwk = JSON.parse(decodeURIComponent(atob(clientPrivateKeyBase64)));

      console.log("✅ Token, public & private keys loaded.");
      console.log("🔹 Server public key (base64):", serverPublicKeyBase64.slice(0, 50) + "...");

      if (!userObj) throw new Error("❌ User məlumatları tapılmadı");
      console.log("✅ User object:", userObj);

      // === [STEP 2] CSR-ləri yarat ===
      const oldCsr = await generateCsr({
        name: userObj.name,
        surname: userObj.surname,
        father: userObj.father,
        fin: userObj.fin,
        password: passwordData.oldPass
      });

      const newCsr = await generateCsr({
        name: userObj.name,
        surname: userObj.surname,
        father: userObj.father,
        fin: userObj.fin,
        password: passwordData.confirmPass
      });

      console.log("✅ oldCsr:", oldCsr);
      console.log("✅ newCsr:", newCsr);

      const requestDataJson = {
        username: userObj.username,
        oldPassword: passwordData.oldPass,
        oldCsr: oldCsr,
        newPassword: passwordData.confirmPass,
        newCsr: newCsr
      };

      console.log("✅ Request JSON (plain):", requestDataJson);

      // === [STEP 4] AES açar yarat və şifrələ ===
      const aesKey = await window.crypto.subtle.generateKey(
        { name: "AES-CBC", length: 256 },
        true,
        ["encrypt", "decrypt"]
      );
      const rawAesKeyBuffer = await window.crypto.subtle.exportKey("raw", aesKey);

      console.log("✅ AES key yaradıldı (length):", rawAesKeyBuffer.byteLength);

      const { cipherText, iv } = await encryptDataWithAes(requestDataJson, aesKey);

      console.log("✅ AES encryption successful.");
      console.log("🔹 CipherText length:", cipherText.length);
      console.log("🔹 IV:", iv);

      // === [STEP 5] RSA ilə AES açarını şifrələ ===
      const encryptedKey = await encryptKeyWithRsa(rawAesKeyBuffer, serverPublicKeyBase64);
      console.log("✅ RSA encryption successful.");
      console.log("🔹 Encrypted AES key (base64):", encryptedKey.slice(0, 50) + "...");

      // === [STEP 6] Serverə göndər ===
      const requestBody = { cipherText, key: encryptedKey, iv };
      console.log("✅ Final request body (to backend):", requestBody);

      const response = await api.put(
        '/auth/updateMe',
        requestBody,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );

      console.log("✅ Server response:", response.data);

      // success modal
      setModalValues(prev => ({
        ...prev,
        showModal: true,
        message: "Parol uğurla yeniləndi ✅",
        isQuestion: false
      }));
      setLoading(false);

    } catch (error) {
      console.error("❌ Password update error:", error);
      if (error?.response?.data) {
        console.error("🔴 Server response data:", error?.response?.data);
      }

      setModalValues(prev => ({
        ...prev,
        showModal: true,
        message: "Xəta baş verdi ❌",
        isQuestion: false
      }));
      setLoading(false);
    }
  };




  return (
    <>
      {loading ? <Loading loadingMessage="Məlumatlar dəyişdirilir..." /> :
        <div className="profile-page">
          <div className="profile-card-row">
            {/* Sol tərəf */}
            <div className="profile-info-card">
              <button className="close-btn-profile" onClick={closeProfile}>✖</button>
              <div className="avatar"><FaUserCircle className="avatar-icon" /></div>
              <h2 className="username">{userObj.name} {userObj.surname}</h2>
              <p className="position">{userObj.position}</p>

              <div className="info-section">
                <div><strong>FIN:</strong> {userObj.fin}</div>
                <div><strong>Rütbə:</strong> {userObj.rank?.description}</div>
                <div><strong>Təşkilat:</strong> {userObj.management?.name}</div>
                <div><strong>Vəzifə:</strong> {userObj.managementRank?.desc}</div>
                <div><strong>Qoşulma tarixi:</strong> {new Date(userObj.joinedDate).toLocaleDateString()}</div>
              </div>

              {userObj.admin && <div className="admin-badge"><MdAdminPanelSettings /> Admin</div>}
            </div>

            {/* Sağ tərəf */}
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
