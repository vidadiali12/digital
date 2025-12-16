import React, { useEffect, useState } from 'react'
import './Pagination.css'

const Pagination = ({ page, setPage, pageSize, totalItem, totalPages }) => {

    const [pageArr, setPageArr] = useState([])
    const [mainPage, setMainPage] = useState(null)

    const createPag = () => {
        if (!totalItem) return;
        let pa = [];
        for (let i = 1; i <= totalPages; i++) {
            pa.push(i)
        }
        setPageArr(pa);

        if (page > totalPages) {
            setPage(1)
        }
    }

    const changePage = (pageNumber) => {
        setPage(pageNumber)
        setMainPage(pageNumber)
    }

    const changePageBefore = (pageNumber) => {
        if (pageNumber > 1) {
            setPage(pageNumber - 1)
            setMainPage(pageNumber - 1)
        }
    }

    const changePageAfter = (pageNumber) => {
        if (pageNumber < pageArr.length) {
            setPage(pageNumber + 1)
            setMainPage(pageNumber + 1)
        }
    }

    useEffect(() => {
        createPag();
    }, [page, totalItem, totalPages])
    return (
        <div className='pag-box'>

            <button
                className={`pag-btn ${mainPage > 1 ? 'active' : ''}`}
                onClick={() => changePageBefore(page)}
            >
                Əvvəl
            </button>

            {
                (pageArr.length <= 4) && (
                    <>
                        {pageArr.slice(0, 4).map((p, i) => (
                            <button
                                key={i}
                                className={`pag-btn ${page === p ? 'active' : ''}`}
                                onClick={() => changePage(p)}
                            >
                                {p}
                            </button>
                        ))}
                    </>
                )
            }
            {
                (pageArr.length > 4) && (
                    <>
                        {pageArr.slice(0, 2).map((p, i) => (
                            <button
                                key={i}
                                className={`pag-btn ${page === p ? 'active' : ''}`}
                                onClick={() => changePage(p)}
                            >
                                {p}
                            </button>
                        ))}

                        ...

                        {pageArr
                            .filter(p => p > 2 && p < pageArr.length - 1)
                            .map((p, i) => {
                                if (Math.abs(page - p) <= 1) {
                                    return (
                                        <button
                                            key={i}
                                            className={`pag-btn ${page === p ? 'active' : ''}`}
                                            onClick={() => changePage(p)}
                                        >
                                            {p}
                                        </button>
                                    )
                                }
                            })
                        }

                        ...

                        {pageArr.slice(-2).map((p, i) => (
                            <button
                                key={i}
                                className={`pag-btn ${page === p ? 'active' : ''}`}
                                onClick={() => changePage(p)}
                            >
                                {p}
                            </button>
                        ))}
                    </>
                )
            }

            <button
                className={`pag-btn ${mainPage < pageArr.length ? 'active' : ''}`}
                onClick={() => changePageAfter(page)}
            >
                Sonra
            </button>

        </div>
    );
}

export default Pagination