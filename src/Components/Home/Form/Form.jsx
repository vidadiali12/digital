import React, { useEffect, useState } from 'react';
import './Form.css';
import * as XLSX from 'xlsx';
import {
    FaEdit,
    FaTrashAlt,
    FaEye,
    FaEyeSlash,
} from 'react-icons/fa';
import { FiPlus } from 'react-icons/fi';
import api from '../../api';
import Loading from '../../Modals/Loading';
import { arrayBufferToBase64, decryptDataWithAes, decryptKeyWithRsa, encryptDataWithAes, encryptKeyWithRsa } from '../../Functions/Functions';
import WithPassword from './WithPassword';
import GetReceivers from './GetReceivers';
import { sendDoc } from './SendDocument';
import { signDoc } from './signDocument';

import * as pdfjsLib from "pdfjs-dist/build/pdf";
import workerSrc from "pdfjs-dist/build/pdf.worker?url";
import axios from 'axios';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

const Form = ({ uObj, item, setShowForm, setModalValues, fromDocDetail, chapter }) => {

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
    const [disabled, setDisabled] = useState(false);

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

    const [showPasswordAlert, setShowPasswordAlert] = useState(false);

    const [pdfBase64, setPdfBase64] = useState("");
    const [dcryptdStrng, setDcryptdStrng] = useState("");
    const [receiver, setReceiver] = useState(null);
    const [showDocument, setShowDocument] = useState(false);
    const [showFlash, setShowFlash] = useState(null)
    const [classForWord, setClassForWord] = useState('');
    const [passEyeIcon, setPassEyeIcon] = useState(true);

    const [valueOfCapacity, setValueOfCapacity] = useState('');

    const renderPdfToCanvas = async (pdfBase64) => {
        if (!pdfBase64) return;

        const pdfWrapper = document.querySelector(".pdf-wrapper");
        if (!pdfWrapper) return;

        pdfWrapper.innerHTML = "";

        const pdfData = Uint8Array.from(atob(pdfBase64), c => c.charCodeAt(0));
        const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;

        const wrapperWidth = pdfWrapper.clientWidth || 600;

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);

            const viewport = page.getViewport({ scale: 1 });
            const scale = wrapperWidth / viewport.width;
            const scaledViewport = page.getViewport({ scale });

            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");

            canvas.width = scaledViewport.width;
            canvas.height = scaledViewport.height;
            canvas.style.width = "100%";
            canvas.style.display = "block";
            canvas.style.marginBottom = "16px";

            pdfWrapper.appendChild(canvas);

            await page.render({
                canvasContext: context,
                viewport: scaledViewport,
            }).promise;
        }
    };

    const initialForm = {
        name: '',
        surname: '',
        fatherName: '',
        fin: '',
        rankId: '',
        position: '',
        phoneNumber: '',
        departmentId: '',
        unitId: '',
        mark: '',
        capacity: '',
        serialNumber: ''
    };

    const initialFormKeyObj = {
        name: 'Ad',
        surname: 'Soyad',
        fatherName: 'Ata adı',
        fin: 'Fin',
        rankId: 'Rütbə',
        position: 'Vəzifə',
        phoneNumber: 'Telefon nömrəsi',
        departmentId: 'İdarə',
        unitId: 'Bölmə',
        mark: 'Marka',
        capacity: 'Tutum',
        serialNumber: 'Serial Nömrə'
    };

    const fileForm = { file: null };

    const [formData, setFormData] = useState(
        (item?.eventId == 3 || chapter?.eventId == 3) ?
            { ...initialForm, username: '' } :
            ((item?.eventId == 2 || chapter?.eventId == 2) && uObj?.admin) ?
                { ...initialForm, username: '', password: '' } :
                (item?.eventId == 4 || chapter?.eventId == 4) ?
                    { username: '' } : initialForm);

    const [initialFormKey, setInitialFormKey] = useState(
        (item?.eventId == 3 || chapter?.eventId == 3) ?
            { ...initialFormKeyObj, username: 'İstifadəçi adı' } :
            ((item?.eventId == 2 || chapter?.eventId == 2) && uObj?.admin) ?
                { ...initialFormKeyObj, username: 'İstifadəçi adı', password: 'Parol' } :
                (item?.eventId == 4 || chapter?.eventId == 4) ?
                    { username: 'İstifadəçi adı' } : initialFormKeyObj);

    const [fileData, setFileData] = useState(fileForm);

    const handleWordClick = (word) => setSelectedWord(word);

    const changeTypeOfAccount = async (id) => {
        setTypeOfAccountId(id);
        if (id) {
            setTotalDisabled(false);
        }
        else {
            setTotalDisabled(true);
        }
        const typeObj = typeOfAccounts?.find(t => Number(t?.id) === Number(id));
        if (!typeObj) {
            console.warn("Account type not found:", id);
            return;
        }
        try {
            const token = localStorage.getItem("myUserDocumentToken");
            if (!token) return;

            const isDevice = await api.get(`/form/getAccountTypeById/${Number(id)}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (isDevice?.data?.data?.data?.device) {
                setShowFlash(true);
            }
            else {
                setShowFlash(false);
            }
        } catch (err) {
            setModalValues((prev => ({
                ...prev,
                message: `❌ İstifadəçi növü məlumatları alınarkən xəta baş verdi: 
                    \n⚠️${err?.response?.data?.errorDescription || err
                    }. \nYenidən yoxlayın!`,
                isQuestion: false,
                showModal: true
            })))
        }

    };

    const handleChange = async (e) => {
        const { name, value } = e?.target;

        if (name === 'departmentId') {
            if (value === 'load_more') {
                await loadMoreDepartments();
                return;
            } else {
                setFormData(prev => ({ ...prev, departmentId: value, unitId: '' }));
            }
        } else if (name === 'unitId') {
            if (value === 'load_more') {
                await loadMoreUnits();
                return;
            } else {
                setFormData(prev => ({ ...prev, unitId: value }));
            }
        }
        else {
            setFormData({ ...formData, [name]: value });
        }
    };

    function cleanBase64(str) {
        return str?.replace(/[\r\n\t ]+/g, "").replace(/^"+|"+$/g, "").trim();
    }

    function base64ToArrayBuffer(base64) {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }

    async function importPrivateKey() {
        const privateB64 = localStorage.getItem("clientPrivateKey");
        if (!privateB64) throw new Error("Private key tapılmadı!");

        const pkcs8 = base64ToArrayBuffer(privateB64);

        return await window.crypto.subtle.importKey(
            "pkcs8",
            pkcs8,
            { name: "RSA-OAEP", hash: "SHA-256" },
            false,
            ["decrypt"]
        );
    }

    async function firstDecrypt(responseData) {
        const privateKey = await importPrivateKey();

        const decryptedAES = await decryptKeyWithRsa(responseData.key, privateKey);
        const decryptedText = await decryptDataWithAes(
            responseData.cipherText,
            responseData.iv,
            decryptedAES
        );

        return cleanBase64(decryptedText);
    }

    async function encryptForSecondRequest(data, serverPublicKey) {
        const aesKey = await window.crypto.subtle.generateKey(
            { name: "AES-CBC", length: 256 },
            true,
            ["encrypt", "decrypt"]
        );

        const rawKey = await window.crypto.subtle.exportKey("raw", aesKey);

        const { cipherText, iv } = await encryptDataWithAes(data, aesKey);
        const encryptedKey = await encryptKeyWithRsa(rawKey, serverPublicKey);

        return { cipherText, key: encryptedKey, iv };
    }

    async function secondDecrypt(responseData) {
        const privateKey = await importPrivateKey();

        const decryptedAES = await decryptKeyWithRsa(responseData.key, privateKey);
        const decryptedText = await decryptDataWithAes(
            responseData.cipherText,
            responseData.iv,
            decryptedAES
        );

        return cleanBase64(decryptedText);
    }

    const handleChangeFile = async (e) => {
        setLoading(true);

        const file = e?.target?.files?.[0];
        if (!file) {
            setLoading(false);
            return;
        }

        const token = localStorage.getItem("myUserDocumentToken");
        const serverPublicKey = localStorage.getItem("serverPublicKey");
        if (!token || !serverPublicKey) {
            setLoading(false);
            return;
        }

        const reader = new FileReader();

        reader.onload = async () => {
            try {
                const arrayBuffer = reader.result;
                const base64File = arrayBufferToBase64(arrayBuffer);

                const aesKey1 = await window.crypto.subtle.generateKey(
                    { name: "AES-CBC", length: 256 },
                    true,
                    ["encrypt", "decrypt"]
                );
                const rawKey1 = await window.crypto.subtle.exportKey("raw", aesKey1);
                const encrypted1 = await encryptDataWithAes(base64File, aesKey1);
                const encryptedKey1 = await encryptKeyWithRsa(rawKey1, serverPublicKey);

                const convertResp = await api.post(
                    "/doc/convertToPdf",
                    {
                        cipherText: encrypted1.cipherText,
                        key: encryptedKey1,
                        iv: encrypted1.iv,
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                const decrypted1 = await firstDecrypt(convertResp.data.data);

                const encrypted2 = await encryptForSecondRequest(decrypted1, serverPublicKey);

                const readableResp = await api.post(
                    "/doc/getReadableContent",
                    encrypted2,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                const decryptedPdfB64 = await secondDecrypt(readableResp.data.data);

                // const pdfBuffer = base64ToArrayBuffer(decryptedPdfB64);
                // const blob = new Blob([pdfBuffer], { type: "application/pdf" });
                // const url = URL.createObjectURL(blob);

                setPdfUrl(decryptedPdfB64);
                setPdfBase64(decrypted1);
                setShowSendButton("");
            } catch (err) {
                console.error("❌ Error in handleChangeFile:", err);
                setModalValues(prev => ({
                    ...prev,
                    message: `❌ Məlumatlar alınarkən xəta baş verdi:\n⚠️${err}. Yenidən yoxlayın!`,
                    isQuestion: false,
                    showModal: true,
                }));
            } finally {
                setLoading(false);
            }
        };

        reader.readAsArrayBuffer(file);
    };

    const downloadExcel = () => {
        const a = document.createElement('a');
        a.href = excelFileValues?.url;
        a.download = `${excelFileValues?.exportName ? excelFileValues?.exportName : ''} - export.xlsx`;
        a.click();
        a.style.border = "none"

        URL.revokeObjectURL(excelFileValues?.url);
    }

    const createExcell = async () => {

        const token = localStorage.getItem("myUserDocumentToken");
        if (!token) throw new Error("Token tapılmadı");

        const serverPublicKeyBase64 = localStorage.getItem("serverPublicKey");
        if (!serverPublicKeyBase64) throw new Error("Server public key tapılmadı");

        try {
            if (addedEntries?.length > 0 && typeOfAccountId) {

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

                function base64ToArrayBuffer(base64) {
                    const binaryString = atob(base64);
                    const len = binaryString?.length;
                    const bytes = new Uint8Array(len);
                    for (let i = 0; i < len; i++) {
                        bytes[i] = binaryString?.charCodeAt(i);
                    }
                    return bytes.buffer;
                }
                function cleanBase64(str) {
                    return str
                        ?.replace(/[\r\n\t ]+/g, "")
                        ?.replace(/^"+|"+$/g, "")
                        ?.trim();
                }

                const pkcs8ArrayBuffer = base64ToArrayBuffer(importedServerPrivateKeyB64);

                const importedPrivateKey = await window.crypto.subtle.importKey(
                    "pkcs8",
                    pkcs8ArrayBuffer,
                    { name: "RSA-OAEP", hash: "SHA-256" },
                    false,
                    ["decrypt"]
                );


                const decryptedKeyBuffer = await decryptKeyWithRsa(responseData?.key, importedPrivateKey);
                const decryptedString = await decryptDataWithAes(responseData?.cipherText, responseData?.iv, decryptedKeyBuffer);
                const cleaned = cleanBase64(decryptedString);
                const excelArrayBuffer = base64ToArrayBuffer(cleaned);

                const workbook = XLSX.read(excelArrayBuffer, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: null });

                const excelData = rawData.map(item => ({
                    name: item?.Name || "",
                    surname: item?.Surname || "",
                    fatherName: item?.Father || item?.FatherName || "",
                    fin: item?.Fin || "",
                    rankId: item?.Rank || "",
                    position: item?.Position || "",
                    phoneNumber: item?.Phone || item?.PhoneNumber || "",
                    departmentId: item?.DepartmentId || "",
                    unitId: item?.Unit || "",
                    mark: item?.mark || '',
                    capacity: item?.capacity || '',
                    serialNumber: item?.serialNumber || '',
                    accountTypeId: item?.AccountTypeId || typeOfAccountId
                }));

                const blob = new Blob([excelArrayBuffer], {
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                });
                const url = URL.createObjectURL(blob);

                const exportName = typeOfAccounts?.find(
                    type => type?.id === Number(requestDataJson?.forms[0]?.accountTypeId)
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
                    message: `✅ Form təsdiqləndi. Excel olaraq yüklə! 
                    ⚠️ QEYD: Excel faylında dəyişiklik edib, onu word sənədində yadda saxlayın. Hazırlanmış Word sənədini əlavə edin!!!`,
                    showModal: true,
                    isQuestion: false,
                }));

                setShowFileArea('show-file-area');
                setShowButton("show-button");
                setTotalDisabled(true)

            } else {
                throw new Error(`❌ Ən az bir istifadəçi yaradılmalıdır!`);
            }
        } catch (err) {
            setModalValues(prev => ({
                ...prev,
                message: `❌ Məlumatlar alınarkən xəta baş verdi: 
                    \n⚠️${err?.response?.data?.errorDescription || err
                    }. \nYenidən yoxlayın!`,
                showModal: true,
                isQuestion: false,
            }));
        }
    };

    const handleAddOrEdit = () => {
        try {
            for (const [key, value] of Object.entries(formData)) {
                if (key !== "unitId" && value === '') {
                    if (showFlash) {
                        throw new Error(`❌ ${initialFormKey[key]} boş saxlanıla bilməz!`);
                    }
                    else {
                        if (key !== "mark" && key !== "capacity" && key !== "serialNumber") {
                            throw new Error(`❌ ${initialFormKey[key]} boş saxlanıla bilməz!`);
                        }
                    }
                }
            }
            if (showFlash && formData.capacity) {
                const hasNumber = /\d/.test(formData.capacity);
                const hasUnit = /(KB|MB|GB)$/.test(formData.capacity);

                if (!hasNumber || !hasUnit) {
                    throw new Error("❌ Tutum üçün həm rəqəm, həm vahid seçilməlidir!");
                }
            }

            if (formData.password) {
                const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{8,}$/;

                if (!passwordRegex.test(formData.password)) {
                    throw new Error("Şifrə ən az 8 simvol, böyük hərf, kiçik hərf və xüsusi simvol içerməlidir");
                }
            }

            if (editingIndex !== null) {
                const updated = [...addedEntries];
                updated[editingIndex] = { ...formData };
                setAddedEntries(updated);

                const updatedMainForm = [...mainForm];
                updatedMainForm[editingIndex] = {
                    ...formData,
                    accountTypeId: typeOfAccountId
                };
                setMainForm(updatedMainForm);

                setEditingIndex(null);

            } else {
                setAddedEntries(prev => [...prev, { ...formData }]);
                setMainForm(prev => [
                    ...prev,
                    {
                        ...formData,
                        accountTypeId: typeOfAccountId
                    }
                ]);
            }

            setFormData(
                (item?.eventId == 3 || chapter?.eventId == 3) ?
                    { ...initialForm, username: '' } :
                    ((item?.eventId == 2 || chapter?.eventId == 2) && uObj?.admin) ?
                        { ...initialForm, username: '', password: '' } :
                        (item?.eventId == 4 || chapter?.eventId == 4) ?
                            { username: '' } : initialForm);

            setDisabled(true);
            setValueOfCapacity("")
            document.getElementById('selectType').style.cursor = "default";

        } catch (err) {
            setModalValues(prev => ({
                ...prev,
                message: `\n⚠️${err?.response?.data?.errorDescription ?
                    `❌ Məlumatlar alınarkən xəta baş verdi: ${err?.response?.data?.errorDescription}. \nYenidən yoxlayın!`
                    : err
                    }`,
                showModal: true,
                isQuestion: false
            }));
        }
    };

    const handleEdit = (index) => {
        setFormData(addedEntries[index]);
        setEditingIndex(index);
        setValueOfCapacity(addedEntries[index]?.capacity?.slice(-2))
    };

    const handleDelete = (index) => {
        setAddedEntries(prev => {
            const next = prev.filter((_, i) => i !== index);
            return next;
        });

        setMainForm(prev => {
            const next = prev.filter((_, i) => i !== index);
            return next;
        });

        setMainExcelData(prev => {
            if (!prev || prev.length === 0) return prev;
            return prev.filter((_, i) => i !== index);
        });

        setEditingIndex(prevIdx => {
            if (prevIdx === null) return null;
            if (prevIdx === index) {
                setFormData(
                    (item?.eventId == 3 || chapter?.eventId == 3) ?
                        { ...initialForm, username: '' } :
                        ((item?.eventId == 2 || chapter?.eventId == 2) && uObj?.admin) ?
                            { ...initialForm, username: '', password: '' } :
                            (item?.eventId == 4 || chapter?.eventId == 4) ?
                                { username: '' } : initialForm
                );
                return null;
            }
            if (prevIdx > index) return prevIdx - 1;
            return prevIdx;
        });

    };

    const chooseType = async () => {
        const token = localStorage.getItem('myUserDocumentToken');
        if (!token) return;

        try {
            setLoading(true);
            const resRank = await axios.get('https://localhost:9097/rank/getAllRank');
            const [resType, resDepartments, resUnits] = await Promise.all([
                api.get('/form/getAccountTypes', {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                api.get('/form/getDepartments', {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { page: depPage, pageSize },
                }),
                api.get('/form/getUnits', {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { page: unitPage, pageSize },
                }),
            ]);

            setTypeOfAccounts(resType?.data?.data?.data);
            setRanks(resRank?.data?.data);
            setDepartments(resDepartments?.data?.data?.data);
            setUnits(resUnits?.data?.data?.data);
            setCountOfDepartments(resDepartments?.data?.data?.totalItem);
            setCountOfUnits(resUnits?.data?.data?.totalItem);
            setLoading(null);
        } catch (err) {
            setModalValues(prev => ({
                ...prev,
                message: `❌ Məlumatlar alınarkən xəta baş verdi: 
                    \n⚠️${err?.response?.data?.errorDescription || err
                    }. \nYenidən yoxlayın!`,
                showModal: true,
                isQuestion: false,
            }));
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
            const newData = res?.data?.data?.data;
            if (newData?.length > 0) {
                setDepartments(prev => [...prev, ...newData]);
                setDepPage(nextPage);
            }
        } catch (err) {
            setModalValues(prev, (
                {
                    ...prev,
                    message: `❌ İdarələr yüklənərkən xəta baş verdi: 
                    \n⚠️${err?.response?.data?.errorDescription || err
                        }. \nYenidən yoxlayın!`,
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
            const newData = res?.data?.data?.data;
            if (newData?.length > 0) {
                setUnits(prev => [...prev, ...newData]);
                setUnitPage(nextPage);
            }
        } catch (err) {
            setModalValues(prev, (
                {
                    ...prev,
                    message: `❌ Bölmələr yüklənərkən xəta baş verdi: 
                    \n⚠️${err?.response?.data?.errorDescription || err
                        }. \nYenidən yoxlayın!`,
                    isQuestion: false,
                    showModal: true
                }
            ))
        }
    };

    useEffect(() => {
        const load = async () => {
            await chooseType();
            if (fromDocDetail?.length > 0) {
                setAddedEntries(fromDocDetail);
                setMainForm(fromDocDetail);
                setDisabled(true);
                if (
                    !chapter?.containsForm
                ) {
                    setShowFileArea('show-file-area')
                    setShowButton("show-button")
                    setTotalDisabled(true)
                    setShowSendButton('')
                    setClassForWord('word-file-style')
                }
            }
            else {
                if (
                    !item?.containsForm
                ) {
                    setShowFileArea('show-file-area')
                    setShowButton("show-button")
                    setTotalDisabled(true)
                    setShowSendButton('')
                    setClassForWord('word-file-style')
                }
            }
        };
        load();
    }, []);

    useEffect(() => {
        if (!pdfUrl) return;
        const waitForWrapper = () => {
            const pdfWrapper = document.getElementsByClassName("pdf-wrapper")[0];
            if (pdfWrapper) {
                renderPdfToCanvas(pdfUrl);
            } else {
                requestAnimationFrame(waitForWrapper);
            }
        };

        waitForWrapper();
    }, [pdfUrl]);

    useEffect(() => {
        if (typeOfAccounts && fromDocDetail?.length > 0) {
            changeTypeOfAccount(fromDocDetail[0].accountTypeId);
        }
    }, [typeOfAccounts, fromDocDetail]);

    const handleSignClick = () => {
        if (pdfUrl !== "") {
            setShowPasswordAlert(true);
        }
        else {
            setModalValues((prev) => ({
                ...prev,
                message:
                    '❌ Fayl seçin!',
                isQuestion: false,
                showModal: true,
            }));
        }
    };

    const onCapacityNumberChange = (e) => {
        const number = e.target.value;
        const unit = valueOfCapacity || "";

        setFormData({
            ...formData,
            capacity: number ? number + unit : ""
        });
    };


    const chooseCapacityValue = (e) => {
        const unit = e.target.value;
        const number = formData?.capacity?.replace(/\D/g, "") || "";

        setValueOfCapacity(unit);

        setFormData({
            ...formData,
            capacity: number ? number + unit : ""
        });
    };


    const signDocument = async (pwd) => {
        await signDoc({
            pwd,
            pdfBase64,
            setLoading,
            setShowPasswordAlert,
            setDcryptdStrng,
            setReceiver,
            setModalValues
        })
    };

    const sendDocumend = async (receiver, description) => {
        await sendDoc({
            description,
            receiver,
            setLoading,
            mainItem: chapter ? chapter : item,
            dcryptdStrng,
            mainForm,
            setShowForm,
            setModalValues,
            setReceiver,
            setShowDocument
        });
    }

    const backToForm = () => {
        setShowFileArea('');
        setShowButton("");
        setTotalDisabled(false)
        setShowSendButton("unshow-button");
    }

    useEffect(() => {
        const wordElement = document.getElementsByClassName('word-file-style')[0];
        const docPrewiev = document.getElementsByClassName('doc-preview')[0]
        if (wordElement && docPrewiev) {
            wordElement.style.marginTop = `${((docPrewiev.offsetHeight - wordElement.offsetHeight) / 2)}px`;
            console.log(docPrewiev.offsetHeight, docPrewiev, wordElement.offsetHeight)
        }
    }, [classForWord, pdfUrl]);


    useEffect(() => {
        if (departments == [] || departments == null || units == [] || units == null || typeOfAccounts == [] || typeOfAccounts == null) {
            setLoading(true)
        }
        else {
            setLoading(false)
        }
    }, [departments, units, typeOfAccounts])

    return loading ? (
        <Loading loadingMessage={'Məlumatlar analiz edilir...'} />
    ) : (
        <div className="form-overlay-box">
            <div className="form-box">
                <h2 className="form-title">
                    Sənəd növü:
                    <span style={{ color: 'var(--color-pale-teal)', padding: '0px 10px' }}>
                        {item?.title || chapter?.title}
                    </span>

                    {
                        (item?.containsForm || chapter?.containsForm) && (
                            <select
                                className="select"
                                disabled={disabled}
                                id="selectType"
                                value={typeOfAccountId || ""}
                                onChange={(e) => changeTypeOfAccount(e.target.value)}
                            >
                                <option value="">İstifadəçi növü seç</option>

                                {typeOfAccounts?.map(type => (
                                    <option value={type?.id} key={type?.id}>
                                        {type?.name}
                                    </option>
                                ))}
                            </select>
                        )
                    }
                </h2>

                {addedEntries?.length > 0 && (item?.containsForm || chapter?.containsForm) && (
                    <div className="added-entries">
                        {addedEntries?.map((entry, idx) => (
                            <div key={idx} className="entry-card">
                                <p>
                                    <b>{idx + 1}.</b>{' '}
                                    <i>
                                        {
                                            ![item?.eventId, chapter?.eventId].includes(4) ?
                                                <>
                                                    {ranks?.find(rank => Number(rank?.id) == Number(entry?.rankId))?.name} {entry?.name} {entry?.surname} {entry?.fatherName}
                                                </> :
                                                <>
                                                    {entry?.username}
                                                </>
                                        }

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

                <div className={`form-body`}>
                    {
                        (!showExcelData ? (
                            <div className={`form-fields ${classForWord}`}>
                                {
                                    (item?.containsForm || chapter?.containsForm) && (
                                        <>
                                            {
                                                ![item?.eventId, chapter?.eventId].includes(4) && (
                                                    <>
                                                        <input name="name" value={formData?.name} disabled={totalDisabled} onChange={handleChange} placeholder="Ad" className={`${showFileArea != '' && 'un-show-form'}`} />
                                                        <input name="surname" value={formData?.surname} disabled={totalDisabled} onChange={handleChange} placeholder="Soyad" className={`${showFileArea != '' && 'un-show-form'}`} />
                                                        <input name="fatherName" value={formData?.fatherName} disabled={totalDisabled} onChange={handleChange} placeholder="Ata adı" className={`${showFileArea != '' && 'un-show-form'}`} />
                                                        <input name="fin" value={formData?.fin} disabled={totalDisabled} onChange={handleChange} placeholder="Fin" className={`${showFileArea != '' && 'un-show-form'}`} />
                                                    </>
                                                )
                                            }
                                            {
                                                ((item?.eventId == 3 || item?.eventId == 4) || (chapter?.eventId == 3 || chapter?.eventId == 4)) &&
                                                (
                                                    <input name="username" value={formData?.username} disabled={totalDisabled} onChange={handleChange} placeholder="İstifadəçi adı" className={`${showFileArea != '' && 'un-show-form'}`} />
                                                )
                                            }

                                            {
                                                ((item?.eventId == 2 || chapter?.eventId == 2) && uObj?.admin) && (
                                                    <>
                                                        <input name="username" value={formData?.username} disabled={totalDisabled} onChange={handleChange} placeholder="İstifadəçi adı" className={`${showFileArea != '' && 'un-show-form'}`} />
                                                        <label htmlFor="" style={{ position: 'relative', padding: '0', margin: '0' }}>
                                                            <input name="password" value={formData?.password} disabled={totalDisabled} onChange={handleChange} placeholder="Parol"
                                                                autoComplete='off'
                                                                type={`${passEyeIcon ? "password" : "text"}`} className={`${showFileArea != '' && 'un-show-form'}`} />
                                                            {
                                                                passEyeIcon ? <FaEye onClick={() => setPassEyeIcon(!passEyeIcon)} className={`${showFileArea != '' && 'un-show-form'} pass-eye-icon`} />
                                                                    : <FaEyeSlash onClick={() => setPassEyeIcon(!passEyeIcon)} className={`${showFileArea != '' && 'un-show-form'} pass-eye-icon`} />
                                                            }
                                                        </label>
                                                    </>
                                                )
                                            }

                                            {
                                                ![item?.eventId, chapter?.eventId].includes(4) && (
                                                    <>
                                                        <select name="rankId" value={formData?.rankId} disabled={totalDisabled} onChange={handleChange} placeholder="Rütbə" className={`${showFileArea != '' && 'un-show-form'} select`}>
                                                            <option value="">Rütbə seç</option>
                                                            {
                                                                ranks?.map((rank) => (
                                                                    <option value={rank?.id} key={rank?.id}>
                                                                        {rank?.description}
                                                                    </option>
                                                                ))
                                                            }
                                                        </select>

                                                        <input name="position" value={formData?.position} disabled={totalDisabled} onChange={handleChange} placeholder="Vəzifə" className={`${showFileArea != '' && 'un-show-form'}`} />
                                                        <input name="phoneNumber" value={formData?.phoneNumber} disabled={totalDisabled} onChange={handleChange} placeholder="+994505005050" className={`${showFileArea != '' && 'un-show-form'}`} />

                                                        {showFlash && (<>
                                                            <input name="mark" value={formData?.mark} disabled={totalDisabled} onChange={handleChange} placeholder="Cihazın Markası" className={`${showFileArea != '' && 'un-show-form'}`} />

                                                            <div className='form-group-capacity'>
                                                                <input name="capacity" value={formData?.capacity?.replace(/\D/g, "") || ""} disabled={totalDisabled} type='number'
                                                                    onChange={onCapacityNumberChange} placeholder="Cihazın Tutumu" className={`${showFileArea != '' && 'un-show-form'}`}
                                                                    id='capacity' />
                                                                <select name="" id="" disabled={totalDisabled}
                                                                    value={valueOfCapacity || formData?.capacity?.slice(-2)}
                                                                    onChange={chooseCapacityValue} className={`${showFileArea != '' && 'un-show-form'} select`} >
                                                                    <option value="">Seç</option>
                                                                    <option value="KB">KB</option>
                                                                    <option value="MB">MB</option>
                                                                    <option value="GB">GB</option>
                                                                </select>
                                                            </div>

                                                            <input name="serialNumber" value={formData?.serialNumber} disabled={totalDisabled} onChange={handleChange} placeholder="Unikal Nömrə" className={`${showFileArea != '' && 'un-show-form'}`} />
                                                        </>)}

                                                        <select name="departmentId" value={formData?.departmentId} disabled={totalDisabled} onChange={handleChange} className={`${showFileArea != '' && 'un-show-form'} select`}>
                                                            <option value="">İdarə seç</option>
                                                            {departments?.map((d, i) => (
                                                                <option key={i} value={d?.id}>{d?.tag}</option>
                                                            ))}
                                                            {departments?.length < countOfDepartments && <option value="load_more">...</option>}
                                                        </select>

                                                        <select name="unitId" value={formData?.unitId} disabled={totalDisabled} onChange={handleChange} className={`${showFileArea != '' && 'un-show-form'} select`}>
                                                            <option value="">Bölmə seç</option>
                                                            {units
                                                                ?.filter(u => u?.departmentId == formData?.departmentId)
                                                                .map((u, i) => (
                                                                    <option key={i} value={u?.id}>{u?.tag}</option>
                                                                ))}
                                                            {units?.length < countOfUnits && <option value="load_more">...</option>}
                                                        </select>
                                                    </>
                                                )
                                            }

                                            <button type="button" className={`${showFileArea != '' && 'un-show-form'} btn btn-green btn-edit-and-add`} onClick={handleAddOrEdit} disabled={totalDisabled} style={{ display: 'flex', alignItems: 'center' }}>
                                                <FiPlus style={{ marginRight: '6px', fontSize: '22px' }} />
                                                {editingIndex !== null ? 'Yadda saxla' : 'İstifadəçi əlavə et'}
                                            </button>


                                            <label className={`file-input-label file-input-label-2 ${showFileArea}`}>
                                                Excel olaraq endirin
                                                <input type="button" onClick={downloadExcel} />
                                            </label>
                                        </>
                                    )
                                }


                                <label className={`file-input-label ${showFileArea} ${classForWord}`} >
                                    {fileData?.file ? fileData?.file?.name : 'Davam edin!'}
                                    <input type="file" name="file" accept=".doc,.docx" onChange={handleChangeFile} style={{ cursor: 'pointer' }} />
                                </label>
                            </div>
                        ) :

                            (
                                showSendButton === "" ?
                                    <div className='added-users'>
                                        {
                                            mainExcelData?.length > 0 && (
                                                mainExcelData?.map((data, dataIndex) => {
                                                    return <div key={dataIndex}>
                                                        <span>{dataIndex + 1}. </span>
                                                        <span>
                                                            {data?.name} {data?.surname}
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
                            {
                                pdfUrl ? (<div className="pdf-wrapper"></div>) :
                                    <span className={`word ${selectedWord === item?.title ? 'selected' : ''}`} onClick={() => handleWordClick(item?.title)}>
                                        {item?.title} sənədi burada görünəcək
                                        <br />
                                        Ən az bir istifadəçi yarat və sənədi əlavə et!
                                    </span>
                            }
                        </div>
                    </div>
                </div>

                <div className="form-buttons">
                    {
                        (item?.containsForm || chapter?.containsForm) && (
                            <button type="button" className={`btn btn-green btn-back ${showFileArea}`} onClick={backToForm}>
                                Forma geri qayıt
                            </button>
                        )
                    }
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
