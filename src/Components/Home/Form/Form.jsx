import React, { useEffect, useState } from 'react';
import './Form.css';
import * as XLSX from 'xlsx';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import { FiPlus } from 'react-icons/fi';
import api from '../../api';
import Loading from '../../Modals/Loading';
import { arrayBufferToBase64, decryptDataWithAes, decryptKeyWithRsa, encryptDataWithAes, encryptKeyWithRsa, generateCsr } from '../../Functions/Functions';
import WithPassword from './WithPassword';
import GetReceivers from './GetReceivers';

const Form = ({ userObj, item, setShowForm, setModalValues }) => {

    const [selectedWord, setSelectedWord] = useState('');
    const [pdfUrl, setPdfUrl] = useState('');
    const [departments, setDepartments] = useState([]);
    const [units, setUnits] = useState([]);
    const [addedEntries, setAddedEntries] = useState([]);
    const [editingIndex, setEditingIndex] = useState(null);
    const [showFileArea, setShowFileArea] = useState('');
    const [showButton, setShowButton] = useState('');
    const [showSendButton, setShowSendButton] = useState('unshow-button');
    const [typeOfAccountId, setTypeOfAccountId] = useState(null);
    const [typeOfAccounts, setTypeOfAccounts] = useState(null);
    const [ranks, setRanks] = useState([])
    const [loading, setLoading] = useState(null);
    const [disabled, setDisabled] = useState(false)

    const [totalDisabled, setTotalDisabled] = useState(true)

    const [mainForm, setMainForm] = useState([])
    const [mainExcelData, setMainExcelData] = useState([]);
    const [showExcelData, setShowExcelData] = useState(false)
    const [excelFileValues, setExcelFileValues] = useState({})

    const [depPage, setDepPage] = useState(1);
    const [unitPage, setUnitPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [countOfDepartments, setCountOfDepartments] = useState(1);
    const [countOfUnits, setCountOfUnits] = useState(1);

    const [showPasswordAlert, setShowPasswordAlert] = useState(false)

    const [pdfBase64, setPdfBase64] = useState("")
    const [dcryptdStrng, setDcryptdStrng] = useState("")
    const [receiver, setReceiver] = useState(null)

    const initialForm = {
        name: '',
        surname: '',
        father: '',
        fin: '',
        rank: '',
        position: '',
        phone: '',
        management: '',
        unit: '',
    };

    const initialFormKey = {
        name: 'Ad',
        surname: 'Soyad',
        father: 'Ata adı',
        fin: 'Fin',
        rank: 'Rütbə',
        position: 'Vəzifə',
        phone: 'Telefon nömrəsi',
        management: 'İdarə',
        unit: 'Bölmə',
    };

    const fileForm = { file: null };

    const [formData, setFormData] = useState(initialForm);
    const [fileData, setFileData] = useState(fileForm);

    const handleWordClick = (word) => setSelectedWord(word);

    const changeTypeOfAccount = (e) => {
        setTypeOfAccountId(e.target.value)
        setTotalDisabled(false)
    }

    const handleChange = async (e) => {
        const { name, value } = e.target;

        if (name === 'management') {
            if (value === 'load_more') {
                await loadMoreDepartments();
                return;
            } else {
                setFormData(prev => ({ ...prev, management: value, unit: '' }));
            }
        } else if (name === 'unit') {
            if (value === 'load_more') {
                await loadMoreUnits();
                return;
            } else {
                setFormData(prev => ({ ...prev, unit: value }));
            }
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };
    const handleChangeFile = async (e) => {

        setLoading(true)

        const file = e.target.files[0];
        if (!file) return;

        setFileData({ ...fileData, file });

        const token = localStorage.getItem("myUserDocumentToken");
        const serverPublicKeyBase64 = localStorage.getItem("serverPublicKey");
        if (!token || !serverPublicKeyBase64) return;

        const reader = new FileReader();
        reader.onload = async () => {
            const arrayBuffer = reader.result;
            const base64Word = arrayBufferToBase64(arrayBuffer)

            try {
                const aesKey = await window.crypto.subtle.generateKey(
                    { name: "AES-CBC", length: 256 },
                    true,
                    ["encrypt", "decrypt"]
                );
                const rawAesKeyBuffer = await window.crypto.subtle.exportKey("raw", aesKey);

                const { cipherText, iv } = await encryptDataWithAes(base64Word, aesKey);

                const encryptedKey = await encryptKeyWithRsa(rawAesKeyBuffer, serverPublicKeyBase64);


                const response = await api.post('/doc/convertToPdf', { cipherText, key: encryptedKey, iv }, {
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
                });

                const responseData = response.data.data;

                const importedServerPrivateKeyB64 = localStorage.getItem("clientPrivateKey");
                if (!importedServerPrivateKeyB64) throw new Error("❌ Private key tapılmadı!");

                function base64ToArrayBuffer(b64) {
                    const binary = atob(b64);
                    const bytes = new Uint8Array(binary.length);
                    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
                    return bytes.buffer;
                }

                const pkcs8ArrayBuffer = base64ToArrayBuffer(importedServerPrivateKeyB64);

                const importedPrivateKey = await window.crypto.subtle.importKey(
                    "pkcs8",
                    pkcs8ArrayBuffer,
                    { name: "RSA-OAEP", hash: "SHA-256" },
                    false,
                    ["decrypt"]
                );


                const decryptedKeyBuffer = await decryptKeyWithRsa(responseData.key, importedPrivateKey);
                const decryptedString = await decryptDataWithAes(responseData.cipherText, responseData.iv, decryptedKeyBuffer);


                const byteCharacters = atob(decryptedString);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }

                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: "application/pdf" });
                const url = URL.createObjectURL(blob);

                setPdfUrl(url);
                setLoading(false);
                setShowSendButton('')

                const base64String = btoa(
                    new Uint8Array(byteArray).reduce((data, byte) => data + String.fromCharCode(byte), "")
                );
                setPdfBase64(base64String);

            } catch (err) {
                setModalValues((prev) => ({
                    ...prev,
                    message:
                        '❌ PDF formatına çevrilərkən xəta baş verdi. Yenidən yoxlayın.',
                    isQuestion: false,
                    showModal: true,
                }));
            }
        };

        reader.readAsArrayBuffer(file);

        if (mainExcelData.length > 0) {
            setShowExcelData(true);
        } else {
            setModalValues((prev) => ({
                ...prev,
                message:
                    '❌ Excel məlumatlarınız boşdur. Məlumatları yenidən doldurub, sənədləri yenidən hazırlayın!',
                isQuestion: false,
                showModal: true,
            }));
        }
    };

    const downloadExcel = () => {
        const a = document.createElement('a');
        a.href = excelFileValues.url;
        a.download = `${excelFileValues.exportName ? excelFileValues.exportName : ''} - export.xlsx`;
        a.click();
        a.style.border = "none"

        URL.revokeObjectURL(excelFileValues.url);
    }

    const createExcell = async () => {

        const token = localStorage.getItem("myUserDocumentToken");
        if (!token) throw new Error("Token tapılmadı");

        const serverPublicKeyBase64 = localStorage.getItem("serverPublicKey");
        if (!serverPublicKeyBase64) throw new Error("Server public key tapılmadı");

        try {
            if (addedEntries.length > 0 && typeOfAccountId) {

                const requestDataJson = { forms: mainForm };

                const aesKey = await window.crypto.subtle.generateKey(
                    { name: "AES-CBC", length: 256 },
                    true,
                    ["encrypt", "decrypt"]
                );
                const rawAesKeyBuffer = await window.crypto.subtle.exportKey("raw", aesKey);

                const { cipherText, iv } = await encryptDataWithAes(requestDataJson, aesKey);

                const encryptedKey = await encryptKeyWithRsa(rawAesKeyBuffer, serverPublicKeyBase64);

                const resToExcel = await api.post('/doc/exportAsExcel',
                    { cipherText, key: encryptedKey, iv },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                const responseData = resToExcel.data.data;

                const importedServerPrivateKeyB64 = localStorage.getItem("clientPrivateKey");
                if (!importedServerPrivateKeyB64) throw new Error("❌ Private key tapılmadı!");

                function base64ToArrayBuffer(b64) {
                    const binary = atob(b64);
                    const bytes = new Uint8Array(binary.length);
                    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
                    return bytes.buffer;
                }

                const pkcs8ArrayBuffer = base64ToArrayBuffer(importedServerPrivateKeyB64);

                const importedPrivateKey = await window.crypto.subtle.importKey(
                    "pkcs8",
                    pkcs8ArrayBuffer,
                    { name: "RSA-OAEP", hash: "SHA-256" },
                    false,
                    ["decrypt"]
                );


                const decryptedKeyBuffer = await decryptKeyWithRsa(responseData.key, importedPrivateKey);
                const decryptedString = await decryptDataWithAes(responseData.cipherText, responseData.iv, decryptedKeyBuffer);

                const excelArrayBuffer = base64ToArrayBuffer(decryptedString);

                const workbook = XLSX.read(excelArrayBuffer, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                const excelData = XLSX.utils.sheet_to_json(worksheet, { defval: null });

                const blob = new Blob([excelArrayBuffer], {
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                });
                const url = URL.createObjectURL(blob);

                const exportName = typeOfAccounts?.find(
                    type => type.id === Number(requestDataJson.forms[0].accountTypeId)
                )?.name;

                const a = document.createElement('a');
                a.href = url;
                a.download = `${exportName ? exportName : ''} - export.xlsx`;
                a.click();

                URL.revokeObjectURL(url);

                setExcelFileValues({
                    url: url,
                    exportName: exportName,
                })

                setMainExcelData(excelData)

                setModalValues(prev => ({
                    ...prev,
                    message: `Form təsdiqləndi. Excel olaraq yüklə!
                    QEYD: Excel faylında dəyişiklik edib, onu word sənədində yadda saxlayın. Hazırlanmış Word sənədini əlavə edin!!!`,
                    showModal: true,
                    isQuestion: false,
                }));

                setShowFileArea('show-file-area');
                setShowButton("show-button")
                setAddedEntries([])
                setTotalDisabled(true)

            } else {
                throw new Error(`❌ Ən az bir istifadəçi yaradılmalıdır!`);
            }
        } catch (err) {
            setModalValues(prev => ({
                ...prev,
                message: err.message,
                showModal: true,
                isQuestion: false,
            }));
        }
    };

    const handleAddOrEdit = () => {
        try {
            for (const [key, value] of Object.entries(formData)) {
                if (key !== "unit") {
                    if (value === '') {
                        throw new Error(`❌ ${initialFormKey[key]} boş saxlanıla bilməz!`);
                    }
                }
            }

            if (editingIndex !== null) {
                const updated = [...addedEntries];
                updated[editingIndex] = { ...formData };
                setAddedEntries(updated);

                const updatedMainForm = [...mainForm];
                updatedMainForm[editingIndex] = {
                    ...{
                        fin: formData.fin,
                        name: formData.name,
                        surname: formData.surname,
                        fatherName: formData.father,
                        rankId: formData.rank,
                        departmentId: formData.management,
                        unitId: formData.unit,
                        position: formData.position,
                        phoneNumber: formData.phone,
                        accountTypeId: typeOfAccountId
                    }
                }
                setMainForm(updatedMainForm);

                setEditingIndex(null);
            } else {
                setAddedEntries(prev => [...prev, { ...formData }]);
                setMainForm(prev => [
                    ...prev,
                    {
                        fin: formData.fin,
                        name: formData.name,
                        surname: formData.surname,
                        fatherName: formData.father,
                        rankId: formData.rank,
                        departmentId: formData.management,
                        unitId: formData.unit,
                        position: formData.position,
                        phoneNumber: formData.phone,
                        accountTypeId: typeOfAccountId
                    }
                ])
            }

            setFormData(initialForm);
            setDisabled(true)
            document.getElementById('selectType').style.cursor = "default"
        } catch (err) {
            setModalValues(prev => ({
                ...prev,
                message: err.message,
                showModal: true,
                isQuestion: false,
            }));
        }
    };

    const handleEdit = (index) => {
        setFormData(addedEntries[index]);
        setEditingIndex(index);
    };

    const handleDelete = (index) => {
        setAddedEntries(prev => prev.filter((_, i) => i !== index));
        if (editingIndex === index) {
            setEditingIndex(null);
            setFormData(initialForm);
        }
    };

    const chooseType = async () => {
        const token = localStorage.getItem('myUserDocumentToken');
        if (!token) return;

        try {
            setLoading(true);
            const [resType, resRank, resDepartments, resUnits] = await Promise.all([
                api.get('/form/getAccountTypes', {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                api.get('/manage/getRanks'),
                api.get('/form/getDepartments', {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { page: depPage, pageSize },
                }),
                api.get('/form/getUnits', {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { page: unitPage, pageSize },
                }),
            ]);

            setTypeOfAccounts(resType.data.data.data);
            setRanks(resRank.data.data)
            setDepartments(resDepartments.data.data.data);
            setUnits(resUnits.data.data.data);
            setCountOfDepartments(resDepartments.data.data.totalItem);
            setCountOfUnits(resUnits.data.data.totalItem);
            setLoading(null);
        } catch (err) {
            setLoading(null);
        }
    };

    const loadMoreDepartments = async () => {
        try {
            const token = localStorage.getItem('myUserDocumentToken');
            const nextPage = depPage + 1;
            const res = await api.get('/form/getDepartments', {
                headers: { Authorization: `Bearer ${token}` },
                params: { page: nextPage, pageSize },
            });
            const newData = res.data.data.data;
            if (newData.length > 0) {
                setDepartments(prev => [...prev, ...newData]);
                setDepPage(nextPage);
            }
        } catch (err) {
            setModalValues(prev, (
                {
                    ...prev,
                    message: '❌ İdarələr yüklənərkən xəta baş verdi. Yenidən yoxlayın!',
                    isQuestion: false,
                    showModal: true
                }
            ))
        }
    };

    const loadMoreUnits = async () => {
        try {
            const token = localStorage.getItem('myUserDocumentToken');
            const nextPage = unitPage + 1;
            const res = await api.get('/form/getUnits', {
                headers: { Authorization: `Bearer ${token}` },
                params: { page: nextPage, pageSize },
            });
            const newData = res.data.data.data;
            if (newData.length > 0) {
                setUnits(prev => [...prev, ...newData]);
                setUnitPage(nextPage);
            }
        } catch (err) {
            setModalValues(prev, (
                {
                    ...prev,
                    message: '❌ Bölmələr yüklənərkən xəta baş verdi. Yenidən yoxlayın!',
                    isQuestion: false,
                    showModal: true
                }
            ))
        }
    };

    useEffect(() => {
        chooseType();
    }, []);



    const handleSignClick = () => {
        setShowPasswordAlert(true);
    };

    const signDocument = async (pwd) => {
        try {
            setShowPasswordAlert(false);
            setLoading(true)

            const token = localStorage.getItem("myUserDocumentToken");
            if (!token) throw new Error("Token tapılmadı");

            const serverPublicKeyBase64 = localStorage.getItem("serverPublicKey");
            if (!serverPublicKeyBase64) throw new Error("Server public key tapılmadı");

            const aesKey = await window.crypto.subtle.generateKey(
                { name: "AES-CBC", length: 256 },
                true,
                ["encrypt", "decrypt"]
            );
            const rawAesKeyBuffer = await window.crypto.subtle.exportKey("raw", aesKey);

            const csr = await generateCsr({
                name: userObj?.name,
                surname: userObj?.surname,
                father: userObj?.father,
                fin: userObj?.fin,
                password: pwd
            });

            if (!csr) throw new Error('❌ "CSR yaradıla bilmədi"');

            const requestDataJson = {
                pdfBase64,
                csr,
            };

            const { cipherText, iv } = await encryptDataWithAes(
                requestDataJson,
                aesKey
            );

            const encryptedKey = await encryptKeyWithRsa(
                rawAesKeyBuffer,
                serverPublicKeyBase64
            );

            const response = await api.post(
                '/doc/signDoc',
                { cipherText, key: encryptedKey, iv },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            const responseData = response.data.data;

            const importedServerPrivateKeyB64 = localStorage.getItem("clientPrivateKey");
            if (!importedServerPrivateKeyB64) throw new Error("❌ Private key tapılmadı!");

            function base64ToArrayBuffer(b64) {
                const binary = atob(b64);
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
                return bytes.buffer;
            }

            const pkcs8ArrayBuffer = base64ToArrayBuffer(importedServerPrivateKeyB64);

            const importedPrivateKey = await window.crypto.subtle.importKey(
                "pkcs8",
                pkcs8ArrayBuffer,
                { name: "RSA-OAEP", hash: "SHA-256" },
                false,
                ["decrypt"]
            );


            const decryptedKeyBuffer = await decryptKeyWithRsa(responseData.key, importedPrivateKey);
            const decryptedString = await decryptDataWithAes(responseData.cipherText, responseData.iv, decryptedKeyBuffer);

            setDcryptdStrng(decryptedString)

            getReceiver();

        } catch (err) {
            setModalValues(prev => (
                {
                    ...prev,
                    message: `❌ Sənəd göndərilərkən xəta baş verdi. Yenidən yoxlayın (İmza problemi) ${err}`,
                    isQuestion: false,
                    showModal: true
                }
            ))
        }
        finally {
            setLoading(false)
        }
    };

    const getReceiver = () => {
        setReceiver(true)
    }

    const sendDocumend = async (receiver, description) => {
        try {
            setLoading(true)
            const token = localStorage.getItem("myUserDocumentToken");
            if (!token) throw new Error("Token tapılmadı");

            const serverPublicKeyBase64 = localStorage.getItem("serverPublicKey");
            if (!serverPublicKeyBase64) throw new Error("Server public key tapılmadı");

            const aesKey = await window.crypto.subtle.generateKey(
                { name: "AES-CBC", length: 256 },
                true,
                ["encrypt", "decrypt"]
            );
            const rawAesKeyBuffer = await window.crypto.subtle.exportKey("raw", aesKey);

            if (!typeOfAccountId || mainForm.length == 0) throw new Error("Excel data çevrilərkən problem yaşandı. Yenidən yoxlayın");

            const requestDataJson = {
                pdfBase64: dcryptdStrng,
                receiverId: receiver?.id,
                chapterId: typeOfAccountId,
                description: description,
                forum: {
                    forms: mainForm
                }
            };

            const { cipherText, iv } = await encryptDataWithAes(
                requestDataJson,
                aesKey
            );

            const encryptedKey = await encryptKeyWithRsa(
                rawAesKeyBuffer,
                serverPublicKeyBase64
            );

            const response = await api.post(
                '/doc/sendDoc',
                { cipherText, key: encryptedKey, iv },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            setShowForm(false)
            const responseData = response.data.data;
            setModalValues(prev => (
                {
                    ...prev,
                    message: "Sənəd uğurla göndərildi ✅",
                    isQuestion: false,
                    showModal: true
                }
            ))
        } catch (err) {
            setModalValues(prev => (
                {
                    ...prev,
                    message: `❌ Sənəd göndərilərkən xəta baş verdi. Yenidən yoxlayın ${err}`,
                    isQuestion: false,
                    showModal: true
                }
            ))
            
      setLoading(false);
        }
    }


    return loading ? (
        <Loading loadingMessage={'Məlumatlar analiz edilir...'} />
    ) : (
        <div className="form-overlay-box">
            <div className="form-box">
                <h2 className="form-title">
                    Sənəd növü:
                    <span style={{ color: 'var(--color-pale-teal)', padding: '0px 10px' }}>
                        {item?.title}
                    </span>

                    <select className="select" disabled={disabled} id='selectType' onChange={(e) => changeTypeOfAccount(e)}>
                        <option value="" >İstifadəçi növü seç</option>
                        {typeOfAccounts?.map((type) => (
                            <option value={type.id} key={type.id}>
                                {type.name}
                            </option>
                        ))}
                    </select>
                </h2>

                {addedEntries.length > 0 && typeOfAccountId && (
                    <div className="added-entries">
                        {addedEntries.map((entry, idx) => (
                            <div key={idx} className="entry-card">
                                <p>
                                    <b>{idx + 1}.</b>{' '}
                                    <i>
                                        {ranks.find(rank => Number(rank.id) == Number(entry.rank)).name} {entry.name} {entry.surname} {entry.father}
                                    </i>
                                </p>
                                <div className="entry-actions">
                                    <button className="btn btn-green" onClick={() => handleEdit(idx)}>
                                        <FaEdit />
                                    </button>
                                    <button className="btn btn-red" onClick={() => handleDelete(idx)}>
                                        <FaTrashAlt />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="form-body">
                    {
                        (!showExcelData ? (
                            <div className="form-fields">
                                <input name="name" value={formData.name} disabled={totalDisabled} onChange={handleChange} placeholder="Ad" />
                                <input name="surname" value={formData.surname} disabled={totalDisabled} onChange={handleChange} placeholder="Soyad" />
                                <input name="father" value={formData.father} disabled={totalDisabled} onChange={handleChange} placeholder="Ata adı" />
                                <input name="fin" value={formData.fin} disabled={totalDisabled} onChange={handleChange} placeholder="Fin" />
                                <select name="rank" value={formData.rank} disabled={totalDisabled} onChange={handleChange} placeholder="Rütbə" className='select' >
                                    <option value="">Rütbə seç</option>
                                    {
                                        ranks.map((rank) => (
                                            <option value={rank.id}>
                                                {rank.description}
                                            </option>
                                        ))
                                    }
                                </select>
                                <input name="position" value={formData.position} disabled={totalDisabled} onChange={handleChange} placeholder="Vəzifə" />
                                <input name="phone" value={formData.phone} disabled={totalDisabled} onChange={handleChange} placeholder="+994505005050" />

                                <select name="management" value={formData.management} disabled={totalDisabled} onChange={handleChange} className="select">
                                    <option value="">İdarə seç</option>
                                    {departments?.map((d, i) => (
                                        <option key={i} value={d.id}>{d.tag}</option>
                                    ))}
                                    {departments.length < countOfDepartments && <option value="load_more">...</option>}
                                </select>

                                <select name="unit" value={formData.unit} disabled={totalDisabled} onChange={handleChange} className="select">
                                    <option value="">Bölmə seç</option>
                                    {units
                                        ?.filter(u => u.departmentId == formData.management)
                                        .map((u, i) => (
                                            <option key={i} value={u.id}>{u.tag}</option>
                                        ))}
                                    {units.length < countOfUnits && <option value="load_more">...</option>}
                                </select>

                                <button type="button" className="btn btn-green" onClick={handleAddOrEdit} disabled={totalDisabled} style={{ display: 'flex', alignItems: 'center' }}>
                                    <FiPlus style={{ marginRight: '6px', fontSize: '22px' }} />
                                    {editingIndex !== null ? 'Yadda saxla' : 'İstifadəçi əlavə et'}
                                </button>

                                <label className={`file-input-label ${showFileArea}`}>
                                    {fileData.file ? fileData.file.name : 'Word faylını seçin'}
                                    <input type="file" name="file" accept=".doc,.docx" onChange={handleChangeFile} />
                                </label>

                                <label className={`file-input-label file-input-label-2 ${showFileArea}`}>
                                    Excel olaraq endirin
                                    <input type="button" onClick={downloadExcel} />
                                </label>
                            </div>
                        ) :

                            (
                                showSendButton === "" ?
                                    <div className='added-users'>
                                        {
                                            mainExcelData.length > 0 && (
                                                mainExcelData?.map((data, dataIndex) => {
                                                    return <div key={dataIndex}>
                                                        <span>{dataIndex + 1}. </span>
                                                        <span>
                                                            {data.Name} {data.Surname}
                                                        </span>
                                                    </div>
                                                })
                                            )
                                        }
                                    </div> :
                                    <div>

                                    </div>
                            )
                        )
                    }

                    <div className="doc-preview">
                        <div className="doc-icon">DOC</div>
                        <div className="doc-text">
                            {pdfUrl ? (
                                <div style={{
                                    width: "100%",
                                    height: "100vh",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    backgroundColor: "#f4f4f4",
                                    borderRadius: "12px",
                                    overflow: "hidden",
                                }}>
                                    <embed
                                        src={`${pdfUrl}#navpanes=0`}
                                        type="application/pdf"
                                        width="100%"
                                        height="100%"
                                        style={{
                                            border: "none",
                                            objectFit: "cover",
                                        }}
                                    />
                                </div>
                            ) : (
                                <span className={`word ${selectedWord === item?.title ? 'selected' : ''}`} onClick={() => handleWordClick(item?.title)}>
                                    {item?.title} sənədi burada görünəcək
                                    <br />
                                    Ən az bir istifadəçi yarat və sənədi əlavə et!
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="form-buttons">
                    <button className={`btn btn-red ${showButton}`} style={{ padding: '10px 22px' }} onClick={() => setShowForm(false)}>
                        Geri
                    </button>
                    <button className={`btn btn-green ${showButton}`} style={{ padding: '10px 22px' }} onClick={createExcell}>
                        Təsdiq
                    </button>
                    <button className={`btn btn-red ${showSendButton}`} style={{ padding: '10px 22px' }} onClick={() => setShowForm(false)}>
                        Ləğv et
                    </button>
                    <button className={`btn btn-green ${showSendButton}`} style={{ padding: '10px 22px' }} onClick={handleSignClick}>
                        Göndər
                    </button>
                </div>
            </div>

            {
                showPasswordAlert && (
                    <WithPassword visible={showPasswordAlert} onSend={signDocument} onClose={() => setShowPasswordAlert(false)} />
                )
            }

            {
                receiver && (
                    <GetReceivers
                        visible={receiver}
                        onClose={() => setReceiver(false)}
                        onSend={sendDocumend}
                        pdf={pdfUrl}
                        setModalValues={setModalValues}
                    />
                )
            }
        </div>
    );
};

export default Form;
