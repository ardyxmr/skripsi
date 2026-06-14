// Lightweight in-memory cache for the "live" pages (Inventory, Approvals) that
// fetch on every open. It lets those pages paint instantly using the last-known
// rows while they re-fetch + poll in the background, so opening them feels as
// snappy as the eager-cached Settings modules — without sacrificing freshness.
//
// Warmed once at app startup by prefetchLiveData() (see ProtectedLayout), and
// refreshed by each page on every successful load. Cleared on logout.
import api from './api';

const cache = {}; // path -> raw rows (pre-normalize, exactly as the API returned)

export function getCached(path) {
  return cache[path] ?? null;
}

export function setCached(path, rows) {
  cache[path] = rows;
}

export function clearLiveCache() {
  Object.keys(cache).forEach((k) => delete cache[k]);
}

// Fire-and-forget warm-up; failures are ignored (the page's own fetch will surface errors).
async function warm(path) {
  try {
    setCached(path, await api.get(path));
  } catch {
    /* ignore — page-level fetch handles real errors */
  }
}

export function prefetchLiveData() {
  warm('/inventory');
  warm('/approvals');
}
