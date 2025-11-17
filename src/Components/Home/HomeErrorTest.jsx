import { useState } from "react";
import { mainData, mainUsers, signedData } from '../Data/Data'
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { FaCheck, FaTimes } from 'react-icons/fa';
import pdf from '../../assets/task/test_word_converted5_signed851.pdf'
import '../Modals/ShowPdf.css'
import '../Modals/SignaturesList.css'
import axios from "axios";
import Loading from "../Modals/Loading";

const HomeErrorTest = ({ text, message, setMessage, exitAccount, setExitAccount, isQuestion, setIsQuestion, setModalType, setUserUpdateId, setShowSigned, setShowPdf, setUserType }) => {
    const [expandedRows, setExpandedRows] = useState([]);
    const [showTest, setShowTest] = useState(false)
    const [loading, setLoading] = useState(false)
    const [showTestData, setShowTestData] = useState(false)
    const [signedObj, setSignedObj] = useState([]);

    const toggleRow = (id) => {
        setExpandedRows(prev =>
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        );
    };

    const takeId = async (itemId, user) => {
        // setUserUpdateId(itemId)
        // setShowSigned(true)
        // setUserType(user)
        try {
            const response = await axios.post('http://localhost:9095/ca/v2/verifyDoc', {
                uri: `C:\\Users\\vidadi.alizade\\Desktop\\my projects\\documentSafe\\src\\assets\\task\\test_word_converted5_signed851.pdf`
            });

            const signedUser = {
                ...response.data[0],
                userId: 851
            };

            if (!signedUser.verified || !signedUser.timestampVerified) {
                setLoading(false);
            }

            let sData = JSON.parse(localStorage.getItem('signedData')) || [];
            let idData = []
            sData.forEach(e => {
                if (e.userId === 851) {
                    idData.push(851)
                }
            })
            console.log(idData)
            if (!idData.includes(851)) {
                sData.push(signedUser);
            }
            localStorage.setItem('signedData', JSON.stringify(sData));

            setTimeout(() => {
                setShowTestData(true)
                setSignedObj(sData.filter(e => e.userId === 851));
            }, 100)
        } catch (error) {
            console.error("Sign User məlumatı alınma xətası:", error);
        }
    }

    const showPdf = (itemId, user) => {
        // setUserUpdateId(itemId)
        // setShowPdf(true)
        // setUserType(user)
        setShowTest(true)
    }

    const updateSign = (itemId) => {
        const signObj = signedData.find(e => e.userId === itemId)
        if (signObj.verified && signObj.timestampVerified) {
            setExitAccount(true)
            setIsQuestion(true)
            setMessage("İmzalamağa əminsiniz?")
            setModalType('sign')
            setUserUpdateId(itemId)
        }
        else {
            setExitAccount(true)
            setIsQuestion(false)
            setMessage("Bu sənəd imzalana bilməz!")
            setModalType('sign')
            setUserUpdateId(null)
        }
    }

    const closeThis = () => {
        setShowTestData(false);
    };


    return (
        <>
            <tr className="toggle-row" onClick={() => toggleRow(1)} style={{ cursor: 'pointer' }}>
                <td>
                    <span>tural.usubov (1)</span>
                </td>
                <td style={{ width: '30px', textAlign: 'center' }}>
                    {expandedRows.includes(1) ? <FaChevronUp className="toggle-icon open" /> : <FaChevronDown className="toggle-icon" />}
                </td>
            </tr>

            {expandedRows.includes(1) && (
                <>
                    <tr>
                        <td><b>Ad:</b> Səfər</td>
                        <td>
                            <div><b>Ad:</b> Tural</div>
                        </td>
                    </tr>
                    <tr>
                        <td><b>Soyad:</b> Əhmədli</td>
                        <td >
                            <div><b>Soyad:</b> Usubov</div>
                        </td>
                    </tr>
                    <tr>
                        <td><b>Ata adı:</b> Tahir</td>
                        <td >
                            <div><b>Ata adı:</b> Eyvaz</div>
                        </td>
                    </tr>
                    <tr>
                        <td><b>Rütbə:</b> əsgər</td>
                        <td >
                            <div><b>Rütbə:</b> leytenant</div>
                        </td>
                    </tr>
                    <tr>
                        <td><b>Vəzifə:</b> İstehkamçı</td>
                        <td >
                            <div><b>Vəzifə:</b> Qərargah rəisi</div>
                        </td>
                    </tr>
                    <tr>
                        <td><b>İdarə:</b> MNK</td>
                        <td >
                            <div><b>İdarə:</b> MNk</div>
                        </td>
                    </tr>
                    <tr>
                        <td><b>Bölmə:</b> MNK</td>
                        <td>
                            <div><b>Bölmə:</b> MNK</div>
                        </td>
                    </tr>
                    <tr>
                        <td style={{ border: 'none', display: 'flex', gap: '15px' }}>
                            <button className='sign-button' onClick={() => updateSign(851)}>
                                İmzala
                            </button>
                            <button className='sign-button' onClick={() => takeId(851, 'user')}>
                                Ətraflı
                            </button>
                            <button className='sign-button' onClick={() => showPdf(851, 'user')}>
                                PDF
                            </button>
                        </td>
                    </tr>
                </>
            )}

            {
                showTest ? <div className='show-pdf'>
                    <div className="pdf-container">
                        <iframe
                            src={pdf}
                            title="PDF Viewer"
                            frameBorder="0"
                        />
                    </div>
                    <button className="close-btn" onClick={() => setShowTest(false)}>Bağla</button>
                </div> : null
            }
            {
                loading ? <Loading /> : null
            }

            {
                showTestData ? <div className="signatures-container">
                    <div>
                        <h2 style={{ width: '100%' }}>Təsdiq məlumatları</h2>
                        <ul className="signatures-list">
                            {
                                signedObj.map((obj, index) => {
                                    if (index === 0) {
                                        return <li className={`signature-item ${obj.verified ? 'verified' : 'not-verified'}`} key={`${obj.userId}-${index}`}>
                                            <p><strong>İmza adı:</strong> {obj.signatureName} tural.usubov</p>
                                            <p><strong>İmzalayan şəxs:</strong> leytennat Tural Usubov</p>
                                            <p><strong>Səbəb:</strong> əsgərin bölük dəyişikliyi</p>
                                            <p><strong>Yer:</strong> {obj.location}</p>
                                            <p><strong>Tarix:</strong> {obj.date}</p>
                                            <p>
                                                <strong>Zaman möhürü təsdiqləndi:</strong>{" "}
                                                {obj.timestampVerified ? <FaCheck color="green" /> : <FaTimes color="red" />}
                                            </p>
                                            <p>
                                                <strong>Təsdiqləndi:</strong>{" "}
                                                {obj.verified ? <FaCheck color="green" /> : <FaTimes color="red" />}
                                            </p>
                                        </li>
                                    }
                                })
                            }
                        </ul>
                        <button onClick={closeThis}>Bağla</button>
                    </div>
                </div> : null
            }
        </>
    )

}

export default HomeErrorTest