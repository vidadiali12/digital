import React, { useEffect, useState } from "react";
import { FaTrash, FaEdit, FaCrown } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "./AllUsers.css";
import Loading from "../Modals/Loading";
import IsChangePassoword from "./IsChangePassoword";
import FilteredBySearch from "./FilteredBySearch";

const AllUsers = ({ setItem, setModalValues }) => {
    const [allUsers, setAllUsers] = useState([]);
    const [countOfUsers, setCountOfUsers] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [loading, setLoading] = useState(false);
    const [userObj, setUserObj] = useState({});
    const [searchTerm, setSearchTerm] = useState("");
    const [ranks, setRanks] = useState([]);
    const [selectedRanks, setSelectedRanks] = useState([]);
    const [managementRanks, setManagementRanks] = useState([]);
    const [selectedLayer, setSelectedLayer] = useState("");
    const [filteredManagementRanks, setFilteredManagementRanks] = useState([]);
    const [selectedManagement, setSelectedManagement] = useState([]);
    const [showSelect, setShowSelect] = useState(false);
    const [user, setUser] = useState({});
    const [ep, setEp] = useState(null);
    const [showSerchElements, setShowSerchElements] = useState(false);

    const navigate = useNavigate();

    const totalPages = Math.ceil(countOfUsers / pageSize);

    useEffect(() => {
        const uObj = JSON.parse(localStorage.getItem("userObj"));
        setUserObj(uObj);
        if (uObj && uObj?.admin === false) {
            navigate("/");
            localStorage.clear();
        }
    }, [navigate]);

    useEffect(() => {
        const fetchRanks = async () => {
            try {
                const res = await api.get("/manage/getRanks");
                setRanks(res?.data?.data || []);
            } catch (err) {
                console.error(err);
            }
        };
        fetchRanks();
    }, []);

    useEffect(() => {
        const fetchManagementRanks = async () => {
            try {
                const token = localStorage.getItem("myUserDocumentToken");
                const res = await api.get("/manage/getManagementRanks", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setManagementRanks(res?.data?.data || []);
            } catch (err) { console.error(err); }
        };
        fetchManagementRanks();
    }, []);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem("myUserDocumentToken");

                let res;

                if (searchTerm || selectedRanks.length > 0 || selectedManagement.length > 0) {
                    const managementMap = selectedLayer
                        ? [{ layerId: Number(selectedLayer), managementIds: selectedManagement }]
                        : [];
                    res = await api.post("/user/searchUserByAdmin",
                        {
                            searchText: searchTerm,
                            rankIds: selectedRanks,
                            managementRankIds: managementMap
                        },
                        {
                            headers: { Authorization: `Bearer ${token}` },
                            params: { page, pageSize }
                        }
                    );
                } else {
                    res = await api.get("/user/getAllUsers", {
                        headers: { Authorization: `Bearer ${token}` },
                        params: { page, pageSize }
                    });
                }

                const users = res?.data?.data || [];
                setAllUsers(users.filter(u => u?.username !== userObj?.username));
                setCountOfUsers(res?.data?.totalItem || users.length || 0);

            } catch (err) {
                setModalValues(prev => ({
                    ...prev,
                    message: `❌ İstifadəçi məlumatları çağrılarkən problem: ${err?.response?.data?.errorDescription || err}`,
                    showModal: true,
                    isQuestion: false
                }));
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [searchTerm, selectedRanks, selectedLayer, selectedManagement, page, pageSize]);


    useEffect(() => {
        if (!selectedLayer) {
            setFilteredManagementRanks([]);
            setSelectedManagement([]);
            return;
        }

        const fetchByLayer = async () => {
            try {
                const token = localStorage.getItem("myUserDocumentToken");
                const hdrs = { Authorization: `Bearer ${token}` };
                let res;

                switch (Number(selectedLayer)) {
                    case 1: res = await api.get("/manage/getHeadDepartments", { headers: hdrs }); break;
                    case 2: res = await api.get("/manage/getDepartments", { headers: hdrs }); break;
                    case 3: res = await api.get("/manage/getAllHeadUnits", { headers: hdrs }); break;
                    case 4: res = await api.get("/manage/getAllUnits", { headers: hdrs }); break;
                    default: res = null;
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

    const toggleRank = (id) => setSelectedRanks(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    const toggleManagement = (id) => setSelectedManagement(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    const handlePageChange = (newPage) => { if (newPage >= 1 && newPage <= totalPages) setPage(newPage); };
    const deleteUser = (id) => { setItem(allUsers.find(u => u.id === id)); setModalValues(prev => ({ ...prev, message: "Bu istifadəçinin silməyə əminsiniz?", showModal: true, isQuestion: true, type: "deleteUser" })); };
    const editUser = async (id) => {
        try {
            setLoading(true);
            const token = localStorage.getItem("myUserDocumentToken");
            const resUser = await api.get(`/admin/user/getUser/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            setUser(resUser?.data?.data);
            setEp(`/admin/updateUser/${id}`);
            setShowSelect(true);
        } catch (err) {
            setModalValues(prev => ({ ...prev, message: `❌ İstifadəçi məlumatları çağrılarkən problem: ${err?.response?.data?.errorDescription || err}`, showModal: true, isQuestion: false }));
        } finally { setLoading(false); }
    };

    const getItemTitle = (item) => item.name || item.desc || item.departmentName || item.departmentDesc || "—";

    const showSearch = () => {
        setSelectedRanks([]);
        setSelectedManagement([]);
        setSearchTerm("");
        const allBox = document.querySelectorAll('.filter-section>div');
        allBox.forEach(box => {
            box.classList.remove('active-filter-box');
        });
    }

    return (
        <div className="users-container">
            <div className="users-header">
                <h2>İstifadəçilər siyahısı</h2>
                <button className="show-filters-btn" onClick={showSearch}>Filteri Təmizlə</button>
            </div>

            <FilteredBySearch searchTerm={searchTerm} setSearchTerm={setSearchTerm} ranks={ranks}
                selectedRanks={selectedRanks} toggleRank={toggleRank} selectedLayer={selectedLayer}
                setSelectedLayer={setSelectedLayer} managementRanks={managementRanks}
                filteredManagementRanks={filteredManagementRanks} selectedManagement={selectedManagement}
                getItemTitle={getItemTitle} toggleManagement={toggleManagement} />

            <table className="users-table">
                <thead>
                    <tr>
                        <th>#</th><th>Ad</th><th>Soyad</th><th>Ata adı</th><th>Vəzifə</th><th>Qurum</th><th>Rütbə</th><th>İdarəçi səviyyə</th><th>Əməliyyatlar</th>
                    </tr>
                </thead>
                <tbody>
                    {allUsers.length > 0 ? allUsers.map((u, index) => (
                        <tr key={u.id} className={u.admin ? "admin-row" : ""}>
                            <td>{(page - 1) * pageSize + index + 1}</td>
                            <td>{u.name} {u.admin && <FaCrown className="admin-icon" />}</td>
                            <td>{u.surname}</td>
                            <td>{u.father}</td>
                            <td>{u.position}</td>
                            <td>{u.management?.name || "-"}</td>
                            <td>{u.rank?.name || "-"}</td>
                            <td>{u.managementRank?.desc || "-"}</td>
                            <td className="actions">
                                <button className="edit-btn" title="Düzəliş et" onClick={() => editUser(u?.id)}>
                                    <FaEdit />
                                </button>
                                <button className="delete-btn" title="Sil" onClick={() => deleteUser(u?.id)}>
                                    <FaTrash />
                                </button>
                            </td>
                        </tr>
                    )) : (
                        <tr><td colSpan="9" style={{ textAlign: "center" }}>Məlumat tapılmadı</td></tr>
                    )}
                </tbody>
            </table>

            <div className="pagination">
                <button onClick={() => handlePageChange(page - 1)} disabled={page === 1}>⬅ Əvvəlki</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(i => (
                    <button key={i} onClick={() => handlePageChange(i)} className={page === i ? "active" : ""}>{i}</button>
                ))}
                <button onClick={() => handlePageChange(page + 1)} disabled={page === totalPages}>Növbəti ➡</button>
            </div>

            {showSelect && (
                <IsChangePassoword user={user} ep={ep} setModalValues={setModalValues} setShowSelect={setShowSelect} />
            )}
        </div>
    );
};

export default AllUsers;
