// Shared status vocabulary for published/discovered resources (catalog / network / datastore / node).
// The backend's effectiveStatus() derives health from the linked provider + node, so a resource can
// read: Active | Inactive | Disabled | Provider Offline | Node Offline | Missing | Template Missing.
// These helpers bucket that vocabulary the SAME way everywhere (stat cards, filters, row grey-out),
// so an offline provider takes its resources offline consistently instead of each screen guessing.

// Any state where the resource can't be used because its provider/node is unreachable or the
// discovered object is gone — nothing the admin chose. ('Offline / Missing' and 'Offline' are legacy
// labels kept for backward compatibility with older rows/filters.)
export const OFFLINE_STATUSES = [
  'Provider Offline', 'Node Offline', 'Missing', 'Template Missing', 'Offline / Missing', 'Offline',
];

const OFFLINE_SET = new Set(OFFLINE_STATUSES);

/** True when the resource is offline/unavailable because of its provider or node (not an admin choice). */
export function isOffline(status) {
  return OFFLINE_SET.has(status);
}

/** True when the resource is live and usable for provisioning. */
export function isActive(status) {
  return status === 'Active';
}

/**
 * Partial degradation — used by Environment (a many-to-many allow-list): some allowed provider/node
 * is down but a usable path remains, so it is NOT offline (still provisionable) — shown amber.
 */
export function isDegraded(status) {
  return status === 'Degraded';
}
