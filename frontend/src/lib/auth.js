// Cookie-based SPA auth: the server holds an HttpOnly session cookie that JavaScript cannot read.
// We keep ONLY an in-memory "are we authenticated?" flag — set after a successful login or /auth/me
// probe, cleared on logout or a 401. It resets to false on a hard reload; UserContext re-probes
// /auth/me on boot to rehydrate it (and DataBootstrap then refetches the data contexts).
let authed = false;

export const isAuthed = () => authed;
export const setAuthed = (v) => { authed = !!v; };

// One-time cleanup of the legacy bearer token from the previous (sessionStorage/localStorage) era.
try {
  sessionStorage.removeItem('infraprov.token');
  localStorage.removeItem('infraprov.token');
} catch { /* storage unavailable — nothing to clean */ }
