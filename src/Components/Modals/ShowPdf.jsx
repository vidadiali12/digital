import { useEffect, useState } from 'react';
import './ShowPdf.css';

const pdfs = import.meta.glob('/src/assets/task/*.pdf', { eager: true });

const ShowPdf = ({ userUpdateId, setShowPdf, userType }) => {
    const [exsisPdf, setExsistPdf] = useState(true);
    const [pdfUrl, setPdfUrl] = useState('');

    useEffect(() => {
        const fileName = userType === 'admin' ? `test_word_converted_signed_signed${userUpdateId}.pdf` : `test_word_converted_signed${userUpdateId}.pdf`;
        const matchedPdf = Object.entries(pdfs).find(([path]) => path.endsWith(fileName));

        if (!matchedPdf) {
            setExsistPdf(false);
            setPdfUrl('');
            return;
        }

        setExsistPdf(true);
        console.log(matchedPdf)
        setPdfUrl(matchedPdf[1].default);
    }, [userUpdateId]);

    return (
        <div className='show-pdf'>
            <div className="pdf-container">
                {
                    exsisPdf
                        ? <iframe
                            src={pdfUrl}
                            title="PDF Viewer"
                            frameBorder="0"
                        />
                        : <div className='pdf-container'>PDF tapılmadı</div>
                }
            </div>
            <button className="close-btn" onClick={() => setShowPdf(false)}>Bağla</button>
        </div>
    );
};

export default ShowPdf;
