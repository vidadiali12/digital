import { FaUserPlus, FaUsers, FaBuilding, FaLayerGroup } from 'react-icons/fa';
import { NavLink, useNavigate } from 'react-router-dom';
import './AdminPage.css';
import { useEffect, useState } from 'react';

const AdminPage = () => {

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

  return (
    userObj?.admin && (
      <div className="admin-page">
        <header className="admin-header">
          <h1>Admin Paneli</h1>
        </header>

        <div className="admin-actions">
          <NavLink to="/adminpage/create-user" className="admin-card">
            <FaUserPlus className="admin-card-icon" />
            <h2>İstifadəçi yarat</h2>
            <p>Yeni istifadəçilər əlavə et</p>
          </NavLink>

          <NavLink to="/adminpage/all-users" className="admin-card">
            <FaUsers className="admin-card-icon" />
            <h2>İstifadəçiləri siyahıla</h2>
            <p>Mövcud istifadəçiləri görüntülə və idarə et</p>
          </NavLink>

          <NavLink to="/adminpage/all-departments" className="admin-card">
            <FaBuilding className="admin-card-icon" />
            <h2>İdarələr</h2>
            <p>Yeni idarə əlavə et və düzəliş et</p>
          </NavLink>

          <NavLink to="/adminpage/all-units" className="admin-card">
            <FaLayerGroup className="admin-card-icon" />
            <h2>Bölmələr</h2>
            <p>Yeni bölmə əlavə et və idarə et</p>
          </NavLink>
        </div>
      </div>
    )
  );
};

export default AdminPage;
