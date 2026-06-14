import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, RefreshCw, Check, X, ChevronRight, ChevronDown, CheckSquare, Square, Filter, RotateCcw, FileEdit, AlertCircle } from 'lucide-react';
import api from '../lib/api';
import { getCached, setCached } from '../lib/liveCache';
import { useUI } from '../stores/uiStore';
import { useUserContext } from '../contexts/UserContext';
import { canApprove } from '../lib/rbac';

const REQUEST_TYPE_LABEL = {
  PROVISION: 'Create New VM',
  RENEWAL: 'Extend Period',
  PERMANENT: 'Make Permanent',
  RESIZE: 'Edit Resources',
  EDIT_RESOURCES: 'Edit Resources',
  ADD_DISK: 'Add Data Disk',
  DESTROY: 'Delete VM',
};

// Map an API approval row onto the field names this page renders.
function normalizeRequest(row) {
  const history = (row.actionType && row.actionDate)
    ? [{ action_type: row.actionType, reason: row.actionReason, action_by: row.approverName, action_date: row.actionDate }]
    : (row.actionHistory || []);
  return {
    ...row,
    type: REQUEST_TYPE_LABEL[row.requestType] || row.type || row.requestType,
    vmName: row.vmName ?? '—',
    instanceCount: row.instanceCount ?? null,   // PROVISION only; null for lifecycle requests
    os: row.catalogName ?? row.os ?? '—',
    environment: row.environmentName ?? row.environment ?? '—',
    tier: row.tierName ?? row.tier ?? '—',
    provider: row.providerName ?? row.provider ?? '—',
    status: row.status,
    expiry: row.requestedExpiry ?? row.expiry ?? '—',
    requestDate: row.createdAt ?? row.requestDate,
    actionDate: row.actionDate ?? null,
    requestedBy: row.requesterName ?? row.requestedBy ?? '—',
    department: row.groupName ?? row.department ?? '—',
    actionBy: row.approverName ?? row.actionBy ?? null,
    description: row.description ?? '',
    actionHistory: history,
  };
}

// Short date like "07 Jun 2026" for compact table cells.
function formatShortDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getDate().toString().padStart(2, '0')} ${d.toLocaleString('en-US', { month: 'short' })} ${d.getFullYear()}`;
}

// Color-coded resource lines per request type. Net-new changes are green; existing/baseline gray.
// Returns { lines: [{ text, cls }] } so the cell can render a scannable multi-line breakdown.
const GREEN = 'text-emerald-600 dark:text-emerald-400 font-semibold';
const GRAY = 'text-gray-500 dark:text-gray-400';
const PLAIN = 'text-gray-700 dark:text-gray-300 font-medium';
function resourceDisplay(req) {
  const p = req.payload || {};
  const baseDisk = (req.requestType === 'PROVISION' && req.bootDiskGb) ? req.bootDiskGb : req.disk;
  const cpuRamLine = () => {
    const cpu = p.cpu ?? req.cpu;
    const ram = p.ramMb != null ? Math.round(p.ramMb / 1024) : req.ram;
    return { text: `${cpu ?? '—'} CPU / ${ram ?? '—'} GB RAM`, cls: GREEN };
  };
  switch (req.requestType) {
    case 'EDIT_RESOURCES': {
      const lines = [];
      if (p.cpu != null || p.ramMb != null) lines.push(cpuRamLine());
      (p.disks || []).forEach((d) => lines.push({ text: `+${d.sizeGb} GB Data Disk`, cls: GREEN }));
      lines.push({ text: `Boot ${baseDisk ?? '—'} GB`, cls: GRAY });
      return { lines };
    }
    case 'RESIZE':
      return { lines: [cpuRamLine(), { text: 'New resize target', cls: GRAY }] };
    case 'ADD_DISK':
      return { lines: [{ text: `+${p.sizeGb ?? '—'} GB Data Disk`, cls: GREEN }, { text: `Boot ${baseDisk ?? '—'} GB`, cls: GRAY }] };
    default:
      return { lines: [{ text: `${req.cpu ?? '—'} CPU / ${req.ram ?? '—'} GB RAM`, cls: PLAIN }, { text: `${baseDisk ?? '—'} GB Disk`, cls: GRAY }] };
  }
}

// Type-column label: "Edit Resources" + a bracketed scope derived from the bundle payload so a
// manager can see what's inside at a glance.
function typeDisplay(req) {
  if (req.requestType === 'EDIT_RESOURCES') {
    const p = req.payload || {};
    const scope = [];
    if (p.cpu != null || p.ramMb != null) scope.push('Extend CPU/RAM');
    if ((p.disks || []).length) scope.push('Add Disk');
    return { label: 'Edit Resources', scope: scope.length ? `[${scope.join(', ')}]` : '' };
  }
  return { label: req.type, scope: '' };
}

// Expiry shown per request type: PERMANENT/RENEWAL from the request itself, lifecycle
// edits from the VM's current expiry, PROVISION from the requested date or env policy.
function expiryDisplay(req) {
  const p = req.payload || {};
  switch (req.requestType) {
    case 'PERMANENT':
      return 'Permanent';
    case 'RENEWAL':
      return `+${p.extensionPeriod || '7 Days'}`;
    case 'RESIZE':
    case 'ADD_DISK':
    case 'DESTROY':
      return formatShortDate(req.currentExpiry) || 'Lifetime';
    case 'PROVISION':
    default:
      if (req.requestedExpiry) return formatShortDate(req.requestedExpiry);
      if (!req.expiryType || req.expiryType === 'lifetime' || !req.expiryValue) return 'Lifetime';
      return `${req.expiryValue} ${req.expiryType}`;
  }
}

// Shimmer placeholder rows shown during the very first load so the table never
// flashes its empty-state ("No requests found") before the data arrives.
function SkeletonRows({ cols, rows = 6 }) {
  return Array.from({ length: rows }).map((_, i) => (
    <tr key={`sk-${i}`} className="animate-pulse">
      <td colSpan={cols} className="px-4 py-4">
        <div className="flex items-center gap-4">
          <div className="h-4 w-4 rounded bg-gray-100 dark:bg-slate-700/40" />
          <div className="h-4 flex-1 rounded bg-gray-100 dark:bg-slate-700/40" />
          <div className="h-4 w-28 rounded bg-gray-100 dark:bg-slate-700/40" />
          <div className="h-4 w-24 rounded bg-gray-100 dark:bg-slate-700/40" />
          <div className="h-4 w-20 rounded bg-gray-100 dark:bg-slate-700/40" />
          <div className="h-4 w-16 rounded bg-gray-100 dark:bg-slate-700/40" />
        </div>
      </td>
    </tr>
  ));
}

export default function Approvals() {
  const navigate = useNavigate();
  const pushToast = useUI((s) => s.pushToast);
  const { currentUser } = useUserContext();
  const canAct = canApprove(currentUser); // Manager/Admin can approve/reject/revert; users are read-only
  // Seed from the app-startup cache so the table paints instantly on open; the
  // mount fetch + polling below still refresh it. Skeleton only shows on a cold start.
  const [requests, setRequests] = useState(() => (getCached('/approvals') || []).map(normalizeRequest));
  const [loading, setLoading] = useState(() => !getCached('/approvals'));

  // `silent` (background polling / manual refresh) skips the full-page loading
  // state and the error toast, so the table just updates in place with no flash.
  const loadApprovals = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const rows = await api.get('/approvals');
      setCached('/approvals', rows || []);
      setRequests((rows || []).map(normalizeRequest));
    } catch (e) {
      if (!silent) pushToast({ kind: 'error', message: e.message || 'Failed to load approvals.' });
    } finally {
      if (!silent) setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => { loadApprovals(); }, [loadApprovals]);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [envFilter, setEnvFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  // Sort by a date column; click a header to toggle desc/asc (default: newest request first).
  const [sortConfig, setSortConfig] = useState({ field: 'requestDate', dir: 'desc' });
  const requestSort = (field) =>
    setSortConfig((prev) => ({ field, dir: prev.field === field && prev.dir === 'desc' ? 'asc' : 'desc' }));
  
  // UI State
  const [expandedRows, setExpandedRows] = useState({});
  const [selectedRows, setSelectedRows] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Action Modal State
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState('Approve'); // 'Approve', 'Reject', 'Revert'
  const [actionReason, setActionReason] = useState('');
  const [actionTargetIds, setActionTargetIds] = useState([]);
  
  // Discard Confirmation State & Refs
  const [discardConfirmTarget, setDiscardConfirmTarget] = useState(false);
  const actionModalOpenRef = useRef(false);
  const isDirtyRef = useRef(false);
  const discardConfirmRef = useRef(false);

  useEffect(() => {
    discardConfirmRef.current = discardConfirmTarget;
  }, [discardConfirmTarget]);

  useEffect(() => {
    actionModalOpenRef.current = actionModalOpen;
    if (actionModalOpen) {
      isDirtyRef.current = actionReason.trim() !== '';
    } else {
      isDirtyRef.current = false;
    }
  });

  const handleCancelModal = () => {
    if (actionModalOpenRef.current && isDirtyRef.current) {
      setDiscardConfirmTarget(true);
    } else {
      setActionModalOpen(false);
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

        if (actionModalOpenRef.current && isDirtyRef.current) {
          setDiscardConfirmTarget(true);
          return;
        }

        setActionModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Live auto-refresh: silently re-fetch every 7s so newly submitted / actioned
  // requests appear without a manual refresh. Pauses while the tab is hidden or
  // the action modal is open (so a background update can't disrupt an in-flight action).
  useEffect(() => {
    const t = setInterval(() => {
      if (document.hidden || actionModalOpenRef.current) return;
      loadApprovals({ silent: true });
    }, 7000);
    return () => clearInterval(t);
  }, [loadApprovals]);

  // Resize State
  const [colWidths, setColWidths] = useState({});
  const handleResizeStart = (e, colKey) => {
    e.preventDefault();
    const startX = e.clientX;
    const th = e.target.closest('th');
    const startWidth = th.getBoundingClientRect().width;
    const handleMouseMove = (moveEvent) => {
      const newWidth = Math.max(50, startWidth + (moveEvent.clientX - startX));
      setColWidths(prev => ({ ...prev, [colKey]: newWidth }));
    };
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Computed Data
  const totalRequests = requests.length;
  const pendingRequests = requests.filter(r => r.status === 'Pending').length;
  const approvedRequests = requests.filter(r => r.status === 'Approved').length;
  const rejectedRequests = requests.filter(r => r.status === 'Rejected').length;
  const needActionRequests = requests.filter(r => r.status === 'Reverted').length;

  const filteredRequests = useMemo(() => {
    const filtered = requests.filter(req => {
      const matchSearch = searchTerm === '' ||
        req.vmName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.requestedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.os.toLowerCase().includes(searchTerm.toLowerCase());

      const matchEnv = envFilter === 'All' || req.environment === envFilter;
      const matchStatus = statusFilter === 'All' || req.status === statusFilter;

      return matchSearch && matchEnv && matchStatus;
    });

    // Sort by the chosen date column; nulls (e.g. no action date yet) sort last.
    const dir = sortConfig.dir === 'asc' ? 1 : -1;
    return filtered.sort((a, b) => {
      const ta = a[sortConfig.field] ? new Date(a[sortConfig.field]).getTime() : null;
      const tb = b[sortConfig.field] ? new Date(b[sortConfig.field]).getTime() : null;
      if (ta === null && tb === null) return 0;
      if (ta === null) return 1;
      if (tb === null) return -1;
      return (ta - tb) * dir;
    });
  }, [requests, searchTerm, envFilter, statusFilter, sortConfig]);

  // Handlers
  const toggleExpand = (id) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSelect = (id) => {
    setSelectedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedRows.length === filteredRequests.length && filteredRequests.length > 0) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredRequests.map(r => r.id));
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadApprovals({ silent: true });
    setIsRefreshing(false);
  };

  const openActionModal = (type, ids = null) => {
    setActionType(type);
    setActionTargetIds(ids ? [ids] : selectedRows);
    setActionReason('');
    setActionModalOpen(true);
  };

  const executeWorkflowAction = async () => {
    if (!actionReason.trim()) {
      return pushToast({ kind: 'error', message: 'Reason is required.' });
    }

    const endpoint = { Approve: 'approve', Reject: 'reject', Revert: 'revert' }[actionType];
    // Revert is PROVISION-only ("send back to draft"); never revert a live-asset change request.
    const targets = requests.filter((r) =>
      actionTargetIds.includes(r.id) && r.status === 'Pending'
      && (actionType !== 'Revert' || r.requestType === 'PROVISION'));

    try {
      await Promise.all(
        targets.map((req) => api.post(`/approvals/${req.id}/${endpoint}`, { actionReason }))
      );
      pushToast({ kind: 'success', message: `${actionType} submitted.` });
      setActionModalOpen(false);
      setActionReason('');
      setActionTargetIds([]);
      setSelectedRows([]);
      await loadApprovals();
    } catch (e) {
      pushToast({ kind: 'error', message: e.message || 'Action failed.' });
    }
  };

  const executeEdit = (id) => {
    const req = requests.find(r => r.id === id);
    if (!req) return;

    // Reverted PROVISION requests carry the original IDs; pre-fill the wizard with them.
    // requestId tells the wizard to RESUBMIT this same request (update in place), not create a new one.
    navigate('/request-vm', {
      state: {
        requestId: req.referenceId,
        environmentId: req.environmentId,
        providerId: req.providerId,
        nodeId: req.nodeId,
        catalogId: req.catalogId,
        tierId: req.tierId,
        networkId: req.networkId,
        datastoreId: req.datastoreId,
        vmPrefix: req.vmName,
        vmCount: req.instanceCount,
        description: req.description,
      },
    });
  };

  // Format Date helper
  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return (
      <>
        <div>{`${day}-${month}-${year}`}</div>
        <div className="text-gray-400 dark:text-gray-500 text-[11px]">{`${hours}:${minutes}`}</div>
      </>
    );
  };

  return (
    <div className="animate-in fade-in duration-300 relative h-auto flex flex-col">
      {/* Action Modal */}
      {actionModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-card w-full max-w-[450px] rounded-modal shadow-modal overflow-hidden border border-gray-200 dark:border-theme animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="shrink-0 flex items-center justify-between p-4 border-b border-gray-100 dark:border-theme">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                {actionType === 'Approve' ? <Check size={18} className="text-emerald-500" /> : 
                 actionType === 'Reject' ? <X size={18} className="text-rose-500" /> : 
                 <RotateCcw size={18} className="text-orange-500" />}
                {actionType} Request
              </h3>
              <button onClick={handleCancelModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-theme rounded-md p-4">
                <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-2">Reason for {actionType.toLowerCase()} <span className="text-rose-500">*</span></label>
                <textarea 
                  className={`w-full px-3 py-2 border rounded-md text-sm bg-white dark:bg-page text-slate-900 dark:text-slate-100 outline-none focus:ring-2 transition-colors min-h-[100px] resize-none
                    ${actionType === 'Approve' ? 'border-slate-300 dark:border-theme focus:border-emerald-500 focus:ring-emerald-500/50' : 
                      actionType === 'Reject' ? 'border-slate-300 dark:border-theme focus:border-rose-500 focus:ring-rose-500/50' : 
                      'border-slate-300 dark:border-theme focus:border-orange-500 focus:ring-orange-500/50'}`}
                  placeholder={`Please provide a clear reason for the ${actionType.toLowerCase()}...`}
                  value={actionReason}
                  onChange={e => setActionReason(e.target.value)}
                />
              </div>
            </div>
            <div className="shrink-0 px-5 py-4 border-t border-gray-100 dark:border-theme flex items-center justify-end gap-3 bg-white dark:bg-card">
              <button 
                onClick={handleCancelModal}
                className="px-4 py-2 text-[13px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-input transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={executeWorkflowAction}
                className={`px-4 py-2 text-[13px] font-medium text-white rounded-input transition-colors shadow-sm
                  ${actionType === 'Approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 
                    actionType === 'Reject' ? 'bg-rose-600 hover:bg-rose-700' : 
                    'bg-orange-600 hover:bg-orange-700'}`}
              >
                Confirm {actionType}
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
                You have an unsaved reason. Are you sure you want to discard it?
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-theme flex items-center justify-center gap-3">
              <button 
                onClick={() => setDiscardConfirmTarget(false)}
                className="px-4 py-2 w-full text-[13px] font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-card border border-gray-200 dark:border-theme rounded-input hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors"
              >
                No, keep editing
              </button>
              <button 
                onClick={() => {
                  setActionModalOpen(false);
                  setDiscardConfirmTarget(false);
                }}
                className="px-4 py-2 w-full text-[13px] font-medium text-white bg-rose-500 border border-rose-600 rounded-input hover:bg-rose-600 shadow-sm transition-colors"
              >
                Yes, discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Summary Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 shrink-0">
        <div 
          onClick={() => setStatusFilter('All')}
          className={`bg-white dark:bg-card rounded-card p-5 border shadow-sm cursor-pointer transition-[transform,box-shadow] hover:-translate-y-0.5 ${statusFilter === 'All' ? 'border-gray-400 dark:border-gray-500 shadow-md ring-1 ring-gray-400/30' : 'border-gray-100 dark:border-theme hover:shadow-md'}`}
        >
          <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Total Requests</div>
          <div className="text-[28px] font-bold text-gray-800 dark:text-gray-100">{totalRequests}</div>
          <div className="text-[12px] text-gray-400 font-medium mt-1">All lifecycle states</div>
        </div>
        
        <div 
          onClick={() => setStatusFilter('Pending')}
          className={`bg-white dark:bg-card rounded-card p-5 border shadow-sm cursor-pointer transition-[transform,box-shadow] hover:-translate-y-0.5 ${statusFilter === 'Pending' ? 'border-amber-400 dark:border-amber-500 shadow-md shadow-amber-500/10 ring-1 ring-amber-400/30' : 'border-gray-100 dark:border-theme hover:shadow-md'}`}
        >
          <div className="text-[11px] font-bold text-amber-500 dark:text-amber-400 uppercase tracking-wider mb-2">Pending</div>
          <div className="text-[28px] font-bold text-gray-800 dark:text-gray-100">{pendingRequests}</div>
          <div className="text-[12px] text-amber-600 dark:text-amber-400/80 font-medium mt-1">Awaiting review</div>
        </div>
        
        <div 
          onClick={() => setStatusFilter('Approved')}
          className={`bg-white dark:bg-card rounded-card p-5 border shadow-sm cursor-pointer transition-[transform,box-shadow] hover:-translate-y-0.5 ${statusFilter === 'Approved' ? 'border-emerald-400 dark:border-emerald-500 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-400/30' : 'border-gray-100 dark:border-theme hover:shadow-md'}`}
        >
          <div className="text-[11px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-wider mb-2">Approved</div>
          <div className="text-[28px] font-bold text-gray-800 dark:text-gray-100">{approvedRequests}</div>
          <div className="text-[12px] text-emerald-600 dark:text-emerald-400/80 font-medium mt-1">Processed</div>
        </div>
        
        <div 
          onClick={() => setStatusFilter('Rejected')}
          className={`bg-white dark:bg-card rounded-card p-5 border shadow-sm cursor-pointer transition-[transform,box-shadow] hover:-translate-y-0.5 ${statusFilter === 'Rejected' ? 'border-rose-400 dark:border-rose-500 shadow-md shadow-rose-500/10 ring-1 ring-rose-400/30' : 'border-gray-100 dark:border-theme hover:shadow-md'}`}
        >
          <div className="text-[11px] font-bold text-rose-500 dark:text-rose-400 uppercase tracking-wider mb-2">Rejected</div>
          <div className="text-[28px] font-bold text-gray-800 dark:text-gray-100">{rejectedRequests}</div>
          <div className="text-[12px] text-rose-600 dark:text-rose-400/80 font-medium mt-1">Denied requests</div>
        </div>

        <div 
          onClick={() => setStatusFilter('Reverted')}
          className={`bg-white dark:bg-card rounded-card p-5 border shadow-sm cursor-pointer transition-[transform,box-shadow] hover:-translate-y-0.5 ${statusFilter === 'Reverted' ? 'border-orange-400 dark:border-orange-500 shadow-md shadow-orange-500/10 ring-1 ring-orange-400/30' : 'border-gray-100 dark:border-theme hover:shadow-md'}`}
        >
          <div className="text-[11px] font-bold text-orange-500 dark:text-orange-400 uppercase tracking-wider mb-2">Need Action</div>
          <div className="text-[28px] font-bold text-gray-800 dark:text-gray-100">{needActionRequests}</div>
          <div className="text-[12px] text-orange-600 dark:text-orange-400/80 font-medium mt-1">Requires editing</div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white dark:bg-card border border-gray-200 dark:border-theme rounded-card shadow-card flex flex-col h-auto overflow-hidden">
        
        {/* Bulk Action Banner (approvers only) */}
        {canAct && selectedRows.length > 0 && (
          <div className="bg-teal-50 dark:bg-teal-900/30 border-b border-teal-100 dark:border-teal-800 px-5 py-3 flex items-center justify-between animate-in slide-in-from-top-2">
            <div className="text-[13px] font-semibold text-teal-800 dark:text-teal-300 flex items-center gap-2">
              <CheckSquare size={16} />
              {selectedRows.length} request(s) selected
            </div>
            {selectedRows.some(id => requests.find(r => r.id === id)?.status === 'Pending') && (
              <div className="flex gap-2">
                <button 
                  onClick={() => openActionModal('Approve', null)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-[12px] font-medium transition-[transform,opacity] shadow-sm flex items-center gap-1.5"
                >
                  <Check size={14} /> Approve Selected
                </button>
                <button 
                  onClick={() => openActionModal('Reject', null)}
                  className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-1.5 rounded-lg text-[12px] font-medium transition-[transform,opacity] shadow-sm flex items-center gap-1.5"
                >
                  <X size={14} /> Reject Selected
                </button>
                {/* Revert = back-to-draft, PROVISION only; hidden unless a new-VM request is selected */}
                {selectedRows.some(id => { const r = requests.find(x => x.id === id); return r?.status === 'Pending' && r?.requestType === 'PROVISION'; }) && (
                  <button
                    onClick={() => openActionModal('Revert', null)}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded-lg text-[12px] font-medium transition-[transform,opacity] shadow-sm flex items-center gap-1.5"
                  >
                    <RotateCcw size={14} /> Revert Selected
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Header Section */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-theme flex items-center justify-between gap-4 flex-wrap bg-transparent dark:bg-transparent">
          <div className="flex items-center gap-3 w-full max-w-[320px]">
            <div className="relative w-full">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search VM Name, OS, Requester..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-transparent dark:bg-transparent border border-gray-200 dark:border-theme rounded-input text-[13px] outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-shadow dark:text-gray-100"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-gray-400" />
              <select 
                value={envFilter}
                onChange={e => setEnvFilter(e.target.value)}
                className="bg-white dark:bg-surface border border-gray-200 dark:border-theme text-gray-700 dark:text-gray-200 text-[13px] font-medium rounded-input px-3 py-2 outline-none cursor-pointer focus:border-teal-400 min-w-[140px]"
              >
                <option value="All">All Environments</option>
                <option value="Development">Development</option>
                <option value="Staging">Staging</option>
                <option value="Production">Production</option>
              </select>
            </div>
            
            <select 
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-white dark:bg-surface border border-gray-200 dark:border-theme text-gray-700 dark:text-gray-200 text-[13px] font-medium rounded-input px-3 py-2 outline-none cursor-pointer focus:border-teal-400 min-w-[120px]"
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Reverted">Need Action</option>
            </select>

            {/* Refresh button doubles as the live indicator: green pulsing dot + emerald tint
                signals auto-refresh is on; clicking refreshes immediately (spins). */}
            <button
              onClick={handleRefresh}
              title="Live — auto-refreshing every few seconds. Click to refresh now."
              className="relative p-2 bg-white dark:bg-surface border border-gray-200 dark:border-theme rounded-input text-emerald-600 dark:text-emerald-400 hover:border-emerald-300 dark:hover:border-emerald-600 shadow-sm"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-surface"></span>
              </span>
            </button>
          </div>
        </div>

        {/* Table Section */}
        <div className="overflow-auto custom-scrollbar bg-white dark:bg-card pb-4" style={{ maxHeight: '70vh' }}>
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead className="sticky top-0 z-20 bg-transparent dark:bg-transparent backdrop-blur-sm border-b border-gray-200 dark:border-theme shadow-sm">
              <tr className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <th className="px-3 py-3 w-8 text-center relative group" style={{ width: colWidths['col1'] }}>
                  <div onMouseDown={(e) => handleResizeStart(e, 'col1')} className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-teal-500/30 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                </th>
                <th className="px-3 py-3 w-10 text-center relative group" style={{ width: colWidths['col2'] }}>
                  {canAct && (
                    <input
                      type="checkbox"
                      className="w-3.5 h-3.5 rounded text-teal-600 border-gray-300 focus:ring-teal-500 cursor-pointer"
                      checked={filteredRequests.length > 0 && selectedRows.length === filteredRequests.length}
                      onChange={toggleSelectAll}
                    />
                  )}
                  <div onMouseDown={(e) => handleResizeStart(e, 'col2')} className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-teal-500/30 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                </th>
                <th className="px-4 py-3 relative group" style={{ width: colWidths['col3'] }}>
                  VM Name
                  <div onMouseDown={(e) => handleResizeStart(e, 'col3')} className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-teal-500/30 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                </th>
                <th className="px-4 py-3 relative group" style={{ width: colWidths['col4'] }}>
                  OS / Tier
                  <div onMouseDown={(e) => handleResizeStart(e, 'col4')} className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-teal-500/30 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                </th>
                <th className="px-4 py-3 relative group" style={{ width: colWidths['col5'] }}>
                  Env / Expiry
                  <div onMouseDown={(e) => handleResizeStart(e, 'col5')} className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-teal-500/30 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                </th>
                <th className="px-4 py-3 relative group" style={{ width: colWidths['col6'] }}>
                  Resources
                  <div onMouseDown={(e) => handleResizeStart(e, 'col6')} className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-teal-500/30 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                </th>
                <th className="px-4 py-3 relative group" style={{ width: colWidths['col7'] }}>
                  Provider
                  <div onMouseDown={(e) => handleResizeStart(e, 'col7')} className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-teal-500/30 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                </th>
                <th className="px-4 py-3 relative group" style={{ width: colWidths['col_type'] }}>
                  Type
                  <div onMouseDown={(e) => handleResizeStart(e, 'col_type')} className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-teal-500/30 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                </th>
                <th className="px-4 py-3 relative group" style={{ width: colWidths['col8'] }}>
                  Status
                  <div onMouseDown={(e) => handleResizeStart(e, 'col8')} className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-teal-500/30 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                </th>
                <th onClick={() => requestSort('requestDate')} className="px-4 py-3 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 relative group select-none" style={{ width: colWidths['col9'] }}>
                  Req Date {sortConfig.field === 'requestDate' ? (sortConfig.dir === 'asc' ? '▲' : '▼') : '⇅'}
                  <div onMouseDown={(e) => handleResizeStart(e, 'col9')} className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-teal-500/30 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                </th>
                <th onClick={() => requestSort('actionDate')} className="px-4 py-3 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 relative group select-none" style={{ width: colWidths['col10'] }}>
                  Action Date {sortConfig.field === 'actionDate' ? (sortConfig.dir === 'asc' ? '▲' : '▼') : '⇅'}
                  <div onMouseDown={(e) => handleResizeStart(e, 'col10')} className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-teal-500/30 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                </th>
                <th className="px-4 py-3 text-right pr-6 relative group" style={{ width: colWidths['col11'] }}>
                  Action
                  <div onMouseDown={(e) => handleResizeStart(e, 'col11')} className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-teal-500/30 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-theme relative">
              {loading && requests.length === 0 ? (
                <SkeletonRows cols={12} />
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan="12" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-transparent dark:bg-transparent flex items-center justify-center mb-3">
                        <Search size={20} className="text-gray-400" />
                      </div>
                      <div className="text-[14px] font-semibold">No requests found</div>
                      <div className="text-[12px] mt-1">Try adjusting your search or filters.</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRequests.map(req => {
                  const isExpanded = !!expandedRows[req.id];
                  const isSelected = selectedRows.includes(req.id);
                  const isPending = req.status === 'Pending';
                  const res = resourceDisplay(req);
                  const exp = expiryDisplay(req);
                  const t = typeDisplay(req);

                  return (
                    <React.Fragment key={req.id}>
                      <tr className={`group hover:bg-gray-50/50 dark:hover:bg-slate-700/50 ${isSelected ? 'bg-teal-50/30 dark:bg-teal-900/10' : ''}`}>
                        <td className="px-3 py-4 text-center">
                          <button 
                            onClick={() => toggleExpand(req.id)}
                            className="p-1 rounded text-gray-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/30 focus:outline-none"
                          >
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                        </td>
                        <td className="px-3 py-4 text-center">
                          {canAct && (
                            <input
                              type="checkbox"
                              className="w-3.5 h-3.5 rounded text-teal-600 border-gray-300 focus:ring-teal-500 cursor-pointer"
                              checked={isSelected}
                              onChange={() => toggleSelect(req.id)}
                            />
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-bold text-gray-800 dark:text-gray-100 font-mono">{req.vmName}</span>
                            {req.instanceCount != null && (
                              <span
                                className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300"
                                title={`${req.instanceCount} instance${req.instanceCount > 1 ? 's' : ''} requested`}
                              >
                                ×{req.instanceCount}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-[13px] font-semibold text-gray-700 dark:text-gray-200">{req.os}</div>
                          <div className="text-[11px] text-gray-500 dark:text-gray-400">{req.tier}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium border
                            ${req.environment === 'Production' ? 'bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400' : 
                              req.environment === 'Staging' ? 'bg-indigo-50 border-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-400' : 
                              'bg-amber-50 border-amber-100 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400'}`}>
                            {req.environment}
                          </div>
                          <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-1">Exp: {exp}</div>
                        </td>
                        <td className="px-4 py-4">
                          {res.lines.map((ln, i) => (
                            <div key={i} className={`${i === 0 ? 'text-[12px]' : 'text-[11px]'} ${ln.cls}`}>{ln.text}</div>
                          ))}
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-[13px] text-gray-700 dark:text-gray-300">{req.provider}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">{t.label}</div>
                          {t.scope && <div className="text-[11px] text-gray-500 dark:text-gray-400 whitespace-nowrap">{t.scope}</div>}
                        </td>
                        <td className="px-4 py-4">
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold shadow-sm
                            ${req.status === 'Approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 
                              req.status === 'Rejected' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400' : 
                              req.status === 'Reverted' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400' :
                              'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${req.status === 'Approved' ? 'bg-emerald-500' : req.status === 'Rejected' ? 'bg-rose-500' : req.status === 'Reverted' ? 'bg-orange-500' : 'bg-amber-500'}`}></span>
                            {req.status}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-[12px] font-medium text-gray-700 dark:text-gray-300">
                          {formatDate(req.requestDate)}
                        </td>
                        <td className="px-4 py-4 text-[12px] font-medium text-gray-700 dark:text-gray-300">
                          {formatDate(req.actionDate)}
                        </td>
                        <td className="px-4 py-4 text-right pr-6 min-w-[150px]">
                          {req.status === 'Pending' ? (
                            !canAct ? (
                              <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider text-right">Awaiting Approval</div>
                            ) : (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openActionModal('Approve', req.id)}
                                className="w-7 h-7 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white border border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-500 dark:hover:text-white transition-[transform,opacity] flex items-center justify-center shadow-sm"
                                title="Approve"
                              >
                                <Check size={14} />
                              </button>
                              <button 
                                onClick={() => openActionModal('Reject', req.id)}
                                className="w-7 h-7 rounded bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white border border-rose-200 dark:bg-rose-900/30 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-500 dark:hover:text-white transition-[transform,opacity] flex items-center justify-center shadow-sm"
                                title="Reject"
                              >
                                <X size={14} />
                              </button>
                              {/* Revert = back-to-draft; only meaningful for a new-VM (PROVISION) request */}
                              {req.requestType === 'PROVISION' && (
                                <button
                                  onClick={() => openActionModal('Revert', req.id)}
                                  className="w-7 h-7 rounded bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white border border-orange-200 dark:bg-orange-900/30 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-500 dark:hover:text-white transition-[transform,opacity] flex items-center justify-center shadow-sm"
                                  title="Revert to Need Action (editable draft)"
                                >
                                  <RotateCcw size={14} />
                                </button>
                              )}
                            </div>
                            )
                          ) : (req.status === 'Reverted' && req.requestType === 'PROVISION') ? (
                            <div className="flex items-center justify-end">
                              <button 
                                onClick={() => executeEdit(req.id)}
                                className="px-3 py-1.5 rounded bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white border border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-500 dark:hover:text-white transition-[transform,opacity] flex items-center gap-1.5 text-[12px] font-bold shadow-sm"
                                title="Edit Request"
                              >
                                <FileEdit size={14} /> Edit Request
                              </button>
                            </div>
                          ) : (
                            <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">
                              View Only
                            </div>
                          )}
                        </td>
                      </tr>
                      {/* Expanded Row Content */}
                      {isExpanded && (
                        <tr className="bg-gray-50/50 dark:bg-page border-b border-gray-100 dark:border-theme">
                          <td colSpan="12" className="p-0">
                            <div className="animate-in slide-in-from-top-1 fade-in duration-200">
                              <div className="p-6 ml-14 mr-6 my-2 bg-white dark:bg-card border border-gray-200 dark:border-theme rounded-xl shadow-sm flex flex-col md:flex-row gap-6 items-start">
                                {/* order-2 → moved to the RIGHT; fixed width keeps the description box small and the Action History below it matches the same width */}
                                <div className="w-full md:w-[440px] shrink-0 order-2">
                                  <div className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Description / Purpose</div>
                                  <div className="text-[13px] text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-page p-3 rounded-lg border border-gray-100 dark:border-theme max-h-[110px] overflow-y-auto custom-scrollbar">
                                    {req.description || <span className="italic text-gray-400">No Description Provided</span>}
                                  </div>
                                  
                                  {req.actionHistory && req.actionHistory.length > 0 && (
                                    <div className="mt-5">
                                      <div className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Action History</div>
                                      <div className="space-y-3">
                                        {req.actionHistory.map((log, index) => {
                                          const isApprove = log.action_type === 'Approve';
                                          const isReject = log.action_type === 'Reject';
                                          
                                          const bgClass = isApprove ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : isReject ? 'bg-rose-50/50 dark:bg-rose-900/10' : 'bg-orange-50/50 dark:bg-orange-900/10';
                                          const borderClass = isApprove ? 'border-emerald-100 dark:border-emerald-900/30' : isReject ? 'border-rose-100 dark:border-rose-900/30' : 'border-orange-100 dark:border-orange-900/30';
                                          const badgeBgClass = isApprove ? 'bg-emerald-100 dark:bg-emerald-900/40' : isReject ? 'bg-rose-100 dark:bg-rose-900/40' : 'bg-orange-100 dark:bg-orange-900/40';
                                          const textClass = isApprove ? 'text-emerald-700 dark:text-emerald-400' : isReject ? 'text-rose-700 dark:text-rose-400' : 'text-orange-700 dark:text-orange-400';
                                          const reasonTextClass = isApprove ? 'text-emerald-700 dark:text-emerald-300' : isReject ? 'text-rose-700 dark:text-rose-300' : 'text-orange-700 dark:text-orange-300';
                                          
                                          return (
                                            <div key={index} className={`${bgClass} p-4 rounded-xl border ${borderClass}`}>
                                              <div className="flex items-center justify-between mb-2">
                                                <div className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${badgeBgClass} ${textClass}`}>
                                                  {log.action_type}
                                                </div>
                                                <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                                  <div className="flex items-center">{formatDate(log.action_date)}</div>
                                                </div>
                                              </div>
                                              <div className={`text-[13px] ${reasonTextClass} leading-relaxed font-medium mb-3`}>
                                                {log.reason}
                                              </div>
                                              <div className="flex items-center justify-end text-[11px] text-gray-500 dark:text-gray-400 border-t border-gray-200/50 dark:border-gray-700/50 pt-2 mt-2">
                                                By: <span className="font-semibold text-gray-700 dark:text-gray-300 ml-1">{log.action_by}</span>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                {/* order-1 → moved to the LEFT, takes the remaining width */}
                                <div className="flex-1 order-1 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-4 rounded-xl">
                                  <div className="text-[11px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wider mb-3">Request Information</div>
                                  <div className="space-y-3">
                                    <div>
                                      <div className="text-[11px] text-gray-500 dark:text-gray-400">Requested By</div>
                                      <div className="text-[13px] font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 flex items-center justify-center text-[10px] font-bold">
                                          {req.requestedBy.substring(0, 2).toUpperCase()}
                                        </div>
                                        {req.requestedBy}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-[11px] text-gray-500 dark:text-gray-400">Department</div>
                                      <div className="text-[13px] font-medium text-gray-800 dark:text-gray-200">{req.department}</div>
                                    </div>
                                    <div>
                                      <div className="text-[11px] text-gray-500 dark:text-gray-400">Manager</div>
                                      <div className="text-[13px] font-medium text-gray-800 dark:text-gray-200">{req.manager}</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        </div>
        
        {/* Pagination Bar */}
        <div className="h-[56px] bg-white dark:bg-transparent border-t border-gray-100 dark:border-theme flex items-center justify-between px-5 shrink-0 z-10">
          <div className="text-[12px] font-medium text-gray-500 dark:text-gray-400">
            Showing {filteredRequests.length > 0 ? 1 : 0}–{filteredRequests.length} of {filteredRequests.length} Requests
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-gray-500 dark:text-gray-400">Rows per page:</span>
              <select className="bg-transparent text-[12px] font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-theme rounded-md px-2 py-1 outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-500/20 cursor-pointer">
                <option value="10">10</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
            
            <div className="w-px h-4 bg-gray-200 dark:bg-slate-700/50"></div>
            
            <div className="flex items-center gap-1.5">
              <button className="w-8 h-8 flex items-center justify-center border border-gray-200 dark:border-theme bg-white dark:bg-card text-gray-400 dark:text-gray-500 rounded-input transition-opacity text-[12px] font-medium cursor-not-allowed">←</button>
              <button className="w-8 h-8 flex items-center justify-center border-none bg-gradient-to-br from-teal-500 to-emerald-500 text-white rounded-input shadow-sm text-[12px] font-bold cursor-default">1</button>
              <button className="w-8 h-8 flex items-center justify-center border border-gray-200 dark:border-theme bg-white dark:bg-card text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-input transition-[border-color,opacity] text-[12px] font-medium">2</button>
              <button className="w-8 h-8 flex items-center justify-center border border-gray-200 dark:border-theme bg-white dark:bg-card text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-input transition-[border-color,opacity] text-[12px] font-medium">→</button>
            </div>
          </div>
        </div>

      </div>
  );
}
