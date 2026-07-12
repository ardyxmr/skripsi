import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { FileText, Search, Filter, Calendar, Download, X, AlertCircle, Server, Fingerprint, ChevronDown } from 'lucide-react';
import ResizableTh from '../../../components/ResizableTh';
import api from '../../../lib/api';
import { useUI } from '../../../stores/uiStore';

// API rows arrive camelCased; alias to the snake_case fields this table renders.
function normalizeLog(row) {
  return {
    ...row,
    user_id: row.userId ?? row.user_id,
    user_name: row.userName ?? row.user_name ?? '—',
    action_type: row.actionType ?? row.action_type ?? '—',
    // No status column in the append-only schema → derive the outcome. Prefer the explicit
    // metadata.result the lifecycle jobs record (success/failed/rejected/…) so a FAILED job no
    // longer shows green; otherwise fall back to the action verb. POWER_OFF is an out-of-band
    // shutdown the portal didn't initiate → Unknown.
    status: row.status ?? (() => {
      const result = row.metadata?.result;
      if (result) return String(result).toLowerCase() === 'success' ? 'SUCCESS' : 'FAILED';
      const a = (row.actionType ?? row.action_type ?? '').toUpperCase();
      if (/FAILED|THROTTLED|DISCONNECTED/.test(a)) return 'FAILED';
      if (a === 'POWER_OFF') return 'UNKNOWN';
      return 'SUCCESS';
    })(),
    description: row.description ?? '',
    ip_address: row.ipAddress ?? row.ip_address ?? '',
    created_at: row.createdAt ?? row.created_at,
    metadata: row.metadata ?? null, // structured payload (vmid, vmName, environmentId, …)
  };
}

export default function AuditManagement() {
  const pushToast = useUI((s) => s.pushToast);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('All Actions');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [actionTypesList, setActionTypesList] = useState([]);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);   // custom Action-type dropdown
  const actionMenuRef = useRef(null);
  // One search box, scoped: the same input filters free-text, Inventory ID, or VM ID depending on
  // searchScope — instead of three separate boxes. (Inventory ID = exact per-instance via metadata.)
  const [searchScope, setSearchScope] = useState('all'); // 'all' | 'inventory_id' | 'vmid'

  const loadLogs = useCallback(async ({ silent } = {}) => {
    if (!silent) setLoading(true);
    try {
      const params = { page, per_page: perPage };
      const q = searchQuery.trim();
      if (q) {
        // The scope decides which backend filter the one search box drives.
        if (searchScope === 'inventory_id') params.inventory_id = q;
        else if (searchScope === 'vmid') params.vmid = q;
        else params.search = q;
      }
      if (actionFilter !== 'All Actions') params.action_type = actionFilter;
      if (dateStart) params.date_start = dateStart;
      if (dateEnd) params.date_end = dateEnd;
      const resp = await api.get('/audit-logs', { params });
      setLogs((resp?.data || []).map(normalizeLog));
      setTotal(resp?.total ?? 0);
      setLastPage(resp?.lastPage ?? 1);
      if (Array.isArray(resp?.actionTypes)) setActionTypesList(resp.actionTypes);
    } catch (e) {
      if (!silent) pushToast({ kind: 'error', message: e.message || 'Failed to load audit logs.' });
    } finally {
      if (!silent) setLoading(false);
    }
  }, [page, perPage, searchQuery, searchScope, actionFilter, dateStart, dateEnd, pushToast]);

  // Any filter change resets to page 1 so we never sit on an out-of-range page.
  useEffect(() => { setPage(1); }, [searchQuery, searchScope, actionFilter, perPage, dateStart, dateEnd]);

  useEffect(() => {
    const t = setTimeout(() => loadLogs(), 250); // debounce search typing / param changes
    return () => clearTimeout(t);
  }, [loadLogs]);

  // Auto-refresh while viewing the newest page (page 1, no date filter) so new entries appear
  // without leaving the menu. Skipped on deeper pages / filtered ranges to avoid disrupting browsing.
  useEffect(() => {
    if (page !== 1 || dateStart || dateEnd) return undefined;
    const id = setInterval(() => { if (!document.hidden) loadLogs({ silent: true }); }, 5000);
    return () => clearInterval(id);
  }, [page, dateStart, dateEnd, loadLogs]);

  // Close the custom Action-type dropdown on any outside click.
  useEffect(() => {
    if (!actionMenuOpen) return undefined;
    const onDown = (e) => { if (actionMenuRef.current && !actionMenuRef.current.contains(e.target)) setActionMenuOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [actionMenuOpen]);

  // Download State
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [downloadDates, setDownloadDates] = useState({ start: '', end: '' });
  
  // Discard Confirmation State & Refs
  const [discardConfirmTarget, setDiscardConfirmTarget] = useState(false);
  const downloadModalOpenRef = useRef(false);
  const isDirtyRef = useRef(false);
  const discardConfirmRef = useRef(false);

  useEffect(() => {
    discardConfirmRef.current = discardConfirmTarget;
  }, [discardConfirmTarget]);

  useEffect(() => {
    downloadModalOpenRef.current = downloadModalOpen;
    if (downloadModalOpen) {
      isDirtyRef.current = downloadDates.start !== '' || downloadDates.end !== '';
    } else {
      isDirtyRef.current = false;
    }
  });

  const handleCancelModal = () => {
    if (downloadModalOpenRef.current && isDirtyRef.current) {
      setDiscardConfirmTarget(true);
    } else {
      setDownloadModalOpen(false);
      setDownloadDates({ start: '', end: '' });
    }
  };

  // Handle ESC key to close all popups
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (discardConfirmRef.current) {
          setDiscardConfirmTarget(false);
          return;
        }

        if (downloadModalOpenRef.current && isDirtyRef.current) {
          setDiscardConfirmTarget(true);
          return;
        }

        setDownloadModalOpen(false);
        setDownloadDates({ start: '', end: '' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Resize State
  const [colWidths, setColWidths] = useState({});
  const handleResizeStart = (e, colKey) => {
    e.preventDefault();
    const startX = e.pageX;
    const startWidth = colWidths[colKey] || e.target.parentElement.offsetWidth;
    const handleMouseMove = (moveEvent) => {
      const newWidth = Math.max(80, startWidth + (moveEvent.pageX - startX));
      setColWidths(prev => ({ ...prev, [colKey]: newWidth }));
    };
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Full action-type vocabulary from the server (not limited to the current page); already sorted.
  const actionTypes = useMemo(() => ['All Actions', ...actionTypesList], [actionTypesList]);

  // Server already filters, sorts (newest first) and paginates — render the page as-is.
  const pageStart = total === 0 ? 0 : (page - 1) * perPage + 1;
  const pageEnd = (page - 1) * perPage + logs.length;

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).format(d);
  };

  const getActionColor = (action) => {
    if (action.includes('APPROVE') || action.includes('CREATE')) return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20';
    if (action.includes('REJECT') || action.includes('DELETE') || action.includes('BREACH')) return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20';
    if (action.includes('REQUEST') || action.includes('RETRY')) return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20';
    return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20';
  };

  // Server-side CSV export — respects the active filters + RBAC visibility.
  const handleDownloadSubmit = async () => {
    if (!downloadDates.start || !downloadDates.end) return;

    const params = new URLSearchParams();
    const q = searchQuery.trim();
    if (q) {
      if (searchScope === 'inventory_id') params.set('inventory_id', q);
      else if (searchScope === 'vmid') params.set('vmid', q);
      else params.set('search', q);
    }
    if (actionFilter !== 'All Actions') params.set('action_type', actionFilter);
    params.set('date_start', downloadDates.start);
    params.set('date_end', downloadDates.end);

    const base = import.meta.env.VITE_API_BASE_URL || '/api';
    try {
      // Cookie auth: send the session cookie with the download (GET → no CSRF needed).
      const resp = await fetch(`${base}/audit-logs/export?${params.toString()}`, {
        credentials: 'include',
      });
      if (!resp.ok) throw new Error('Export failed');
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `audit_trail_${downloadDates.start}_to_${downloadDates.end}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      pushToast({ kind: 'error', message: e.message || 'Export failed.' });
    }

    setDownloadModalOpen(false);
    setDownloadDates({ start: '', end: '' });
  };

  return (
    <div className="flex flex-col gap-6 h-full animate-in slide-in-from-right-8 fade-in duration-300 fill-mode-both items-start w-full">
      {/* Header Summary */}
      <div className="shrink-0 w-full bg-white dark:bg-card border border-gray-200 dark:border-theme rounded-card p-4 shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <FileText size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-zinc-100">Audit Trail</h1>
            <p className="text-[13px] text-slate-500 dark:text-zinc-400 mt-0.5">Track and trace system-wide user actions and workflows.</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex flex-col items-end">
            <span className="text-slate-500 dark:text-zinc-400 text-[11px] uppercase font-semibold tracking-wider">Total Records</span>
            <span className="font-bold text-slate-800 dark:text-zinc-200">{total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full flex flex-col bg-white dark:bg-card border border-gray-200 dark:border-theme rounded-card shadow-card overflow-hidden">
        {/* Toolbar */}
        <div className="p-3 border-b border-gray-100 dark:border-theme flex items-center gap-2 bg-slate-50/50 dark:bg-zinc-800/20 shrink-0">
          {/* Scoped search (flex-1) — the left dropdown chooses what to match (text / Inventory ID / VM ID). */}
          <div className="flex items-stretch flex-1 min-w-0 rounded-input border border-gray-200 dark:border-theme bg-white dark:bg-surface focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/20 overflow-hidden">
            <div className="relative shrink-0">
              <select
                value={searchScope}
                onChange={(e) => setSearchScope(e.target.value)}
                title="Choose what to search"
                className="h-full pl-3 pr-7 py-2 text-[12px] font-semibold text-slate-600 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-800/50 border-r border-gray-200 dark:border-theme appearance-none cursor-pointer focus:outline-none"
              >
                <option value="all">All fields</option>
                <option value="inventory_id">Inventory ID</option>
                <option value="vmid">VM ID (vmid)</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
            </div>
            <div className="relative flex-1 min-w-0">
              {searchScope === 'inventory_id'
                ? <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                : searchScope === 'vmid'
                  ? <Server className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  : <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />}
              <input
                type="text"
                inputMode={searchScope === 'all' ? 'text' : 'numeric'}
                placeholder={
                  searchScope === 'inventory_id' ? 'Search by Inventory ID…'
                    : searchScope === 'vmid' ? 'Search by VM ID (vmid)…'
                      : 'Search user, resource, or description…'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-[13px] bg-transparent text-slate-800 dark:text-zinc-200 focus:outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} title="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500"><X size={14} /></button>
              )}
            </div>
          </div>

          {/* Date range (compact) */}
          <div className="flex items-center gap-1 shrink-0">
            <input
              type="date"
              value={dateStart}
              max={dateEnd || undefined}
              onChange={(e) => setDateStart(e.target.value)}
              title="From date"
              className="px-2 py-[7px] text-[11px] border border-gray-200 dark:border-theme rounded-input bg-white dark:bg-surface text-slate-600 dark:text-zinc-300 focus:outline-none focus:border-indigo-500"
            />
            <span className="text-slate-400 text-[11px]">–</span>
            <input
              type="date"
              value={dateEnd}
              min={dateStart || undefined}
              onChange={(e) => setDateEnd(e.target.value)}
              title="To date"
              className="px-2 py-[7px] text-[11px] border border-gray-200 dark:border-theme rounded-input bg-white dark:bg-surface text-slate-600 dark:text-zinc-300 focus:outline-none focus:border-indigo-500"
            />
            {(dateStart || dateEnd) && (
              <button onClick={() => { setDateStart(''); setDateEnd(''); }} title="Clear dates" className="p-1 text-slate-400 hover:text-rose-500"><X size={13} /></button>
            )}
          </div>

          {/* Action type (compact) — custom dropdown: a native <select> popup auto-widens to the
              longest option and spilled past the panel into the far-right scrollbar. */}
          <div className="relative shrink-0" ref={actionMenuRef}>
            <Filter className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 z-10" size={13} />
            <button
              type="button"
              onClick={() => setActionMenuOpen((o) => !o)}
              title="Filter by action type"
              className="flex items-center justify-between gap-1 pl-7 pr-2 py-[7px] w-[150px] text-[12px] border border-gray-200 dark:border-theme rounded-input bg-white dark:bg-surface text-slate-600 dark:text-zinc-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <span className="truncate text-left">{actionFilter}</span>
              <ChevronDown className={`shrink-0 text-slate-400 transition-transform ${actionMenuOpen ? 'rotate-180' : ''}`} size={12} />
            </button>
            {actionMenuOpen && (
              // right-0 → the list aligns to the button's RIGHT edge and grows LEFT (into the search
              // area, which has room), so a long action name can never overflow into the scrollbar.
              <ul
                role="listbox"
                className="absolute right-0 top-full mt-1 z-30 w-max min-w-[150px] max-w-[280px] max-h-64 overflow-y-auto custom-scrollbar bg-white dark:bg-card border border-gray-200 dark:border-theme rounded-input shadow-modal py-1"
              >
                {actionTypes.map((type) => (
                  <li
                    key={type}
                    role="option"
                    aria-selected={type === actionFilter}
                    onClick={() => { setActionFilter(type); setActionMenuOpen(false); }}
                    className={`px-3 py-1.5 text-[12px] cursor-pointer whitespace-nowrap hover:bg-indigo-50 dark:hover:bg-indigo-900/20 ${type === actionFilter ? 'font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10' : 'text-slate-600 dark:text-zinc-300'}`}
                  >
                    {type}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Download (icon only) */}
          <button
            onClick={() => setDownloadModalOpen(true)}
            title="Download CSV"
            aria-label="Download CSV"
            className="shrink-0 p-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-input transition-opacity shadow-sm shadow-indigo-500/20"
          >
            <Download size={16} />
          </button>
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-auto custom-scrollbar relative">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="sticky top-0 bg-slate-50 dark:bg-zinc-800/80 backdrop-blur-sm z-10 shadow-sm">
              <tr>
                <ResizableTh width={colWidths.time} onResize={(e) => handleResizeStart(e, 'time')} className="px-4 py-3 text-[12px] font-bold text-slate-600 dark:text-zinc-300 border-b border-gray-200 dark:border-theme">
                  Date / Time
                </ResizableTh>
                <ResizableTh width={colWidths.user} onResize={(e) => handleResizeStart(e, 'user')} className="px-4 py-3 text-[12px] font-bold text-slate-600 dark:text-zinc-300 border-b border-gray-200 dark:border-theme">
                  User
                </ResizableTh>
                <ResizableTh width={colWidths.action} onResize={(e) => handleResizeStart(e, 'action')} className="px-4 py-3 text-[12px] font-bold text-slate-600 dark:text-zinc-300 border-b border-gray-200 dark:border-theme">
                  Action Type
                </ResizableTh>
                <ResizableTh width={colWidths.status} onResize={(e) => handleResizeStart(e, 'status')} className="px-4 py-3 text-[12px] font-bold text-slate-600 dark:text-zinc-300 border-b border-gray-200 dark:border-theme">
                  Status
                </ResizableTh>
                <ResizableTh width={colWidths.description} onResize={(e) => handleResizeStart(e, 'description')} className="px-4 py-3 text-[12px] font-bold text-slate-600 dark:text-zinc-300 border-b border-gray-200 dark:border-theme">
                  Description
                </ResizableTh>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-theme">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/30 transition-opacity group">
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-2 text-[13px] text-slate-600 dark:text-zinc-300 whitespace-nowrap">
                        <Calendar size={13} className="text-slate-400" />
                        {formatDate(log.created_at)}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-col">
                        <span className="text-[13px] font-bold text-slate-800 dark:text-zinc-200">{log.user_name}</span>
                        <span className="text-[11px] text-slate-500 font-mono mt-0.5">ID: {log.user_id}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className={`inline-flex items-center px-2 py-1 text-[11px] font-bold rounded border ${getActionColor(log.action_type)} whitespace-nowrap`}>
                        {log.action_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className={`inline-flex items-center px-2 py-1 text-[10px] font-bold rounded border whitespace-nowrap ${
                        log.status === 'SUCCESS' ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' :
                        log.status === 'FAILED' ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20' :
                        'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className="text-[13px] text-slate-700 dark:text-zinc-300 leading-relaxed block break-words">
                        {log.description}
                      </span>
                      {(log.metadata?.inventoryId ?? log.metadata?.vmid) != null && (
                        <button
                          onClick={() => {
                            // Drive the scoped search box: prefer the unique inventory_id so we never
                            // mix two VMs that happened to share a recycled vmid.
                            if (log.metadata?.inventoryId != null) { setSearchScope('inventory_id'); setSearchQuery(String(log.metadata.inventoryId)); }
                            else { setSearchScope('vmid'); setSearchQuery(String(log.metadata.vmid)); }
                          }}
                          title="Show this exact VM instance's full history"
                          className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                        >
                          <Server size={10} /> {log.metadata?.vmid ? `vmid ${log.metadata.vmid}` : `#${log.metadata.inventoryId}`}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-4 py-12 text-center text-[13px] text-slate-500 dark:text-zinc-400">
                    No audit records found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div className="p-3 border-t border-gray-100 dark:border-theme flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 dark:bg-zinc-800/20 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-[12px] text-slate-500 dark:text-zinc-400 font-medium">
              {total > 0 ? `Showing ${pageStart.toLocaleString()}–${pageEnd.toLocaleString()} of ${total.toLocaleString()}` : 'No records'}
            </span>
            {/* Page-size selector */}
            <div className="flex items-center gap-1.5 text-[12px] text-slate-500 dark:text-zinc-400">
              <span>Rows:</span>
              <select
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
                className="px-2 py-1 text-[12px] border border-gray-200 dark:border-theme rounded-input bg-white dark:bg-surface text-slate-700 dark:text-zinc-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {[25, 50, 100, 200].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-slate-500 dark:text-zinc-400">Page {page} of {lastPage}</span>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="px-3 py-1.5 text-[12px] font-medium text-slate-600 dark:text-zinc-300 bg-white dark:bg-card border border-gray-200 dark:border-theme rounded hover:bg-slate-50 dark:hover:bg-zinc-700 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              disabled={page >= lastPage || loading}
              className="px-3 py-1.5 text-[12px] font-medium text-slate-600 dark:text-zinc-300 bg-white dark:bg-card border border-gray-200 dark:border-theme rounded hover:bg-slate-50 dark:hover:bg-zinc-700 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Download Modal */}
      {downloadModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-card w-[400px] rounded-modal shadow-modal overflow-hidden border border-gray-100 dark:border-theme animate-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-theme flex items-center justify-between">
              <h3 className="text-[15px] font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <Download size={16} className="text-indigo-500" /> Download Audit Log
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-gray-600 dark:text-gray-300 mb-2">Start Date <span className="text-rose-500">*</span></label>
                <input 
                  type="date"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-theme rounded-input text-[13px] bg-white dark:bg-surface dark:text-gray-100 outline-none focus:ring-1 focus:border-indigo-400 focus:ring-indigo-500/20"
                  value={downloadDates.start}
                  onChange={e => setDownloadDates({...downloadDates, start: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-600 dark:text-gray-300 mb-2">End Date <span className="text-rose-500">*</span></label>
                <input 
                  type="date"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-theme rounded-input text-[13px] bg-white dark:bg-surface dark:text-gray-100 outline-none focus:ring-1 focus:border-indigo-400 focus:ring-indigo-500/20"
                  value={downloadDates.end}
                  onChange={e => setDownloadDates({...downloadDates, end: e.target.value})}
                />
              </div>
            </div>
            <div className="px-5 py-4 bg-transparent dark:bg-transparent/50 border-t border-gray-100 dark:border-theme flex justify-end gap-3">
              <button 
                onClick={handleCancelModal}
                className="px-4 py-2 text-[13px] font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-card border border-gray-200 dark:border-theme rounded-input hover:bg-gray-100 dark:hover:bg-zinc-700/50 transition-opacity"
              >
                Cancel
              </button>
              <button 
                onClick={handleDownloadSubmit}
                disabled={!downloadDates.start || !downloadDates.end}
                className="px-4 py-2 text-[13px] font-medium text-white bg-indigo-500 hover:bg-indigo-600 border border-indigo-600 shadow-indigo-500/20 rounded-input transition-opacity shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Download CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discard Confirmation Modal */}
      {discardConfirmTarget && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-gray-900/60 dark:bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-card w-[400px] rounded-modal shadow-modal overflow-hidden border border-gray-100 dark:border-theme animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mx-auto mb-4 text-rose-500">
                <AlertCircle size={24} />
              </div>
              <h3 className="text-[16px] font-bold text-gray-800 dark:text-gray-100 mb-2">Discard Changes?</h3>
              <p className="text-[13px] text-gray-600 dark:text-gray-400">
                You have unsaved changes. Are you sure you want to discard them?
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 dark:bg-zinc-800/50 border-t border-gray-100 dark:border-theme flex items-center justify-center gap-3">
              <button 
                onClick={() => setDiscardConfirmTarget(false)}
                className="px-4 py-2 w-full text-[13px] font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-card border border-gray-200 dark:border-theme rounded-input hover:bg-gray-100 dark:hover:bg-zinc-700/50 transition-opacity"
              >
                No, keep editing
              </button>
              <button 
                onClick={() => {
                  setDownloadModalOpen(false);
                  setDownloadDates({ start: '', end: '' });
                  setDiscardConfirmTarget(false);
                }}
                className="px-4 py-2 w-full text-[13px] font-medium text-white bg-rose-500 border border-rose-600 rounded-input hover:bg-rose-600 shadow-sm transition-opacity"
              >
                Yes, discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
