import React, { useState, useEffect, useRef } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const WithPassword = ({ visible = true, onSend, onClose }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (visible && inputRef?.current) {
      inputRef.current.focus();
    }
  }, [visible]);

  if (!visible) return null;

  const handleSend = () => {
    if (!password || password?.trim().length === 0) {
      setError("Parol boş ola bilməz");
      return;
    }
    setError("");
    if (typeof onSend === "function") onSend(password);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") handleSend();
    if (e.key === "Escape" && typeof onClose === "function") onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Password modal"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(180deg, var(--color-dark-teal), var(--color-teal))",
        backgroundColor: "var(--color-dark-teal, #1a1446)",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "min(520px, 92%)",
          borderRadius: "12px",
          boxShadow: "0 12px 40px rgba(10,10,20,0.5)",
          background: "linear-gradient(180deg, var(--color-pale-teal), var(--color-white))",
          padding: "28px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          alignItems: "stretch",
        }}
      >
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2
            style={{
              margin: 0,
              fontSize: "18px",
              color: "var(--color-dark-teal)",
              fontWeight: 700,
              letterSpacing: 0.2,
            }}
          >
            Sənəd üçün parol
          </h2>
          {typeof onClose === "function" && (
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                background: "transparent",
                border: "none",
                fontSize: 20,
                cursor: "pointer",
                color: "var(--color-gray-dark, #2a2d3e)",
              }}
            >
              ✕
            </button>
          )}
        </header>

        <p style={{ margin: 0, color: "var(--color-gray-dark, #2a2d3e)" }}>
          Parolu daxil edib <strong>Send</strong> düyməsinə bas.
        </p>

        <div
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "center",
          }}
        >
          <div
            style={{
              position: "relative",
              flex: 1,
            }}
          >
            <input
              ref={inputRef}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Parolu yazın..."
              style={{
                width: "100%",
                padding: "12px 40px 12px 14px",
                fontSize: "16px",
                borderRadius: "8px",
                border: "1px solid var(--color-gray-light, #e0e2ec)",
                outline: "none",
                boxShadow: "inset 0 1px 0 rgba(0,0,0,0.02)",
              }}
            />

            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Gizlət" : "Göstər"}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontSize: "18px",
                color: "var(--color-gray-dark, #2a2d3e)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 4,
              }}
            >
              {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
            </button>
          </div>

          <button
            onClick={handleSend}
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "14px",
              background: "linear-gradient(90deg, var(--color-light-teal), var(--color-teal))",
              color: "var(--color-white)",
              boxShadow: "0 6px 18px rgba(59,46,133,0.25)",
            }}
          >
            Send
          </button>
        </div>

        {error && (
          <div style={{ color: "var(--color-danger, #e11d48)", fontSize: 13 }}>
            {error}
          </div>
        )}

        <footer style={{ marginTop: 6, display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={() => {
              setPassword("");
              setError("");
            }}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--color-gray-dark, #2a2d3e)",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Təmizlə
          </button>
        </footer>
      </div>
    </div>
  );
};

export default WithPassword;
