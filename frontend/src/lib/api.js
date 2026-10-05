// frontend/src/lib/api.js

// Base URL for the backend API
const RAW_BASE =
  import.meta.env.VITE_API_URL ||
  "https://lendahand-backend.katcrypt.com/api/v1";

// strip trailing slash just in case
const BASE = RAW_BASE.replace(/\/+$/, "");

const DEFAULT_FETCH_OPTS = {
  credentials: "include", // send/receive auth cookie
};

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiFetch(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? 15000
  );

  try {
    const init = {
      ...DEFAULT_FETCH_OPTS,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...authHeaders(),
        ...(options.headers || {}),
      },
      signal: controller.signal,
      ...options,
    };

    const res = await fetch(`${BASE}${path}`, init);

    const ct = res.headers.get("content-type") || "";
    let data = null;

    if (res.status === 204) {
      data = null;
    } else if (ct.includes("application/json")) {
      data = await res.json();
    } else {
      const text = await res.text();
      data = text ? { message: text } : null;
    }

    if (!res.ok) {
      throw new Error((data && data.message) || `Request failed: ${res.status}`);
    }

    return data;
  } finally {
    clearTimeout(timeout);
  }
}

export const apiRaw = (path, init = {}) =>
  fetch(`${BASE}${path}`, { ...DEFAULT_FETCH_OPTS, ...init });

export const api = {
  // health
  health: () => apiFetch("/api/v1/health"),

  // auth
  login: (email, password) =>
    apiFetch("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (email, password, displayName) =>
    apiFetch("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, displayName }),
    }),

  logout: () => apiFetch("/api/v1/auth/logout", { method: "POST" }),
  me: () => apiFetch("/api/v1/auth/me"),

  // users / profile
  getProfile: () => apiFetch("/api/v1/users/me"),
  updateMe: (payload) =>
    apiFetch("/api/v1/users/me", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  deleteMe: () => apiFetch("/api/v1/users/me", { method: "DELETE" }),

  listUsers: () => apiFetch("/api/v1/users"),

  // me / overview
  meOverview: () => apiFetch("/api/v1/me/overview"),

  // Now implemented via /auth/me -> /feedback/user/:id
  meFeedback: async () => {
    const me = await apiFetch("/api/v1/auth/me");
    const user = me?.user || me;
    if (!user || !user._id) {
      throw new Error("You need to be logged in to view feedback.");
    }
    return apiFetch(`/api/v1/feedback/user/${user._id}`);
  },

  // requests
  listRequests: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/api/v1/requests${qs ? `?${qs}` : ""}`);
  },

  createRequest: (payload) =>
    apiFetch("/api/v1/requests", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getRequest: (id) => apiFetch(`/api/v1/requests/${id}`),

  updateRequest: (id, updates) =>
    apiFetch(`/api/v1/requests/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    }),

  deleteRequest: (id) =>
    apiFetch(`/api/v1/requests/${id}`, {
      method: "DELETE",
    }),

  acceptRequest: (id) =>
    apiFetch(`/api/v1/requests/${id}/accept`, { method: "PATCH" }),

  cancelAcceptance: (id) =>
    apiFetch(`/api/v1/requests/${id}/cancel`, { method: "PATCH" }),

  markComplete: (id) =>
    apiFetch(`/api/v1/requests/${id}/complete`, { method: "PATCH" }),

  confirmCompletion: (id) =>
    apiFetch(`/api/v1/requests/${id}/confirm`, { method: "PATCH" }),

  getNearbyRequests: (lat, lng, miles) =>
    apiFetch(
      `/api/v1/requests/near?lat=${lat}&lng=${lng}&maxDistance=${miles}`
    ),

  reportRequest: (id) =>
    apiFetch(`/api/v1/requests/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ flagged: true }),
    }),

  // notifications
  listNotifications: () => apiFetch("/api/v1/notifications"),

  markNotificationRead: (id) =>
    apiFetch(`/api/v1/notifications/${id}/read`, { method: "PATCH" }),

  markAllNotificationsRead: () =>
    apiFetch("/api/v1/notifications/read-all", { method: "PATCH" }),

  // submit feedback after a request is closed
  submitFeedback: (requestId, rating, comment) =>
    apiFetch(`/api/v1/requests/${requestId}/feedback`, {
      method: "POST",
      body: JSON.stringify({ rating, comment }),
    }),

  // fetch public-ish feedback for a helper
  getUserFeedback: (userId) =>
    apiFetch(`/api/v1/feedback/user/${userId}`),

  // --- admin ---
  admin: {
    getAllUsers: () => apiFetch("/api/v1/admin/users"),
    updateUser: (id, updates) =>
      apiFetch(`/api/v1/admin/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      }),
    deleteUser: (id) =>
      apiFetch(`/api/v1/admin/users/${id}`, { method: "DELETE" }),

    getAllRequests: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return apiFetch(`/api/v1/admin/requests${qs ? `?${qs}` : ""}`);
    },
    updateRequest: (id, updates) =>
      apiFetch(`/api/v1/admin/requests/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      }),
    deleteRequest: (id) =>
      apiFetch(`/api/v1/admin/requests/${id}`, { method: "DELETE" }),

    getAllFeedback: () => apiFetch("/api/v1/admin/feedback"),
  },
};
