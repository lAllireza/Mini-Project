"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.csrf();
      const user = await api.login(username, password);
      if (!user.is_staff) {
        setError("این حساب دسترسی پنل مدیریت را ندارد");
        await api.logout();
        return;
      }
      router.push("/admin");
    } catch (err) {
      const detail =
        err.body?.non_field_errors?.[0] || err.body?.detail || err.message || "ورود ناموفق بود";
      setError(detail);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f172a, #1e293b)",
        fontFamily: "'Vazirmatn', Tahoma, sans-serif",
        padding: "24px",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: "380px",
          background: "#fff",
          borderRadius: "18px",
          padding: "32px",
          boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
        }}
      >
        <h1 style={{ fontSize: "20px", marginBottom: "4px", color: "#0f172a" }}>ورود ادمین</h1>
        <p style={{ color: "#64748b", fontSize: "13px", marginBottom: "24px" }}>
          فقط کاربران دارای دسترسی مدیریت اجازه‌ی ورود دارند
        </p>

        <label style={{ fontSize: "13px", color: "#334155" }}>نام کاربری</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={inputStyle}
          autoFocus
        />

        <label style={{ fontSize: "13px", color: "#334155" }}>رمز عبور</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />

        {error && <p style={{ color: "#dc2626", fontSize: "13px", marginTop: "-6px" }}>{error}</p>}

        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? "در حال ورود..." : "ورود"}
        </button>
      </form>
    </main>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "10px",
  border: "1px solid #cbd5e1",
  marginTop: "6px",
  marginBottom: "16px",
  fontSize: "14px",
  boxSizing: "border-box",
};

const buttonStyle = {
  width: "100%",
  padding: "12px",
  border: "none",
  borderRadius: "10px",
  background: "#0f172a",
  color: "#fff",
  fontSize: "14px",
  cursor: "pointer",
  marginTop: "6px",
};