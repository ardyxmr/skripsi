import axios from 'axios';
import { camelizeKeys, decamelizeKeys } from 'humps';
import { getToken, clearToken } from './auth';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach auth + convert outgoing camelCase -> snake_case
api.interceptors.request.use((cfg) => {
  const token = getToken();
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  if (cfg.data && !(cfg.data instanceof FormData)) {
    cfg.data = decamelizeKeys(cfg.data);
  }
  if (cfg.params) cfg.params = decamelizeKeys(cfg.params);
  return cfg;
});

// Normalize incoming snake_case -> camelCase; normalize errors; handle 401
api.interceptors.response.use(
  (res) => {
    res.data = camelizeKeys(res.data);
    return res;
  },
  (err) => {
    if (err.response?.status === 401) {
      clearToken();
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    const body = err.response?.data?.error;
    return Promise.reject({
      code: body?.code ?? 'UNKNOWN',
      message: body?.message ?? err.message,
      details: body?.details ?? null,
      status: err.response?.status,
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
