import './Header.css'
import logo from '../../Images/Logos/logo.png';
import { NavLink, Link } from 'react-router-dom';
import { IoPersonOutline } from "react-icons/io5";
import { CiLogout } from "react-icons/ci";
import { AiFillCaretDown, AiFillHome } from 'react-icons/ai';
import { IoShieldCheckmarkOutline } from "react-icons/io5";
import { HiOutlineInbox } from "react-icons/hi";
import { FiSend } from "react-icons/fi";
import { RiCheckboxBlankCircleFill } from "react-icons/ri";
import { useEffect, useState } from 'react';
import Profile from '../Modals/Profile';
import api from '../api';

const Header = ({ setUserObj, setModalValues, connectNow, setConnectNow }) => {

    const [profile, setProfile] = useState(null);
    const [unReadCount, setUnReadCount] = useState(null);
    const [connectOpe, setConnectOpe] = useState(null);

    const uObj = JSON.parse(localStorage.getItem("userObj"));
    useEffect(() => {
        const savedUser = localStorage.getItem("userObj");
        if (savedUser) {
            setUserObj(JSON.parse(savedUser));
        }
    }, []);


    const goLogout = () => {
        setModalValues(prev => ({
            ...prev,
            message: "Hesabınızdan çıxmağa əminsiniz?",
            showModal: true,
            isQuestion: true,
            type: "exitAccount"
        }))
    }

    const showProfile = () => {
        setProfile(true)
    }

    const makeActiveNavigate = (e) => {
        const navigateArr = document.getElementsByClassName("passiv-navigate");
        for (let i = 0; i < navigateArr?.length; i++) {
            navigateArr[i].classList.remove("active-navigate")
        }

        e?.target?.classList.add("active-navigate")
    }

    const callUnRead = async () => {
        const token = localStorage.getItem("myUserDocumentToken");
        if (!token) throw new Error("❌ Token tapılmadı!");

        try {
            const resUnRead = await api.get("/doc/getUnreadDocs", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            setUnReadCount(resUnRead?.data?.data);
        } catch (err) {
            if (err?.response?.data?.errorDescription?.includes("User should reset password")
                ||
                err?.response?.data?.errorDescription?.toLowerCase().includes("parol".toLowerCase())) {
                setUnReadCount(0)
                return;
            }
            else {
                setModalValues(prev => ({
                    ...prev,
                    isQuestion: false,
                    showModal: true,
                    message: `❌ Xəta baş verdi:\n⚠️"${err?.response?.data?.errorDescription || err
                        }". \nYenidən yoxlayın!`
                }))
            }
        }
    }

    const callIsConnect = async () => {
        try {
            const token = localStorage.getItem("myUserDocumentToken");
            if (!token) throw new Error("❌ Token tapılmadı!");
            const isConnect = await api.get("/admin/bridge/getStatus", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            setConnectNow(isConnect?.data?.data)

        } catch (err) {
            setModalValues(prev => ({
                ...prev,
                isQuestion: false,
                showModal: true,
                message: `❌ Əlaqə yaradıla bilmədi!`
            }))
        }
    }

    const connectNs = async () => {
        try {
            setConnectOpe(true);
            const token = localStorage.getItem("myUserDocumentToken");
            if (!token) throw new Error("❌ Token tapılmadı!");
            const connectRes = await api.put("/admin/bridge/startBridging", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            setConnectNow(connectRes?.data?.data)
            setConnectOpe(false);

        } catch (err) {
            setModalValues(prev => ({
                ...prev,
                isQuestion: false,
                showModal: true,
                message: `❌ Əlaqə yaradıla bilmədi!`
            }))
            setConnectOpe(false);
        }
    }

    const disConnectNs = async () => {
        try {
            setConnectOpe(true);
            const token = localStorage.getItem("myUserDocumentToken");
            if (!token) throw new Error("❌ Token tapılmadı!");
            const disConnectRes = await api.put("/admin/bridge/closeBridging", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            setConnectNow(!disConnectRes?.data?.data)
            setConnectOpe(false);

        } catch (err) {
            setModalValues(prev => ({
                ...prev,
                isQuestion: false,
                showModal: true,
                message: `❌ Əlaqə kəsilmədi!`
            }));
            setConnectOpe(false);
        }
    }

    useEffect(() => {
        callUnRead();
        callIsConnect();
    }, []);

    return (
        uObj?.shouldChangePassword ?
            <Profile setProfile={setProfile}
                setModalValues={setModalValues}
                shouldChangePassword={uObj?.shouldChangePassword}
            />
            : (<div className={`header`}>
                <ul className='ul-up'>
                    <li>
                        <Link to="/">
                            <img src={logo} alt="logo of duty system" />
                            <span>Elektron Sənəd Dövriyyəsi</span>
                        </Link>
                    </li>

                    {uObj?.admin && (
                        <NavLink to="/adminpage" className="admin-link">
                            <IoShieldCheckmarkOutline className="admin-icon" />
                            <span>Admin Səhifə</span>
                        </NavLink>
                    )}
                    <li style={{ padding: '5px 0' }}>
                        <IoPersonOutline className='user-icon' />
                        <span>{uObj && (`${uObj?.rank?.name} ${uObj?.name} ${uObj?.surname}`)}</span>
                        <AiFillCaretDown style={{ fontSize: 15, color: 'black' }} />
                        <ul>
                            <li>
                                <button onClick={showProfile}>
                                    <IoPersonOutline className='account-icons' />
                                    <span>Profil</span>
                                </button>
                            </li>
                            <li>
                                <button onClick={goLogout}>
                                    <CiLogout className='account-icons' />
                                    <span>Çıxış</span>
                                </button>
                            </li>
                        </ul>
                    </li>
                </ul>
                <ul className='ul-down'>
                    <div className='main-page-ul'>
                        <span className='passiv-navigate' onClick={(e) => makeActiveNavigate(e)}>
                            <NavLink to="/">
                                <AiFillHome className='menu-icon' />Əsas Səhifə
                            </NavLink>
                        </span>

                        <span className='passiv-navigate' onClick={(e) => makeActiveNavigate(e)}>
                            <NavLink to="/inbox-all-messages">
                                {
                                    (unReadCount != 0 && unReadCount != null) && (<span className='un-read-count'>{unReadCount}</span>)
                                }
                                <HiOutlineInbox className='menu-icon' />Gələn mesajlar
                            </NavLink>
                        </span>

                        <span className='passiv-navigate' onClick={(e) => makeActiveNavigate(e)}>
                            <NavLink to="/sent-all-messages">
                                <FiSend className='menu-icon' />Göndərdiklərim
                            </NavLink>
                        </span>
                    </div>

                    {
                        uObj?.admin && (
                            <div className='ns-connect-box'>
                                <div className='ns-connect-inform'>
                                    <span className='ns-connect-text'>NS bağlantı: </span>
                                    {
                                        connectNow ? <RiCheckboxBlankCircleFill className='connect-icon ci-1' /> : <RiCheckboxBlankCircleFill className='connect-icon ci-2' />
                                    }
                                </div>
                                {
                                    !connectNow && (
                                        <button className='ns-connect-btn' onClick={connectNs}>
                                            {connectOpe ? "Bağlantı yaradılır..." : "Bağlantı yarat"}
                                        </button>
                                    )
                                }
                                {
                                    connectNow && (
                                        <button className='ns-connect-btn' onClick={disConnectNs}>
                                            {connectOpe ? "Bağlantını kəsilir..." : "Bağlantını kəs"}
                                        </button>
                                    )
                                }
                            </div>
                        )
                    }
                </ul>

                {
                    profile && (
                        <Profile
                            setProfile={setProfile}
                            setModalValues={setModalValues}
                            shouldChangePassword={uObj?.shouldChangePassword} />
                    )
                }
            </div>)
    );
}

export default Header;
