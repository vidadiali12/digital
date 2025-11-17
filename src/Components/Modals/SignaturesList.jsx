import { useEffect, useState } from 'react';
import './SignaturesList.css';
import { FaCheck, FaTimes } from 'react-icons/fa';
import { mainData, mainUsers } from '../Data/Data';

const SignaturesList = ({ signatures, text, userUpdateId, setShowSigned, userType }) => {

    const [dataObj, setDataObj] = useState({});
    const [userObj, setUserObj] = useState([]);
    const [signedObj, setSignedObj] = useState([]);
    const [localSignatures, setLocalSignatures] = useState(signatures || []);

    useEffect(() => {
        if (!signatures || signatures.length === 0) {
            const saved = JSON.parse(localStorage.getItem('signedData')) || [];
            setLocalSignatures(saved);
        } else {
            setLocalSignatures(signatures);
        }
    }, [signatures]);

    useEffect(() => {
        const matchedData = mainData.find(e => e.id === userUpdateId);
        let matchedUser = []
        const matchedSignature = localSignatures.filter(e => e.userId === userUpdateId);

        // console.log(userUpdateId, localSignatures, matchedSignature)
        if (userType === 'admin') {
            matchedUser.push(mainUsers.find(e => e.userName === mainData.find(e => e.id === userUpdateId).userNameOfAccount),
                mainUsers.find(e => e.userName === mainData.find(e => e.id === userUpdateId).userNameOfSigned));
        }
        else if (userType === 'user') {
            matchedUser = [mainUsers.find(e => e.userName === mainData.find(e => e.id === userUpdateId).userNameOfAccount)];
        }
        console.log(matchedUser)

        if (matchedData) {
            setDataObj({ ...matchedData });
        }

        if (matchedUser) {
            setUserObj([...matchedUser]);
        }

        if (matchedSignature) {
            setSignedObj([...matchedSignature]);
        }
    }, [text, localSignatures, userUpdateId]);

    const closeThis = () => {
        setShowSigned(false);
    };

    return (
        <div className="signatures-container">
            <div>
                <h2 style={{ width: '100%' }}>Təsdiq məlumatları</h2>
                <ul className="signatures-list">
                    {
                        signedObj.map((obj, index) => {
                            return <li className={`signature-item ${obj.verified ? 'verified' : 'not-verified'}`} key={`${obj.userId}-${index}`}>
                                <p><strong>İmza adı:</strong> {obj.signatureName} {userObj[index].userName}</p>
                                <p><strong>İmzalayan şəxs:</strong> {userObj[index].rank} {userObj[index].name} {userObj[index].surname}</p>
                                <p><strong>Səbəb:</strong> {dataObj.reason}</p>
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
                        })
                    }
                </ul>
                <button onClick={closeThis}>Bağla</button>
            </div>
        </div>
    );
};

export default SignaturesList;
