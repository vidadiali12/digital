import React, { useEffect, useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import "./Logging.css";
import api from "../../api";
import Pagination from "../../Modals/Pagination/Pagination";

const LOG_LEVEL_LIST = [
    { id: 1, name: "Low" },
    { id: 2, name: "Medium" },
    { id: 3, name: "High" },
    { id: 4, name: "Info" }
];

export default function Logging({ setModalValues }) {
    const [logs, setLogs] = useState([]);
    const [categories, setCategories] = useState([]);
    const [activeFilter, setActiveFilter] = useState(null);

    const [page, setPage] = useState(1);
    const [pageSize] = useState(12);
    const [totalItem, setTotalItem] = useState(null);
    const [totalPages, setTotalPages] = useState(null)

    const [filters, setFilters] = useState({
        categoryId: [],
        logLevelId: [],
        searchText: "",
        compIp: "",
        fromDate: "",
        toDate: "",
        isCrash: null
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
            console.log(e);
        }
    };

    const loadLogs = async () => {
        try {
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
        } catch (e) {
            console.log(e);
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
            searchText: "",
            compIp: "",
            fromDate: "",
            toDate: "",
            isCrash: null
        });
        setActiveFilter(null);
    };

    useEffect(() => {
        loadCategories();
    }, []);

    useEffect(() => {
        loadLogs();
    }, [filters, page]);

    return (
        <div className="logs-wrapper p-4 w-full">

            <div className="logs-filters">

                <input
                    placeholder="Axtar..."
                    value={filters.searchText}
                    onChange={e =>
                        setFilters(prev => ({ ...prev, searchText: e.target.value }))
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

                <button onClick={clearFilter}>Filteri sıfırla</button>
            </div>

            <div className="logs-table">
                <div className="table-header">
                    <span>#</span>
                    <span>Kateqoriya</span>
                    <span>Level</span>
                    <span>Komputer IP</span>
                    <span>Tarix</span>
                    <span>Server xətası</span>
                </div>

                {logs.map((l, i) => (
                    <div className="table-row" key={l.id}>
                        <span>{pageSize * (page - 1) + i + 1}</span>
                        <span>{l.category?.category}</span>
                        <span>{l.logLevel}</span>
                        <span>{l.compIP}</span>
                        <span>{l.logDate?.split("T")[0]} {l.logDate?.split("T")[1]?.slice(0, 8)}</span>
                        <span className={`${l.crash ? "red-color" : 'green-color'}`}>{l.crash ? "Bəli" : "Xeyr"}</span>
                    </div>
                ))}
            </div>

            {totalItem && totalPages && totalItem > pageSize && (
                <Pagination
                    page={page}
                    setPage={setPage}
                    pageSize={pageSize}
                    totalItem={totalItem}
                    totalPages={totalPages}
                />
            )}
        </div>
    );
}
