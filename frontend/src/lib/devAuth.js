// DEV-ONLY login bypass — lets you browse the UI before the backend exists.
// Enabled only when VITE_AUTH_BYPASS=true (set in frontend/.env). Turn it off
// (or remove this file's two call sites) once the real backend is up.
//
// Call sites: src/pages/Login.jsx (onSubmit) and src/contexts/UserContext.jsx (boot).

export const AUTH_BYPASS = import.meta.env.VITE_AUTH_BYPASS === 'true';

const USER_KEY = 'infraprov.devUser';

export function makeBypassUser(email) {
  return {
    id: 0,
    name: 'Dev Admin',
    email: email || 'dev@infraprov.local',
    role: 'Administrator', // full nav (Approvals + Settings visible)
    group: 'System Administrators',
  };
}

export function setBypassUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getBypassUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearBypassUser() {
  localStorage.removeItem(USER_KEY);
}
