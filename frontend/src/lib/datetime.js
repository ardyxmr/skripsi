// Render a timestamp as "YYYY-MM-DD HH:mm:ss" for the Settings tables.
// ISO strings (e.g. "2026-06-09T07:32:50.000000Z") are reformatted in place — the date/time
// parts are kept exactly as stored, so no timezone shift is introduced; only the display changes.
// Any other parseable value falls back to local-time components. Empty input → ''.
export function formatDateTime(value) {
  if (!value) return '';
  const iso = String(value).match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2})/);
  if (iso) return `${iso[1]} ${iso[2]}`;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
