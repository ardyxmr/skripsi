import React, { useRef, useState, useMemo } from 'react';
import Colgroup from './Colgroup';
import PaginationBar from './PaginationBar';
import { useClientPagination } from './useClientPagination';
import TableSkeleton from './TableSkeleton';
import ColResizeHandle from './ColResizeHandle';
import { useFitColumns } from './useFitColumns';

/**
 * Global data table for the settings-style lists. A page keeps its own card shell, stat header,
 * toolbar (search/filter) and modals, and just declares `columns` + `rows`; this component owns the
 * table itself: a single `table-fixed` table with a sticky header (so header & body columns can never
 * drift), fit-mode resizable columns (see useFitColumns), internal sort + client pagination, the
 * loading skeleton and the empty state.
 *
 * Column def: {
 *   key, header, render(row),
 *   weight?      // fit-mode share of the width (default 1)
 *   align?       // 'left' | 'center' | 'right'
 *   sortable?, sortAccessor?(row)   // default accessor = row[key]
 *   resizable?   // default true; the last column has no handle regardless
 *   minPx?       // resize floor (default 80)
 *   headerClassName?, cellClassName?   // default 'px-4 py-3'
 * }
 */
const alignClass = (a) => (a === 'center' ? 'text-center' : a === 'right' ? 'text-right' : 'text-left');

export default function DataTable({
  columns,
  rows,
  rowKey,
  rowClassName,
  perPage = 10,
  noun = 'Items',
  loading = false,
  emptyState,
  defaultSort = { key: null, dir: 'asc' },
}) {
  const tableRef = useRef(null);
  const { pct, startResize } = useFitColumns(columns, tableRef);
  const [sort, setSort] = useState(defaultSort);

  const sorted = useMemo(() => {
    if (!sort.key) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return rows;
    const acc = col.sortAccessor || ((r) => r[col.key]);
    return [...rows].sort((a, b) => {
      const va = acc(a);
      const vb = acc(b);
      if (va < vb) return sort.dir === 'asc' ? -1 : 1;
      if (va > vb) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [rows, sort, columns]);

  const pager = useClientPagination(sorted, perPage);

  const toggleSort = (col) => {
    if (!col.sortable) return;
    setSort((s) => (s.key === col.key ? { key: col.key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key: col.key, dir: 'asc' }));
  };

  const lastIdx = columns.length - 1;

  return (
    <div className="flex-auto min-h-0 w-full flex flex-col">
      <div className="flex-auto min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar bg-white dark:bg-card">
        <table ref={tableRef} className="w-full text-left border-collapse text-[13px] table-fixed">
          <Colgroup widths={pct} />
          <thead>
            <tr className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {columns.map((col, i) => {
                const canResize = col.resizable !== false && i < lastIdx;
                return (
                  <th
                    key={col.key}
                    onClick={() => toggleSort(col)}
                    className={`sticky top-0 z-10 bg-gray-50 dark:bg-surface border-b border-gray-200 dark:border-theme ${col.headerClassName ?? 'px-4 py-3'} ${alignClass(col.align)} ${col.sortable ? 'cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-300' : ''} ${canResize ? 'relative' : ''}`}
                  >
                    {col.header}
                    {col.sortable && sort.key === col.key ? (sort.dir === 'asc' ? ' ↑' : ' ↓') : ''}
                    {canResize && <ColResizeHandle onMouseDown={(e) => startResize(i, e)} />}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 && <TableSkeleton cols={columns.length} />}

            {!loading && pager.total === 0 && emptyState && (
              <tr>
                <td colSpan={columns.length} className="py-16">
                  <div className="w-full flex flex-col items-center justify-center text-slate-400 dark:text-zinc-500">
                    {emptyState.icon && <emptyState.icon size={48} className="mb-4 opacity-20" />}
                    {emptyState.title && <h4 className="text-[15px] font-bold text-gray-800 dark:text-gray-200 mb-1">{emptyState.title}</h4>}
                    {emptyState.message && <p className="text-[13px] mb-4 text-center max-w-sm">{emptyState.message}</p>}
                    {emptyState.action}
                  </div>
                </td>
              </tr>
            )}

            {pager.paged.map((row) => (
              <tr
                key={rowKey(row)}
                className={`table-row-optimized border-b border-slate-100 dark:border-theme last:border-0 group ${rowClassName ? rowClassName(row) : ''}`}
              >
                {columns.map((col) => (
                  <td key={col.key} className={`${col.cellClassName ?? 'px-4 py-3'} ${alignClass(col.align)}`}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PaginationBar pager={pager} noun={noun} />
    </div>
  );
}
