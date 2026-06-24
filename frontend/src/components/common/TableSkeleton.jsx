import React from 'react';

/**
 * Shimmer placeholder rows for a table's <tbody>, shown during the first data
 * load so the table never flashes its empty-state before rows arrive — matches
 * the SkeletonRows pattern already used on Inventory/Approvals.
 *
 * Props:
 *  - cols:  number of <td> columns to span (use the table's column count)
 *  - rows:  how many placeholder rows (default 5)
 *  - bars:  how many shimmer bars per row (default 4), varied widths
 */
const WIDTHS = ['w-40', 'w-28', 'w-24', 'w-20', 'w-16', 'w-32'];

export default function TableSkeleton({ cols, rows = 5, bars = 4 }) {
  return Array.from({ length: rows }).map((_, r) => (
    <tr key={`sk-${r}`} className="animate-pulse border-b border-gray-100 dark:border-theme last:border-0">
      <td colSpan={cols} className="px-5 py-4">
        <div className="flex items-center gap-4">
          <div className="h-4 w-4 rounded bg-gray-100 dark:bg-zinc-700/40 shrink-0" />
          {Array.from({ length: bars }).map((_, b) => (
            <div key={b} className={`h-4 rounded bg-gray-100 dark:bg-zinc-700/40 ${WIDTHS[b % WIDTHS.length]}`} />
          ))}
        </div>
      </td>
    </tr>
  ));
}
