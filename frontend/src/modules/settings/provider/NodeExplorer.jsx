import React, { useState, useEffect } from 'react';
import { X, Layers, Network, Database, Server, RefreshCw } from 'lucide-react';
import api from '../../../lib/api';

// Read-only, node-scoped Discovery Explorer drawer — the node-scoped twin of
// ProviderDiscovery. Tabs read GET /nodes/{id}/explorer. No publish/provision.
const TABS = [
  { key: 'templates', label: 'Templates', icon: Layers },
  { key: 'networks', label: 'Networks', icon: Network },
  { key: 'datastores', label: 'Datastores', icon: Database },
  { key: 'vms', label: 'VMs', icon: Server },
];

// Colored status pills — same vocabulary/colors as the provider Discovery Explorer so the two views are consistent.
const Badge = ({ label, cls }) => <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${cls}`}>{label}</span>;
const C = {
  emerald: 'bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400',
  slate: 'bg-slate-50 border border-slate-200 text-slate-700 dark:bg-surface dark:border-theme dark:text-slate-400',
  amber: 'bg-amber-50 border border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400',
  rose: 'bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400',
};
// Present VM → Running (green) / Stopped; gone → Missing. Mirrors ProviderDiscovery's vmStatusBadge.
const vmStatusBadge = (r) => {
  if (r.discoveredStatus !== 'Active') return <Badge label="Missing" cls={C.rose} />;
  if (r.powerState === 'running') return <Badge label="Running" cls={C.emerald} />;
  if (r.powerState === 'stopped') return <Badge label="Stopped" cls={C.slate} />;
  return <Badge label="Unknown" cls={C.amber} />;
};
const discBadge = (s) => <Badge label={s} cls={s === 'Active' ? C.emerald : C.rose} />;

export default function NodeExplorer({ isOpen, node, onClose }) {
  const [tab, setTab] = useState('templates');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !node) return;
    let active = true;
    setLoading(true);
    setTab('templates');
    api.get(`/nodes/${node.id}/explorer`)
      .then((d) => active && setData(d))
      .catch(() => active && setData(null))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [isOpen, node]);

  if (!isOpen || !node) return null;

  const rows = data?.[tab] || [];
  const cell = 'px-4 py-2.5 text-[13px] text-slate-600 dark:text-slate-300';
  const head = 'px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-theme';

  const columns = {
    templates: [['Template', (r) => r.templateName], ['Type', (r) => r.templateType], ['Status', (r) => discBadge(r.discoveredStatus)]],
    networks: [['Bridge', (r) => r.networkName], ['Type', (r) => r.networkType], ['CIDR', (r) => r.cidr ?? '—'], ['Status', (r) => discBadge(r.discoveredStatus)]],
    datastores: [['Storage', (r) => r.datastoreName], ['Type', (r) => r.datastoreType], ['Status', (r) => discBadge(r.discoveredStatus)]],
    // Mirror the Discovery Explorer VMs columns, minus Node (we're already scoped to one node here).
    vms: [['VM', (r) => r.vmName ?? `vm-${r.externalVmid}`], ['VMID', (r) => r.externalVmid], ['IP Address', (r) => r.ipAddress ?? '—'], ['Status', (r) => vmStatusBadge(r)]],
  }[tab];

  return (
    <div className="fixed inset-0 z-[110] flex justify-end bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onMouseDown={onClose}>
      <div className="w-full max-w-[680px] h-full bg-white dark:bg-card border-l border-gray-200 dark:border-theme shadow-2xl flex flex-col animate-in slide-in-from-right duration-300" onMouseDown={(e) => e.stopPropagation()}>
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-theme">
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Layers size={16} className="text-blue-500" /> Node Explorer — {node.name}
            </h3>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
              {node.provider}{node.rawNode ? ` · ${node.rawNode}` : ''} · read-only, scoped to this node
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-surface dark:hover:bg-slate-700 rounded-full">
            <X size={16} />
          </button>
        </div>

        <div className="shrink-0 flex items-center gap-1 px-4 pt-3 border-b border-gray-100 dark:border-theme">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium rounded-t-md border-b-2 transition-colors ${
                tab === key
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Icon size={14} /> {label}
              <span className="ml-1 text-[11px] text-slate-400">{data ? (data[key] || []).length : ''}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400 gap-2 text-[13px]">
              <RefreshCw size={16} className="animate-spin" /> Loading…
            </div>
          ) : rows.length === 0 ? (
            <div className="py-16 text-center text-[13px] text-slate-400 dark:text-slate-500">No {tab} discovered on this node.</div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr>{columns.map(([label]) => <th key={label} className={head}>{label}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 dark:border-theme last:border-0">
                    {columns.map(([label, fn], i) => <td key={label} className={`${cell} ${i === 0 ? 'font-medium text-slate-800 dark:text-slate-200' : ''}`}>{fn(r)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
