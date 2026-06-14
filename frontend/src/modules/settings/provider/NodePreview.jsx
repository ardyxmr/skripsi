import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Server, Search, Plus, Edit2, RefreshCw, Layers, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import TableActionMenu from '../../../components/common/TableActionMenu';
import ResizableTh from '../../../components/ResizableTh';
import NodeForm from './NodeForm';
import NodeExplorer from './NodeExplorer';
import { useNodeContext } from '../../../contexts/NodeContext';
import { useProviderContext } from '../../../contexts/ProviderContext';
import StatusPill from '../../../components/common/StatusPill';

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
      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <span className="font-medium">{pct}%</span>
      </div>
      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  );
}

export default function NodePreview() {
  const { nodes, create, update, remove, sync } = useNodeContext();
  const { providers } = useProviderContext();

  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const [syncingId, setSyncingId] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const [modal, setModal] = useState({ isOpen: false, mode: 'add', data: null });
  const [drawer, setDrawer] = useState({ isOpen: false, node: null });
  const [del, setDel] = useState({ isOpen: false, node: null, blocked: false });

  const flash = (m, ms = 3000) => { setToast(m); setTimeout(() => setToast(''), ms); };

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
    setDropdownPos({ top: rect.bottom, right: window.innerWidth - rect.right });
    setOpenDropdownId(id);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {
      nodeName: fd.get('nodeName'),
      description: fd.get('description'),
      providerId: Number(fd.get('providerId')) || null,
      providerNodeId: Number(fd.get('providerNodeId')) || null,
      status: fd.get('status'),
    };
    try {
      if (modal.mode === 'add') { await create(payload); flash('Node published.'); }
      else { await update(modal.data.id, payload); flash('Node updated.'); }
      setModal({ isOpen: false, mode: 'add', data: null });
    } catch (err) {
      flash(err.message || 'Save failed.');
    }
  };

  const handleSync = async (n) => {
    setOpenDropdownId(null);
    setSyncingId(n.id);
    try {
      await sync(n.id);
      flash(`${n.name} synced.`);
    } catch (err) {
      flash(err.message || 'Sync failed.');
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
      else { flash(err.message || 'Delete failed.'); setDel({ isOpen: false, node: null, blocked: false }); }
    }
  };

  const unpublish = async () => {
    try {
      await update(del.node.id, { status: 'Inactive' });
      flash('Node unpublished.');
    } catch (err) {
      flash(err.message || 'Unpublish failed.');
    }
    setDel({ isOpen: false, node: null, blocked: false });
  };

  const filtered = nodes.filter((n) =>
    (n.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (n.rawNode || '').toLowerCase().includes(search.toLowerCase()) ||
    (n.provider || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="block w-full bg-white dark:bg-card border border-gray-200 dark:border-theme rounded-card shadow-card shrink-0">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-theme flex items-center justify-between">
        <h3 className="text-[15px] font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          Node Preview
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-surface text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-theme">{nodes.length}</span>
        </h3>
        <div className="flex items-center gap-2 relative">
          <div className="relative w-[240px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search Node..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-surface border border-gray-200 dark:border-theme rounded-lg text-[13px] outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:text-gray-100"
            />
          </div>
          <button
            onClick={() => setModal({ isOpen: true, mode: 'add', data: null })}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors flex items-center gap-1.5 shadow-sm shadow-blue-500/20 whitespace-nowrap"
          >
            <Plus size={14} /> Add Node
          </button>
          {toast && (
            <div className="absolute top-full right-0 mt-3 z-50 animate-in slide-in-from-top-2 fade-in duration-300 pointer-events-none">
              <div className="bg-slate-800 dark:bg-slate-700 text-white px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2.5 text-sm font-medium whitespace-nowrap">
                <CheckCircle2 size={16} className="text-emerald-400" /> {toast}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="w-full overflow-x-auto overflow-y-visible">
        {nodes.length === 0 ? (
          <div className="w-full py-16 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
            <Server size={48} className="mb-4 opacity-20" />
            <h4 className="text-[15px] font-bold text-gray-800 dark:text-gray-200 mb-1">No Published Nodes</h4>
            <p className="text-[13px] mb-4 text-center max-w-sm">Publish a node to give users a friendly name instead of the raw hypervisor node.</p>
            <button onClick={() => setModal({ isOpen: true, mode: 'add', data: null })} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-[13px] font-medium transition-colors flex items-center gap-1.5 shadow-sm shadow-blue-500/20">
              <Plus size={14} /> Add Node
            </button>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-[13px]">
            <thead className="sticky top-0 bg-white dark:bg-card z-10 shadow-sm border-b border-gray-100 dark:border-theme">
              <tr>
                <ResizableTh width={220} storageKey="node_preview_column_widths" columnKey="name">Node Name</ResizableTh>
                <ResizableTh width={160} storageKey="node_preview_column_widths" columnKey="provider">Provider</ResizableTh>
                <ResizableTh width={140} storageKey="node_preview_column_widths" columnKey="cpu">CPU Utilization</ResizableTh>
                <ResizableTh width={140} storageKey="node_preview_column_widths" columnKey="ram">RAM Utilization</ResizableTh>
                <ResizableTh width={110} storageKey="node_preview_column_widths" columnKey="status">Status</ResizableTh>
                <ResizableTh width={150} storageKey="node_preview_column_widths" columnKey="sync">Sync</ResizableTh>
                <th className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wider table-header-optimized border-b border-slate-100 dark:border-theme w-16">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((n) => {
                const offline = n.operational === 'Offline';
                return (
                  <tr key={n.id} className="table-row-optimized border-b border-slate-100 dark:border-theme last:border-0 group">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-gray-800 dark:text-gray-200">{n.name}</span>
                        {n.status !== 'Active' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-surface text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-theme">
                            {n.status === 'Inactive' ? 'Inactive' : n.status}
                          </span>
                        )}
                      </div>
                      {n.rawNode && <div className="text-[12px] text-slate-400 dark:text-slate-500 mt-0.5 font-mono">{n.rawNode}</div>}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-gray-600 dark:text-gray-400">{n.provider}</td>
                    <td className="px-4 py-3"><UtilBar pct={n.cpuPct} offline={offline} /></td>
                    <td className="px-4 py-3"><UtilBar pct={n.ramPct} offline={offline} /></td>
                    <td className="px-4 py-3">
                      <StatusPill tone={n.operational === 'Online' ? 'success' : n.operational === 'Offline' ? 'danger' : 'warning'} label={n.operational} variant="soft" shape="full" uppercase />
                    </td>
                    <td className="px-4 py-3 text-[12px] text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1.5">
                        {syncingId === n.id && <RefreshCw size={12} className="animate-spin text-blue-500" />}
                        {ago(n.lastSyncAt)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <TableActionMenu isOpen={openDropdownId === n.id} onToggle={(e) => handleDropdownClick(e, n.id)} dropdownPos={dropdownPos}>
                        <button onClick={() => { setOpenDropdownId(null); setModal({ isOpen: true, mode: 'edit', data: n }); }} className="w-full text-left px-4 py-2 text-[13px] flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200">
                          <Edit2 size={14} /> Edit node
                        </button>
                        <button onClick={() => handleSync(n)} className="w-full text-left px-4 py-2 text-[13px] flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-emerald-600 dark:text-emerald-400">
                          <RefreshCw size={14} /> Sync now
                        </button>
                        <button onClick={() => { setOpenDropdownId(null); setDrawer({ isOpen: true, node: n }); }} className="w-full text-left px-4 py-2 text-[13px] flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400">
                          <Layers size={14} /> Node Explorer
                        </button>
                        <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                        <button onClick={() => { setOpenDropdownId(null); setDel({ isOpen: true, node: n, blocked: false }); }} className="w-full text-left px-4 py-2 text-[13px] flex items-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-600 dark:text-rose-400">
                          <Trash2 size={14} /> Delete node
                        </button>
                      </TableActionMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <NodeForm
        isOpen={modal.isOpen}
        mode={modal.mode}
        data={modal.data}
        providers={providers}
        onSubmit={handleSubmit}
        onClose={() => setModal({ isOpen: false, mode: 'add', data: null })}
      />

      <NodeExplorer isOpen={drawer.isOpen} node={drawer.node} onClose={() => setDrawer({ isOpen: false, node: null })} />

      {del.isOpen && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-card rounded-modal shadow-modal border border-gray-200 dark:border-theme w-full max-w-[420px] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-5 flex flex-col gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${del.blocked ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500' : 'bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-500'}`}>
                {del.blocked ? <AlertTriangle size={24} /> : <Trash2 size={24} />}
              </div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                {del.blocked ? 'Node In Use' : 'Delete Node'}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {del.blocked
                  ? 'This node is referenced by a request, an active VM, or an environment policy, so it cannot be deleted. You can unpublish it instead (set status to Inactive) to hide it from the wizard.'
                  : <>This will permanently delete the published node <span className="font-semibold text-slate-800 dark:text-slate-200">{del.node?.name}</span>. The raw provider node is untouched. This action cannot be undone.</>}
              </p>
              <div className="flex justify-end gap-3 mt-2">
                <button onClick={() => setDel({ isOpen: false, node: null, blocked: false })} className="px-4 py-2 text-[13px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-input transition-colors">Cancel</button>
                {del.blocked ? (
                  <button onClick={unpublish} className="px-4 py-2 text-[13px] font-medium bg-amber-600 hover:bg-amber-700 text-white rounded-input transition-colors shadow-sm">Unpublish instead</button>
                ) : (
                  <button onClick={confirmDelete} className="px-4 py-2 text-[13px] font-medium bg-rose-600 hover:bg-rose-700 text-white rounded-input transition-colors shadow-sm">Delete node</button>
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
