const BASE = "/api";

function getCookie(name) {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

async function ensureCsrfToken() {
  let token = getCookie("csrftoken");
  if (!token) {
    await fetch(`${BASE}/auth/csrf/`, { credentials: "include" });
    token = getCookie("csrftoken");
  }
  return token;
}

async function apiFetch(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };

  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    headers["X-CSRFToken"] = await ensureCsrfToken();
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    method,
    headers,
    credentials: "include", // برای ارسال/دریافت کوکی session از طریق nginx
  });

  let body = null;
  try {
    body = await res.json();
  } catch (err) {
    // ممکن است بدنه‌ای نداشته باشد (مثل 204)
  }

  if (!res.ok) {
    const error = new Error(body?.detail || body?.message || "خطا در ارتباط با سرور");
    error.status = res.status;
    error.body = body;
    throw error;
  }

  return body;
}

export const api = {
  csrf: () => ensureCsrfToken(),
  login: (username, password) =>
    apiFetch("/auth/login/", { method: "POST", body: JSON.stringify({ username, password }) }),
  logout: () => apiFetch("/auth/logout/", { method: "POST" }),
  me: () => apiFetch("/auth/me/"),

  listUsers: () => apiFetch("/users/"),
  createUser: (data) => apiFetch("/users/", { method: "POST", body: JSON.stringify(data) }),
  updateUser: (id, data) => apiFetch(`/users/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteUser: (id) => apiFetch(`/users/${id}/`, { method: "DELETE" }),

  listItems: () => apiFetch("/items/"),
  createItem: (data) => apiFetch("/items/", { method: "POST", body: JSON.stringify(data) }),
  updateItem: (id, data) => apiFetch(`/items/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteItem: (id) => apiFetch(`/items/${id}/`, { method: "DELETE" }),
};
