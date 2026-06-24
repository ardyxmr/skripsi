import axios from 'axios';
import { camelizeKeys, decamelizeKeys } from 'humps';
import { setAuthed } from './auth';

// Backend origin without the trailing /api — /sanctum/csrf-cookie lives at the app root.
const ORIGIN = import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '');

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // send/receive the HttpOnly session + XSRF cookies
  withXSRFToken: true,    // axios attaches X-XSRF-TOKEN from the XSRF-TOKEN cookie (Laravel defaults)
});

// Primes the XSRF-TOKEN + session cookies. Call before a state-changing request when no CSRF cookie
// is present yet (login) or to recover from a 419. /sanctum/csrf-cookie is NOT under /api.
export const ensureCsrf = () => axios.get(`${ORIGIN}/sanctum/csrf-cookie`, { withCredentials: true });

// Convert outgoing camelCase -> snake_case. Auth now rides the session cookie — no Authorization header.
api.interceptors.request.use((cfg) => {
  if (cfg.data instanceof FormData) {
    // Let the browser/axios set multipart/form-data with the correct boundary.
    delete cfg.headers['Content-Type'];
  } else if (cfg.data) {
    cfg.data = decamelizeKeys(cfg.data);
  }
  if (cfg.params) cfg.params = decamelizeKeys(cfg.params);
  return cfg;
});

// Normalize incoming snake_case -> camelCase; recover CSRF (419); handle 401; normalize errors.
api.interceptors.response.use(
  (res) => {
    res.data = camelizeKeys(res.data);
    return res;
  },
  async (err) => {
    const status = err.response?.status;
    const cfg = err.config;

    // CSRF token expired/missing → refresh the cookie and retry the original request ONCE.
    if (status === 419 && cfg && !cfg._csrfRetried) {
      cfg._csrfRetried = true;
      try {
        await ensureCsrf();
        return await api.request(cfg);
      } catch { /* fall through to the normal rejection below */ }
    }

    if (status === 401) {
      setAuthed(false);
      // Don't bounce the expected logged-out boot probe (/auth/me on the login screen).
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    const body = err.response?.data?.error;
    const details = body?.details ?? null;
    // Surface the first field-level validation message (e.g. duplicate-name / already-published)
    // instead of the generic "The given data was invalid." — callers show `message` in a toast.
    let message = body?.message ?? err.message;
    if (details && typeof details === 'object') {
      const first = Object.values(details)[0];
      if (Array.isArray(first) && first.length) message = first[0];
      else if (typeof first === 'string') message = first;
    }
    return Promise.reject({
      code: body?.code ?? 'UNKNOWN',
      message,
      details,
      status,
    });
  }
);

// Convenience wrappers that return response data directly.
export default {
  get: (...a) => api.get(...a).then((r) => r.data),
  post: (...a) => api.post(...a).then((r) => r.data),
  put: (...a) => api.put(...a).then((r) => r.data),
  del: (...a) => api.delete(...a).then((r) => r.data),
  // Raw instance for special cases (FormData upload, blob download).
  raw: api,
};
