import './Home.css';
import { NavLink } from 'react-router-dom';
import { FiPlus } from "react-icons/fi";
import { FaEdit, FaTrashAlt, FaArrowRight } from "react-icons/fa";

import api from '../api';
import { useEffect, useState } from 'react';
import AddTitle from './Title/AddTitle';
import Form from './Form/Form';


const Home = ({ setModalValues, setItem, item }) => {
    const [showTitle, setShowTitle] = useState(null)
    const [titles, setTitles] = useState([])
    const [typeOfOperation, setTypeOfOperation] = useState(null)
    const [showTitleActions, setShowTitleActions] = useState(null)
    const [showForm, setShowForm] = useState(null)
    const [uObj, setuObj] = useState(null)

    const showTitleAdding = () => {
        setItem({})
        setShowTitle(true)
        setTypeOfOperation("createTitle")
    }

    const getTitles = async () => {
        const token = localStorage.getItem("myUserDocumentToken");
        if (!token) return;

        const resTitles = await api.get('/chapter/getChapters', {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })

        setTitles(resTitles.data.data)
    }

    const handleEdit = (id) => {
        setTypeOfOperation("editTitle")
        setShowTitle(true)
        setItem(titles?.find(title => title?.id === id))
    }

    const handleDelete = (id) => {
        setItem(titles?.find(title => title?.id === id))
        setModalValues(prev => ({
            ...prev,
            message: "Bu başlığı silməyə əminsiniz?",
            isQuestion: true,
            showModal: true,
            type: "deleteTitle"
        }))
    }

    const goForm = (titleId) => {
        setItem(titles?.find(title => title?.id === titleId));
        setShowForm(true)
    }

    const goTitle = (titleId, index) => {
        uObj?.admin ?
            setShowTitleActions(index)
            : goForm(titleId)
    }

    const createForm = (titleId) => {
        goForm(titleId)
    }

    const handleReset = () => {
        setShowTitleActions(null)
    }

    useEffect(() => {
        const u = localStorage.getItem("userObj") ? JSON.parse(localStorage.getItem("userObj")) : null
        setuObj(u);
        getTitles();
    }, [localStorage.getItem("userObj")]);

    return (
        !uObj?.shouldChangePassword && (<div className="home" onClick={handleReset}>
            <ul className='ul-down' onClick={(e) => e.stopPropagation()}>
                {
                    titles?.map((title, index) => (
                        <li key={title?.id} onClick={() => goTitle(title?.id, index)}>
                            <NavLink to="/">
                                {title?.title}
                                <FiPlus className="plus-icon" />
                            </NavLink>
                            {
                                uObj?.admin && (
                                    <div className={`${showTitleActions === index && ('show-title-actions')} actions`}>
                                        <button
                                            className="edit-btn"
                                            onClick={() => handleEdit(title?.id)}
                                            title="Redaktə et"
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            className="delete-btn"
                                            onClick={() => handleDelete(title?.id)}
                                            title="Sil"
                                        >
                                            <FaTrashAlt />
                                        </button>
                                        <button
                                            className="delete-btn"
                                            onClick={() => createForm(title?.id)}
                                            title="Davam et"
                                        >
                                            <FaArrowRight />
                                        </button>
                                    </div>
                                )
                            }
                        </li>
                    ))
                }
                {
                    uObj?.admin && (
                        <li style={{
                            display: 'flex',
                            borderRadius: '100%',
                            width: '60px',
                            height: '60px',
                            marginLeft: 'auto'
                        }} onClick={showTitleAdding}>
                            <NavLink to="/" >
                                <FiPlus className="plus-icon" />
                            </NavLink>
                        </li>
                    )
                }
            </ul>

            {
                showTitle && (
                    <AddTitle
                        setShowTitle={setShowTitle}
                        uObj={uObj}
                        typeOfOperation={typeOfOperation}
                        item={item}
                        setModalValues={setModalValues} />
                )
            }

            {
                showForm && (
                    <Form
                        uObj={uObj}
                        setShowForm={setShowForm}
                        setModalValues={setModalValues}
                        item={item}
                        fromDocDetail={[]}
                        chapter={null} />
                )
            }
        </div>
        )
    );
};

export default Home;
