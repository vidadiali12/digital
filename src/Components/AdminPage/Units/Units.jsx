import React, { useEffect, useState } from 'react';
import api from '../../api';
import { FaTrash, FaEdit, FaPlus } from 'react-icons/fa';
import Loading from '../../Modals/Loading';
import './Units.css';
import { useNavigate } from 'react-router-dom';

const Units = ({ setModalValues, setUpdateItem, setAddItem, setItem, setTypeOfItem }) => {

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

    const [headUnits, setHeadUnits] = useState([]);
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        const token = localStorage.getItem('myUserDocumentToken');
        if (!token) return;

        try {
            setLoading(true);
            const [headRes, allRes] = await Promise.all([
                api.get('/manage/getAllHeadUnits', {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                api.get('/manage/getAllUnits', {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);

            setHeadUnits(headRes?.data?.data || []);
            setUnits(allRes?.data?.data || []);
        } catch (err) {
            console.error('❌ Məlumat alınmadı:', err);
            setModalValues(prev => ({
                ...prev,
                message: `❌ Məlumatlar alınarkən xəta baş verdi: 
                \n⚠️${err?.response?.data?.errorDescription || err
                    }. \nYenidən yoxlayın!`,
                showModal: true,
                isQuestion: false,
            }))
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);


    const addHeadUnit = () => {
        setTypeOfItem("headUnit")
        setAddItem(true)
    }


    const addUnit = () => {
        setTypeOfItem("unit")
        setAddItem(true)
    }


    const editHeadUnit = (id) => {
        setItem(headUnits.find(e => e?.id === id))
        setTypeOfItem("headUnit")
        setUpdateItem(true)
    }

    const editUnit = (id) => {
        setItem(units.find(e => e?.id === id))
        setTypeOfItem("unit")
        setUpdateItem(true)
    }

    const deleteHeadUnit = (id) => {
        setItem(headUnits.find(e => e?.id === id))
        setModalValues(prev => ({
            ...prev,
            message: `Bu Baş Bölməni silməyə əminsiz?`,
            showModal: true,
            isQuestion: true,
            type: "deleteHeadUnit"
        }))
    };

    const deleteUnit = (id) => {
        setItem(units.find(e => e?.id === id))
        setModalValues(prev => ({
            ...prev,
            message: `Bu Bölməni silməyə əminsiz?`,
            showModal: true,
            isQuestion: true,
            type: "deleteUnit"
        }))
    };

    if (loading) return <Loading loadingMessage="Məlumatlar yüklənir..." />;

    return (
        userObj?.admin && (
            <div className="units-container">
                <div className="units-header">
                    <h2>Bölmələrin Siyahısı</h2>
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <button className="add-btn" onClick={addHeadUnit}>
                            <FaPlus /> Yeni Baş Bölmə
                        </button>

                        <button className="add-btn" onClick={addUnit}>
                            <FaPlus /> Yeni Bölmə
                        </button>
                    </div>
                </div>

                <div className="units-list">
                    {headUnits?.map((head, index) => (
                        <div key={head?.id} className="unit-card">
                            <div className="unit-card-header">
                                <div>
                                    <span className="dep-name">{index + 1}. İdarə: {head?.departmentName}</span>
                                    <div>
                                        <span className='head-unit-name'>
                                            Baş Bölmə: {head?.name}
                                        </span>
                                        <p className="desc">({head?.description})</p>
                                        <div className="actions">
                                            <button className="edit-btn" onClick={() => editHeadUnit(head?.id)}>
                                                <FaEdit />
                                            </button>
                                            <button className="delete-btn" onClick={() => deleteHeadUnit(head?.id)}>
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {units.filter((u) => u?.headUnitName === head?.name).length > 0 ? (
                                <table className="inner-units-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Bölmə</th>
                                            <th>Təsvir</th>
                                            <th>Əməliyyatlar</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {units
                                            .filter((u) => u?.headUnitName === head?.name)
                                            .map((unit, i) => (
                                                <tr key={unit?.id}>
                                                    <td>{i + 1}</td>
                                                    <td>{unit?.name}</td>
                                                    <td>{unit?.description}</td>
                                                    <td className="actions">
                                                        <button className="edit-btn" onClick={() => editUnit(unit?.id)}>
                                                            <FaEdit />
                                                        </button>
                                                        <button className="delete-btn" onClick={() => deleteUnit(unit?.id)}>
                                                            <FaTrash />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            ) : <span>
                                {
                                    head?.name
                                } Baş bölməsinə bağlı alt bölmələr mövcud deyil.
                            </span>}
                        </div>
                    ))}
                </div>
            </div>
        )
    );
};

export default Units;