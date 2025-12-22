import React from "react";
import "./LogDetails.css";

export default function LogDetails({ setModalValues, item, setShowLogDetails, setItem }) {
    if (!item) return null;

    console.log(item)
    return (
        <div className="detail-overlay">
            <div className="detail-box">

                <h2>Log Detalları</h2>

                <section>
                    <h3>Əsas məlumat</h3>
                    <Item label="Tarix:" value={`${item?.logDate?.split("T")[0]} ${item?.logDate?.split("T")[1]?.slice(0, 8)}`}/>
                    <Item label="IP Ünvan:" value={item?.compIP} />
                </section>

                <section>
                    <h3>Log</h3>
                    <Item label="Mesaj:" value={item?.message} />
                    <Item label="Server Xətası:" value={item?.crash ? "Bəli" : "Xeyr"} />
                </section>

                <section>
                    <h3>Kateqoriya</h3>
                    <Item label="Kateqoriya ID:" value={item?.category?.id} />
                    <Item label="Kateqoriya:" value={item?.category?.category} />
                </section>

                <section>
                    <h3>Log Səviyyəsi</h3>
                    <Item label="Log səviyyəsi:" value={item?.logLevel} />
                </section>

                <section>
                    <h3>İstifadəçi məlumatları</h3>
                    <pre className="detail-json">
                        {item?.userJsonData || "-"}
                    </pre>
                </section>

                <button
                    className="detail-close"
                    onClick={() => {
                        setShowLogDetails(null);
                        setItem(null);
                    }}
                >
                    Bağla
                </button>

            </div>
        </div>
    );
}

function Item({ label, value }) {
    return (
        <div className="detail-item">
            <span className="detail-label">{label}</span>
            <span className="detail-value">{value ?? "-"}</span>
        </div>
    );
}
