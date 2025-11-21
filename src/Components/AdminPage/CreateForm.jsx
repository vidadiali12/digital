import { useEffect, useState } from 'react';
import { FaUser, FaLock, FaIdCard, FaBriefcase, FaEye, FaEyeSlash } from 'react-icons/fa';
import './CreateForm.css';
import api from '../api';
import { encryptDataWithAes, encryptKeyWithRsa, generateCsr } from '../Functions/Functions';
import Loading from '../Modals/Loading';

const iconMap = {
  name: <FaUser className="input-icon" />,
  surname: <FaUser className="input-icon" />,
  fatherName: <FaIdCard className="input-icon" />,
  position: <FaBriefcase className="input-icon" />,
  username: <FaUser className="input-icon" />,
  password: <FaLock className="input-icon" />,
  adminUsername: <FaUser className="input-icon" />,
  adminPassword: <FaLock className="input-icon" />,
  fin: <FaIdCard className="input-icon" />,
  rankId: <FaUser className="input-icon" />,
  managementRankId: <FaUser className="input-icon" />
};



const CreateForm = ({ formData, setFormData, setShowForm, ep, isAdmin, setModalValues, mng }) => {

  const keyPlaceholder = {
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
    managementId: `${formData.managementRankId === 1 ? "Baş İdarə" : formData.managementRankId === 2 ? "İdarə"
      : formData.managementRankId === 3 ? "Baş Bölmə" : "Bölmə"}`
  };


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

  const changeRank = (e) => {
    const value = Number(e.target.value);
    setRankValue(value);
    setFormData(prev => ({ ...prev, rankId: value }));
  };

  const changeManageRank = (e) => {
    const value = Number(e.target.value);
    setManageRankValue(value);
    setFormData(prev => ({ ...prev, managementRankId: value }));
    setHeadDepartmentsId(null);
    setDepartmentsId(null);
    setHeadUnitsId(null);
    setUnitsId(null);

    setFormData(prev => ({ ...prev, managementId: "" }));
  };

  const changeHeadDepartment = (e) => {
    const value = Number(e.target.value);
    setHeadDepartmentsId(value);
    setFormData(prev => ({ ...prev, managementId: value }));
  }

  const changeDepartment = (e) => {

    const value = e.target.value;
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
          setHeadUnits(response.data.data);
          if (response.data.data.length === 0) {
            throw new Error("❌ Seçilən İdarəyə uyğun Baş Bölmə mövcud deyil!")
          }
        } catch (err) {
          setModalValues(prev => ({
            ...prev,
            message: `❌ Məlumatlar alınarkən xəta baş verdi: \n${err}.\nYenidən yoxlayın`,
            showModal: true,
            isQuestion: false,
          }))
        }
      }
    };

    if (manageRankValue != 2) {
      getHeadUnits();
    }
    else if (manageRankValue == 2) {
      setFormData(prev => ({ ...prev, managementId: numericValue }));
    }

    setHeadUnitsId(null);
    setUnitsId(null)
  }

  const changeHeadUnit = (e) => {
    const token = localStorage.getItem('myUserDocumentToken');
    if (!token) return;

    const value = Number(e.target.value);
    setHeadUnitsId(value);

    const getUnits = async () => {
      try {
        const response = await api.get(`/manage/getUnitsByHeadUnit/${value}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUnits(response.data.data);
        if (response.data.data.length === 0) {
          throw new Error("❌ Seçilən Baş Bölməyə uyğun Baş Bölmə mövcud deyil!")
        }
      } catch (err) {
        console.log(err);
        setModalValues(prev => ({
          ...prev,
          message: `❌ Məlumatlar alınarkən xəta baş verdi: \n${err?.response?.data?.errorDescription || err}.\nYenidən yoxlayın`,
          showModal: true,
          isQuestion: false,
        }))
      }
    };

    if (manageRankValue != 3) {
      getUnits();
    }
    else if (manageRankValue == 3) {
      setFormData(prev => ({ ...prev, managementId: value }));
    }
  };

  const changeUnit = (e) => {
    const value = Number(e.target.value);
    setUnitsId(value);
    setFormData(prev => ({ ...prev, managementId: value }));
  };

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);

        const ranksRes = await api.get('/manage/getRanks')
        setRanks(ranksRes.data.data);

        if (!isAdmin) {
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

          setManagmentRanks(managementRes.data.data);
          setDepartments(departmentsRes.data.data);
          setHeadDepartments(headDepartmentsRes.data.data);
        }

        setLoading(false)
      } catch (err) {
        console.error("Error fetching data:", err);
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

      const csr = await generateCsr({
        name: formData.name,
        surname: formData.surname,
        father: formData.fatherName,
        fin: formData.fin,
        password: formData.password
      });

      if (!csr) {
        throw new Error('❌ "CSR yaradıla bilmədi"');
      }


      let updatedFormData = { ...formData, csr };

      console.log(formData)
      if (ep.includes("/admin/updateUser/")) {
        updatedFormData = {
          changePassword: formData.password,
          name: formData.name,
          surname: formData.surname,
          fatherName: formData.father,
          position: formData.position,
          username: formData.username,
          password: formData.password,
          managementRankId: mng.managementRankId,
          managementId: mng.managementId,
          rankId: formData.rankId,
          fin: formData.fin,
          csr: csr
        }
      }



      setFormData(updatedFormData);


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

        if (value === "") {
          throw new Error(`❌ "${fieldName}" boş buraxıla bilməz`);
        }

        if (["rankId", "managementRankId", "managementId"].includes(key) && value === 0) {
          throw new Error(`❌ "${fieldName}" boş buraxıla bilməz`);
        }

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

      let response = null;

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
        message: `İstifadəçi uğurla yaradıldı ✅`,
        showModal: true,
        isQuestion: false,
      }))
    } catch (err) {
      console.error("Error in createUser:", err);
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


  return (
    loading ? <Loading loadingMessage={"Məlumatlar analiz edilir..."} /> :
      <div className="form-overlay">
        <div className="form-card">
          <h2>{ep.includes("/admin/updateUser/") ? "Məlumatları dəyiş" : "Yeni İstifadəçi Yarat"}</h2>
          <form className="form-grid" onSubmit={(e) => e.preventDefault()}>
            {Object.keys(formData).map(key => {
              const isPassword = key.toLowerCase().includes('password');
              if (key !== "csr" && key !== "managementRankId" && key !== "managementId") {
                if (key === "rankId") {
                  return (
                    <div className="form-group" key={key}>
                      {iconMap[key]}
                      <select value={rankValue || ""} onChange={changeRank}>
                        <option value="">{keyPlaceholder[key]}</option>
                        {ranks.map(rank => (
                          <option key={rank.id} value={rank.id}>{rank.description}</option>
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
                        value={formData[key]}
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
              }
            })}

            {
              !isAdmin && (<div className="form-group" >
                <select value={manageRankValue || ""} onChange={changeManageRank}>
                  <option value="">Kateqoriya Seç</option>
                  {managmentRanks.map((rank, index) => (
                    <option key={index} value={rank.id}>{rank.desc}</option>
                  ))}
                </select>
              </div>)
            }

            {manageRankValue != null && !isNaN(manageRankValue) && manageRankValue == 1 && (
              <div className="form-group" >
                <select value={headDepartmentsId || ""} onChange={changeHeadDepartment}>
                  <option value="">Baş İdarə Seç</option>
                  {headDepartments.map(headDepartment => (
                    <option key={headDepartment.id} value={headDepartment.id}>
                      {headDepartment.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {manageRankValue != null && !isNaN(manageRankValue) && manageRankValue != 1 && (
              <div className="form-group" >
                <select value={departmentsId || ""} onChange={changeDepartment}>
                  <option value="">İdarə Seç</option>
                  {departments.map(department => (
                    <option key={department.id} value={department.id}>
                      {department.departmentName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {manageRankValue != null && !isNaN(manageRankValue) && (manageRankValue == 3 || manageRankValue == 4) &&
              departmentsId != null && !isNaN(departmentsId) && (
                <div className="form-group">
                  <select value={headUnitsId || ""} onChange={changeHeadUnit}>
                    <option value="">Baş Bölmə Seç</option>
                    {headUnits.map(headUnit => (
                      <option key={headUnit.id} value={headUnit.id}>
                        {headUnit.name}
                      </option>
                    ))}
                  </select>
                </div>
              )
            }

            {manageRankValue != null && !isNaN(manageRankValue) && manageRankValue == 4 &&
              departmentsId != null && !isNaN(departmentsId) && headUnitsId != null && !isNaN(headUnitsId) && (
                <div className="form-group">
                  <select value={unitsId || ""} onChange={changeUnit}>
                    <option value="">Bölmə Seç</option>
                    {units.map(unit => (
                      <option key={unit.id} value={unit.id}>
                        {unit.name}
                      </option>
                    ))}
                  </select>
                </div>
              )
            }



            <div className="form-actions">
              <button type="button" className="submit-btn" onClick={createUser}>{ep.includes("/admin/updateUser/") ? "Yadda saxla" : "Yarat"}</button>
              <button type="button" className="cancel-btn" onClick={handleClose}>Bağla</button>
            </div>
          </form>
        </div>
      </div>
  );
};

export default CreateForm;
