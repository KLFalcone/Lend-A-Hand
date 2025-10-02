const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(options.headers || {}),
    },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed: ${res.status}`);
  return data;
}

export const api = {
  // --- health + auth ---
  health: () => apiFetch("/api/health"),
  login: (email, password) =>
    apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (email, password) =>
    apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  // --- requests ---
  listRequests: () =>
    apiFetch("/api/requests", {
      method: "GET",
    }),

  createRequest: (payload) =>
    apiFetch("/api/requests", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
