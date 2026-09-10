"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

export default function HomePage() {
  const [data, setData] = useState({ status: "loading", message: "در حال بررسی اتصال..." });
  const [checking, setChecking] = useState(false);

  const getDbStatus = useCallback(async () => {
    setChecking(true);
    setData((prev) => ({ ...prev, status: "loading", message: "در حال بررسی اتصال..." }));
    try {
      const res = await fetch("/api/health/db/", { cache: "no-store" });
      const body = await res.json();

      if (!res.ok) {
        setData({
          status: "error",
          message: body.message || "خطا در دریافت اطلاعات از سرور",
          detail: body.detail,
        });
        return;
      }

      setData(body);
    } catch (error) {
      setData({ status: "error", message: "امکان ارتباط با بک‌اند وجود ندارد", detail: error.message });
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    getDbStatus();
  }, [getDbStatus]);

  const isSuccess = data.status === "success";
  const isLoading = data.status === "loading";

  const theme = isSuccess
    ? { bg: "#ecfdf5", border: "#a7f3d0", text: "#065f46", dot: "#10b981", label: "متصل" }
    : isLoading
    ? { bg: "#f1f5f9", border: "#cbd5e1", text: "#334155", dot: "#94a3b8", label: "در حال بررسی" }
    : { bg: "#fef2f2", border: "#fecaca", text: "#991b1b", dot: "#ef4444", label: "قطع" };

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f172a, #1e293b)",
        fontFamily: "'Vazirmatn', 'IRANSans', Tahoma, sans-serif",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "560px",
          background: "#ffffff",
          borderRadius: "20px",
          padding: "32px",
          boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "40px", marginBottom: "8px" }}>🚀</div>
          <h1 style={{ margin: 0, fontSize: "22px", color: "#0f172a" }}>
            Next.js + Django + PostgreSQL
          </h1>
          <p style={{ color: "#64748b", marginTop: "8px", fontSize: "14px" }}>
            وضعیت زنده‌ی ارتباط بین فرانت‌اند، بک‌اند و دیتابیس
          </p>
        </div>

        <div
          style={{
            background: theme.bg,
            border: `1px solid ${theme.border}`,
            borderRadius: "14px",
            padding: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: theme.dot,
                display: "inline-block",
                animation: isLoading ? "pulse 1.2s infinite" : "none",
              }}
            />
            <strong style={{ color: theme.text, fontSize: "15px" }}>
              وضعیت دیتابیس: {theme.label}
            </strong>
          </div>

          <p style={{ color: theme.text, fontSize: "14px", margin: "6px 0" }}>{data.message}</p>

          {data.database && (
            <div style={{ marginTop: "14px", fontSize: "13px", color: "#334155", display: "grid", gap: "6px" }}>
              <Row label="نام دیتابیس" value={data.database} />
              <Row label="هاست" value={data.host} />
              <Row label="پورت" value={data.port} />
              <Row label="نسخه PostgreSQL" value={data.postgres_version} />
              <Row label="زمان پاسخ" value={data.response_time_ms != null ? `${data.response_time_ms} ms` : undefined} />
            </div>
          )}

          {data.detail && (
            <pre
              style={{
                marginTop: "12px",
                background: "#00000010",
                padding: "10px",
                borderRadius: "8px",
                fontSize: "12px",
                whiteSpace: "pre-wrap",
                direction: "ltr",
                textAlign: "left",
              }}
            >
              {data.detail}
            </pre>
          )}
        </div>

        <button
          onClick={getDbStatus}
          disabled={checking}
          style={{
            marginTop: "20px",
            width: "100%",
            padding: "12px",
            border: "none",
            borderRadius: "10px",
            background: checking ? "#94a3b8" : "#0f172a",
            color: "#fff",
            fontSize: "14px",
            cursor: checking ? "not-allowed" : "pointer",
          }}
        >
          {checking ? "در حال بررسی..." : "بررسی مجدد اتصال"}
        </button>

        <div style={{ textAlign: "center", marginTop: "16px" }}>
          <Link href="/login" style={{ fontSize: "13px", color: "#64748b" }}>
            ورود به پنل مدیریت ←
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.3; }
          100% { opacity: 1; }
        }
      `}</style>
    </main>
  );
}

function Row({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
      <span style={{ color: "#64748b" }}>{label}</span>
      <span style={{ fontWeight: 600, direction: "ltr" }}>{value}</span>
    </div>
  );
}