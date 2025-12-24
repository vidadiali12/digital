import React, { useEffect, useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import "./Logging.css";
import api from "../../api";
import { FiInfo } from "react-icons/fi";
import Pagination from "../../Modals/Pagination/Pagination";
import LogDetails from "./LogDetails";
import Loading from "../../Modals/Loading";

const LOG_LEVEL_LIST = [
    { id: 1, name: "Low" },
    { id: 2, name: "Medium" },
    { id: 3, name: "High" },
    { id: 4, name: "Info" }
];

export default function Logging({ setModalValues, item, setItem }) {
    const [logs, setLogs] = useState([]);
    const [categories, setCategories] = useState([]);
    const [activeFilter, setActiveFilter] = useState(null);

    const [page, setPage] = useState(1);
    const [pageSize] = useState(12);
    const [totalItem, setTotalItem] = useState(null);
    const [totalPages, setTotalPages] = useState(null);
    const [showLogDetails, setShowLogDetails] = useState(null);
    const [loading, setLoading] = useState(false);

    const [filters, setFilters] = useState({
        categoryId: [],
        logLevelId: [],
        userDataText: "",
        compIp: "",
        fromDate: "",
        toDate: "",
        isCrash: null,
        newToOld: true
    });

    const getHeaders = () => {
        const token = localStorage.getItem("myUserDocumentToken");
        return {
            headers: { Authorization: `Bearer ${token}` }
        };
    };

    const loadCategories = async () => {
        try {
            const res = await api.get(
                "/admin/log/category/getAllCategory",
                getHeaders()
            );
            setCategories(res?.data?.data || []);
        } catch (e) {
            setModalValues(prev => ({
                ...prev,
                isQuestion: false,
                showModal: true,
                message: `❌ Xəta baş verdi:\n⚠️"${err?.response?.data?.errorDescription || err}"`
            }))
        }
    };

    const loadLogs = async (filterType) => {
        try {
            if (filterType) {
                setLoading(true)
            }

            const res = await api.post(
                "/admin/log/getAllLog",
                filters,
                {
                    ...getHeaders(),
                    params: { page, pageSize }
                }
            );

            setLogs(res?.data?.data || []);
            setTotalItem(res?.data?.totalItem || null);
            setTotalPages(res?.data?.totalPages || null)
            setLoading(false)
        } catch (e) {
            setModalValues(prev => ({
                ...prev,
                isQuestion: false,
                showModal: true,
                message: `❌ Xəta baş verdi:\n⚠️"${err?.response?.data?.errorDescription || err}"`
            }))
            setLoading(false)
        }
    };

    const toggleFilter = (key, id) => {
        setFilters(prev => ({
            ...prev,
            [key]: prev[key].includes(id)
                ? prev[key].filter(x => x !== id)
                : [...prev[key], id]
        }));
    };

    const showFilter = name => {
        setActiveFilter(prev => (prev === name ? null : name));
    };

    const clearFilter = () => {
        setFilters({
            categoryId: [],
            logLevelId: [],
            userDataText: "",
            compIp: "",
            fromDate: "",
            toDate: "",
            isCrash: null,
            newToOld: true
        });
        setActiveFilter(null);
    };

    const showDetails = async (log) => {
        const token = localStorage.getItem('myUserDocumentToken');

        try {
            const res = await api.get(
                `/admin/log/getLogDetails/${log?.id}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setItem(res?.data?.data);
            setShowLogDetails(true)
        } catch (err) {
            setModalValues(prev => ({
                ...prev,
                isQuestion: false,
                showModal: true,
                message: `❌ Xəta baş verdi:\n⚠️"${err?.response?.data?.errorDescription || err}"`
            }))
        }
    }

    const callLevelColor = (l) => {
        let clr, level = l.toLocaleLowerCase();
        if (level == "low") {
            clr = "green"
        }
        else if (level == "high") {
            clr = "red"
        }
        else if (level == "medium") {
            clr = "orange"
        }
        else if (level == "info") {
            clr = "#ffe017ff"
        }

        return clr
    }

    const changeAsc = (e) => {
        if (e?.target?.value == `${true}`) {
            setFilters(prev => ({
                ...prev, newToOld: true
            }))
        }
        else if (e?.target?.value == `${false}`) {
            setFilters(prev => ({
                ...prev, newToOld: false
            }))
        }
    }

    useEffect(() => {
        loadCategories();
        setItem(null);
    }, []);

    useEffect(() => {
        loadLogs(true);
    }, [filters?.categoryId, filters?.fromDate, filters?.isCrash, filters?.logLevelId, filters?.newToOld, filters?.toDate, page]);


    useEffect(() => {
        loadLogs(false);
    }, [filters?.compIp, filters?.userDataText]);

    useEffect(() => {
        setPage(1);
    }, [filters]);

    return (
        <div className="logs-wrapper p-4 w-full">

            <div className="logs-filters">

                <input
                    placeholder="Axtar..."
                    value={filters.userDataText}
                    onChange={e =>
                        setFilters(prev => ({ ...prev, userDataText: e.target.value }))
                    }
                />

                <input
                    placeholder="IP"
                    value={filters.compIp}
                    onChange={e =>
                        setFilters(prev => ({ ...prev, compIp: e.target.value }))
                    }
                />

                <input
                    value={filters.fromDate.split(".").reverse().join("-")}
                    type="date"
                    onChange={e =>
                        setFilters(prev => ({ ...prev, fromDate: e.target.value.split("-").reverse().join(".") }))
                    }
                />

                <input
                    value={filters.toDate.split(".").reverse().join("-")}
                    type="date"
                    onChange={e =>
                        setFilters(prev => ({ ...prev, toDate: e.target.value.split("-").reverse().join(".") }))
                    }
                />

                <div className="filter-box">
                    <span onClick={() => showFilter("category")}>
                        Kateqoriya <FiChevronDown />
                    </span>
                    <div className={`filter-box-child ${activeFilter === "category" ? "show" : ""}`}>
                        {categories.map(c => (
                            <label key={c.id}>
                                <input
                                    type="checkbox"
                                    checked={filters.categoryId.includes(c.id)}
                                    onChange={() => toggleFilter("categoryId", c.id)}
                                />
                                <span>{c.category}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="filter-box">
                    <span onClick={() => showFilter("level")}>
                        Log Level <FiChevronDown />
                    </span>
                    <div className={`filter-box-child ${activeFilter === "level" ? "show" : ""}`}>
                        {LOG_LEVEL_LIST.map(l => (
                            <label key={l.id}>
                                <input
                                    type="checkbox"
                                    checked={filters.logLevelId.includes(l.id)}
                                    onChange={() => toggleFilter("logLevelId", l.id)}
                                />
                                <span>{l.name}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <select
                    value={filters?.isCrash == null ? "" : filters?.isCrash}
                    onChange={e =>
                        setFilters(prev => ({
                            ...prev,
                            isCrash: e.target.value === ""
                                ? null
                                : e.target.value === "true"
                        }))
                    }
                >
                    <option value="">Hamısı</option>
                    <option value="true">Xətalı</option>
                    <option value="false">Normal</option>
                </select>

                <div className="filter-box sort-filter">
                    <select
                        className="filter-select"
                        onChange={changeAsc}
                        value={filters?.newToOld}
                    >
                        <option value={`${true}`}>Yenidən Köhnəyə</option>
                        <option value={`${false}`}>Köhnədən Yeniyə</option>
                    </select>
                    <span className="select-icon">⇅</span>
                </div>

                <button onClick={clearFilter} className="clear-filters">Filteri sıfırla</button>
            </div>

            <div className="logs-table">
                <div className="table-header">
                    <span>#</span>
                    <span>Kateqoriya</span>
                    <span>Level</span>
                    <span>Komputer IP</span>
                    <span>Tarix</span>
                    <span style={{ textAlign: 'center' }}>Server xətası</span>
                    <span className="log-more-icon-box">Ətraflı</span>
                </div>

                {logs.map((l, i) => (
                    <div className="table-row" key={l.id}>
                        <span>{pageSize * (page - 1) + i + 1}</span>
                        <span>{l.category?.category}</span>
                        <span style={
                            { color: callLevelColor(l.logLevel) }
                        }>{l.logLevel}</span>
                        <span>{l.compIP}</span>
                        <span>{l.logDate?.split("T")[0]} {l.logDate?.split("T")[1]?.slice(0, 8)}</span>
                        <span className={`${l.crash ? "red-color" : 'green-color'}`}>{l.crash ? "Bəli" : "Xeyr"}</span>
                        <span className="log-more-icon-box">
                            <FiInfo className="icon-log-more" onClick={() => showDetails(l)} />
                        </span>
                    </div>
                ))}
            </div>

            {
                showLogDetails && (
                    <LogDetails setModalValues={setModalValues} setItem={setItem} item={item} setShowLogDetails={setShowLogDetails} />
                )
            }

            {totalItem && totalPages && totalItem > pageSize && (
                <Pagination
                    page={page}
                    setPage={setPage}
                    pageSize={pageSize}
                    totalItem={totalItem}
                    totalPages={totalPages}
                />
            )}

            {
                loading && <Loading loadingMessage={"Məlumatlar yüklənir..."} />
            }
        </div>
    );
}
