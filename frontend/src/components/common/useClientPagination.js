import { useState, useEffect, useMemo } from 'react';

// Client-side pagination for an already filtered/sorted in-memory array. Returns the current slice
// (`paged`) plus everything <PaginationBar> needs. Changing the page size resets to page 1; the page
// is clamped when the list shrinks below it (e.g. after a filter narrows or a live refresh removes
// rows). Live-polled data stays on the same page across refreshes because we key off the array
// contents, not its identity.
export function useClientPagination(items, initialPerPage = 10) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPageRaw] = useState(initialPerPage);

  const total = items.length;
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const pageSafe = Math.min(page, lastPage);
  const pageStart = total === 0 ? 0 : (pageSafe - 1) * perPage + 1;
  const pageEnd = Math.min(pageSafe * perPage, total);
  const paged = useMemo(
    () => items.slice((pageSafe - 1) * perPage, pageSafe * perPage),
    [items, pageSafe, perPage],
  );

  useEffect(() => { if (page > lastPage) setPage(lastPage); }, [page, lastPage]);

  const setPerPage = (n) => { setPerPageRaw(n); setPage(1); };

  return { page, setPage, perPage, setPerPage, total, lastPage, pageSafe, pageStart, pageEnd, paged };
}
