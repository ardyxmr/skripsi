import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Server, Search, Plus, Edit2, RefreshCw, Layers, Trash2, AlertTriangle, Ban } from 'lucide-react';
import TableActionMenu from '../../../components/common/TableActionMenu';
import DataTable from '../../../components/common/DataTable';
import NodeForm from './NodeForm';
import NodeExplorer from './NodeExplorer';
import { useNodeContext } from '../../../contexts/NodeContext';
import { useProviderContext } from '../../../contexts/ProviderContext';
import StatusPill from '../../../components/common/StatusPill';
import { useUI } from '../../../stores/uiStore';
import { capacityBadge } from '../../../lib/nodeCapacity';

// Relative freshness label for the Sync column, e.g. "synced 2m ago".
const ago = (ts) => {
  if (!ts) return 'never synced';
  const d = (Date.now() - new Date(ts).getTime()) / 1000;
  if (d < 60) return 'synced just now';
  if (d < 3600) return `synced ${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `synced ${Math.floor(d / 3600)}h ago`;
  return `synced ${Math.floor(d / 86400)}d ago`;
};

function UtilBar({ pct, offline }) {
  if (offline || pct == null) return <span className="text-[12px] text-slate-400">— offline</span>;
  const color = pct > 90 ? 'bg-rose-500' : pct > 75 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="flex flex-col gap-1 w-full max-w-[120px]">
      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400">
        <span className="font-medium">{pct}%</span>
      </div>
      <div className="w-full h-1.5 bg-slate-100 dark:bg-zinc-700 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  );
}

// Two distinct failure modes: the Proxmox CLUSTER API is unreachable (provider Disconnected →
// governance 'Provider Offline' → we can't know the node → Unknown) vs the cluster IS reachable but
// Proxmox reports THIS node offline (a valid per-node fact → trust n.operational).
const nodeOperational = (n) => (n.status === 'Provider Offline' ? 'Unknown' : n.operational);
const nodeOffline = (n) => { const op = nodeOperational(n); return op === 'Offline' || op === 'Unknown'; };

export default function NodePreview() {
  const { nodes, create, update, remove, sync } = useNodeContext();
  const { providers } = useProviderContext();
  // Errors must surface on top of the open form modal — use the global, always-on-top toast.
  const pushToast = useUI((s) => s.pushToast);

  const [search, setSearch] = useState('');
  const [syncingId, setSyncingId] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const [modal, setModal] = useState({ isOpen: false, mode: 'add', data: null });
  const [drawer, setDrawer] = useState({ isOpen: false, node: null });
  const [del, setDel] = useState({ isOpen: false, node: null, blocked: false });
  // Unsaved-changes guard for the Add/Edit form — same pattern as the other Settings managements.
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

  // Success notifications go through the global top-center toast (same as the error toasts).
  const flash = (m) => pushToast({ kind: 'success', message: m });

  // Close the form, but confirm first if it has unsaved edits (otherwise close directly).
  const closeForm = (force = false) => {
    if (hasUnsavedChanges && !force) {
      setShowUnsavedWarning(true);
    } else {
      setModal({ isOpen: false, mode: 'add', data: null });
      setShowUnsavedWarning(false);
      setHasUnsavedChanges(false);
    }
  };
  const confirmCloseForm = () => closeForm(true);

  // Esc closes the warning first if it's up, otherwise the open form (through the guard).
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (showUnsavedWarning) setShowUnsavedWarning(false);
      else if (modal.isOpen) closeForm();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showUnsavedWarning, modal.isOpen, hasUnsavedChanges]);

  useEffect(() => {
    const onClick = (e) => {
      if (!e.target.closest('.action-dropdown-container') && !e.target.closest('.action-dropdown-portal')) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleDropdownClick = (e, id) => {
    e.stopPropagation();
    if (openDropdownId === id) { setOpenDropdownId(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    // Positioning + upward-flip is handled centrally in TableActionMenu now; this value is unused.
    setDropdownPos({ top: rect.bottom, right: window.innerWidth - rect.right });
    setOpenDropdownId(id);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {
      nodeName: fd.get('node_name'),
      description: fd.get('description'),
      providerId: Number(fd.get('providerId')) || null,
      providerNodeId: Number(fd.get('providerNodeId')) || null,
      status: fd.get('status'),
      blockOnCritical: fd.get('block_on_critical') === 'on',   // capacity hard-block toggle (admin)
    };
    // Defense-in-depth: never POST an incomplete node (no provider/node) — the form already
    // gates Save, but this guarantees a stray submit can't fire a doomed request.
    if (!payload.providerId || !payload.providerNodeId || !payload.nodeName) {
      pushToast({ kind: 'error', message: 'Select a provider and an available discovered node first.' });
      return;
    }
    try {
      if (modal.mode === 'add') { await create(payload); flash('Node published.'); }
      else { await update(modal.data.id, payload); flash('Node updated.'); }
      setModal({ isOpen: false, mode: 'add', data: null });
      setHasUnsavedChanges(false);
    } catch (err) {
      pushToast({ kind: 'error', message: err.message || 'Save failed.' });
    }
  };

  const handleSync = async (n) => {
    setOpenDropdownId(null);
    setSyncingId(n.id);
    try {
      await sync(n.id);
      flash(`${n.name} synced.`);
    } catch (err) {
      pushToast({ kind: 'error', message: err.message || 'Sync failed.' });
    } finally {
      setSyncingId(null);
    }
  };

  const confirmDelete = async () => {
    try {
      await remove(del.node.id);
      flash('Node deleted.');
      setDel({ isOpen: false, node: null, blocked: false });
    } catch (err) {
      // 409 → referenced by request/inventory/env policy → offer unpublish.
      if (err.status === 409) { setDel((d) => ({ ...d, blocked: true })); }
      else { pushToast({ kind: 'error', message: err.message || 'Delete failed.' }); setDel({ isOpen: false, node: null, blocked: false }); }
    }
  };

  const unpublish = async () => {
    try {
      await update(del.node.id, { status: 'Inactive' });
      flash('Node unpublished.');
    } catch (err) {
      pushToast({ kind: 'error', message: err.message || 'Unpublish failed.' });
    }
    setDel({ isOpen: false, node: null, blocked: false });
  };

  const filtered = useMemo(() => nodes.filter((n) =>
    (n.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (n.rawNode || '').toLowerCase().includes(search.toLowerCase()) ||
    (n.provider || '').toLowerCase().includes(search.toLowerCase())
  ), [nodes, search]);

  // Column defs for the shared <DataTable>: `weight` = fit-mode share of the width, `render` = cell.
  const nodeColumns = [
    { key: 'name', header: 'Node Name', weight: 2.4, headerClassName: 'px-5 py-3', cellClassName: 'px-5 py-3',
      render: (n) => {
        const offline = nodeOffline(n);
        return (
          <>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[13px] font-bold text-gray-800 dark:text-gray-200">{n.name}</span>
              {n.status !== 'Active' && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-surface text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-theme">
                  {n.status === 'Inactive' ? 'Inactive' : n.status}
                </span>
              )}
              {!offline && (() => {
                const cb = capacityBadge(n.capacity);
                return cb ? (
                  <span
                    title={`Capacity: ${cb.detail}${cb.blocked ? ' — provisioning blocked' : ''}`}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold border inline-flex items-center gap-1 ${cb.level === 'critical'
                      ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30'
                      : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30'}`}
                  >
                    <AlertTriangle size={10} /> {cb.label}
                  </span>
                ) : null;
              })()}
              {n.blockOnCritical && (
                <span
                  title="Hard-block enabled: provisioning is refused while this node is Critical"
                  className="px-1.5 py-0.5 rounded text-[10px] font-bold border inline-flex items-center gap-1 bg-slate-100 text-slate-600 border-slate-300 dark:bg-zinc-700 dark:text-zinc-300 dark:border-zinc-600"
                >
                  <Ban size={10} /> Block
                </span>
              )}
            </div>
            {n.rawNode && <div className="text-[12px] text-slate-400 dark:text-zinc-500 mt-0.5 font-mono">{n.rawNode}</div>}
          </>
        );
      } },
    { key: 'provider', header: 'Provider', weight: 1.6,
      render: (n) => <span className="text-[13px] text-gray-600 dark:text-gray-400">{n.provider}</span> },
    { key: 'cpu', header: 'CPU Utilization', weight: 1.4,
      render: (n) => <UtilBar pct={n.cpuPct} offline={nodeOffline(n)} /> },
    { key: 'ram', header: 'RAM Utilization', weight: 1.4,
      render: (n) => <UtilBar pct={n.ramPct} offline={nodeOffline(n)} /> },
    { key: 'status', header: 'Status', weight: 1.1,
      render: (n) => {
        const op = nodeOperational(n);
        return <StatusPill tone={op === 'Online' ? 'success' : op === 'Offline' ? 'danger' : 'warning'} label={op} variant="soft" shape="full" size="sm" weight="font-medium" pad="px-2 py-0.5" />;
      } },
    { key: 'sync', header: 'Sync', weight: 1.5, cellClassName: 'px-4 py-3 text-[12px] text-slate-500 dark:text-zinc-400',
      render: (n) => (
        <span className="inline-flex items-center gap-1.5">
          {syncingId === n.id && <RefreshCw size={12} className="animate-spin text-blue-500" />}
          {ago(n.lastSyncAt)}
        </span>
      ) },
    { key: 'action', header: 'Action', weight: 0.7, align: 'center', resizable: false, headerClassName: 'px-5 py-3', cellClassName: 'px-5 py-3',
      render: (n) => (
        <TableActionMenu isOpen={openDropdownId === n.id} onToggle={(e) => handleDropdownClick(e, n.id)} dropdownPos={dropdownPos}>
          <button type="button" onClick={() => { setOpenDropdownId(null); setModal({ isOpen: true, mode: 'edit', data: n }); }} className="w-full text-left px-4 py-2 text-[13px] flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200">
            <Edit2 size={14} /> Edit node
          </button>
          <button type="button" onClick={() => handleSync(n)} className="w-full text-left px-4 py-2 text-[13px] flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-zinc-700 text-emerald-600 dark:text-emerald-400">
            <RefreshCw size={14} /> Sync now
          </button>
          <button type="button" onClick={() => { setOpenDropdownId(null); setDrawer({ isOpen: true, node: n }); }} className="w-full text-left px-4 py-2 text-[13px] flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-zinc-700 text-blue-600 dark:text-blue-400">
            <Layers size={14} /> Node Explorer
          </button>
          <div className="h-px bg-slate-100 dark:bg-zinc-700 my-1"></div>
          <button type="button" onClick={() => { setOpenDropdownId(null); setDel({ isOpen: true, node: n, blocked: false }); }} className="w-full text-left px-4 py-2 text-[13px] flex items-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <Trash2 size={14} /> Delete node
          </button>
        </TableActionMenu>
      ) },
  ];

  return (
    <div className="flex flex-col w-full bg-white dark:bg-card border border-gray-200 dark:border-theme rounded-card shadow-card shrink-0 max-h-[600px]">
      {/* Header — title + action, matching Provider Overview */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-theme flex items-center justify-between shrink-0">
        <h3 className="text-[15px] font-bold text-gray-800 dark:text-gray-100">Node Preview</h3>
        <div className="flex items-center gap-2 relative">
          <button
            type="button"
            onClick={() => setModal({ isOpen: true, mode: 'add', data: null })}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors flex items-center gap-1.5 shadow-sm shadow-blue-500/20 whitespace-nowrap"
          >
            <Plus size={14} /> Add Node
          </button>
        </div>
      </div>

      {/* Filters — own row, matching Provider Overview */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-theme flex items-center gap-3 shrink-0">
        <div className="relative w-[300px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search Node..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-surface border border-gray-200 dark:border-theme rounded-lg text-[13px] outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:text-gray-100"
          />
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={nodeColumns}
        rows={filtered}
        rowKey={n => n.id}
        noun="Nodes"
        emptyState={{
          icon: Server,
          title: 'No Published Nodes',
          message: 'Publish a node to give users a friendly name instead of the raw hypervisor node.',
          action: (
            <button type="button" onClick={() => setModal({ isOpen: true, mode: 'add', data: null })} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-[13px] font-medium transition-colors flex items-center gap-1.5 shadow-sm shadow-blue-500/20">
              <Plus size={14} /> Add Node
            </button>
          ),
        }}
      />

      <NodeForm
        isOpen={modal.isOpen}
        mode={modal.mode}
        data={modal.data}
        providers={providers}
        publishedNodeIds={nodes.map((n) => n.providerNodeId).filter(Boolean)}
        onSubmit={handleSubmit}
        onChange={() => setHasUnsavedChanges(true)}
        onClose={() => closeForm()}
      />

      {/* Unsaved Changes Warning Modal — shown only when the form has changes (matches other managements). */}
      {showUnsavedWarning && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-card rounded-modal shadow-modal border border-gray-200 dark:border-theme w-[400px] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-5 flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded-full flex items-center justify-center mb-1">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-zinc-100 leading-tight">Unsaved Changes</h3>
              <p className="text-sm text-slate-600 dark:text-zinc-400">You have unsaved changes in the form. Are you sure you want to close it? Your changes will be lost.</p>
              <div className="flex justify-center gap-3 mt-4 w-full">
                <button onClick={() => setShowUnsavedWarning(false)} className="flex-1 px-4 py-2 text-[13px] font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-input transition-colors">Cancel</button>
                <button onClick={confirmCloseForm} className="flex-1 px-4 py-2 text-[13px] font-medium bg-rose-600 hover:bg-rose-700 text-white rounded-input transition-colors shadow-sm">Discard Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <NodeExplorer isOpen={drawer.isOpen} node={drawer.node} onClose={() => setDrawer({ isOpen: false, node: null })} />

      {del.isOpen && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-card rounded-modal shadow-modal border border-gray-200 dark:border-theme w-full max-w-[420px] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-5 flex flex-col gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${del.blocked ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500' : 'bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-500'}`}>
                {del.blocked ? <AlertTriangle size={24} /> : <Trash2 size={24} />}
              </div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-zinc-100 leading-tight">
                {del.blocked ? 'Node In Use' : 'Delete Node'}
              </h3>
              <p className="text-sm text-slate-600 dark:text-zinc-400">
                {del.blocked
                  ? 'This node is referenced by a request, an active VM, or an environment policy, so it cannot be deleted. You can unpublish it instead (set status to Inactive) to hide it from the wizard.'
                  : <>This will permanently delete the published node <span className="font-semibold text-slate-800 dark:text-zinc-200">{del.node?.name}</span>. The raw provider node is untouched. This action cannot be undone.</>}
              </p>
              <div className="flex justify-end gap-3 mt-2">
                <button type="button" onClick={() => setDel({ isOpen: false, node: null, blocked: false })} className="px-4 py-2 text-[13px] font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-input transition-colors">Cancel</button>
                {del.blocked ? (
                  <button type="button" onClick={unpublish} className="px-4 py-2 text-[13px] font-medium bg-amber-600 hover:bg-amber-700 text-white rounded-input transition-colors shadow-sm">Unpublish instead</button>
                ) : (
                  <button type="button" onClick={confirmDelete} className="px-4 py-2 text-[13px] font-medium bg-rose-600 hover:bg-rose-700 text-white rounded-input transition-colors shadow-sm">Delete node</button>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
