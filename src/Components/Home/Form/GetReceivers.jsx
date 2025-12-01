import React, { useEffect, useState } from "react";
import { IoIosShareAlt } from "react-icons/io";
import { FaSearch } from "react-icons/fa";
import "./GetReceivers.css";
import api from "../../api";
import Loading from "../../Modals/Loading";

import * as pdfjsLib from "pdfjs-dist/build/pdf";
import workerSrc from "pdfjs-dist/build/pdf.worker?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;


const GetReceivers = ({ visible = true, onClose, onSend, pdf, setModalValues }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [hasMore, setHasMore] = useState(true);
  const [description, setDescription] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [ranks, setRanks] = useState([]);
  const [managementRanks, setManagementRanks] = useState([]);
  const [selectedRanks, setSelectedRanks] = useState([]);
  const [selectedManagement, setSelectedManagement] = useState([]);
  const userObj = JSON.parse(localStorage.getItem("userObj"));
  const [selectedLayer, setSelectedLayer] = useState("");
  const [filteredManagementRanks, setFilteredManagementRanks] = useState([]);


  useEffect(() => {
    if (visible) {
      setUsers([]);
      setPage(1);
      fetchRanks();
      fetchManagementRanks();
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      fetchUsers(1, pageSize, true);
      setPage(1);
    }
  }, [searchTerm, selectedRanks, selectedManagement, visible]);


  const fetchRanks = async () => {
    try {
      const res = await api.get("/manage/getRanks");
      setRanks(res.data?.data || []);
    } catch { }
  };

  const fetchManagementRanks = async () => {
    try {
      const token = localStorage.getItem("myUserDocumentToken");
      const res = await api.get("/manage/getManagementRanks", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setManagementRanks(res.data?.data || []);
    } catch { }
  };

  const fetchUsers = async (pageValue = page, sizeValue = pageSize, reset = false) => {
    setError("");
    try {
      const token = localStorage.getItem("myUserDocumentToken");
      const managementMap = [{
        layerId: Number(selectedLayer),
        managementIds: selectedManagement
      }];

      const response = await api.post(
        "/user/searchUser",
        {
          searchText: searchTerm || null,
          rankIds: selectedRanks,
          managementRankId: managementMap
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { page: pageValue, pageSize: sizeValue }
        }
      );

      const newUsers = response.data?.data || [];
      if (reset) setUsers(newUsers);
      else setUsers(prev => [...prev, ...newUsers]);
      if (newUsers.length < pageSize) setHasMore(false);
    } catch (err) {
      setError("İstifadəçilər alınmadı");
      setModalValues(prev => ({
        ...prev,
        message: `❌ İstifadəçi Alınmadı: \n${err?.response?.data?.errorDescription || err}`,
        showModal: true,
        isQuestion: false
      }));
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchUsers(nextPage, pageSize);
  };

  const handleUserClick = (user) => {
    if (!description) {
      setModalValues(prev => ({
        ...prev,
        message: "❌ Başlıq daxil edilməlidir!",
        isQuestion: false,
        showModal: true
      }));
      return;
    }
    if (typeof onSend === "function") onSend(user, description);
  };

  const searchUser = (term) => {
    setSearchTerm(term);
  };

  const toggleRank = (id) => {
    setSelectedRanks(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleManagement = (id) => {
    setSelectedManagement(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  useEffect(() => {
    if (!selectedLayer) {
      setFilteredManagementRanks([]);
      setSelectedManagement([]);
      return;
    }

    const token = localStorage.getItem("myUserDocumentToken");
    const hdrs = { Authorization: `Bearer ${token}` };

    const fetchByLayer = async () => {
      try {
        let res;
        switch (Number(selectedLayer)) {
          case 1:
            res = await api.get("/manage/getHeadDepartments", { headers: hdrs });
            break;
          case 2:
            res = await api.get("/manage/getDepartments", { headers: hdrs });
            break;
          case 3:
            res = await api.get("/manage/getAllHeadUnits", { headers: hdrs });
            break;
          case 4:
            res = await api.get("/manage/getAllUnits", { headers: hdrs });
            break;
          default:
            res = null;
        }

        setFilteredManagementRanks(res?.data?.data || []);
        setSelectedManagement([]);

      } catch (err) {
        console.error("Layer fetch error: ", err);
        setFilteredManagementRanks([]);
      }
    };

    fetchByLayer();
  }, [selectedLayer]);

  const getItemTitle = (item, selectedLayer) => {
    if (Number(selectedLayer) === 2) {
      return item.departmentName || item.name || "—";
    }
    return item.name || item.description || "—";
  };



  if (!visible) return null;

  return (
    <div className="receivers-overlay">
      <div className="receivers-layout">
        <div className="receivers-left">
          <header className="receivers-header">
            <h2>İstifadəçilər siyahısı</h2>
            <input
              type="text"
              placeholder="Başlıq daxil edin"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="desc-input"
            />
            <button onClick={onClose} className="close-btn-receiver close-btn">✕</button>
          </header>

          {loading && users.length === 0 && <Loading loadingMessage={"İstifadəçilər yüklənir..."} />}
          {error && <div className="error">{error}</div>}
          {!loading && users?.length > 0 && (
            <div className="receivers-grid">
              {users.map(u => {
                if (userObj?.username !== u?.username) {
                  return (
                    <div key={u.id} className="receiver-card" onClick={() => handleUserClick(u)}>
                      <div className="receiver-icon">
                        <IoIosShareAlt size={36} color="#007b83" />
                      </div>
                      <div className="receiver-info">
                        <h3>{u.name} {u.surname} {u.father}</h3>
                        <p><strong>Rütbə: </strong>{u?.rank?.description || "—"}</p>
                        <p><strong>İdarə (Bölmə): </strong>{u?.management?.name || "—"}</p>
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          )}
          {hasMore && !loading && <button className="load-more" onClick={loadMore}>Daha çox yüklə</button>}
          {loading && users?.length > 0 && <Loading loadingMessage={"İstifadəçilər alınır..."} />}
        </div>

        <div className="receivers-right">

          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Axtar..."
              value={searchTerm}
              onChange={(e) => searchUser(e.target.value)}
            />
          </div>

          <div className="filter-container">
            <div className="filter-section">
              <h4>Rütbələr</h4>
              {ranks.map(r => (
                <label key={r.id} className="filter-item">
                  <input
                    type="checkbox"
                    checked={selectedRanks.includes(r.id)}
                    onChange={() => toggleRank(r.id)}
                  />
                  {r.description}
                </label>
              ))}
            </div>
            <div className="filter-section">
              <h4>Aid olduğu qurum</h4>
              <select
                name="select-layer"
                id="select-layer"
                className="filter-item"
                onChange={(e) => setSelectedLayer(e.target.value)}
              >
                <option value="">Aid olduğu qurum</option>
                {managementRanks.map(m => (
                  <option key={m.id} value={m.id}>{m.desc}</option>
                ))}
              </select>
            </div>
            <div className="filter-section">
              <h4>Qurum siyahısı</h4>

              {filteredManagementRanks.map((item) => {
                const title = getItemTitle(item, selectedLayer);

                return (
                  <label key={item.id} className="filter-item">
                    <input
                      type="checkbox"
                      checked={selectedManagement.includes(item.id)}
                      onChange={() => toggleManagement(item.id)}
                    />
                    {title}
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GetReceivers;
