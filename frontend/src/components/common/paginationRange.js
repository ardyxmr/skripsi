// Compact page-number list for a pager: every page when there are few, otherwise the first, last,
// and a small window around the current page, with 'gap-N' markers rendered as an ellipsis.
// Shared by the data-table pagers (Inventory / Approvals / User Management …).
export function paginationRange(current, last) {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);
  const wanted = [1, last, current, current - 1, current + 1].filter((p) => p >= 1 && p <= last);
  const sorted = [...new Set(wanted)].sort((a, b) => a - b);
  const out = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) out.push(`gap-${p}`);
    out.push(p);
    prev = p;
  }
  return out;
}
