import { useEffect, useState } from 'react';
import {
  FaLock,
  FaIdCard,
  FaBriefcase,
  FaEye,
  FaEyeSlash,
  FaUser,
  FaUserTie,
  FaUserCircle,
  FaUserShield,
  FaKey,
  FaLayerGroup,
  FaSitemap
} from 'react-icons/fa';
import './CreateForm.css';
import api from '../api';
import { encryptDataWithAes, encryptKeyWithRsa, generateCsr } from '../Functions/Functions';
import Loading from '../Modals/Loading';

const iconMap = {
  name: <FaUser className="input-icon" />,
  surname: <FaUser className="input-icon" />,
  fatherName: <FaUserTie className="input-icon" />,
  position: <FaBriefcase className="input-icon" />,
  username: <FaUserCircle className="input-icon" />,
  password: <FaLock className="input-icon" />,
  adminUsername: <FaUserShield className="input-icon" />,
  adminPassword: <FaKey className="input-icon" />,
  fin: <FaIdCard className="input-icon" />,
  rankId: <FaLayerGroup className="input-icon" />,
  managementRankId: <FaSitemap className="input-icon" />
};



const CreateForm = ({ formData, setFormData, setShowForm, ep, isAdmin, setModalValues, changePassword, user }) => {

  let keyPlaceholder = {
    name: "Ad",
    surname: "Soyad",
    fatherName: "Ata adı",
    position: "Vəzifə",
    username: "İstifadəçi adı",
    password: "Parol",
    adminUsername: "Admin - [İstifadəçi adı]:",
    adminPassword: "Admin - [Parol]: ",
    fin: "Fin ",
    rankId: "Rütbə",
    managementRankId: "Kateqoriya",
    managementId: `${formData?.managementRankId == 1 ? "Baş İdarə" : formData?.managementRankId == 2 ? "İdarə"
      : formData?.managementRankId == 3 ? "Baş Bölmə" : "Bölmə"}`
  };

  if (changePassword && ep?.includes("/admin/updateUser/")) {
    keyPlaceholder = {
      name: "Ad",
      surname: "Soyad",
      fatherName: "Ata adı",
      password: "Parol",
      fin: "Fin"
    };
  }
  else if (!changePassword && ep?.includes("/admin/updateUser/")) {
    keyPlaceholder = {
      position: "Vəzifə",
      username: "İstifadəçi adı",
      adminUsername: "Admin - [İstifadəçi adı]:",
      adminPassword: "Admin - [Parol]: ",
      rankId: "Rütbə",
      managementRankId: "Kateqoriya",
      managementId: `${formData?.managementRankId == 1 ? "Baş İdarə" : formData?.managementRankId == 2 ? "İdarə"
        : formData?.managementRankId == 3 ? "Baş Bölmə" : "Bölmə"}`
    };
  }


  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState({});
  const [ranks, setRanks] = useState([]);
  const [managmentRanks, setManagmentRanks] = useState([]);
  const [departments, setDepartments] = useState([])
  const [headDepartments, setHeadDepartments] = useState([])
  const [headUnits, setHeadUnits] = useState([])
  const [units, setUnits] = useState([])
  const [rankValue, setRankValue] = useState(null);
  const [manageRankValue, setManageRankValue] = useState(null);
  const [departmentsId, setDepartmentsId] = useState(null);
  const [headDepartmentsId, setHeadDepartmentsId] = useState(null);
  const [headUnitsId, setHeadUnitsId] = useState(null);
  const [unitsId, setUnitsId] = useState(null);
  const [layerIds, setLayerIds] = useState(null)

  const [editDepartmentId, setEditDepartmentId] = useState(null);
  const [editHeadUnitId, setEditHeadUnitId] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const togglePassword = (key) => {
    setShowPassword(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleClose = () => {
    setFormData(prev => ({
      ...prev,
      rankId: "",
      managementRankId: "",
      managementId: ""
    }))
    setShowForm(null)
  };

  const changeRank = (id) => {
    const value = Number(id);
    setRankValue(value);
    setFormData(prev => ({ ...prev, rankId: value }));
  };

  const changeManageRank = (id) => {
    const value = Number(id);
    setManageRankValue(value);
    setFormData(prev => ({ ...prev, managementRankId: value }));
    setHeadDepartmentsId(null);
    setDepartmentsId(null);
    setHeadUnitsId(null);
    setUnitsId(null);

    setFormData(prev => ({ ...prev, managementId: "" }));
  };

  const changeHeadDepartment = (id) => {
    const value = Number(id);
    setHeadDepartmentsId(value);
    setFormData(prev => ({ ...prev, managementId: value }));
  }

  const changeDepartment = (id) => {
    const value = Number(id);
    if (!value) {
      setDepartmentsId(null);
      setHeadUnits([]);
      return;
    }

    const numericValue = Number(value);
    setDepartmentsId(numericValue);

    const getHeadUnits = async () => {
      if (!isAdmin) {
        const token = localStorage.getItem('myUserDocumentToken');
        if (!token) return;

        try {
          const response = await api.get(`/manage/getHeadUnits/${numericValue}`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          setHeadUnits(response?.data?.data);

          if (response?.data?.data.length === 0) {
            throw new Error("❌ Seçilən İdarəyə uyğun Baş Bölmə mövcud deyil!");
          }
        } catch (err) {
          setModalValues(prev => ({
            ...prev,
            message: `❌ Məlumatlar alınarkən xəta baş verdi: \n${err}.\nYenidən yoxlayın`,
            showModal: true,
            isQuestion: false,
          }));
        }
      }
    };

    if (manageRankValue != 2) {
      getHeadUnits();
    } else if (manageRankValue == 2) {
      setFormData(prev => ({ ...prev, managementId: numericValue }));
    }

    setHeadUnitsId(null);
    setUnitsId(null);
  };


  const changeHeadUnit = (id) => {
    const token = localStorage.getItem('myUserDocumentToken');
    if (!token) return;

    const value = Number(id);
    setHeadUnitsId(value);

    const getUnits = async () => {
      try {
        const response = await api.get(`/manage/getUnitsByHeadUnit/${value}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setUnits(response?.data?.data);

        if (response?.data?.data.length === 0) {
          throw new Error("❌ Seçilən Baş Bölməyə uyğun Bölmə mövcud deyil!");
        }
      } catch (err) {
        setModalValues(prev => ({
          ...prev,
          message: `❌ Məlumatlar alınarkən xəta baş verdi: \n${err?.response?.data?.errorDescription || err}.\nYenidən yoxlayın`,
          showModal: true,
          isQuestion: false,
        }));
      }
    };

    if (manageRankValue != 3) {
      getUnits();
    } else if (manageRankValue == 3) {
      setFormData(prev => ({ ...prev, managementId: value }));
    }
  };


  const changeUnit = (id) => {
    const value = Number(id);
    setUnitsId(value);
    setFormData(prev => ({ ...prev, managementId: value }));
  };

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);

        const ranksRes = await api.get('/manage/getRanks')
        setRanks(ranksRes?.data?.data);

        if (!isAdmin || (ep?.includes("/admin/updateUser/") && !changePassword)) {
          const token = localStorage.getItem("myUserDocumentToken");
          if (!token) throw new Error("Token tapılmadı");
          const hdrs = {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
          const [managementRes, departmentsRes, headDepartmentsRes] = await Promise.all([
            api.get('/manage/getManagementRanks', { headers: hdrs }),
            api.get('/manage/getDepartments', { headers: hdrs }),
            api.get('/manage/getHeadDepartments', { headers: hdrs })
          ]);

          setManagmentRanks(managementRes?.data?.data);
          setDepartments(departmentsRes?.data?.data);
          setHeadDepartments(headDepartmentsRes?.data?.data);
        }
        setLoading(false)
      } catch (err) {
        setLoading(false)
        setModalValues(prev => ({
          ...prev,
          message: `❌ Məlumatlar alınarkən xəta baş verdi: \n${err}.\nYenidən yoxlayın`,
          showModal: true,
          isQuestion: false,
        }))
      }
    };

    fetchAllData();

  }, []);

  useEffect(() => {
    const initializeUserForm = async () => {
      try {
        if (!ep?.includes("/admin/updateUser/") || changePassword) return;

        const layerId = formData?.managementRankId;
        setManageRankValue(layerId);
        changeRank(formData?.rankId);

        switch (layerId) {
          case 1:
            changeHeadDepartment(formData?.managementId);
            break;
          case 2:
            changeDepartment(formData?.managementId);
            break;
          case 3: {
            changeHeadUnit(formData?.managementId);
            break;
          }
          case 4: {
            changeUnit(formData?.managementId);
            break;
          }

          default:
            console.warn("Unknown management layer:", layerId);
        }

        setLayerIds(layerId);

      } catch (err) {
        setModalValues(prev => ({
          ...prev,
          message: `❌ Form initialization error: \n${err}`,
          showModal: true,
          isQuestion: false,
        }));
      }
    };

    initializeUserForm();
  }, [ep, changePassword]);



  const createUser = async () => {

    try {
      const serverPublicKeyBase64 = "MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA1CUTSIHT3jOeRUpTAkqgniN+a2oUYi5Y/TY2evwxugai9e8MiCTF65bpxPy3Q7AP/pwVGXt+XpDhqGMrtHmoVOljfrlMELhzQ60bCFLhzuFDvvufnbRlrKIXAMjka2trYtLRonrDBTmmEqYC0DN273b0SSEqIbUwNYI/cY/nit00xLsKrJzMgqzAkshHJhRnED6I6o4hYY+B0AM44Mzt4qui8kFzgWYWrNaidbSpqhal/RLv4xygnvB2JUsbc0BJq0mj3iLb7Y77992hK4Cwe4K3jc2D12T9YrvH0DEboFlevY05tkom8faB/hIFMUsTFRtZNXLBibNsrODO+VLTWFwvGS1tffDS/OYzEE3l+Sze3fQnPuGjw+zoBRbZuNgQPL1qlKoj2ptEBHp2OysLZ1bc8vy5QzN/+taCTpSoWJVgv06M8PfOF+NKTFGsRh9oMtEpWK+EYeDmhIzCddSObwzEzQhkTjW1v23cKTQ2xWYJmvENCOWo+e2mpbIw3kOghXsXONOWae9L9UtzMXlgRuVxzDOTRxe7KQVXcZ1myWuuH1bJkyj/fO1dleYFtqOaegTo96pOuOrSWC67ZOuZcZE8hOIMK9phYxo0q2aAEicsyN/xmJImLRenXU+WrLuyNFMGIT3446dWvvE0JnCLs1v2UW6Jd4YINKS1U8JOhZUCAwEAAQ=="

      if (!serverPublicKeyBase64) throw new Error("Server public key tapılmadı");

      for (const [key, value] of Object.entries(formData)) {
        if (key == "fin") {
          if (
            value.length != 7
          ) {
            throw new Error(`❌ "Fin 7 simvoldan ibarət olmalıdır"`);
          }
        }
      }

      let updatedFormData = null
      if (changePassword) {
        const csr = await generateCsr({
          name: formData?.name,
          surname: formData?.surname,
          father: formData?.fatherName,
          fin: formData?.fin,
          password: formData?.password
        });

        if (!csr) {
          throw new Error('❌ "CSR yaradıla bilmədi"');
        }

        updatedFormData = { ...formData, csr };

        if (ep?.includes("/admin/updateUser/")) {
          updatedFormData = {
            ...formData, changePassword, csr,
            position: user?.position,
            username: user?.username,
            rankId: user?.rank?.id,
            managementRankId: user?.managementRank?.id,
            managementId: user?.management?.id
          }
        }
      }
      else {
        if (ep?.includes("/admin/updateUser/")) {
          updatedFormData = {
            ...formData, changePassword, csr: "",
            name: user?.name,
            surname: user?.surname,
            fatherName: user?.father,
            password: "",
            fin: user?.fin
          }
        }
      }

      setFormData(updatedFormData);

      console.log(updatedFormData)
      const requestDataJson = updatedFormData;

      const aesKey = await window.crypto.subtle.generateKey(
        { name: "AES-CBC", length: 256 },
        true,
        ["encrypt", "decrypt"]
      );

      const rawAesKeyBuffer = await window.crypto.subtle.exportKey("raw", aesKey);

      const { cipherText, iv } = await encryptDataWithAes(requestDataJson, aesKey);

      const encryptedKey = await encryptKeyWithRsa(rawAesKeyBuffer, serverPublicKeyBase64);

      for (const [key, value] of Object.entries(updatedFormData)) {
        const fieldName = keyPlaceholder[key] || key;

        if (ep?.includes("/admin/updateUser/") && !changePassword) {
          if (key !== "csr" && key !== "password") {
            if (value === "") {
              throw new Error(`❌ "${fieldName}" boş buraxıla bilməz`);
            }
          }
        }
        else {
          if (value === "") {
            throw new Error(`❌ "${fieldName}" boş buraxıla bilməz`);
          }
        }

        if (["rankId", "managementRankId", "managementId"].includes(key) && value === 0) {
          throw new Error(`❌ "${fieldName}" boş buraxıla bilməz`);
        }

        if ((ep?.includes("/admin/updateUser/") && !changePassword)) {
          console.log("Good")
        }
        else {
          if (key === "password") {
            if (
              value.length < 8 ||
              !/[a-z]/.test(value) ||
              !/[A-Z]/.test(value) ||
              !/[^A-Za-z0-9]/.test(value)
            ) {
              throw new Error(
                `❌ "Şifrə tələblərə cavab vermir! Şifrə ən az 8 simvoldan ibarət olmalı, böyük, kiçik hərf və simvol daxil etməlidir."`
              );
            }
          }
        }
      }


      setLoading(true)
      let hdrs = {}
      if (isAdmin) {
        hdrs = {
          'Content-Type': 'application/json'
        }
      }
      else {
        const token = localStorage.getItem("myUserDocumentToken");
        if (!token) throw new Error("Token tapılmadı");

        hdrs = {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }

      let response = "";

      if (ep.includes("/admin/updateUser/")) {
        const token = localStorage.getItem("myUserDocumentToken");
        if (!token) throw new Error("Token tapılmadı");
        response = await api.put(ep, { cipherText, key: encryptedKey, iv }, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      } else {
        response = await api.post(ep, { cipherText, key: encryptedKey, iv }, {
          headers: hdrs
        });
      }

      setShowForm(null);
      setLoading(false);
      setModalValues(prev => ({
        ...prev,
        message: `${ep.includes("/admin/updateUser/") ? "İstifadəçi məlumatları uğurla dəyişdirildi ✅" : "İstifadəçi uğurla yaradıldı ✅"}`,
        showModal: true,
        isQuestion: false,
      }))

      setTimeout(() => {
        window.location.reload()
      }, 1200);

    } catch (err) {
      setLoading(false);
      setModalValues(prev => ({
        ...prev,
        message: `${err?.response?.data?.errorDescription?.includes("User csr is empty")
          ? `❌ Xəta baş verdi.\nZəhmət olmasa yenidən yoxlayın` :
          `\n${err?.response?.data?.errorDescription || err}\nxətası baş verdi.\nDüzəliş edib, yenidən yoxlayın`
          }`,
        showModal: true,
        isQuestion: false,
      }))
    }
  };


  const visibleKeys = (() => {
    const defaultKeys = Object.keys(formData || {}).filter(k => k !== "csr" && k !== "managementRankId" && k !== "managementId");

    if (ep?.includes("/admin/updateUser/")) {
      if (changePassword) {
        return ["name", "surname", "fatherName", "password", "fin"].filter(k => defaultKeys.includes(k));
      } else {
        return ["position", "username", "adminUsername", "adminPassword", "rankId", "managementRankId", "managementId"]
          .filter(k => defaultKeys.includes(k));
      }
    }

    return defaultKeys;
  })();

  return (
    loading ? <Loading loadingMessage={"Məlumatlar analiz edilir..."} /> :
      <div className="form-overlay">
        <div className="form-card">
          <h2>{ep.includes("/admin/updateUser/") ? "Məlumatları dəyiş" : "Yeni İstifadəçi Yarat"}</h2>
          <form className="form-grid" onSubmit={(e) => e.preventDefault()}>

            {visibleKeys.map(key => {
              const isPassword = key.toLowerCase().includes('password');
              if (key === "rankId") {
                return (
                  <div className="form-group" key={key}>
                    {iconMap[key]}
                    <select value={rankValue || ""} onChange={(e) => changeRank(e?.target?.value)}>
                      <option value="">{keyPlaceholder[key]}</option>
                      {ranks?.map(rank => (
                        <option key={rank?.id} value={rank?.id}>{rank?.description}</option>
                      ))}
                    </select>
                  </div>
                );
              } else {
                return (
                  <div className="form-group" key={key}>
                    {iconMap[key]}
                    <input
                      type={isPassword ? (showPassword[key] ? "text" : "password") : "text"}
                      name={key}
                      placeholder={keyPlaceholder[key]}
                      value={formData[key] || ""}
                      onChange={handleChange}
                    />
                    {isPassword && (
                      <span className="password-toggle" onClick={() => togglePassword(key)}>
                        {showPassword[key] ? <FaEyeSlash /> : <FaEye />}
                      </span>
                    )}
                  </div>
                );
              }
            })}

            {
              ((!ep?.includes("/admin/updateUser/") && !isAdmin) ||
                (ep?.includes("/admin/updateUser/") && !changePassword)) && (
                <div className="form-group">
                  <select value={manageRankValue || ""} onChange={(e) => changeManageRank(e.target.value)}>
                    <option value="">Kateqoriya Seç</option>
                    {managmentRanks?.map((rank, index) => (
                      <option key={index} value={rank?.id}>{rank?.desc}</option>
                    ))}
                  </select>
                </div>
              )
            }


            {manageRankValue != null && !isNaN(manageRankValue) && manageRankValue == 1 && (
              <div className="form-group" >
                <select value={headDepartmentsId || ""} onChange={(e) => changeHeadDepartment(e?.target?.value)}>
                  <option value="">Baş İdarə Seç</option>
                  {headDepartments?.map(headDepartment => (
                    <option key={headDepartment?.id} value={headDepartment?.id}>
                      {headDepartment?.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {((manageRankValue != null && !isNaN(manageRankValue) && manageRankValue != 1) || layerIds != 1) && (
              <div className="form-group" >
                <select value={departmentsId || ""} onChange={(e) => changeDepartment(e?.target?.value)}>
                  <option value="">İdarə Seç</option>
                  {departments?.map(department => (
                    <option key={department?.id} value={department?.id}>
                      {department?.departmentName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {((manageRankValue != null && !isNaN(manageRankValue) && (manageRankValue == 3 || manageRankValue == 4) &&
              departmentsId != null && !isNaN(departmentsId)) || (layerIds == 3 || layerIds == 4)) && (
                <div className="form-group">
                  <select value={headUnitsId || ""} onChange={(e) => changeHeadUnit(e?.target?.value)}>
                    <option value="">Baş Bölmə Seç</option>
                    {headUnits?.map(headUnit => (
                      <option key={headUnit?.id} value={headUnit?.id}>
                        {headUnit?.name}
                      </option>
                    ))}
                  </select>
                </div>
              )
            }

            {((manageRankValue != null && !isNaN(manageRankValue) && manageRankValue == 4 &&
              departmentsId != null && !isNaN(departmentsId) && headUnitsId != null && !isNaN(headUnitsId)) || layerIds == 4) && (
                <div className="form-group">
                  <select value={unitsId || ""} onChange={(e) => changeUnit(e?.target?.value)}>
                    <option value="">Bölmə Seç</option>
                    {units?.map(unit => (
                      <option key={unit?.id} value={unit?.id}>
                        {unit?.name}
                      </option>
                    ))}
                  </select>
                </div>
              )
            }



            <div className="form-actions">
              <button type="button" className="submit-btn" onClick={createUser}>{ep?.includes("/admin/updateUser/") ? "Yadda saxla" : "Yarat"}</button>
              <button type="button" className="cancel-btn" onClick={handleClose}>Bağla</button>
            </div>
          </form>
        </div>
      </div>
  );
};

export default CreateForm;
