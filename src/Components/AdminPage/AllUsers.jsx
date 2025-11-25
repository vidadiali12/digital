import React, { useEffect, useState } from "react";
import { FaTrash, FaEdit, FaCrown, FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "./AllUsers.css";
import Loading from "../Modals/Loading";
import IsChangePassoword from "./IsChangePassoword";

const AllUsers = ({ setItem, setModalValues }) => {
    const [allUsers, setAllUsers] = useState([]);
    const [countOfUsers, setCountOfUsers] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchTerm, setSearchTerm] = useState("");
    const [ep, setEp] = useState(null);
    const [loading, setLoading] = useState(null)
    const [showSelect, setShowSelect] = useState(null)
    const [user, setUser] = useState({})

    const navigate = useNavigate();

    const totalPages = Math.ceil(countOfUsers / pageSize);

    const [userObj, setUserObj] = useState({})

    useEffect(() => {
        const uObj = JSON.parse(localStorage.getItem("userObj"))
        setUserObj(uObj)
        if (uObj && uObj?.admin === false) {
            navigate("/")
            localStorage.removeItem("myUserDocumentToken");
            localStorage.removeItem("tokenExpiration");
        }
    }, [navigate])

    useEffect(() => {
        const getAllUsers = async () => {
            const token = localStorage.getItem("myUserDocumentToken");
            if (!token) throw new Error("Token tapılmadı");

            try {
                setLoading(true)
                const resUsers = await api.get("/user/getAllUsers", {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { page, pageSize },
                });
                setAllUsers(resUsers?.data?.data?.data || []);
                setCountOfUsers(resUsers?.data?.data?.totalItem);
                setLoading(false)
            } catch (err) {
                setLoading(false)
                console.log("İstifadəçilər alınmadı:", err);
                setModalValues(prev => ({
                    ...prev,
                    message: "❌ İstifadəçi məlumatları çağrılarkən problem yaşandı. Yenidən yoxlayın...",
                    showModal: true,
                    isQuestion: false
                }))
            }
        };
        getAllUsers();
    }, [page, pageSize]);

    const filteredUsers = allUsers?.filter((u) => {
        const text = `${u?.name} ${u?.surname} ${u?.father} ${u?.position} ${u?.management?.name}`.toLowerCase();
        return text.includes(searchTerm.toLowerCase());
    });

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    const deleteUser = (id) => {
        setModalValues(prev => ({
            ...prev,
            message: "Bu istifadəçinin silməyə əminsiniz?",
            showModal: true,
            isQuestion: true,
            type: "deleteUser"
        }))
        setItem(allUsers.find(u => u.id === id))
    }

    const editUser = async (id) => {
        try {
            setLoading(true)
            const token = localStorage.getItem("myUserDocumentToken");
            if (!token) return;

            const resUser = await api.get(`/admin/user/getUser/${id}`, {
                headers: {
                    Authorization: `Beare ${token}`
                }
            })
            const user = resUser?.data?.data;
            setUser(user)
            setEp(`/admin/updateUser/${id}`)
            setShowSelect(true)
            setLoading(false)
        } catch (err) {
            setLoading(false)
            setModalValues(prev => ({
                ...prev,
                message: "❌ İstifadəçi məlumatları çağrılarkən problem yaşandı. Yenidən yoxlayın...",
                showModal: true,
                isQuestion: false,
            }))
        }
    }

    return (
        loading ? <Loading loadingMessage={"Məlumatlar alınır..."} /> : userObj?.admin && (
            <div className="users-container">
                <div className="users-header">
                    <h2>İstifadəçilər siyahısı</h2>
                    <div className="search-box">
                        <FaSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Axtar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e?.target?.value)}
                        />
                    </div>
                </div>

                <table className="users-table">
                    <thead>
                        <tr className="all-users-tr">
                            <th>#</th>
                            <th>Ad</th>
                            <th>Soyad</th>
                            <th>Ata adı</th>
                            <th>Vəzifə</th>
                            <th>Qurum</th>
                            <th>Rütbə</th>
                            <th>İdarəçi səviyyə</th>
                            <th>Əməliyyatlar</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers?.length > 0 ? (
                            filteredUsers?.map((u, index) => {
                                if (userObj.username !== u.username) {
                                    return <tr key={u.id} className={u?.admin ? "admin-row  all-users-tr" : " all-users-tr"}>
                                        <td>{(page - 1) * pageSize + index + 1}</td>
                                        <td>
                                            {u?.name}{" "}
                                            {u?.admin && <FaCrown title="Admin" className="admin-icon" />}
                                        </td>
                                        <td>{u?.surname}</td>
                                        <td>{u?.father}</td>
                                        <td>{u?.position}</td>
                                        <td>{u?.management?.name || "-"}</td>
                                        <td>{u?.rank?.name || "-"}</td>
                                        <td>{u?.managementRank?.desc || "-"}</td>
                                        <td className="actions">
                                            <button className="edit-btn" title="Düzəliş et" onClick={() => editUser(u?.id)}>
                                                <FaEdit />
                                            </button>
                                            <button className="delete-btn" title="Sil" onClick={() => deleteUser(u?.id)}>
                                                <FaTrash />
                                            </button>
                                        </td>
                                    </tr>
                                }
                            }
                            )
                        ) : (
                            <tr>
                                <td colSpan="9" style={{ textAlign: "center" }}>
                                    Məlumat tapılmadı
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                <div className="pagination">
                    <button onClick={() => handlePageChange(page - 1)} disabled={page === 1}>
                        ⬅ Əvvəlki
                    </button>

                    <button
                        onClick={() => handlePageChange(1)}
                        className={page === 1 ? "active" : ""}
                    >
                        1
                    </button>

                    {page > 3 && <span className="dots">...</span>}

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(
                            (i) =>
                                i !== 1 &&
                                i !== totalPages &&
                                i >= page - 1 &&
                                i <= page + 1
                        )
                        .map((i) => (
                            <button
                                key={i}
                                onClick={() => handlePageChange(i)}
                                className={page === i ? "active" : ""}
                            >
                                {i}
                            </button>
                        ))}

                    {page < totalPages - 2 && <span className="dots">...</span>}

                    {totalPages > 1 && (
                        <button
                            onClick={() => handlePageChange(totalPages)}
                            className={page === totalPages ? "active" : ""}
                        >
                            {totalPages}
                        </button>
                    )}

                    <button
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page === totalPages}
                    >
                        Növbəti ➡
                    </button>
                </div>

                {/* <div className="page-size">
                    <label>Səhifədə:</label>
                    <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                        <option value={2}>2</option>
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                    </select>
                </div> */}

                {
                    showSelect && (
                        <IsChangePassoword
                            user={user}
                            ep={ep}
                            setModalValues={setModalValues}
                            setShowSelect={setShowSelect} />
                    )
                }
            </div>
        )
    );
};

export default AllUsers;
