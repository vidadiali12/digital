import './Header.css'
import logo from '../../Images/Logos/logo.png';
import { NavLink, Link } from 'react-router-dom';
import { IoPersonOutline } from "react-icons/io5";
import { CiLogout } from "react-icons/ci";
import { AiFillCaretDown, AiFillHome } from 'react-icons/ai';
import { IoShieldCheckmarkOutline } from "react-icons/io5";
import { HiOutlineInbox } from "react-icons/hi";
import { FiSend } from "react-icons/fi";
import { useEffect, useState } from 'react';
import Profile from '../Modals/Profile';

const Header = ({ setUserObj, userObj, modalValues, setModalValues }) => {

    const [profile, setProfile] = useState(null)

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
        for (let i = 0; i < navigateArr.length; i++) {
            navigateArr[i].classList.remove("active-navigate")
        }

        e.target.classList.add("active-navigate")
        console.log(e.target)
    }

    return (
        <div className='header'>
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
                            <AiFillHome className='menu-icon' /> Əsas Səhifə
                        </NavLink>
                    </span>

                    <span className='passiv-navigate' onClick={(e) => makeActiveNavigate(e)}>
                        <NavLink to="/inbox-all-messages">
                            <HiOutlineInbox className='menu-icon' /> Gələn mesajlar
                        </NavLink>
                    </span>

                    <span className='passiv-navigate' onClick={(e) => makeActiveNavigate(e)}>
                        <NavLink to="/sent-all-messages">
                            <FiSend className='menu-icon' /> Göndərdiklərim
                        </NavLink>
                    </span>
                </div>
            </ul>

            {
                profile && (
                    <Profile userObj={userObj}
                        setProfile={setProfile}
                        modalValues={modalValues}
                        setModalValues={setModalValues} />
                )
            }
        </div>
    );
}

export default Header;
