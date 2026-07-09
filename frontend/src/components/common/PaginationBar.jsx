import { paginationRange } from './paginationRange';

// Footer pager shared by the data tables (Inventory / Approvals / User Management …). Driven by a
// `pager` object from useClientPagination; `noun` labels the count ("Users", "Roles", …).
export default function PaginationBar({ pager, noun = 'Rows', perPageOptions = [10, 25, 50, 100] }) {
  const { setPage, perPage, setPerPage, total, lastPage, pageSafe, pageStart, pageEnd } = pager;

  const numBtn = 'w-8 h-8 flex items-center justify-center border border-gray-200 dark:border-theme bg-white dark:bg-card text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700/50 rounded-input transition-[border-color,opacity] text-[12px] font-medium';
  const arrowBtn = `${numBtn} disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-card`;

  return (
    <div className="h-[56px] bg-white dark:bg-transparent border-t border-gray-100 dark:border-theme flex items-center justify-between px-5 shrink-0 z-10">
      <div className="text-[12px] font-medium text-gray-500 dark:text-gray-400">
        Showing {pageStart}–{pageEnd} of {total} {noun}
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-gray-500 dark:text-gray-400">Rows per page:</span>
          <select
            value={perPage}
            onChange={(e) => setPerPage(Number(e.target.value))}
            className="bg-white dark:bg-surface text-[12px] font-medium text-slate-700 dark:text-zinc-300 border border-gray-200 dark:border-theme rounded-md px-2 py-1 outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-500/20 cursor-pointer"
          >
            {perPageOptions.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        <div className="w-px h-4 bg-gray-200 dark:bg-zinc-700/50"></div>

        <div className="flex items-center gap-1.5">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={pageSafe <= 1} aria-label="Previous page" className={arrowBtn}>←</button>
          {paginationRange(pageSafe, lastPage).map((p) =>
            typeof p === 'number' ? (
              <button
                key={p}
                onClick={() => setPage(p)}
                aria-current={p === pageSafe ? 'page' : undefined}
                className={p === pageSafe
                  ? 'w-8 h-8 flex items-center justify-center border-none bg-gradient-to-br from-teal-500 to-emerald-500 text-white rounded-input shadow-sm text-[12px] font-bold'
                  : numBtn}
              >
                {p}
              </button>
            ) : (
              <span key={p} className="w-8 h-8 flex items-center justify-center text-gray-400 dark:text-gray-500 text-[12px] select-none">…</span>
            ),
          )}
          <button onClick={() => setPage((p) => Math.min(lastPage, p + 1))} disabled={pageSafe >= lastPage} aria-label="Next page" className={arrowBtn}>→</button>
        </div>
      </div>
    </div>
  );
}
