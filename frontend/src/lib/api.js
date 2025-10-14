// frontend/src/lib/api.js
const RAW_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
const BASE = RAW_BASE.replace(/\/+$/, ''); // strip trailing slash

const DEFAULT_FETCH_OPTS = {
  credentials: 'include',
};

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiFetch(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 15000);

  try {
    const init = {
      ...DEFAULT_FETCH_OPTS,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...authHeaders(),
        ...(options.headers || {}),
      },
      signal: controller.signal,
      ...options,
    };

    const res = await fetch(`${BASE}${path}`, init);

    // Parse response safely (handles 204 and non-JSON)
    const ct = res.headers.get('content-type') || '';
    let data = null;

    if (res.status === 204) {
      data = null; // No Content
    } else if (ct.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      data = text ? { message: text } : null;
    }

    if (!res.ok) throw new Error((data && data.message) || `Request failed: ${res.status}`);
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

// Optional raw helper for special cases (file uploads, etc.)
export const apiRaw = (path, init = {}) =>
  fetch(`${BASE}${path}`, { ...DEFAULT_FETCH_OPTS, ...init });

export const api = {
  // --- health ---
  health: () => apiFetch('/api/v1/health'),

  // --- auth ---
  login: (email, password) =>
    apiFetch('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (email, password) =>
    apiFetch('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: () => apiFetch('/api/v1/auth/logout', { method: 'POST' }),

  me: () => apiFetch('/api/v1/auth/me'),

  // --- requests ---
  listRequests: () => apiFetch('/api/v1/requests'),

  createRequest: (payload) =>
    apiFetch('/api/v1/requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getRequest: (id) => apiFetch(`/api/v1/requests/${id}`),

  updateRequest: (id, updates) =>
    apiFetch(`/api/v1/requests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  deleteRequest: (id) => apiFetch(`/api/v1/requests/${id}`, { method: 'DELETE' }),

  // --- users (backend currently: list only) ---
  listUsers: () => apiFetch('/api/v1/users'),
};
