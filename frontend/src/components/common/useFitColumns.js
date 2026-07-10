import { useState, useEffect, useCallback } from 'react';

// Fit-mode column widths for <DataTable>. Unlike the old px-based useResizableColumns, columns hold
// relative WEIGHTS and render as PERCENTAGES of the table width — so the table always fills its
// container (no leftover gap, no runaway horizontal scroll). A resize is a NEIGHBOUR SHIFT: the
// dragged column grows and the column to its right shrinks by the same amount, so the total is
// conserved and a column can never be dragged past the table edge. Nothing is persisted, so widths
// reset to the column defaults whenever the page remounts (i.e. on every menu switch).
//
// `columns` — the DataTable column defs (each may carry `weight` (default 1) and `minPx` (default 80)).
// `tableRef` — ref to the <table> element, read at drag time to convert pixel delta → weight delta.
export function useFitColumns(columns, tableRef, { minPx = 80 } = {}) {
  const seed = () => columns.map((c) => (c.weight ?? 1));
  const [weights, setWeights] = useState(seed);

  // Re-seed only when the column COUNT changes (schema edit) — not on every inline `columns` array
  // identity change, so weights survive normal re-renders.
  useEffect(() => {
    setWeights((w) => (w.length === columns.length ? w : columns.map((c) => (c.weight ?? 1))));
  }, [columns.length]);

  const total = weights.reduce((a, b) => a + b, 0) || 1;
  const pct = weights.map((w) => `${((w / total) * 100).toFixed(4)}%`);

  // Drag the divider on the RIGHT edge of column `index`: it borrows width from column index+1.
  const startResize = useCallback((index, e) => {
    e.preventDefault();
    e.stopPropagation();
    const W = tableRef.current?.clientWidth || 0;
    if (!W || index >= weights.length - 1) return;

    const startX = e.pageX;
    const start = [...weights];
    const sum = start.reduce((a, b) => a + b, 0);
    const minW = (minPx / W) * sum;                 // per-column floor, in weight units

    const onMove = (ev) => {
      let delta = ((ev.pageX - startX) / W) * sum;  // px moved → weight moved
      // Neither the dragged column nor its right neighbour may fall below the floor.
      delta = Math.min(start[index + 1] - minW, Math.max(-(start[index] - minW), delta));
      setWeights(() => {
        const next = [...start];
        next[index] = start[index] + delta;
        next[index + 1] = start[index + 1] - delta;
        return next;
      });
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [weights, tableRef, minPx]);

  return { pct, startResize };
}
