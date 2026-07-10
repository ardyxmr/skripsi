import { useState, useEffect, useCallback } from 'react';

// Per-column resizable widths for the two-table-split data tables. Seeds from `initialWidths`
// (or the persisted localStorage[storageKey] if it matches the column count); returns the live
// `widths` array — feed it to BOTH <Colgroup>s (header + body) so their columns stay aligned —
// plus `startResize(index, e)` to wire onto each header's drag handle. Widths persist on drag end.
// Every width is clamped to [minWidth, maxWidth] so a column can't be dragged to 0 or grow forever.
export function useResizableColumns(storageKey, initialWidths, { minWidth = 60, maxWidth = 600 } = {}) {
  const [widths, setWidths] = useState(() => {
    if (storageKey) {
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
        // Clamp persisted widths too — an old value saved before the max clamp could be huge.
        if (Array.isArray(saved) && saved.length === initialWidths.length) {
          return saved.map((w) => Math.min(maxWidth, Math.max(minWidth, w)));
        }
      } catch { /* ignore malformed storage */ }
    }
    return initialWidths;
  });

  // If the column set changes shape (schema/columns edited), fall back to the new defaults.
  useEffect(() => {
    setWidths((w) => (w.length === initialWidths.length ? w : initialWidths));
  }, [initialWidths.length]);

  const startResize = useCallback((index, e) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.pageX;
    const startWidth = widths[index];

    const onMove = (ev) => {
      // Clamp both ways: minWidth stops the drag-left (already worked), maxWidth stops the
      // drag-right which was previously unbounded (a column could grow without limit).
      const next = Math.min(maxWidth, Math.max(minWidth, startWidth + ev.pageX - startX));
      setWidths((w) => {
        const copy = [...w];
        copy[index] = next;
        return copy;
      });
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      setWidths((w) => {
        if (storageKey) {
          try { localStorage.setItem(storageKey, JSON.stringify(w)); } catch { /* ignore */ }
        }
        return w;
      });
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [widths, minWidth, maxWidth, storageKey]);

  return { widths, startResize };
}
