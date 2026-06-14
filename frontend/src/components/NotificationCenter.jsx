import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Bell, CheckCircle, Clock, AlertTriangle, Shield, PlusCircle, Check, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCached, LIVE_CACHE_EVENT } from '../lib/liveCache';
import { useUserContext } from '../contexts/UserContext';
import { canApprove } from '../lib/rbac';

// Friendly request-type labels for notification copy.
const REQ_LABEL = {
  PROVISION: 'Provision', RENEWAL: 'Renewal', PERMANENT: 'Permanent',
  RESIZE: 'Resize', ADD_DISK: 'Add-disk', EDIT_RESOURCES: 'Edit-resources', DESTROY: 'Delete',
};

const tsMs = (iso) => (iso ? new Date(iso).getTime() : 0);
const daysUntil = (iso) => Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);

function timeAgo(ms) {
  if (!ms) return '';
  const sec = Math.floor((Date.now() - ms) / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min${min === 1 ? '' : 's'} ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? '' : 's'} ago`;
  const day = Math.floor(hr / 24);
  return `${day} day${day === 1 ? '' : 's'} ago`;
}

const pendingType = (rt) => (rt === 'RENEWAL' ? 'RENEWAL_REQUEST' : rt === 'PERMANENT' ? 'PERMANENT_REQUEST' : 'PROVISION_REQUEST');
const decisionType = (s) => (s === 'Rejected' ? 'APPROVAL_REJECTED' : s === 'Reverted' ? 'RENEWAL_REQUEST' : 'APPROVAL_DECISION');

// Derive the notification feed from the data the app already serves (role-scoped by the
// backend: a User only sees their own approvals/VMs, a Manager/Admin sees the fleet).
//  • Approvers  → pending requests that need their action.
//  • Requesters → decisions (Approved/Rejected/Reverted) on their own requests.
//  • Everyone   → their VMs that are expiring soon or failed to provision.
// Each item carries a STABLE id so the read-state survives polls/reloads.
function deriveNotifications(approvals, inventory, user) {
  const approver = canApprove(user);
  const items = [];

  for (const r of approvals || []) {
    const vm = r.vmName || r.vm || 'a VM';
    const label = REQ_LABEL[r.requestType] || r.requestType || 'Request';
    if (approver) {
      if (r.status === 'Pending') {
        const count = r.instanceCount && r.instanceCount > 1 ? ` ×${r.instanceCount}` : '';
        items.push({ id: `appr-pending-${r.id}`, type: pendingType(r.requestType), message: `${label} request for ${vm}${count} needs your approval`, link: '/approvals', when: tsMs(r.createdAt) });
      }
    } else if (['Approved', 'Rejected', 'Reverted'].includes(r.status)) {
      items.push({ id: `appr-${r.status}-${r.id}`, type: decisionType(r.status), message: `Your ${label} request for ${vm} was ${r.status.toLowerCase()}`, link: r.status === 'Reverted' ? '/approvals' : '/inventory', when: tsMs(r.actionDate || r.createdAt) });
    }
  }

  for (const v of inventory || []) {
    const vm = v.vmName || v.name || 'a VM';
    if (v.status === 'Failed') {
      items.push({ id: `vm-failed-${v.id}`, type: 'PROVISION_FAILED', message: `Provisioning failed for ${vm}`, link: '/inventory', when: tsMs(v.createdAt) });
    } else if (v.status === 'Expired') {
      // Past expiry, in the grace window before auto-destroy.
      items.push({ id: `vm-grace-${v.id}`, type: 'EXPIRY_WARNING', message: `${vm} has expired — auto-delete pending (grace period)`, link: '/inventory', when: Date.now(), timeLabel: 'in grace period' });
    } else if (v.expiryDate && !v.isPermanent && !['Deleted', 'Deleting'].includes(v.status)) {
      const d = daysUntil(v.expiryDate);
      if (d >= 0 && d <= 7) {
        items.push({ id: `vm-expiry-${v.id}`, type: 'EXPIRY_WARNING', message: `${vm} expires ${d === 0 ? 'today' : `in ${d} day${d === 1 ? '' : 's'}`}`, link: '/inventory', when: Date.now(), timeLabel: d === 0 ? 'today' : `in ${d} day${d === 1 ? '' : 's'}` });
      }
    }
  }

  items.sort((a, b) => b.when - a.when);
  return items.slice(0, 30);
}

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  // Seed from the shared live cache the pages already populate, so the bell starts
  // in sync with whatever Inventory/Approvals last fetched.
  const [approvals, setApprovals] = useState(() => getCached('/approvals') || []);
  const [inventory, setInventory] = useState(() => getCached('/inventory') || []);
  const [readIds, setReadIds] = useState(() => new Set());
  const popoverRef = useRef(null);
  const navigate = useNavigate();
  const { currentUser } = useUserContext();

  const readKey = currentUser ? `notif_read_${currentUser.id}` : 'notif_read_anon';

  // Load persisted read-state for the active user.
  useEffect(() => {
    try {
      setReadIds(new Set(JSON.parse(localStorage.getItem(readKey) || '[]')));
    } catch {
      setReadIds(new Set());
    }
  }, [readKey]);

  const persistRead = useCallback((set) => {
    setReadIds(new Set(set));
    try { localStorage.setItem(readKey, JSON.stringify([...set])); } catch { /* ignore quota */ }
  }, [readKey]);

  // Pull the latest rows from the shared cache into local state (triggers re-derive).
  const applyFromCache = useCallback(() => {
    const a = getCached('/approvals'); if (Array.isArray(a)) setApprovals(a);
    const i = getCached('/inventory'); if (Array.isArray(i)) setInventory(i);
  }, []);

  // PARITY: the single app-wide LiveDataPoller (App.jsx) owns all polling and writes the shared
  // cache; the bell is a passive consumer. Whenever the cache changes, re-derive in the SAME tick
  // — so the bell lights up at the exact moment the request/VM appears on the page, no separate poll.
  useEffect(() => {
    const onUpdate = (e) => {
      const p = e.detail?.path;
      if (p === '/approvals' || p === '/inventory') applyFromCache();
    };
    window.addEventListener(LIVE_CACHE_EVENT, onUpdate);
    applyFromCache(); // seed from whatever is cached right now
    return () => window.removeEventListener(LIVE_CACHE_EVENT, onUpdate);
  }, [applyFromCache]);

  const notifications = useMemo(
    () => deriveNotifications(approvals, inventory, currentUser),
    [approvals, inventory, currentUser],
  );
  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [popoverRef]);

  const handleMarkAllRead = () => {
    const next = new Set(readIds);
    notifications.forEach((n) => next.add(n.id));
    persistRead(next);
  };

  const handleNotificationClick = (id, link) => {
    const next = new Set(readIds);
    next.add(id);
    persistRead(next);
    setIsOpen(false);
    if (link) navigate(link);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'PROVISION_REQUEST': return <div className="p-2 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-500"><PlusCircle size={16} /></div>;
      case 'APPROVAL_DECISION': return <div className="p-2 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500"><CheckCircle size={16} /></div>;
      case 'APPROVAL_REJECTED': return <div className="p-2 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-500"><XCircle size={16} /></div>;
      case 'RENEWAL_REQUEST': return <div className="p-2 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-500"><Clock size={16} /></div>;
      case 'PERMANENT_REQUEST': return <div className="p-2 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500"><Shield size={16} /></div>;
      case 'PROVISION_FAILED':
      case 'EXPIRY_WARNING': return <div className="p-2 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-500"><AlertTriangle size={16} /></div>;
      default: return <div className="p-2 rounded-full bg-gray-50 dark:bg-gray-800 text-gray-500"><Bell size={16} /></div>;
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-opacity"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white dark:border-card"></span>
        )}
      </button>

      {/* Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[380px] bg-white dark:bg-card rounded-modal shadow-modal border border-gray-100 dark:border-theme z-[100] animate-in slide-in-from-top-2 duration-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-theme flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-800/20">
            <h3 className="text-[14px] font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <span className="bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {unreadCount} new
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1 transition-opacity"
              >
                <Check size={12} /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar flex flex-col divide-y divide-gray-50 dark:divide-theme">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-[13px] text-gray-500 dark:text-gray-400">
                You're all caught up.
              </div>
            ) : (
              notifications.map((n) => {
                const isRead = readIds.has(n.id);
                return (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n.id, n.link)}
                    className={`px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-opacity flex gap-3 ${!isRead ? 'bg-indigo-50/40 dark:bg-indigo-900/10' : ''}`}
                  >
                    <div className="shrink-0 pt-0.5">
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <p className={`text-[13px] leading-snug ${!isRead ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>
                        {n.message}
                      </p>
                      <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
                        {n.timeLabel || timeAgo(n.when)}
                      </span>
                    </div>
                    {!isRead && (
                      <div className="shrink-0 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5"></div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-gray-100 dark:border-theme bg-slate-50/50 dark:bg-slate-800/20 text-center shrink-0">
            <button
              onClick={() => { setIsOpen(false); navigate('/approvals'); }}
              className="text-[12px] font-semibold text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 transition-opacity"
            >
              View all activity
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
