"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";

export default function AdminPage() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [tab, setTab] = useState("users");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .me()
      .then((user) => {
        if (!user.is_staff) {
          router.replace("/login");
          return;
        }
        setMe(user);
      })
      .catch(() => router.replace("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleLogout() {
    await api.logout();
    router.replace("/login");
  }

  if (loading) return <CenteredMessage text="در حال بارگذاری..." />;
  if (!me) return null;

  return (
    <main dir="rtl" style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Vazirmatn', Tahoma, sans-serif" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "18px 28px",
          background: "#0f172a",
          color: "#fff",
        }}
      >
        <div>
          <div style={{ fontSize: "16px", fontWeight: 700 }}>پنل مدیریت</div>
          <div style={{ fontSize: "12px", color: "#94a3b8" }}>خوش آمدی، {me.username}</div>
        </div>
        <button onClick={handleLogout} style={logoutBtn}>
          خروج
        </button>
      </header>

      <div style={{ display: "flex", gap: "8px", padding: "16px 28px 0" }}>
        <TabButton active={tab === "users"} onClick={() => setTab("users")}>
          مدیریت کاربران
        </TabButton>
        <TabButton active={tab === "items"} onClick={() => setTab("items")}>
          مدیریت داده‌ها
        </TabButton>
      </div>

      <div style={{ padding: "20px 28px 40px" }}>{tab === "users" ? <UsersPanel me={me} /> : <ItemsPanel />}</div>
    </main>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 18px",
        borderRadius: "10px 10px 0 0",
        border: "none",
        cursor: "pointer",
        background: active ? "#fff" : "transparent",
        color: active ? "#0f172a" : "#64748b",
        fontWeight: active ? 700 : 500,
        fontSize: "13px",
      }}
    >
      {children}
    </button>
  );
}

function CenteredMessage({ text }) {
  return (
    <div
      dir="rtl"
      style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#475569" }}
    >
      {text}
    </div>
  );
}

function emptyUserForm() {
  return { username: "", email: "", password: "", is_active: true, is_staff: false, is_superuser: false };
}

function UsersPanel({ me }) {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyUserForm());
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);

  function load() {
    api.listUsers().then(setUsers).catch((e) => setError(e.message));
  }
  useEffect(load, []);

  function startEdit(user) {
    setEditingId(user.id);
    setForm({ ...user, password: "" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyUserForm());
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      if (editingId) {
        await api.updateUser(editingId, payload);
      } else {
        await api.createUser(payload);
      }
      cancelEdit();
      load();
    } catch (err) {
      setError(err.body ? Object.values(err.body).flat().join(" | ") : err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(user) {
    if (!confirm(`حذف کاربر «${user.username}»؟`)) return;
    try {
      await api.deleteUser(user.id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "20px" }}>
      <div style={panelStyle}>
        <h3 style={panelTitle}>لیست کاربران</h3>
        {error && <p style={{ color: "#dc2626", fontSize: "13px" }}>{error}</p>}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ textAlign: "right", color: "#64748b" }}>
              <th style={th}>نام کاربری</th>
              <th style={th}>ایمیل</th>
              <th style={th}>فعال</th>
              <th style={th}>ادمین</th>
              <th style={th}>سوپریوزر</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderTop: "1px solid #e2e8f0" }}>
                <td style={td}>{u.username}</td>
                <td style={td}>{u.email || "—"}</td>
                <td style={td}>{u.is_active ? "✅" : "❌"}</td>
                <td style={td}>{u.is_staff ? "✅" : "❌"}</td>
                <td style={td}>{u.is_superuser ? "✅" : "❌"}</td>
                <td style={td}>
                  <button onClick={() => startEdit(u)} style={linkBtn}>
                    ویرایش
                  </button>
                  {u.id !== me.id && (
                    <button onClick={() => remove(u)} style={{ ...linkBtn, color: "#dc2626" }}>
                      حذف
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={submit} style={panelStyle}>
        <h3 style={panelTitle}>{editingId ? "ویرایش کاربر" : "کاربر جدید"}</h3>
        <FormField
          label="نام کاربری"
          value={form.username}
          onChange={(v) => setForm({ ...form, username: v })}
          disabled={!!editingId}
        />
        <FormField label="ایمیل" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
        <FormField
          label={editingId ? "رمز عبور جدید (اختیاری)" : "رمز عبور"}
          type="password"
          value={form.password}
          onChange={(v) => setForm({ ...form, password: v })}
        />
        <CheckField label="فعال باشد" checked={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} />
        <CheckField
          label="دسترسی ادمین (staff)"
          checked={form.is_staff}
          onChange={(v) => setForm({ ...form, is_staff: v })}
        />
        {me.is_superuser && (
          <CheckField
            label="سوپریوزر"
            checked={form.is_superuser}
            onChange={(v) => setForm({ ...form, is_superuser: v })}
          />
        )}
        <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
          <button type="submit" disabled={busy} style={primaryBtn}>
            {editingId ? "ذخیره" : "ایجاد"}
          </button>
          {editingId && (
            <button type="button" onClick={cancelEdit} style={secondaryBtn}>
              انصراف
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function ItemsPanel() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ title: "", description: "" });
  const [editingId, setEditingId] = useState(null);

  function load() {
    api.listItems().then(setItems).catch((e) => setError(e.message));
  }
  useEffect(load, []);

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      if (editingId) {
        await api.updateItem(editingId, form);
      } else {
        await api.createItem(form);
      }
      setForm({ title: "", description: "" });
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(item) {
    if (!confirm(`حذف «${item.title}»؟`)) return;
    await api.deleteItem(item.id);
    load();
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "20px" }}>
      <div style={panelStyle}>
        <h3 style={panelTitle}>داده‌های ذخیره‌شده در PostgreSQL</h3>
        {error && <p style={{ color: "#dc2626", fontSize: "13px" }}>{error}</p>}
        {items.map((it) => (
          <div key={it.id} style={{ padding: "10px 0", borderTop: "1px solid #e2e8f0" }}>
            <strong>{it.title}</strong>
            <p style={{ margin: "4px 0", color: "#475569", fontSize: "13px" }}>{it.description}</p>
            <div style={{ fontSize: "12px", color: "#94a3b8" }}>ثبت‌شده توسط {it.created_by || "—"}</div>
            <button
              onClick={() => {
                setEditingId(it.id);
                setForm({ title: it.title, description: it.description });
              }}
              style={linkBtn}
            >
              ویرایش
            </button>
            <button onClick={() => remove(it)} style={{ ...linkBtn, color: "#dc2626" }}>
              حذف
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={submit} style={panelStyle}>
        <h3 style={panelTitle}>{editingId ? "ویرایش رکورد" : "رکورد جدید"}</h3>
        <FormField label="عنوان" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
        <FormField
          label="توضیحات"
          value={form.description}
          onChange={(v) => setForm({ ...form, description: v })}
          textarea
        />
        <button type="submit" style={primaryBtn}>
          {editingId ? "ذخیره" : "ایجاد"}
        </button>
      </form>
    </div>
  );
}

function FormField({ label, value, onChange, type = "text", disabled, textarea }) {
  return (
    <div style={{ marginBottom: "12px" }}>
      <label style={{ fontSize: "12px", color: "#334155" }}>{label}</label>
      {textarea ? (
        <textarea
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...inputStyle, minHeight: "70px" }}
        />
      ) : (
        <input
          type={type}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          style={inputStyle}
        />
      )}
    </div>
  );
}

function CheckField({ label, checked, onChange }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", marginBottom: "10px" }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

const panelStyle = {
  background: "#fff",
  borderRadius: "0 12px 12px 12px",
  padding: "18px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
};
const panelTitle = { margin: "0 0 14px", fontSize: "14px", color: "#0f172a" };
const th = { padding: "8px", fontWeight: 600 };
const td = { padding: "8px" };
const linkBtn = { border: "none", background: "transparent", color: "#2563eb", cursor: "pointer", fontSize: "12px", marginInlineEnd: "10px" };
const primaryBtn = { flex: 1, padding: "10px", border: "none", borderRadius: "8px", background: "#0f172a", color: "#fff", cursor: "pointer", fontSize: "13px" };
const secondaryBtn = { padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "8px", background: "#fff", cursor: "pointer", fontSize: "13px" };
const inputStyle = { width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "4px", fontSize: "13px", boxSizing: "border-box" };
const logoutBtn = { background: "transparent", border: "1px solid #475569", color: "#fff", borderRadius: "8px", padding: "8px 14px", cursor: "pointer", fontSize: "13px" };