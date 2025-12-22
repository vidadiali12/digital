import './Home.css'
import { FiPlus } from "react-icons/fi"
import { FaEdit, FaTrashAlt, FaArrowRight, FaFolderOpen } from "react-icons/fa"
import api from '../api'
import { useEffect, useState } from 'react'
import AddTitle from './Title/AddTitle'
import Form from './Form/Form'
import Loading from '../Modals/Loading'

const Home = ({ setModalValues, setItem, item }) => {
    const [titles, setTitles] = useState([])
    const [showTitle, setShowTitle] = useState(false)
    const [typeOfOperation, setTypeOfOperation] = useState(null)
    const [showForm, setShowForm] = useState(false)
    const [uObj, setuObj] = useState(null);
    const [loading, setLoading] = useState(null);

    const getTitles = async () => {
        try {
            setLoading(true)
            const token = localStorage.getItem("myUserDocumentToken")
            if (!token) return

            const res = await api.get('/chapter/getChapters', {
                headers: { Authorization: `Bearer ${token}` }
            })
            setTitles(res.data.data);
            setLoading(false)
        } catch (err) {
            setModalValues(prev => ({
                ...prev,
                message: `❌ Xəta baş verdi: \n⚠️${err?.response?.data?.errorDescription || err}.`,
                isQuestion: false,
                showModal: true
            }))
        }
    }

    const showTitleAdding = () => {
        setItem({})
        setTypeOfOperation("createTitle")
        setShowTitle(true)
    }

    const handleEdit = (id) => {
        setItem(titles.find(t => t.id === id))
        setTypeOfOperation("editTitle")
        setShowTitle(true)
    }

    const handleDelete = (id) => {
        setItem(titles.find(t => t.id === id))
        setModalValues(prev => ({
            ...prev,
            message: "Bu başlığı silməyə əminsiniz?",
            isQuestion: true,
            showModal: true,
            type: "deleteTitle"
        }))
    }

    const goForm = (id) => {
        setItem(titles.find(t => t.id === id))
        setShowForm(true)
    }

    useEffect(() => {
        const u = localStorage.getItem("userObj")
            ? JSON.parse(localStorage.getItem("userObj"))
            : null
        setuObj(u)
        getTitles()
    }, [localStorage.getItem("userObj")])

    if (uObj?.shouldChangePassword) return null

    return (
        loading ? <Loading loadingMessage={"Sənəd tipləri yüklənir..."} /> :
        <section className="home">

            <div className="cards-wrapper">

                {uObj?.admin && (
                    <div className="title-card add-card" onClick={showTitleAdding}>
                        <FiPlus />
                        <span>Yeni sənəd tipi əlavə et</span>
                    </div>
                )}

                {titles.map(title => (
                    <div key={title.id} className="title-card">
                        <div className="card-head">
                            <FaFolderOpen />
                            <span>{title.title}</span>
                        </div>

                        <div className="card-actions">
                            {uObj?.admin && (
                                <>
                                    <button onClick={() => handleEdit(title.id)}>
                                        <FaEdit />
                                        <span>Redaktə</span>
                                    </button>
                                    <button onClick={() => handleDelete(title.id)}>
                                        <FaTrashAlt />
                                        <span>Sil</span>
                                    </button>
                                </>
                            )}
                            <button className="primary" onClick={() => goForm(title.id)}>
                                <FaArrowRight />
                                <span>Davam et</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {showTitle && (
                <div className="overlay">
                    <AddTitle
                        setShowTitle={setShowTitle}
                        userObj={uObj}
                        typeOfOperation={typeOfOperation}
                        item={item}
                        setModalValues={setModalValues}
                    />
                </div>
            )}

            {showForm && (
                <Form
                    uObj={uObj}
                    setShowForm={setShowForm}
                    setModalValues={setModalValues}
                    item={item}
                    fromDocDetail={[]}
                    chapter={null}
                />
            )}
        </section>
    )
}

export default Home
