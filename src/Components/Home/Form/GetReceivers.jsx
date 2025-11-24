import React, { useEffect, useState } from "react";
import { IoIosShareAlt } from "react-icons/io";
import "./GetReceivers.css";
import api from "../../api";
import Loading from "../../Modals/Loading";

const GetReceivers = ({ visible = true, onClose, onSend, pdf, setModalValues }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [hasMore, setHasMore] = useState(true);
  const [description, setDescription] = useState("");

  const userObj = JSON.parse(localStorage.getItem("userObj"))

  useEffect(() => {
    if (visible) {
      setUsers([]);
      setPage(1);
      fetchUsers(1, pageSize, true);
    }
  }, [visible]);

  const fetchUsers = async (pageValue = page, sizeValue = pageSize, reset = false) => {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("myUserDocumentToken");
      const response = await api.post(
        "/user/searchUser",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { page: pageValue, pageSize: sizeValue },
        }
      );

      const newUsers = response.data?.data?.data || [];
      console.log(newUsers);

      if (reset) setUsers(newUsers);
      else setUsers((prev) => [...prev, ...newUsers]);
      if (newUsers.length < pageSize) setHasMore(false);
    } catch (err) {
      setError("İstifadəçilər alınmadı");
      setModalValues(prev => ({
        ...prev,
        message: `❌ İstifadəçi Alınmadı: \n${err?.response?.data?.errorDescription || err}.\nYenidən yoxlayın`,
        showModal: true,
        isQuestion: false,
      }))
    } finally {
      setLoading(false);
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
    if (typeof onSend === "function") {
      onSend(user, description);
    }
  };

  if (!visible) return null;

  return (
    <div className="receivers-overlay">
      <div className="receivers-layout">
        <div className="receivers-left">
          <header className="receivers-header">
            <h2>İstifadəçilər siyahısı</h2>
            <button onClick={onClose} className="close-btn-receiver close-btn">✕</button>
          </header>

          <input
            type="text"
            placeholder="Başlıq daxil edin"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="desc-input"
          />

          {loading && users.length === 0 && (
            <Loading loadingMessage={"İstifadəçilər yüklənir..."} />
          )}

          {error && <div className="error">{error}</div>}

          {!loading && users?.length > 0 && (
            <div className="receivers-grid">
              {users?.map((u) => {
                if (userObj?.username !== u?.username) {
                  return <div
                    key={u?.id}
                    className="receiver-card"
                    onClick={() => handleUserClick(u)}
                  >
                    <div className="receiver-icon">
                      {u?.rank?.name?.toLowerCase()?.includes("rəhbər") ? (
                        <IoIosShareAlt size={36} color="#007b83" />
                      ) : (
                        <IoIosShareAlt size={36} color="#007b83" />
                      )}
                    </div>
                    <div className="receiver-info">
                      <h3>
                        {u?.name} {u?.surname} {u?.father}
                      </h3>
                      <p><strong>Rütbə: </strong>{u?.rank?.description || "—"}</p>

                      <p><strong>İdarə (Bölmə): </strong>{u?.management?.name || "—"}</p>
                    </div>
                  </div>
                }
              })}
            </div>
          )}
          

          {hasMore && !loading && (
            <button className="load-more" onClick={loadMore}>
              Daha çox yüklə
            </button>
          )}

          {loading && users?.length > 0 && <Loading loadingMessage={"İstifadəçilər alınır..."} />}
        </div>

        <div className="receivers-right">
          {pdf ? (
            <embed
              src={`${pdf}#toolbar=0&navpanes=0&scrollbar=0`}
              type="application/pdf"
              width="100%"
              height="100%"
              style={{
                border: "none",
                borderRadius: "12px",
                objectFit: "cover",
                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              }}
            />
          ) : (
            <div className="no-pdf">PDF tapılmadı</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GetReceivers;
