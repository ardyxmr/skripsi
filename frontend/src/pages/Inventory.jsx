import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  Search, RefreshCw, ChevronRight, ChevronDown, MoreVertical,
  X, Calendar, Server, Clock, AlertCircle, Shield, FileText, CheckCircle2,
  Settings, Cpu, HardDrive, Plus, Eye, Copy
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { getCached, setCached, LIVE_CACHE_EVENT } from '../lib/liveCache';
import { useUI } from '../stores/uiStore';
import { ensureMinDuration } from '../lib/minDuration';
import { useUserContext } from '../contexts/UserContext';
import { isAdmin } from '../lib/rbac';
import StatusPill from '../components/common/StatusPill';
import HardenModal from '../components/HardenModal';

// Map an API inventory row onto the field names this page renders, keeping
// Friendly labels for a pending lifecycle approval shown beside the VM status.
const PENDING_LABEL = {
  RESIZE: 'Resize',
  RENEWAL: 'Extend Expiry',
  PERMANENT: 'Make Permanent',
  ADD_DISK: 'Add Disk',
  DESTROY: 'Delete',
};

// the provider-synced dual-status + per-disk facts available.
function normalizeVm(row) {
  return {
    ...row,
    name: row.vmName ?? row.name,
    os: row.catalogName ?? row.os ?? '—',
    environment: row.environmentName ?? row.environment ?? '—',
    tier: row.tierName ?? row.tier ?? '—',
    provider: row.providerName ?? row.provider,
    node: row.nodeName ?? row.node,
    datastore: row.datastoreName ?? row.datastore,
    network: row.networkName ?? row.network,
    cpu: row.vcpu ?? row.cpu ?? 0,
    ram: row.ramMb != null ? Math.round(row.ramMb / 1024) : (row.ram ?? 0),
    disk: row.diskAllocatedGb ?? row.disk ?? 0,
    ip: row.ipAddress ?? row.ip ?? 'N/A',
    owner: row.ownerName ?? row.owner ?? '—',
    createdBy: row.createdBy ?? row.requesterName ?? '—',
    createdDate: row.createdAt ?? row.createdDate,
    osUser: row.loginUsername ?? 'ubuntu',
    observedPowerState: row.observedPowerState ?? 'unknown',
    disks: row.disks ?? [],
    allowDataDisk: row.allowDataDisk ?? false,
    maxDataDisks: row.maxDataDisks ?? 0,
    lastSyncAt: row.lastSyncAt ?? null,
    pendingActions: row.pendingActions ?? [],          // lifecycle requests awaiting approval
    expiryType: row.expiryType ?? null,                // env expiry policy (for the renew cap)
    expiryValue: row.expiryValue ?? null,
    hardeningStatus: row.hardeningStatus ?? 'Not Hardened',     // Stage 8
    catalogId: row.catalogId ?? null,
    catalogHasHardening: row.catalogHasHardening ?? false,      // catalog has ≥1 active hardening version → show the action
    appliedVersion: row.appliedVersion ?? null,                 // { name, version } of the last applied version
    appliedVersionId: row.appliedVersionId ?? null,
    lastHardenedAt: row.lastHardenedAt ?? null,
  };
}

// Display status folds the live Proxmox power state into the governance status:
// a governed (Active) VM is shown as Running (powered on) or Stopped (powered off).
// All other governance states (Provisioning/Failed/Expired/Deleting/Deleted) pass
// through unchanged. Purely presentational — the DB status stays 'Active'.
function effectiveVmStatus(vm) {
  // Hardening is config-only so the DB status stays 'Active' — surface it as an in-progress
  // display state (like Provisioning/Updating/Deleting) while the Ansible run is live.
  if (vm.status === 'Active' && vm.hardeningStatus === 'Running') return 'Hardening';
  if (vm.status === 'Active') {
    return vm.observedPowerState === 'stopped' ? 'Stopped' : 'Running';
  }
  return vm.status;
}

// Shimmer placeholder rows shown during the very first load so the table never
// flashes its empty-state ("No VMs Found") before the data arrives.
function SkeletonRows({ cols, rows = 6 }) {
  return Array.from({ length: rows }).map((_, i) => (
    <tr key={`sk-${i}`} className="animate-pulse">
      <td colSpan={cols} className="px-4 py-4">
        <div className="flex items-center gap-4">
          <div className="h-4 w-4 rounded bg-gray-100 dark:bg-zinc-700/40" />
          <div className="h-4 flex-1 rounded bg-gray-100 dark:bg-zinc-700/40" />
          <div className="h-4 w-28 rounded bg-gray-100 dark:bg-zinc-700/40" />
          <div className="h-4 w-24 rounded bg-gray-100 dark:bg-zinc-700/40" />
          <div className="h-4 w-20 rounded bg-gray-100 dark:bg-zinc-700/40" />
          <div className="h-4 w-16 rounded bg-gray-100 dark:bg-zinc-700/40" />
        </div>
      </td>
    </tr>
  ));
}

// Renewal is capped to the environment window (now + policy): you can only top a VM's expiry back
// UP to that window, never beyond. Returns the selectable extension options (within headroom),
// friendly window/remaining/headroom labels, and whether the VM is already at the cap.
function computeRenewBounds(vm, nowTs) {
  const unit = vm?.expiryType;
  const val = Number(vm?.expiryValue) || 0;
  const windowMin = unit === 'minutes' ? val : unit === 'hours' ? val * 60 : val * 1440; // days/custom/default
  const remMin = vm?.expiryDate ? Math.max(0, (new Date(vm.expiryDate).getTime() - nowTs) / 60000) : 0;
  const headMin = Math.max(0, Math.round(windowMin - remMin));
  const headroomDays = Math.floor(headMin / 1440);
  const fmt = (m) => (m >= 1440 ? `${Math.floor(m / 1440)} days` : m >= 60 ? `${Math.floor(m / 60)} hours` : `${m} min`);

  let options = [7, 14, 21, 30, 45, 60].filter((d) => d <= headroomDays).map((d) => `${d} Days`);
  if (headroomDays >= 1 && !options.includes(`${headroomDays} Days`)) options.push(`${headroomDays} Days`);
  if (options.length === 0 && headMin >= 60) options.push(`${Math.floor(headMin / 60)} Hours`);
  else if (options.length === 0 && headMin >= 1) options.push(`${headMin} Minutes`);
  options = [...new Set(options)];

  return {
    windowLabel: fmt(windowMin),
    remainingLabel: fmt(remMin),
    headroomLabel: fmt(headMin),
    atCap: options.length === 0,
    options,
  };
}

export default function Inventory() {
  const navigate = useNavigate();
  const pushToast = useUI((s) => s.pushToast);
  const dismissToast = useUI((s) => s.dismissToast);
  const { currentUser } = useUserContext();
  const admin = isAdmin(currentUser);

  // Shared field styling — mirrors the wizard's "Number of Instances" / "Description (Optional)"
  // boxes: no explicit light-mode text color or caret override, so the caret follows the
  // theme-correct text color (dark on light, light on dark) and never goes invisible.
  const inputCls = 'w-full p-2.5 border border-gray-200 dark:border-theme rounded-lg text-[13px] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-gray-50 dark:bg-surface dark:text-gray-100';
  const selectCls = `${inputCls} appearance-none cursor-pointer`;

  // Seed from the app-startup cache so the table paints instantly on open; the
  // mount fetch + polling below still refresh it. Skeleton only shows on a cold start.
  const [vms, setVms] = useState(() => (getCached('/inventory') || []).map(normalizeVm));
  const [loading, setLoading] = useState(() => !getCached('/inventory'));

  // Ticks every second so expiry / grace-period countdowns update live.
  const [nowTs, setNowTs] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Live "Xd Yh / Xh Ym / Xm Ys / Ys" countdown to a timestamp (recomputes each tick).
  const formatCountdown = (targetIso) => {
    if (!targetIso) return '';
    const s = Math.floor((new Date(targetIso).getTime() - nowTs) / 1000);
    if (s <= 0) return '0s';
    const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${sec}s`;
    return `${sec}s`;
  };

  // `silent` (background polling / manual refresh) skips the full-page loading
  // state and the error toast, so the table just updates in place with no flash.
  const loadInventory = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const rows = await api.get('/inventory');
      setCached('/inventory', rows || []);
      setVms((rows || []).map(normalizeVm));
    } catch (e) {
      if (!silent) pushToast({ kind: 'error', message: e.message || 'Failed to load inventory.' });
    } finally {
      if (!silent) setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => { loadInventory(); }, [loadInventory]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [envFilter, setEnvFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Widget Filter State
  const [activeWidgetFilter, setActiveWidgetFilter] = useState('Total VM');
  
  // UI States
  const [expandedRows, setExpandedRows] = useState({}); // Support multiple expanded rows
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedVm, setSelectedVm] = useState(null);
  const [revealedCreds, setRevealedCreds] = useState(null); // { username, password } once revealed for the open VM
  const [credLoading, setCredLoading] = useState(false);
  
  // Modals
  const [deleteModalVm, setDeleteModalVm] = useState(null);
  const [hardenModalVm, setHardenModalVm] = useState(null);   // version-aware hardening modal (HardenModal)
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [extendModalVm, setExtendModalVm] = useState(null);
  
  // Renew Form State
  const [renewReason, setRenewReason] = useState('');
  const [renewExtension, setRenewExtension] = useState('7 Days');
  const [isPermanentRequest, setIsPermanentRequest] = useState(false);
  const [renewError, setRenewError] = useState('');

  // Edit Resources State
  const [editModalVm, setEditModalVm] = useState(null);
  const [editCpu, setEditCpu] = useState(1);
  const [editRam, setEditRam] = useState(1);
  const [newDisks, setNewDisks] = useState([]);
  const [isAddingDisk, setIsAddingDisk] = useState(false);
  const [newDiskSize, setNewDiskSize] = useState(50);
  const [newDiskSetup, setNewDiskSetup] = useState('');
  const [editConfirmName, setEditConfirmName] = useState('');
  
  // Discard Confirmation State & Refs
  const [discardConfirmTarget, setDiscardConfirmTarget] = useState(null);
  const activeModalRef = useRef(null);
  const isDirtyRef = useRef(false);
  const discardConfirmRef = useRef(null);

  useEffect(() => {
    discardConfirmRef.current = discardConfirmTarget;
  }, [discardConfirmTarget]);

  useEffect(() => {
    if (editModalVm) {
      activeModalRef.current = 'edit';
      isDirtyRef.current = editCpu !== (editModalVm.cpu || 1) || editRam !== (editModalVm.ram || 1) || newDisks.length > 0 || editConfirmName.trim() !== '';
    } else if (extendModalVm) {
      activeModalRef.current = 'renew';
      isDirtyRef.current = renewReason.trim() !== '' || renewExtension !== '7 Days' || isPermanentRequest;
    } else if (deleteModalVm) {
      activeModalRef.current = 'delete';
      isDirtyRef.current = deleteConfirmName.trim() !== '';
    } else {
      activeModalRef.current = null;
      isDirtyRef.current = false;
    }
  }); // run on every render

  const handleCancelModal = (modalType) => {
    if (activeModalRef.current === modalType && isDirtyRef.current) {
      setDiscardConfirmTarget(modalType);
    } else {
      if (modalType === 'edit') setEditModalVm(null);
      if (modalType === 'renew') setExtendModalVm(null);
      if (modalType === 'delete') setDeleteModalVm(null);
    }
  };

  // Toast State
  const [toastMessage, setToastMessage] = useState('');

  // Handle toast auto-dismiss
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage('');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleOpenRenew = (vm) => {
    setExtendModalVm(vm);
    setRenewReason('');
    // Default the extension to the largest period that still fits within the env-window headroom.
    const rb = computeRenewBounds(vm, Date.now());
    setRenewExtension(rb.options[rb.options.length - 1] ?? 'N/A');
    setIsPermanentRequest(false);
    setRenewError('');
  };
  
  // Action Dropdown State
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });

  const handleActionClick = (e, id) => {
    e.stopPropagation();
    if (openDropdownId === id) {
      setOpenDropdownId(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 5, right: window.innerWidth - rect.right });
      setOpenDropdownId(id);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.action-dropdown-menu') && !e.target.closest('.action-btn')) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Pause background polling while the user is mid-interaction so a silent
  // refresh can't disrupt an open modal, drawer, or action menu.
  const pollPausedRef = useRef(false);
  pollPausedRef.current = !!(editModalVm || extendModalVm || deleteModalVm || drawerOpen || openDropdownId);

  // Live updates are driven by the single app-wide LiveDataPoller (App.jsx): whenever it writes
  // fresh /inventory rows to the cache it fires LIVE_CACHE_EVENT, and we re-render from the cache
  // here — no per-page timer. Skipped while the tab is hidden or the user is mid-interaction
  // (modal/drawer/menu) so a background update can't yank the table.
  useEffect(() => {
    const onLive = (e) => {
      if (e.detail?.path !== '/inventory') return;
      if (document.hidden || pollPausedRef.current) return;
      const rows = getCached('/inventory');
      if (Array.isArray(rows)) {
        setVms(rows.map(normalizeVm));
      }
    };
    window.addEventListener(LIVE_CACHE_EVENT, onLive);
    return () => window.removeEventListener(LIVE_CACHE_EVENT, onLive);
  }, []);

  // Global sync: force the latest discovered snapshot (provider_vms) to mirror into every VM the
  // user can see — a DB-only mass refresh (no live Proxmox call; that lives in Provider Management).
  const handleRefresh = async () => {
    setIsRefreshing(true);
    const start = Date.now();
    const tid = crypto.randomUUID();
    pushToast({ id: tid, kind: 'loading', message: 'Syncing inventory…' });
    try {
      const rows = await api.post('/inventory/sync-all');
      setCached('/inventory', rows || []);
      setVms((rows || []).map(normalizeVm));
      dismissToast(tid);
      pushToast({ kind: 'success', message: 'Inventory synced successfully.' });
    } catch (e) {
      dismissToast(tid);
      pushToast({ kind: 'error', message: e.message || 'Sync failed.' });
    } finally {
      // Let the icon complete at least one full spin even on a cache-fast sync.
      await ensureMinDuration(start);
      setIsRefreshing(false);
    }
  };

  // Retry a failed provisioning (reuses the same workspace).
  const handleRetry = async (vm) => {
    setOpenDropdownId(null);
    try {
      await api.post(`/inventory/${vm.id}/retry`);
      setToastMessage('Retry queued.');
      await loadInventory();
    } catch (e) {
      pushToast({ kind: 'error', message: e.message || 'Retry failed.' });
    }
  };

  // Admin: mark a Pending-Setup data disk as Ready after in-guest setup.
  const handleMarkDiskReady = async (vm, disk) => {
    try {
      await api.post(`/inventory/${vm.id}/disks/${disk.id}/complete`);
      setToastMessage('Disk marked Ready.');
      await loadInventory();
    } catch (e) {
      pushToast({ kind: 'error', message: e.message || 'Failed to mark disk ready.' });
    }
  };

  const getDaysRemaining = (expiryDate) => {
    if (!expiryDate) return Infinity;
    return Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
  };

  const filteredVms = useMemo(() => {
    return vms.filter(vm => {
      const s = searchTerm.toLowerCase();
      const matchSearch = s === '' || 
        vm.name.toLowerCase().includes(s) || 
        vm.ip.toLowerCase().includes(s) ||
        vm.os.toLowerCase().includes(s) ||
        vm.environment.toLowerCase().includes(s) ||
        vm.owner.toLowerCase().includes(s);
        
      const eff = effectiveVmStatus(vm);
      const matchEnv = envFilter === 'All' || vm.environment === envFilter;
      const matchStatus = statusFilter === 'All' || eff === statusFilter || vm.status === statusFilter;

      let matchWidget = true;
      if (activeWidgetFilter === 'Running') {
        matchWidget = eff === 'Running';
      } else if (activeWidgetFilter === 'Expiring Soon') {
        const days = getDaysRemaining(vm.expiryDate);
        matchWidget = vm.expiryDate !== null && days <= 7 && days > 0 && vm.status !== 'Expired';
      } else if (activeWidgetFilter === 'Need Action') {
        matchWidget = eff === 'Stopped' || vm.status === 'Expired';
      }
      
      return matchSearch && matchEnv && matchStatus && matchWidget;
    });
  }, [vms, searchTerm, envFilter, statusFilter, activeWidgetFilter]);

  const toggleExpand = (id) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const openDrawer = (vm) => {
    setSelectedVm(vm);
    setRenewError('');
    setRevealedCreds(null);   // require an explicit, audited reveal per VM open
    setCredLoading(false);
  };

  // Reveal-on-demand: the password is never in the list payload — fetch it from the audited endpoint.
  const revealCredentials = async () => {
    if (!selectedVm) return;
    setCredLoading(true);
    try {
      const res = await api.get(`/inventory/${selectedVm.id}/credentials`);
      setRevealedCreds({ username: res.username ?? selectedVm.osUser, password: res.password });
    } catch (e) {
      pushToast({ kind: 'error', message: e.message || 'Could not load credentials.' });
    } finally {
      setCredLoading(false);
    }
  };

  const copyText = (t) => {
    if (!t) return;
    try { navigator.clipboard?.writeText(t); pushToast({ message: 'Copied to clipboard' }); } catch { /* ignore */ }
  };

  const handleOpenEdit = (vm) => {
    setEditModalVm(vm);
    setEditCpu(vm.cpu || 1);
    setEditRam(vm.ram || 1);
    setNewDisks([]);
    setIsAddingDisk(false);
    setNewDiskSize(50);
    setEditConfirmName('');
  };

  // Handle ESC key to close all popups
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (discardConfirmRef.current) {
          setDiscardConfirmTarget(null);
          return;
        }

        if (activeModalRef.current && isDirtyRef.current) {
          setDiscardConfirmTarget(activeModalRef.current);
          return;
        }

        setDeleteModalVm(null);
        setExtendModalVm(null);
        setEditModalVm(null);
        setOpenDropdownId(null);
        setDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenDelete = (vm) => {
    setDeleteModalVm(vm);
    setDeleteConfirmName('');
  };

  const executeDelete = async () => {
    if (!deleteModalVm) return;
    try {
      await api.post(`/inventory/${deleteModalVm.id}/delete`, { vmNameConfirmation: deleteConfirmName });
      setToastMessage('Delete request submitted.');
      setDeleteModalVm(null);
      await loadInventory();
    } catch (e) {
      pushToast({ kind: 'error', message: e.message || 'Delete failed.' });
    }
  };

  // Status dot color + tooltip (the status pill itself uses the shared <StatusPill>).
  const getStatusConfig = (status) => {
    switch (status) {
      case 'Active':
      case 'Running':
        return { color: 'bg-emerald-500', tooltip: 'VM is running' };
      case 'Stopped':
        return { color: 'bg-[#8a5a2b]', tooltip: 'VM is powered off in Proxmox' };
      case 'Deleted':
        return { color: 'bg-gray-400', tooltip: 'VM has been destroyed (record retained)' };
      case 'Provisioning':
        return { color: 'bg-blue-500', tooltip: 'Terraform Apply in Progress' };
      case 'Updating':
        return { color: 'bg-violet-500', tooltip: 'Applying changes (resize / edit / add-disk)' };
      case 'Hardening':
        return { color: 'bg-cyan-500', tooltip: 'Ansible hardening in progress' };
      case 'Deleting':
        return { color: 'bg-rose-500', tooltip: 'Terraform Destroy in progress' };
      case 'Failed':
        return { color: 'bg-rose-500', tooltip: 'Provisioning failed, needs retry or deletion' };
      case 'Expired':
        return { color: 'bg-rose-500', tooltip: 'VM lifecycle has expired' };
      default:
        return { color: 'bg-gray-400', tooltip: 'Unknown status' };
    }
  };

  // Expiry Logic
  const getExpiryDisplay = (expiryDate) => {
    if (!expiryDate) return { text: 'Lifetime', dateStr: '', badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' };
    
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - nowTs;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const dateStr = `(${expiry.getDate().toString().padStart(2, '0')} ${expiry.toLocaleString('default', { month: 'short' })} ${expiry.getFullYear()})`;

    if (diffTime <= 0) {
      return { text: 'Expired', dateStr, badgeClass: 'bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-900/40 dark:text-rose-400 dark:border-rose-800' };
    } else if (diffDays <= 1) {
      return { text: `${formatCountdown(expiryDate)} Remaining`, dateStr, badgeClass: 'bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-900/40 dark:text-rose-400 dark:border-rose-800' };
    } else if (diffDays <= 7) {
      return { text: `${diffDays} Days Remaining`, dateStr, badgeClass: 'bg-orange-100 text-orange-700 border border-orange-200 dark:bg-orange-900/40 dark:text-orange-400 dark:border-orange-800' };
    } else if (diffDays <= 14) {
      return { text: `${diffDays} Days Remaining`, dateStr, badgeClass: 'bg-yellow-100 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-400 dark:border-yellow-800' };
    } else {
      return { text: `${diffDays} Days Remaining`, dateStr, badgeClass: 'bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800' };
    }
  };

  const renderStatusText = (vm) => {
    if (vm.status === 'Expired') {
      const graceMs = vm.gracePeriodUntil ? new Date(vm.gracePeriodUntil).getTime() - nowTs : 0;
      return graceMs > 0
        ? `Expired (Grace Period - ${formatCountdown(vm.gracePeriodUntil)} Remaining)`
        : `Expired (Auto Destroying...)`;
    }
    return effectiveVmStatus(vm);
  };

  const formatSimpleDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return `${d.getDate().toString().padStart(2, '0')} ${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;
  };
  
  // Widget Calculations
  const totalVmCount = vms.length;
  const runningCount = vms.filter(v => effectiveVmStatus(v) === 'Running').length;
  const expiringSoonCount = vms.filter(v => v.expiryDate && getDaysRemaining(v.expiryDate) <= 7 && getDaysRemaining(v.expiryDate) > 0 && v.status !== 'Expired').length;
  // A stopped (powered-off) VM needs attention just like an expired one.
  const needActionCount = vms.filter(v => effectiveVmStatus(v) === 'Stopped' || v.status === 'Expired').length;

  // Live renewal headroom for the open Renew modal (recomputes each tick via nowTs).
  const renewBounds = extendModalVm ? computeRenewBounds(extendModalVm, nowTs) : null;

  return (
    <div className="animate-in fade-in duration-300 relative h-auto flex flex-col">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute -top-4 left-0 right-0 flex justify-center z-[100] pointer-events-none">
          <div className="bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 px-4 py-2 rounded-md shadow-md flex items-center gap-2 text-[13px] font-medium animate-in fade-in slide-in-from-top-4 duration-200">
            <CheckCircle2 size={16} className="text-emerald-500" />
            {toastMessage}
          </div>
        </div>
      )}

      {/* Dashboard Summary Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 shrink-0">
        <div 
          onClick={() => setActiveWidgetFilter('Total VM')}
          className={`bg-white dark:bg-card rounded-card p-5 border shadow-sm cursor-pointer transition-[transform,box-shadow] hover:-translate-y-0.5 ${activeWidgetFilter === 'Total VM' ? 'border-gray-400 dark:border-gray-500 shadow-md ring-1 ring-gray-400/30' : 'border-gray-100 dark:border-theme hover:shadow-md'}`}>
          <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Total VM</div>
          <div className="text-[28px] font-bold text-gray-800 dark:text-gray-100">{totalVmCount}</div>
          <div className="text-[12px] text-gray-400 font-medium mt-1">All VMs in inventory</div>
        </div>
        
        <div
          onClick={() => setActiveWidgetFilter('Running')}
          className={`cursor-pointer rounded-card p-5 border shadow-sm transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/20 hover:border-emerald-200 dark:hover:border-emerald-700 ${activeWidgetFilter === 'Running' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-400 ring-1 ring-emerald-400' : 'bg-white dark:bg-card border-emerald-100 dark:border-emerald-900/30'}`}>
          <div className="text-[11px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-wider mb-2">Running</div>
          <div className="text-[28px] font-bold text-gray-800 dark:text-gray-100">{runningCount}</div>
          <div className="text-[12px] text-emerald-600 dark:text-emerald-400/80 font-medium mt-1">Powered-on VMs</div>
        </div>
        
        <div 
          onClick={() => setActiveWidgetFilter('Expiring Soon')}
          className={`cursor-pointer rounded-card p-5 border shadow-sm transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/20 hover:border-amber-200 dark:hover:border-amber-700 ${activeWidgetFilter === 'Expiring Soon' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-400 ring-1 ring-amber-400' : 'bg-white dark:bg-card border-amber-100 dark:border-amber-900/30'}`}>
          <div className="text-[11px] font-bold text-amber-500 dark:text-amber-400 uppercase tracking-wider mb-2">Expiring Soon</div>
          <div className="text-[28px] font-bold text-gray-800 dark:text-gray-100">{expiringSoonCount}</div>
          <div className="text-[12px] text-amber-600 dark:text-amber-400/80 font-medium mt-1">Within 7 days</div>
        </div>
        
        <div 
          onClick={() => setActiveWidgetFilter('Need Action')}
          className={`cursor-pointer rounded-card p-5 border shadow-sm transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-rose-500/20 hover:border-rose-200 dark:hover:border-rose-700 ${activeWidgetFilter === 'Need Action' ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-400 ring-1 ring-rose-400' : 'bg-white dark:bg-card border-rose-100 dark:border-rose-900/30'}`}>
          <div className="text-[11px] font-bold text-rose-500 dark:text-rose-400 uppercase tracking-wider mb-2">Need Action</div>
          <div className="text-[28px] font-bold text-gray-800 dark:text-gray-100">{needActionCount}</div>
          <div className="text-[12px] text-rose-600 dark:text-rose-400/80 font-medium mt-1">Stopped or expired</div>
        </div>
      </div>

      <div className="bg-white dark:bg-card border border-gray-200 dark:border-theme rounded-card shadow-card flex flex-col h-auto overflow-hidden relative">
      
      {/* Drawer */}
      <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${drawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-gray-900/30 dark:bg-black/50 backdrop-blur-sm" onClick={() => setDrawerOpen(false)}></div>
        <div className={`absolute top-0 right-0 h-full w-[450px] bg-white dark:bg-card shadow-modal rounded-l-modal transition-transform duration-300 transform ${drawerOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col border-l border-gray-200 dark:border-theme`}>
          {selectedVm && (
            <>
              <div className="px-6 py-5 border-b border-gray-100 dark:border-theme flex items-center justify-between bg-transparent dark:bg-transparent">
                <div>
                  <h2 className="text-[18px] font-bold text-gray-800 dark:text-gray-100 font-mono tracking-tight">{selectedVm.name}</h2>
                  <div className="text-[12px] text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                    <span className="capitalize">{selectedVm.environment}</span> • <span>{selectedVm.ip}</span>
                  </div>
                </div>
                <button onClick={() => setDrawerOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700/50 transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* General Info */}
                <section>
                  <h3 className="text-[12px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Server size={14}/> VM Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[11px] text-gray-400 dark:text-gray-500 mb-1">OS Template</div>
                      <div className="text-[13px] font-medium text-gray-800 dark:text-gray-200">{selectedVm.os}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-400 dark:text-gray-500 mb-1">Tier</div>
                      <div className="text-[13px] font-medium text-gray-800 dark:text-gray-200">{selectedVm.tier}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-400 dark:text-gray-500 mb-1">Resources</div>
                      <div className="text-[13px] font-medium text-gray-800 dark:text-gray-200 font-mono">
                        {selectedVm.cpu}C / {selectedVm.ram}G / {selectedVm.disk}G
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-400 dark:text-gray-500 mb-1">Status</div>
                      <div className="text-[13px] font-medium text-gray-800 dark:text-gray-200">{effectiveVmStatus(selectedVm)}</div>
                    </div>
                  </div>
                </section>
                
                {/* Security/Access Info */}
                <section>
                  <h3 className="text-[12px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Shield size={14}/> VM Access Information</h3>
                  <div className="bg-blue-50/50 dark:bg-surface border border-blue-100 dark:border-theme rounded-card p-4 space-y-3">
                    <div className="flex justify-between items-center border-b border-blue-100/50 dark:border-blue-800/30 pb-2">
                      <span className="text-[12px] text-gray-500 dark:text-gray-400">Default OS User:</span>
                      <span className="text-[13px] font-bold text-gray-800 dark:text-gray-200 font-mono bg-blue-100/50 dark:bg-page px-2 py-0.5 rounded-md border dark:border-theme">{selectedVm.osUser}</span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-[12px] text-gray-500 dark:text-gray-400">Temporary Password:</span>
                      {revealedCreds ? (
                        revealedCreds.password ? (
                          <span className="flex items-center gap-1.5">
                            <span className="text-[13px] font-bold text-gray-800 dark:text-gray-200 font-mono bg-blue-100/50 dark:bg-page px-2 py-0.5 rounded-md border dark:border-theme select-all">{revealedCreds.password}</span>
                            <button onClick={() => copyText(revealedCreds.password)} title="Copy password" className="p-1 text-gray-400 hover:text-teal-600 dark:hover:text-teal-400"><Copy size={13} /></button>
                          </span>
                        ) : (
                          <span className="text-[12px] italic text-gray-400 dark:text-gray-500">Not available (provisioned before this feature)</span>
                        )
                      ) : (
                        <button onClick={revealCredentials} disabled={credLoading} className="flex items-center gap-1.5 text-[12px] font-medium text-teal-600 dark:text-teal-400 hover:underline disabled:opacity-50">
                          <Eye size={13} /> {credLoading ? 'Revealing…' : 'Reveal'}
                        </button>
                      )}
                    </div>
                    <div className="text-[11px] text-blue-600 dark:text-blue-400 bg-blue-100/50 dark:bg-blue-900/30 p-2 rounded flex items-start gap-1.5 mt-2">
                      <AlertCircle size={12} className="shrink-0 mt-0.5" />
                      <span>Temporary, unique per VM — you'll be required to set a new password on first login. Revealing it is recorded in the audit log.</span>
                    </div>
                  </div>
                </section>

                {/* Security Hardening (Stage 8) — only when the VM's catalog has a playbook */}
                {selectedVm.catalogHasHardening && (
                  <section>
                    <h3 className="text-[12px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Shield size={14}/> Harden / Patch</h3>
                    <div className="bg-gray-50 dark:bg-surface border border-gray-200 dark:border-theme rounded-card p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[12px] text-gray-500 dark:text-gray-400">Status:</span>
                        <StatusPill status={selectedVm.hardeningStatus} tone={({ Success: 'success', Failed: 'danger', Running: 'hardening' })[selectedVm.hardeningStatus] || 'neutral'} variant="soft" shape="full" size="sm" weight="font-medium" pad="px-2 py-0.5" />
                      </div>
                      {selectedVm.appliedVersion && (
                        <div className="flex justify-between items-center">
                          <span className="text-[12px] text-gray-500 dark:text-gray-400">Applied version:</span>
                          <span className="text-[12px] font-medium text-gray-700 dark:text-gray-300">{selectedVm.appliedVersion.name} v{selectedVm.appliedVersion.version}</span>
                        </div>
                      )}
                      {selectedVm.lastHardenedAt && (
                        <div className="flex justify-between items-center">
                          <span className="text-[12px] text-gray-500 dark:text-gray-400">Last hardened:</span>
                          <span className="text-[12px] text-gray-700 dark:text-gray-300">{formatSimpleDate(selectedVm.lastHardenedAt)}</span>
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {/* Lifecycle */}
                <section>
                  <h3 className="text-[12px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Clock size={14}/> Lifecycle Information</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] text-gray-500 dark:text-gray-400">Created Date:</span>
                      <span className="text-[13px] font-medium text-gray-800 dark:text-gray-200">{formatSimpleDate(selectedVm.createdDate)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] text-gray-500 dark:text-gray-400">Next Expiration:</span>
                      <span className="text-[13px] font-medium text-gray-800 dark:text-gray-200">
                        {selectedVm.expiryDate ? formatSimpleDate(selectedVm.expiryDate) : 'Lifetime (Permanent)'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] text-gray-500 dark:text-gray-400">Time Remaining:</span>
                      <span className={`text-[12px] px-2 py-0.5 rounded font-bold ${getExpiryDisplay(selectedVm.expiryDate).badgeClass}`}>
                        {getExpiryDisplay(selectedVm.expiryDate).text}
                      </span>
                    </div>
                  </div>
                </section>
                
                {/* Description */}
                <section>
                  <h3 className="text-[12px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-4 flex items-center gap-2"><FileText size={14}/> Description</h3>
                  <div className="text-[13px] text-gray-600 dark:text-gray-300 bg-transparent dark:bg-transparent p-4 rounded-card border border-gray-100 dark:border-theme leading-relaxed">
                    {selectedVm.description}
                  </div>
                </section>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Version-aware hardening modal */}
      <HardenModal vm={hardenModalVm} onClose={() => setHardenModalVm(null)} onSubmitted={() => loadInventory()} />

      {/* Delete Modal */}
      {deleteModalVm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-card w-full max-w-[450px] rounded-modal shadow-modal overflow-hidden border border-gray-200 dark:border-theme animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="shrink-0 flex items-center justify-between p-4 border-b border-gray-100 dark:border-theme">
              <h3 className="font-semibold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                <AlertCircle size={18} className="text-rose-500" />
                Delete VM Confirmation
              </h3>
              <button onClick={() => handleCancelModal('delete')} className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-700">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-4">
              <p className="text-[13px] text-gray-600 dark:text-gray-300">
                You are about to delete the following Virtual Machine:
              </p>
              <div className="bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-theme rounded-md p-3 flex justify-center">
                <span className="font-mono font-bold text-[15px] text-gray-800 dark:text-gray-100">{deleteModalVm.name}</span>
              </div>
              <p className="text-[13px] text-rose-600 dark:text-rose-400 font-medium bg-rose-50 dark:bg-rose-900/20 p-3 rounded-md border border-rose-100 dark:border-rose-900/30">
                This action cannot be undone. All data and Terraform state will be destroyed.
              </p>
              <div className="bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-theme rounded-md p-4">
                <label className="block text-[12px] font-semibold text-slate-700 dark:text-zinc-300 mb-2">
                  To confirm deletion, please type <strong className="font-mono bg-rose-100 dark:bg-rose-900/40 px-1.5 py-0.5 rounded text-rose-700 dark:text-rose-400 select-all">{deleteModalVm.name}</strong> below:
                </label>
                <input 
                  type="text" 
                  value={deleteConfirmName}
                  onChange={(e) => setDeleteConfirmName(e.target.value)}
                  placeholder={deleteModalVm.name}
                  className={`${inputCls} focus:border-rose-500 focus:ring-rose-500/20`}
                />
              </div>
            </div>
            <div className="shrink-0 px-5 py-4 border-t border-gray-100 dark:border-theme flex items-center justify-end gap-3 bg-white dark:bg-card">
              <button 
                onClick={() => handleCancelModal('delete')}
                className="px-4 py-2 text-[13px] font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-input transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={executeDelete}
                disabled={deleteConfirmName !== deleteModalVm.name}
                className="px-4 py-2 text-[13px] font-medium bg-rose-600 hover:bg-rose-700 text-white rounded-input transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}      {/* Extend Modal / Renew VM */}
      {extendModalVm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-card w-full max-w-[450px] rounded-modal shadow-modal overflow-hidden border border-gray-200 dark:border-theme animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="shrink-0 flex items-center justify-between p-4 border-b border-gray-100 dark:border-theme">
              <h3 className="font-semibold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                <Calendar size={18} className="text-teal-500" />
                Renew VM Request
              </h3>
              <button onClick={() => handleCancelModal('renew')} className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-700">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-4">
              <p className="text-[13px] text-gray-600 dark:text-gray-300">
                Request an extension for <strong className="font-mono text-gray-800 dark:text-gray-200">{extendModalVm.name}</strong>.
              </p>
              
              <div className="bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-theme rounded-md p-4 space-y-4">
                {/* Reason Field */}
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Reason / Business Justification <span className="text-rose-500">*</span>
                  </label>
                  <textarea 
                    value={renewReason}
                    onChange={(e) => {
                      setRenewReason(e.target.value);
                      if (renewError) setRenewError('');
                    }}
                    placeholder="Explain why this VM needs extension or permanent retention..."
                    className={`${inputCls} min-h-[80px] resize-none ${renewError ? 'border-rose-400 dark:border-rose-900/50 focus:border-rose-500 focus:ring-rose-500/20' : ''}`}
                  ></textarea>
                  {renewError && (
                    <div className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium animate-in fade-in slide-in-from-top-1">
                      <X size={12} className="shrink-0" />
                      {renewError}
                    </div>
                  )}
                </div>

                {/* Expiry headroom — extension is capped to the environment window (now + policy) */}
                <div className="text-[11px] bg-blue-50/60 dark:bg-blue-900/15 border border-blue-100 dark:border-blue-900/30 rounded-md p-2.5 flex flex-wrap gap-x-4 gap-y-1">
                  <span className="text-gray-500 dark:text-gray-400">Environment max: <strong className="text-gray-700 dark:text-gray-200">{renewBounds?.windowLabel}</strong></span>
                  <span className="text-gray-500 dark:text-gray-400">Remaining: <strong className="text-gray-700 dark:text-gray-200">{renewBounds?.remainingLabel}</strong></span>
                  <span className="text-gray-500 dark:text-gray-400">Extendable: <strong className={renewBounds?.atCap ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>{renewBounds?.atCap ? 'at cap' : `up to ${renewBounds?.headroomLabel}`}</strong></span>
                </div>

                {/* Extension Period Dropdown — options limited to the available headroom */}
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">Extension Period</label>
                  {renewBounds?.atCap ? (
                    <div className="text-[12px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/40 rounded-md p-2.5">
                      Already at the maximum expiry for this environment ({renewBounds.windowLabel}). You can only request <strong>Permanent</strong> below.
                    </div>
                  ) : (
                    <select
                      value={renewExtension}
                      onChange={(e) => setRenewExtension(e.target.value)}
                      disabled={isPermanentRequest}
                      className={`${selectCls} disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {renewBounds?.options.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Permanent Checkbox */}
                <div className="flex items-center gap-2 pt-1">
                  <input 
                    type="checkbox" 
                    id="req-perm" 
                    checked={isPermanentRequest}
                    onChange={(e) => setIsPermanentRequest(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-slate-300 dark:border-theme bg-transparent rounded focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="req-perm" className="text-[13px] font-medium text-slate-700 dark:text-zinc-200 cursor-pointer select-none">
                    Request Permanent VM
                  </label>
                </div>
              </div>
            </div>
            <div className="shrink-0 px-5 py-4 border-t border-gray-100 dark:border-theme flex items-center justify-end gap-3 bg-white dark:bg-card">
              <button 
                onClick={() => handleCancelModal('renew')}
                className="px-4 py-2 text-[13px] font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-input transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!renewReason.trim()) {
                    setRenewError('Reason / Business Justification is required.');
                    return;
                  }
                  // At the env cap there's no headroom to extend — Permanent is the only option.
                  if (renewBounds?.atCap && !isPermanentRequest) {
                    setRenewError('This VM is already at the maximum expiry for its environment. Check "Request Permanent VM" instead.');
                    return;
                  }
                  const id = extendModalVm.id;
                  try {
                    if (isPermanentRequest) {
                      await api.post(`/inventory/${id}/permanent`, { description: renewReason });
                      setToastMessage('Permanent request submitted. Pending approval.');
                    } else {
                      await api.post(`/inventory/${id}/renew`, { description: renewReason, extensionPeriod: renewExtension });
                      setToastMessage(`Renewal request (${renewExtension}) submitted. Pending approval.`);
                    }
                    setExtendModalVm(null);
                    await loadInventory();
                  } catch (e) {
                    setRenewError(e.message || 'Request failed.');
                  }
                }}
                className="px-4 py-2 text-[13px] font-medium bg-teal-600 hover:bg-teal-700 text-white rounded-input transition-colors shadow-sm"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Resources Modal */}
      {editModalVm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-card w-full max-w-[550px] rounded-modal shadow-modal overflow-hidden border border-gray-200 dark:border-theme animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="shrink-0 flex items-center justify-between p-4 border-b border-gray-100 dark:border-theme">
              <h3 className="font-semibold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                <Settings size={18} className="text-teal-500" />
                Edit VM Resources
              </h3>
              <button onClick={() => handleCancelModal('edit')} className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-700">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-4">
              <p className="text-[13px] text-gray-600 dark:text-gray-300">
                Modify hardware resources for <strong className="font-mono text-gray-800 dark:text-gray-200">{editModalVm.name}</strong>.
              </p>

              {/* Resource Configuration Container */}
              <div className="bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-theme rounded-md p-4">
                <div className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Cpu size={14} />
                  Compute Resources
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">CPU Cores (vCPU)</label>
                    <input 
                      type="number"
                      min="1" max="64"
                      value={editCpu}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === '') { setEditCpu(''); return; }   // allow clearing to retype freely
                        const n = parseInt(v, 10);
                        if (!Number.isNaN(n)) setEditCpu(Math.min(64, Math.max(1, n)));
                      }}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">Memory / RAM (GB)</label>
                    <input 
                      type="number"
                      min="1" max="256"
                      value={editRam}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === '') { setEditRam(''); return; }   // allow clearing to retype freely
                        const n = parseInt(v, 10);
                        if (!Number.isNaN(n)) setEditRam(Math.min(256, Math.max(1, n)));
                      }}
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>

              {editModalVm.allowDataDisk && (() => {
                const existingData = (editModalVm.disks || []).filter((d) => (d.diskIndex ?? 0) > 0).length;
                const maxDisks = editModalVm.maxDataDisks ?? 0;
                const usedTotal = existingData + newDisks.length;
                const atCap = usedTotal >= maxDisks;
                return (
              <div className="bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-theme rounded-md p-4">
                <div className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <HardDrive size={14} />
                    Add Data Disk
                  </div>
                  <div className="flex items-center gap-3 normal-case tracking-normal">
                    <span className={`text-[11px] font-semibold ${atCap ? 'text-rose-500' : 'text-slate-500 dark:text-zinc-400'}`} title="Environment data-disk policy cap">
                      {usedTotal}/{maxDisks} used
                    </span>
                    <button
                      onClick={() => setIsAddingDisk(true)}
                      disabled={atCap || isAddingDisk}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline"
                    >
                      <Plus size={12} /> Add data disk
                    </button>
                  </div>
                </div>
                {atCap && (
                  <div className="text-[11px] text-rose-500 dark:text-rose-400 mb-3 -mt-2">
                    Data-disk limit reached for this environment ({maxDisks}). An administrator can raise it in Settings → Environments.
                  </div>
                )}
                
                <div className="space-y-3">
                  {/* Existing Disk (Grayed Out) */}
                  <div className="flex items-center justify-between bg-white dark:bg-card border border-gray-200 dark:border-theme p-3 rounded-md opacity-70 cursor-not-allowed">
                    <div className="flex items-center gap-3">
                      <div className="bg-gray-100 dark:bg-zinc-700 p-2 rounded text-gray-500">
                        <HardDrive size={16} />
                      </div>
                      <div>
                        <div className="text-[13px] font-bold text-gray-800 dark:text-gray-200">Disk 0 (System)</div>
                        <div className="text-[11px] text-gray-500">Existing Volume</div>
                      </div>
                    </div>
                    <div className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-zinc-700 px-3 py-1 rounded border border-gray-200 dark:border-zinc-600">
                      {editModalVm.disk} GB
                    </div>
                  </div>

                  {/* Added Disks */}
                  {newDisks.map((disk, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white dark:bg-card border border-blue-200 dark:border-blue-900/50 p-3 rounded-md">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded text-blue-600 dark:text-blue-400">
                          <HardDrive size={16} />
                        </div>
                        <div>
                          <div className="text-[13px] font-bold text-gray-800 dark:text-gray-200">Disk {idx + 1} (Additional)</div>
                          <div className="text-[11px] text-blue-600 dark:text-blue-400">New Volume</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-zinc-700 px-3 py-1 rounded border border-gray-200 dark:border-zinc-600">
                          {disk.size} GB
                        </div>
                        <button 
                          onClick={() => setNewDisks(newDisks.filter((_, i) => i !== idx))}
                          className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/30 p-1.5 rounded-md transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add New Disk Input Form */}
                  {isAddingDisk && (
                    <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/50 p-3 rounded-md flex flex-col gap-3 animate-in fade-in zoom-in duration-200">
                       <div className="flex items-center gap-3">
                         <input
                           type="number"
                           min="1"
                           value={newDiskSize}
                           onChange={(e) => {
                             const v = e.target.value;
                             if (v === '') { setNewDiskSize(''); return; }   // allow clearing to retype freely
                             const n = parseInt(v, 10);
                             if (!Number.isNaN(n)) setNewDiskSize(Math.max(1, n));
                           }}
                           className={inputCls.replace('w-full', 'w-24')}
                         />
                         <span className="text-[13px] font-medium text-slate-600 dark:text-zinc-400">GB</span>
                       </div>
                       <textarea
                         value={newDiskSetup}
                         onChange={(e) => setNewDiskSetup(e.target.value)}
                         placeholder="Setup intent — Linux: mount /data, fs ext4/xfs, optional LVM; Windows: drive D:, GPT/MBR, NTFS"
                         className={`${inputCls} min-h-[56px] resize-y`}
                       />
                       <div className="flex items-center justify-end gap-2">
                         <button
                           onClick={() => { setIsAddingDisk(false); setNewDiskSetup(''); }}
                           className="text-[12px] font-medium text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300 px-2 py-1"
                         >
                           Cancel
                         </button>
                         <button
                           onClick={() => {
                             const sz = parseInt(newDiskSize, 10);
                             if (!Number.isNaN(sz) && sz > 0) {
                               setNewDisks([...newDisks, { size: sz, setup: newDiskSetup }]);
                               setIsAddingDisk(false);
                               setNewDiskSize(50);
                               setNewDiskSetup('');
                             }
                           }}
                           className="text-[12px] font-medium bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 shadow-sm transition-opacity"
                         >
                           Add Disk
                         </button>
                       </div>
                    </div>
                  )}

                </div>
              </div>
                );
              })()}

              {/* Security Confirmation */}
              <div className="bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-theme rounded-md p-4">
                <label className="block text-[12px] font-semibold text-slate-700 dark:text-zinc-300 mb-2">
                  To confirm changes, please type <strong className="font-mono bg-rose-100 dark:bg-rose-900/40 px-1.5 py-0.5 rounded text-rose-700 dark:text-rose-400 select-all">{editModalVm.name}</strong> below:
                </label>
                <input 
                  type="text" 
                  value={editConfirmName}
                  onChange={(e) => setEditConfirmName(e.target.value)}
                  placeholder={editModalVm.name}
                  className={`${inputCls} focus:border-rose-500 focus:ring-rose-500/20`}
                />
              </div>
            </div>

            <div className="shrink-0 px-5 py-4 border-t border-gray-100 dark:border-theme flex items-center justify-end gap-3 bg-white dark:bg-card">
              <button 
                onClick={() => handleCancelModal('edit')}
                className="px-4 py-2 text-[13px] font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-input transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const id = editModalVm.id;
                  // Parse the (possibly-empty) inputs; an empty/invalid field counts as "no change".
                  const cpuVal = parseInt(editCpu, 10);
                  const ramVal = parseInt(editRam, 10);
                  const cpuChanged = !Number.isNaN(cpuVal) && cpuVal !== (editModalVm.cpu || 1);
                  const ramChanged = !Number.isNaN(ramVal) && ramVal !== (editModalVm.ram || 1);
                  // ONE unified request bundling CPU/RAM + any new disks → a single approval + apply.
                  const payload = { vmNameConfirmation: editConfirmName };
                  if (cpuChanged) payload.cpu = cpuVal;
                  if (ramChanged) payload.ramMb = ramVal * 1024;
                  if (newDisks.length) payload.disks = newDisks.map((d) => ({ sizeGb: d.size, setupDescription: d.setup || '' }));
                  try {
                    await api.post(`/inventory/${id}/edit-resources`, payload);
                    setToastMessage('Edit Resources request submitted. Pending approval.');
                    setEditModalVm(null);
                    await loadInventory();
                  } catch (e) {
                    pushToast({ kind: 'error', message: e.message || 'Request failed.' });
                  }
                }}
                disabled={(() => {
                  if (editConfirmName !== editModalVm.name) return true;
                  const c = parseInt(editCpu, 10), r = parseInt(editRam, 10);
                  const cpuChanged = !Number.isNaN(c) && c !== (editModalVm.cpu || 1);
                  const ramChanged = !Number.isNaN(r) && r !== (editModalVm.ram || 1);
                  return !(cpuChanged || ramChanged || newDisks.length > 0); // nothing actionable
                })()}
                className="px-4 py-2 text-[13px] font-medium bg-teal-600 hover:bg-teal-700 text-white rounded-input transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Request
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
                onClick={() => setDiscardConfirmTarget(null)}
                className="px-4 py-2 w-full text-[13px] font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-card border border-gray-200 dark:border-theme rounded-input hover:bg-gray-100 dark:hover:bg-zinc-700/50 transition-colors"
              >
                No, keep editing
              </button>
              <button 
                onClick={() => {
                  if (discardConfirmTarget === 'edit') setEditModalVm(null);
                  if (discardConfirmTarget === 'renew') setExtendModalVm(null);
                  if (discardConfirmTarget === 'delete') setDeleteModalVm(null);
                  setDiscardConfirmTarget(null);
                }}
                className="px-4 py-2 w-full text-[13px] font-medium text-white bg-rose-500 border border-rose-600 rounded-input hover:bg-rose-600 shadow-sm transition-colors"
              >
                Yes, discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-theme flex items-center justify-between gap-4 flex-wrap bg-transparent shrink-0">
        <div className="flex items-center gap-3 w-full max-w-[400px]">
          <div className="relative w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search VM Name, IP Address, OS Template..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-transparent dark:bg-transparent border border-gray-200 dark:border-theme rounded-input text-[13px] outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-shadow dark:text-gray-100"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
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
          
          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-white dark:bg-surface border border-gray-200 dark:border-theme text-gray-700 dark:text-gray-200 text-[13px] font-medium rounded-input px-3 py-2 outline-none cursor-pointer focus:border-teal-400 min-w-[140px]"
          >
            <option value="All">All Status</option>
            <option value="Running">Running</option>
            <option value="Stopped">Stopped</option>
            <option value="Provisioning">Provisioning</option>
            <option value="Updating">Updating</option>
            <option value="Hardening">Hardening</option>
            <option value="Failed">Failed</option>
            <option value="Expired">Expired</option>
            <option value="Deleting">Deleting</option>
            <option value="Deleted">Deleted</option>
          </select>

          <div className="flex items-center gap-2 ml-2">
            {/* Refresh button doubles as the live indicator: the green pulsing dot + emerald tint
                signals auto-refresh is on; clicking refreshes immediately (spins). */}
            <button
              onClick={handleRefresh}
              title="Sync all VMs from the latest provider snapshot (auto-refreshes every few seconds; click to sync now)."
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
      </div>

      {/* Main Content Area - Table with Horizontal and Vertical Scrolling */}
      <div className="bg-transparent overflow-hidden flex flex-col relative border-t border-transparent">
        
        {/* Table Container with max-height 70vh and overflow auto */}
        <div className="overflow-auto custom-scrollbar pb-4" style={{ maxHeight: '70vh' }}>
          <table className="w-full text-left border-collapse min-w-[1300px]">
            <thead className="sticky top-0 z-20 bg-transparent dark:bg-transparent backdrop-blur-sm border-b border-gray-200 dark:border-theme shadow-sm">
              <tr className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <th className="px-3 py-3 w-8 text-center"></th>
                {/* Status dot */}
                <th className="px-3 py-3 w-8 text-center"></th>
                <th className="px-4 py-3">VM Name</th>
                <th className="px-4 py-3">OS</th>
                <th className="px-4 py-3">Environment</th>
                <th className="px-4 py-3">Tier</th>
                <th className="px-4 py-3">IP Address</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Expiry</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-theme relative">
              {loading && vms.length === 0 ? (
                <SkeletonRows cols={10} />
              ) : filteredVms.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-6 py-16 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center justify-center py-10">
                      <div className="w-12 h-12 rounded-full bg-transparent dark:bg-transparent flex items-center justify-center mb-3">
                        <Server size={20} className="text-gray-400" />
                      </div>
                      <div className="text-[14px] font-bold text-primary mb-1">No VMs Found</div>
                      <div className="text-[12px] text-secondary mb-4">Provision your first virtual machine to get started.</div>
                      <button
                        onClick={() => navigate('/request-vm')}
                        className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-input text-[12px] font-medium transition-colors shadow-sm"
                      >
                        + Provision VM
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredVms.map(vm => {
                  const isExpanded = !!expandedRows[vm.id];
                  const statusConf = getStatusConfig(effectiveVmStatus(vm));
                  const expiryConf = getExpiryDisplay(vm.expiryDate);
                  const isDropdownOpen = openDropdownId === vm.id;
                  
                  return (
                    <React.Fragment key={vm.id}>
                      <tr className={`group hover:bg-gray-50/50 dark:hover:bg-zinc-700/50`}>
                        <td className="px-3 py-4 text-center">
                          <button 
                            onClick={() => toggleExpand(vm.id)}
                            className="p-1 rounded text-gray-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/30 focus:outline-none"
                          >
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                        </td>
                        <td className="px-3 py-4 text-center">
                          {/* Tooltip Wrapper — inline-flex so the popover anchors to the dot, not the
                              full cell; left-anchored + nowrap so the whole label stays on one line and
                              never clips off the table's left edge in this leftmost column. */}
                          <div className="relative inline-flex items-center justify-center group/tt cursor-help">
                            <span className={`w-2.5 h-2.5 rounded-full ${statusConf.color}`}></span>
                            <div className="absolute bottom-full left-1/2 -translate-x-3 mb-2 hidden group-hover/tt:block w-max whitespace-nowrap bg-gray-800 text-white text-[11px] py-1 px-2 rounded shadow-lg z-50">
                              {statusConf.tooltip}
                              <div className="absolute top-full left-3 border-4 border-transparent border-t-gray-800"></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <button 
                            onClick={() => openDrawer(vm)}
                            className="text-[13px] font-bold text-gray-800 dark:text-gray-100 font-mono hover:text-teal-600 dark:hover:text-teal-400 hover:underline decoration-teal-400/30 underline-offset-4 transition-colors"
                          >
                            {vm.name}
                          </button>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-[12px] font-semibold text-gray-700 dark:text-gray-200">{vm.os}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-[12px] font-medium text-gray-700 dark:text-gray-300">{vm.environment}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-[12px] font-medium text-gray-600 dark:text-gray-400">{vm.tier}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-[12px] font-mono text-gray-600 dark:text-gray-400">{vm.ip}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <StatusPill status={effectiveVmStatus(vm)} className="tracking-wider">
                              {renderStatusText(vm)}
                            </StatusPill>
                            {/* Pending lifecycle approval(s) on this VM (resize/extend/permanent/…) */}
                            {vm.pendingActions?.length > 0 && (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 animate-pulse"
                                title="A request on this VM is awaiting approval"
                              >
                                <Clock size={10} />
                                Waiting approval ({vm.pendingActions.map((a) => PENDING_LABEL[a] || a).join(', ')})
                              </span>
                            )}
                          </div>
                          {/* Power state is now folded into the status pill above; only
                              surface a sync-health warning when the provider snapshot is stale. */}
                          {vm.observedPowerState === 'unknown' && (
                            <div className="mt-1.5">
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400" title={vm.lastSyncAt ? `Last sync: ${vm.lastSyncAt}` : 'Never synced'}>
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Provider Unreachable
                              </span>
                            </div>
                          )}
                          {vm.status === 'Provisioning' && (
                            <div className="w-full h-1 bg-gray-200 dark:bg-surface rounded-full mt-2 overflow-hidden">
                              <div className="h-full bg-blue-500 animate-[pulse_1s_ease-in-out_infinite]" style={{ width: '60%' }}></div>
                            </div>
                          )}
                          {vm.status === 'Updating' && (
                            <div className="w-full h-1 bg-gray-200 dark:bg-surface rounded-full mt-2 overflow-hidden">
                              <div className="h-full bg-violet-500 animate-[pulse_1s_ease-in-out_infinite]" style={{ width: '60%' }}></div>
                            </div>
                          )}
                          {vm.hardeningStatus === 'Running' && vm.status === 'Active' && (
                            <div className="w-full h-1 bg-gray-200 dark:bg-surface rounded-full mt-2 overflow-hidden">
                              <div className="h-full bg-cyan-500 animate-[pulse_1s_ease-in-out_infinite]" style={{ width: '60%' }}></div>
                            </div>
                          )}
                          {vm.status === 'Deleting' && (
                            <div className="w-full h-1 bg-gray-200 dark:bg-surface rounded-full mt-2 overflow-hidden">
                              <div className="h-full bg-rose-500 animate-[pulse_1s_ease-in-out_infinite]" style={{ width: '60%' }}></div>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-0.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${expiryConf.badgeClass}`}>
                              {expiryConf.text}
                            </span>
                            {expiryConf.dateStr && (
                              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium pl-1">{expiryConf.dateStr}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center relative action-dropdown-container">
                          <button 
                            onClick={(e) => handleActionClick(e, vm.id)}
                            className={`action-btn p-1.5 rounded-lg transition-colors ${isDropdownOpen ? 'bg-gray-100 text-gray-800 dark:bg-surface dark:text-white' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-zinc-700/50 dark:hover:text-gray-200'}`}
                          >
                            <MoreVertical size={16} />
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Row Content */}
                      <tr className={`bg-gray-50/50 dark:bg-page border-b border-gray-100 dark:border-theme overflow-hidden transition-opacity duration-300 ease-in-out ${isExpanded ? 'table-row opacity-100' : 'hidden opacity-0'}`}>
                        <td colSpan="10" className="p-0">
                          <div className="p-6 ml-14 mr-6 my-2 bg-white dark:bg-card border border-gray-200 dark:border-theme rounded-xl shadow-sm flex flex-col md:flex-row gap-8">
                            
                            {/* Left Panel */}
                            <div className="w-full md:w-[250px] shrink-0 border-l-2 border-teal-400 pl-4">
                              <div className="space-y-3">
                                <div>
                                  <div className="text-[10px] uppercase font-bold tracking-wider text-gray-500 dark:text-gray-400">Default OS User</div>
                                  <div className="text-[13px] font-medium text-gray-800 dark:text-gray-200">{vm.osUser}</div>
                                </div>
                                <div>
                                  <div className="text-[10px] uppercase font-bold tracking-wider text-gray-500 dark:text-gray-400">Created Date</div>
                                  <div className="text-[13px] font-medium text-gray-800 dark:text-gray-200">{formatSimpleDate(vm.createdDate)}</div>
                                </div>
                                <div>
                                  <div className="text-[10px] uppercase font-bold tracking-wider text-gray-500 dark:text-gray-400">Created By</div>
                                  <div className="text-[13px] font-medium text-gray-800 dark:text-gray-200">{vm.createdBy}</div>
                                </div>
                                <div>
                                  <div className="text-[10px] uppercase font-bold tracking-wider text-gray-500 dark:text-gray-400">VM ID</div>
                                  <div className="text-[13px] font-medium text-gray-800 dark:text-gray-200 font-mono">{vm.id}</div>
                                </div>
                              </div>
                            </div>

                            {/* Middle Panel */}
                            <div className="w-full md:w-[250px] shrink-0">
                              <div className="space-y-3">
                                <div>
                                  <div className="text-[10px] uppercase font-bold tracking-wider text-gray-500 dark:text-gray-400">Provider</div>
                                  <div className="text-[13px] font-medium text-gray-800 dark:text-gray-200">{vm.provider || 'Proxmox'}</div>
                                </div>
                                <div>
                                  <div className="text-[10px] uppercase font-bold tracking-wider text-gray-500 dark:text-gray-400">Node</div>
                                  <div className="text-[13px] font-medium text-gray-800 dark:text-gray-200">{vm.node || 'pve01'}</div>
                                </div>
                                <div>
                                  <div className="text-[10px] uppercase font-bold tracking-wider text-gray-500 dark:text-gray-400">Datastore</div>
                                  <div className="text-[13px] font-medium text-gray-800 dark:text-gray-200">{vm.datastore || 'vmdata'}</div>
                                </div>
                                <div>
                                  <div className="text-[10px] uppercase font-bold tracking-wider text-gray-500 dark:text-gray-400">Network</div>
                                  <div className="text-[13px] font-medium text-gray-800 dark:text-gray-200">{vm.network || 'vlan-prod'}</div>
                                </div>
                              </div>
                            </div>

                            {/* Resources Panel — allocated sizes (snapshot) */}
                            <div className="w-full md:w-[230px] shrink-0">
                              <div className="space-y-3">
                                <div>
                                  <div className="text-[10px] uppercase font-bold tracking-wider text-gray-500 dark:text-gray-400">vCPU</div>
                                  <div className="text-[13px] font-medium text-gray-800 dark:text-gray-200 font-mono">{vm.cpu} vCPU</div>
                                </div>
                                <div>
                                  <div className="text-[10px] uppercase font-bold tracking-wider text-gray-500 dark:text-gray-400">Memory</div>
                                  <div className="text-[13px] font-medium text-gray-800 dark:text-gray-200 font-mono">{vm.ram} GB</div>
                                </div>
                                <div>
                                  <div className="text-[10px] uppercase font-bold tracking-wider text-gray-500 dark:text-gray-400 mb-1">Disks</div>
                                  {(vm.disks && vm.disks.length > 0) ? (
                                    <div className="space-y-1">
                                      {vm.disks.map((d, di) => (
                                        <div key={di} className="flex items-center justify-between gap-2 text-[12px]">
                                          <span className="font-mono text-gray-700 dark:text-gray-300">{d.bus || `disk${d.diskIndex ?? di}`}{d.isPrimary || d.diskIndex === 0 ? ' (boot)' : ''}</span>
                                          <span className="font-mono text-gray-800 dark:text-gray-200">{d.sizeGb} GB</span>
                                          {d.setupStatus && d.setupStatus !== 'Ready' && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 font-semibold">{d.setupStatus}</span>
                                          )}
                                          {admin && d.setupStatus === 'Pending Setup' && (
                                            <button onClick={() => handleMarkDiskReady(vm, d)} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-600 text-white font-semibold hover:bg-emerald-700">Mark Ready</button>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-[13px] font-mono text-gray-800 dark:text-gray-200">{vm.disk} GB</div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Right Panel - Description */}
                            <div className="flex-1 min-w-[250px]">
                               <div className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Description / Notes</div>
                               <div className="text-[13px] text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-page p-3 rounded-lg border border-gray-100 dark:border-theme overflow-y-auto max-h-[140px]">
                                 {vm.description || <span className="italic text-gray-400">No Description Provided</span>}
                               </div>
                            </div>

                          </div>
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Bar */}
        <div className="h-[56px] bg-white dark:bg-transparent border-t border-gray-100 dark:border-theme flex items-center justify-between px-5 shrink-0 z-10">
          <div className="text-[12px] font-medium text-gray-500 dark:text-gray-400">
            Showing {filteredVms.length > 0 ? 1 : 0}–{filteredVms.length} of {filteredVms.length} VMs
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
            
            <div className="w-px h-4 bg-gray-200 dark:bg-zinc-700/50"></div>
            
            <div className="flex items-center gap-1.5">
              <button className="w-8 h-8 flex items-center justify-center border border-gray-200 dark:border-theme bg-white dark:bg-card text-gray-400 dark:text-gray-500 rounded-input text-[12px] font-medium cursor-not-allowed">←</button>
              <button className="w-8 h-8 flex items-center justify-center border-none bg-gradient-to-br from-teal-500 to-emerald-500 text-white rounded-input shadow-sm text-[12px] font-bold cursor-default">1</button>
              <button className="w-8 h-8 flex items-center justify-center border border-gray-200 dark:border-theme bg-white dark:bg-card text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700/50 rounded-input text-[12px] font-medium">2</button>
              <button className="w-8 h-8 flex items-center justify-center border border-gray-200 dark:border-theme bg-white dark:bg-card text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700/50 rounded-input text-[12px] font-medium">→</button>
            </div>
          </div>
        </div>

      </div>
      </div>
      
      {/* Floating Action Dropdown Menu */}
      {openDropdownId && (() => {
        const activeVm = vms.find(v => v.id === openDropdownId);
        if (!activeVm) return null;
        return (
          <div 
            style={{ top: dropdownPos.top, right: dropdownPos.right }}
            className="fixed w-48 bg-white dark:bg-card rounded-modal shadow-modal border border-gray-100 dark:border-theme py-1 z-[70] animate-in fade-in slide-in-from-top-2 duration-100 text-left overflow-hidden action-dropdown-menu"
          >
            {activeVm.expiryDate !== null && ['Active', 'Expired'].includes(activeVm.status) && (
              <>
                <button onClick={() => { setOpenDropdownId(null); handleOpenRenew(activeVm); }} className="w-full px-4 py-2 text-[12px] font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-700/50 flex items-center gap-2">
                  Renew VM
                </button>
                <div className="my-1 border-t border-gray-100 dark:border-theme"></div>
              </>
            )}

            {activeVm.status === 'Active' && (
              <>
                <button onClick={() => { setOpenDropdownId(null); handleOpenEdit(activeVm); }} className="w-full px-4 py-2 text-[12px] font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-700/50 flex items-center gap-2">
                  Edit Resources
                </button>
                <div className="my-1 border-t border-gray-100 dark:border-theme"></div>
              </>
            )}

            {/* Hardening: enabled whenever the catalog has versions and no run is live. The version
                modal owns version selection + the "already applied → force re-harden" confirm. */}
            {activeVm.status === 'Active' && activeVm.catalogHasHardening && (
              <>
                <button
                  onClick={activeVm.hardeningStatus === 'Running' ? undefined : () => { setOpenDropdownId(null); setHardenModalVm(activeVm); }}
                  disabled={activeVm.hardeningStatus === 'Running'}
                  title={activeVm.hardeningStatus === 'Running' ? 'Hardening is in progress' : ''}
                  className={`w-full px-4 py-2 text-[12px] font-medium flex items-center gap-2 ${activeVm.hardeningStatus === 'Running' ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-700/50'}`}
                >
                  {activeVm.hardeningStatus === 'Running' ? 'Harden / Patch…' : 'Harden / Patch'}
                </button>
                <div className="my-1 border-t border-gray-100 dark:border-theme"></div>
              </>
            )}

            {activeVm.status === 'Failed' && (
              <button onClick={() => handleRetry(activeVm)} className="w-full px-4 py-2 text-[12px] font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-zinc-700/50 flex items-center gap-2">
                Retry Provisioning
              </button>
            )}

            {activeVm.status !== 'Deleted' && (
              <button onClick={() => { setOpenDropdownId(null); handleOpenDelete(activeVm); }} className="w-full px-4 py-2 text-[12px] font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-zinc-700/50 flex items-center gap-2">
                Delete VM
              </button>
            )}
          </div>
        );
      })()}

    </div>
  );
}
