import './App.css'
import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Header from './Components/Header/Header';
import Login from './Components/Login/Login';
import Home from './Components/Home/Home';
import api from './Components/api';
import AdminPage from './Components/AdminPage/AdminPage';
import CreateUser from './Components/AdminPage/CreateUser';
import AllUsers from './Components/AdminPage/AllUsers';
import Modal from './Components/Modals/Modal';
import Units from './Components/AdminPage/Units/Units';
import Departments from './Components/AdminPage/Departments/Departments';
import Update from './Components/AdminPage/UpdateDeleteAdd/Update';
import AddItem from './Components/AdminPage/UpdateDeleteAdd/AddItem';
import GetMessages from './Components/Home/MyMessages/GetMessages';
import SendMessages from './Components/Home/MyMessages/SendMessages';
import Loading from './Components/Modals/Loading';
import CreateForm from './Components/AdminPage/CreateForm';

function App() {

  const [updateItem, setUpdateItem] = useState(null)
  const [addItem, setAddItem] = useState(null)
  const [item, setItem] = useState({})
  const [typeOfItem, setTypeOfItem] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(true)
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    fatherName: "",
    position: "",
    username: "",
    password: "",
    rankId: "",
    csr: "",
    fin: "",
    adminUsername: "",
    adminPassword: ""
  })

  const [modalValues, setModalValues] = useState({
    message: null,
    answer: null,
    showModal: null,
    isQuestion: null,
    type: null
  })

  const location = useLocation();
  const navigate = useNavigate();
  const noNavbar = location.pathname === '/login';

  const [token, setToken] = useState(localStorage.getItem("myUserDocumentToken"));
  const [userObj, setUserObj] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      const currentToken = localStorage.getItem("myUserDocumentToken");
      if (token !== currentToken) {
        setToken(currentToken);
        if (!currentToken) navigate("/login", { replace: true });
      }
    }, 100);
    return () => clearInterval(interval);
  }, [token, navigate]);


  const deleteItem = async (itemName) => {
    const token = localStorage.getItem("myUserDocumentToken")

    if (!token) return;

    const url = itemName === "deleteDepartment" ? '/manage/deleteDepartment/' :
      itemName === "deleteHeadUnit" ? '/manage/deleteHeadUnit/' :
        itemName === "deleteUnit" ? '/manage/deleteUnit/' :
          itemName === "deleteUser" ? '/admin/deleteUser/' :
            itemName === "deleteTitle" ? '/admin/chapter/deleteChapter/' : "/doc/deleteDoc/"


    try {
      await api.delete(`${url}${item.id}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })
      setModalValues({
        message: `${itemName === "deleteDepartment" ? 'İdarə' :
          itemName === "deleteHeadUnit" ? 'Baş Bölmə' :
            itemName === "deleteUnit" ? 'Bölmə' :
              itemName === "deleteUser" ? "İstifadəçi" :
                itemName === "deleteTitle" ? 'Başlıq' : 'Sənəd'}${' '}uğurla silindi ✅`,
        showModal: true,
        isQuestion: false,
        answer: null,
        type: null
      })

      setTimeout(() => {
        window.location.reload()
      }, 1500);
    }
    catch (err) {
      setModalValues({
        message: `❌ Məlumatlar yüklənərkən problem yaşandı...`,
        showModal: true,
        isQuestion: false,
        answer: null,
        type: null
      })
    }
  }

  useEffect(() => {
    const exitAccount = async () => {
      if (modalValues.answer && modalValues.type === "exitAccount") {
        const token = localStorage.getItem("myUserDocumentToken")

        if (!token) return;

        try {
          setLoading(true)
          await api.put("/auth/signOut", {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            }
          })
          localStorage.removeItem("myUserDocumentToken");
          localStorage.removeItem("tokenExpiration");
          localStorage.removeItem("userObj")
          setToken(null);
          navigate("/login", { replace: true });
          setModalValues(prev => ({
            ...prev,
            answer: null,
            type: null
          }))
          setLoading(false)
        }
        catch (err) {
          setLoading(false)
          setModalValues({
            message: `❌ Hesabdan çıxarkən problem yaşandı...`,
            showModal: true,
            isQuestion: false,
            answer: null,
            type: null
          })
        }
      }
      else if (modalValues.answer && modalValues.type === "deleteDepartment") {
        deleteItem('deleteDepartment')
      }
      else if (modalValues.answer && modalValues.type === "deleteUnit") {
        deleteItem('deleteUnit')
      }
      else if (modalValues.answer && modalValues.type === "deleteHeadUnit") {
        deleteItem('deleteHeadUnit')
      }
      else if (modalValues.answer && modalValues.type === "deleteUser") {
        deleteItem('deleteUser')
      }
      else if (modalValues.answer && modalValues.type === "deleteTitle") {
        deleteItem('deleteTitle')
      }
      else if (modalValues.answer && modalValues.type === "deleteDoc") {
        deleteItem('deleteDoc')
      }
    }

    exitAccount()
  }, [modalValues.answer])

  return (
    loading ? <Loading loadingMessage={"Hesabdan çıxılır..."} /> : <div className='main-element'>
      {!noNavbar && <Header
        setUserObj={setUserObj}
        userObj={userObj}
        modalValues={modalValues}
        setModalValues={setModalValues}
      />}
      <Routes>
        {!token ? (
          <>
            <Route path="/login" element={<Login setToken={setToken} setItem={setItem} />} />
            {showForm && (
              <Route path='/create-admin-page' element={<CreateForm
                formData={formData}
                setFormData={setFormData}
                setShowForm={setShowForm}
                ep={"/admin/createAdmin"} isAdmin={true}
                setModalValues={setModalValues} />
              } />
            )}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          <>
            <Route path="/" element={<Home
              userObj={userObj}
              setModalValues={setModalValues}
              setItem={setItem}
              item={item} />} />

            <Route path="/adminpage" element={<AdminPage
              userObj={userObj} />} />

            <Route path="/adminpage/create-user" element={<CreateUser
              userObj={userObj}
              modalValues={modalValues}
              setModalValues={setModalValues} />} />

            <Route path="/adminpage/all-users" element={<AllUsers
              userObj={userObj}
              setItem={setItem}
              setModalValues={setModalValues} />} />

            <Route path="/adminpage/all-units" element={<Units
              userObj={userObj}
              setModalValues={setModalValues}
              setUpdateItem={setUpdateItem}
              setAddItem={setAddItem}
              setItem={setItem}
              setTypeOfItem={setTypeOfItem} />} />

            <Route path="/adminpage/all-departments" element={<Departments
              userObj={userObj}
              setModalValues={setModalValues}
              setUpdateItem={setUpdateItem}
              setAddItem={setAddItem}
              setItem={setItem}
              setTypeOfItem={setTypeOfItem} />} />

            <Route path='/inbox-all-messages' element={<GetMessages setModalValues={setModalValues} setItem={setItem} item={item} />} />

            <Route path='/sent-all-messages' element={<SendMessages setModalValues={setModalValues} setItem={setItem} item={item} />} />

            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>

      {modalValues.showModal && <Modal modalValues={modalValues} setModalValues={setModalValues} />}

      {updateItem && (<Update
        userObj={userObj}
        setModalValues={setModalValues}
        setUpdateItem={setUpdateItem}
        item={item}
        typeOfItem={typeOfItem} />
      )}

      {addItem && (
        <AddItem
          userObj={userObj}
          setModalValues={setModalValues}
          setAddItem={setAddItem}
          typeOfItem={typeOfItem} />
      )}
    </div>
  );
}

export default App;
