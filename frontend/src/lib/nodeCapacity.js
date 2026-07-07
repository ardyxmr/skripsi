// Shared node-capacity render helpers. The backend (NodeCapacityService) computes the level +
// percentages; the frontend only maps them to badges/labels. All keys are camelCase (api.js
// camelizes responses): { cpuPct, ramPct, diskPct, level, breached, provisioningBlocked, ... }.

// [label, pct] of the resource nearest its ceiling, or null when no numbers are known.
export function capacityPeak(cap) {
  if (!cap) return null;
  const parts = [['CPU', cap.cpuPct], ['RAM', cap.ramPct], ['DISK', cap.diskPct]]
    .filter(([, v]) => v != null);
  if (!parts.length) return null;
  return parts.reduce((a, b) => (b[1] > a[1] ? b : a));
}

// Full one-line breakdown for tooltips, e.g. "CPU 40% · RAM 92% · DISK 61%".
export function capacityDetail(cap) {
  if (!cap) return '';
  return [['CPU', cap.cpuPct], ['RAM', cap.ramPct], ['DISK', cap.diskPct]]
    .filter(([, v]) => v != null)
    .map(([k, v]) => `${k} ${v}%`)
    .join(' · ');
}

// Badge descriptor for a node's capacity, or null when OK / unknown. `level` is 'warning'|'critical'.
export function capacityBadge(cap) {
  if (!cap || !cap.level || cap.level === 'ok') return null;
  const peak = capacityPeak(cap);
  return {
    level: cap.level,
    blocked: !!cap.provisioningBlocked,
    label: peak ? `${peak[0]} ${peak[1]}%` : cap.level,
    detail: capacityDetail(cap),
  };
}
