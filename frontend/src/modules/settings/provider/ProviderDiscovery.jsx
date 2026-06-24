import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Layers, Box, Play, Database, Network, Grid, Server, Search, CheckCircle2, RefreshCw, AlertTriangle, Clock } from 'lucide-react';
import api from '../../../lib/api';
import StatusPill from '../../../components/common/StatusPill';

const EMPTY = { nodes: [], templates: [], networks: [], datastores: [], vms: [] };

// Soft-variant pill matching the explorer row style (rounded, uppercase, no dot).
const Pill = (props) => <StatusPill variant="soft" uppercase shape="sm" {...props} />;

// One consolidated VM status (replaces the confusing Power + Discovered-status pair):
// a present VM shows its power (Running/Stopped); a VM no longer in Proxmox shows Missing
// (pruned automatically after 24h).
const vmStatusBadge = (item) => {
  if (item.discoveredStatus !== 'Active') return <Pill status="Missing" />;
  if (item.powerState === 'running') return <Pill status="Running" />;
  if (item.powerState === 'stopped') return <Pill status="Stopped" />;
  return <Pill status="Unknown" />;
};

export default function ProviderDiscovery({ isOpen, provider, onClose }) {
  const [resourceNavSelection, setResourceNavSelection] = useState('nodes');
  const [resourceSearch, setResourceSearch] = useState('');
  const [explorer, setExplorer] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Load discovered resources for this provider from the discovery layer.
  useEffect(() => {
    if (!isOpen || !provider?.id) return;
    let active = true;
    setLoading(true);
    api
      .get(`/providers/${provider.id}/explorer`)
      .then((data) => {
        if (active) setExplorer({ ...EMPTY, ...data });
      })
      .catch(() => active && setExplorer(EMPTY))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [isOpen, provider?.id]);

  const nodes = explorer.nodes || [];
  const templates = explorer.templates || [];
  const networks = explorer.networks || [];
  const datastores = explorer.datastores || [];
  const vms = explorer.vms || [];

  // Discovery health — driven by the live /explorer response (falls back to the
  // provider row). discoveryStatus from the API is lowercase (success|failed|…).
  const connectionStatus = explorer.connectionStatus ?? provider?.status ?? 'Disconnected';
  const ds = String(explorer.discoveryStatus ?? provider?.discoveryStatus ?? 'never_run').toLowerCase();
  const dsLabel = { success: 'Success', failed: 'Failed', running: 'Running', partial: 'Partial', never_run: 'Never Run' }[ds] || ds;
  const lastDiscoveryAt = explorer.lastDiscoveryAt ?? provider?.lastDiscoveryAt ?? null;
  const nextDiscoveryAt = explorer.nextDiscoveryAt ?? null;
  const fmtDate = (iso) => (iso ? new Date(iso).toLocaleString() : 'Never');
  // Synthesize the "Last Discovery Result" lines from the discovered counts.
  const discoveryResult = lastDiscoveryAt
    ? [
        `✓ Nodes Synced: ${nodes.length}`,
        `✓ Templates Synced: ${templates.length}`,
        `✓ Networks Synced: ${networks.length}`,
        `✓ Datastores Synced: ${datastores.length}`,
        `✓ VMs Synced: ${vms.length}`,
      ]
    : [];

  const discoveryDrawer = { isOpen, provider };

  return createPortal(
    <>
      <div className={`fixed inset-y-0 right-0 w-[950px] bg-slate-50 dark:bg-[#18181b] shadow-2xl z-[100] transform transition-transform duration-300 ease-in-out flex flex-col ${discoveryDrawer.isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {discoveryDrawer.isOpen && (
          <div className="flex flex-col h-full h-screen overflow-hidden">
            <div className="flex items-center justify-between p-5 bg-white dark:bg-card border-b border-slate-200 dark:border-theme shrink-0">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-zinc-100 text-[16px] flex items-center gap-2">
                <Layers size={18} className="text-blue-600 dark:text-blue-400" /> Discovery Explorer
              </h3>
              <p className="text-[12px] text-slate-500 dark:text-zinc-400 mt-1">Interactive view of synced resources from {discoveryDrawer.provider?.providerName || discoveryDrawer.provider?.name || 'Provider'}</p>
            </div>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors">
              <X size={18} />
            </button>
          </div>
          
          {discoveryDrawer.provider && (
            <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-row animate-in fade-in duration-300 relative">
              
              {/* Left Panel - Master/Details & Navigation */}
              <div className="w-[340px] shrink-0 bg-white dark:bg-card border-r border-slate-200 dark:border-theme overflow-y-auto custom-scrollbar p-5 flex flex-col gap-6">
                
                {/* Context Info */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Provider</div>
                    <div className="text-[13px] font-bold text-slate-800 dark:text-zinc-200">{discoveryDrawer.provider.providerName || discoveryDrawer.provider.name}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Connection Status</div>
                    <StatusPill status={connectionStatus} label={connectionStatus} shape="sm" pad="px-2 py-0.5" uppercase />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Discovery Status</div>
                    <StatusPill tone={ds === 'success' ? 'info' : ds === 'failed' ? 'danger' : ds === 'running' ? 'warning' : 'neutral'} label={dsLabel} shape="sm" pad="px-2 py-0.5" uppercase />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Last Discovery</div>
                    <div className="text-[13px] text-slate-700 dark:text-zinc-300 flex items-center gap-1.5"><Clock size={14} className="text-slate-400"/> {fmtDate(lastDiscoveryAt)}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Next Discovery</div>
                    <div className="text-[13px] text-slate-700 dark:text-zinc-300 flex items-center gap-1.5"><Clock size={14} className="text-slate-400"/> {nextDiscoveryAt ? new Date(nextDiscoveryAt).toLocaleString() : 'Manual Only'}</div>
                  </div>
                </div>

                {/* Discovery Health */}
                <div className="flex flex-col gap-2">
                  <h3 className="text-[13px] font-bold text-slate-800 dark:text-zinc-200 border-b border-slate-100 dark:border-theme pb-1">Discovery Health</h3>
                  <div className={`p-3 border rounded-card flex items-start gap-3 ${ds === 'success' ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300' : ds === 'failed' ? 'bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20 text-rose-800 dark:text-rose-300' : ds === 'running' || ds === 'partial' ? 'bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20 text-amber-800 dark:text-amber-300' : 'bg-slate-50 border-slate-200 dark:bg-surface dark:border-theme text-slate-800 dark:text-zinc-300'}`}>
                    <div className="mt-0.5">
                      {ds === 'success' && <CheckCircle2 size={16} />}
                      {ds === 'running' && <RefreshCw size={16} className="animate-spin" />}
                      {(ds === 'failed' || ds === 'partial') && <AlertTriangle size={16} />}
                      {(ds === 'never_run') && <Box size={16} />}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[12px] font-bold uppercase tracking-wider">{dsLabel}</span>
                      <span className="text-[13px] opacity-90 mt-0.5">
                        {ds === 'success' && '✓ Discovery completed successfully'}
                        {ds === 'running' && '⟳ Discovery currently running'}
                        {ds === 'failed' && '⚠ Discovery failed during last execution'}
                        {ds === 'partial' && '⚠ Discovery partially completed'}
                        {ds === 'never_run' && 'No discovery has been executed yet'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Last Discovery Result */}
                <div className="flex flex-col gap-2">
                  <h3 className="text-[13px] font-bold text-slate-800 dark:text-zinc-200 border-b border-slate-100 dark:border-theme pb-1">Last Discovery Result</h3>
                  <div className="bg-slate-50 dark:bg-surface border border-slate-200 dark:border-theme rounded-card p-3 flex flex-col gap-2">
                    {discoveryResult.length > 0 ? (
                      discoveryResult.map((result, idx) => (
                        <div key={idx} className={`text-[12px] font-medium flex items-center gap-2 ${result.includes('✓') ? 'text-emerald-600 dark:text-emerald-400' : result.includes('⚠') ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-zinc-300'}`}>
                          {result}
                        </div>
                      ))
                    ) : (
                      <div className="text-[12px] text-slate-500 italic">No results available</div>
                    )}
                  </div>
                </div>

                {/* Resource Navigation UI */}
                <div className="flex flex-col gap-2 mt-2">
                  <h3 className="text-[13px] font-bold text-slate-800 dark:text-zinc-200 border-b border-slate-100 dark:border-theme pb-1">Resources</h3>
                  <div className="flex flex-col space-y-1">
                    <button 
                      onClick={() => { setResourceNavSelection('nodes'); setResourceSearch(''); }}
                      className={`w-full text-left px-3 py-2.5 rounded-md flex items-center justify-between text-[13px] font-medium transition-colors ${resourceNavSelection === 'nodes' ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-700'}`}>
                      <div className="flex items-center gap-2.5">
                        <Play size={10} className={`transition-all ${resourceNavSelection === 'nodes' ? 'fill-current text-blue-500 dark:text-blue-400 opacity-100' : 'opacity-0 w-0'}`} />
                        <Box size={16} className={resourceNavSelection === 'nodes' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'} /> 
                        <span className={resourceNavSelection === 'nodes' ? 'font-bold' : ''}>Nodes</span>
                      </div>
                      <span className="text-[12px] bg-white dark:bg-card px-2 py-0.5 rounded-full border border-slate-200 dark:border-theme shadow-sm">{nodes.length}</span>
                    </button>
                    <button 
                      onClick={() => { setResourceNavSelection('templates'); setResourceSearch(''); }}
                      className={`w-full text-left px-3 py-2.5 rounded-md flex items-center justify-between text-[13px] font-medium transition-colors ${resourceNavSelection === 'templates' ? 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400' : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-700'}`}>
                      <div className="flex items-center gap-2.5">
                        <Play size={10} className={`transition-all ${resourceNavSelection === 'templates' ? 'fill-current text-teal-500 dark:text-teal-400 opacity-100' : 'opacity-0 w-0'}`} />
                        <Database size={16} className={resourceNavSelection === 'templates' ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'} /> 
                        <span className={resourceNavSelection === 'templates' ? 'font-bold' : ''}>Templates</span>
                      </div>
                      <span className="text-[12px] bg-white dark:bg-card px-2 py-0.5 rounded-full border border-slate-200 dark:border-theme shadow-sm">{templates.length}</span>
                    </button>
                    <button 
                      onClick={() => { setResourceNavSelection('networks'); setResourceSearch(''); }}
                      className={`w-full text-left px-3 py-2.5 rounded-md flex items-center justify-between text-[13px] font-medium transition-colors ${resourceNavSelection === 'networks' ? 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400' : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-700'}`}>
                      <div className="flex items-center gap-2.5">
                        <Play size={10} className={`transition-all ${resourceNavSelection === 'networks' ? 'fill-current text-purple-500 dark:text-purple-400 opacity-100' : 'opacity-0 w-0'}`} />
                        <Network size={16} className={resourceNavSelection === 'networks' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'} /> 
                        <span className={resourceNavSelection === 'networks' ? 'font-bold' : ''}>Networks</span>
                      </div>
                      <span className="text-[12px] bg-white dark:bg-card px-2 py-0.5 rounded-full border border-slate-200 dark:border-theme shadow-sm">{networks.length}</span>
                    </button>
                    <button 
                      onClick={() => { setResourceNavSelection('datastores'); setResourceSearch(''); }}
                      className={`w-full text-left px-3 py-2.5 rounded-md flex items-center justify-between text-[13px] font-medium transition-colors ${resourceNavSelection === 'datastores' ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-700'}`}>
                      <div className="flex items-center gap-2.5">
                        <Play size={10} className={`transition-all ${resourceNavSelection === 'datastores' ? 'fill-current text-amber-500 dark:text-amber-400 opacity-100' : 'opacity-0 w-0'}`} />
                        <Grid size={16} className={resourceNavSelection === 'datastores' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'} /> 
                        <span className={resourceNavSelection === 'datastores' ? 'font-bold' : ''}>Datastores</span>
                      </div>
                      <span className="text-[12px] bg-white dark:bg-card px-2 py-0.5 rounded-full border border-slate-200 dark:border-theme shadow-sm">{datastores.length}</span>
                    </button>
                    <button
                      onClick={() => { setResourceNavSelection('vms'); setResourceSearch(''); }}
                      className={`w-full text-left px-3 py-2.5 rounded-md flex items-center justify-between text-[13px] font-medium transition-colors ${resourceNavSelection === 'vms' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-700'}`}>
                      <div className="flex items-center gap-2.5">
                        <Play size={10} className={`transition-all ${resourceNavSelection === 'vms' ? 'fill-current text-emerald-500 dark:text-emerald-400 opacity-100' : 'opacity-0 w-0'}`} />
                        <Server size={16} className={resourceNavSelection === 'vms' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'} />
                        <span className={resourceNavSelection === 'vms' ? 'font-bold' : ''}>VMs</span>
                      </div>
                      <span className="text-[12px] bg-white dark:bg-card px-2 py-0.5 rounded-full border border-slate-200 dark:border-theme shadow-sm">{vms.length}</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* Right Panel */}
              <div className="flex-1 bg-slate-50/50 dark:bg-transparent overflow-y-auto custom-scrollbar flex flex-col relative">
                
                <div className="p-6 flex flex-col gap-4 animate-in fade-in duration-300">
                      {/* Header & Search */}
                      <div className="flex items-center justify-between bg-white dark:bg-card p-4 rounded-card border border-slate-200 dark:border-theme shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-[16px] font-bold text-slate-800 dark:text-zinc-200 capitalize">
                      {resourceNavSelection === 'nodes' ? 'Discovered Nodes' :
                       resourceNavSelection === 'templates' ? 'Discovered Templates' :
                       resourceNavSelection === 'networks' ? 'Discovered Networks' :
                       resourceNavSelection === 'vms' ? 'Discovered VMs' : 'Discovered Datastores'}
                    </span>
                    <span className="text-[12px] text-slate-500 mt-0.5">
                      {loading ? 'Loading…' : `${
                        resourceNavSelection === 'nodes' ? nodes.length :
                        resourceNavSelection === 'templates' ? templates.length :
                        resourceNavSelection === 'networks' ? networks.length :
                        resourceNavSelection === 'vms' ? vms.length :
                        datastores.length} Resources`}
                    </span>
                  </div>
                  <div className="relative w-[280px]">
                    <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder={`Search ${resourceNavSelection}...`}
                      value={resourceSearch}
                      onChange={(e) => setResourceSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-[13px] border border-slate-200 dark:border-theme rounded-md bg-slate-50 dark:bg-surface focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Data Table */}
                <div className="bg-white dark:bg-card border border-slate-200 dark:border-theme rounded-card shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <table className="w-full text-left border-collapse text-[13px]">
                    <thead className="bg-slate-50/80 dark:bg-surface border-b border-slate-200 dark:border-theme">
                      <tr>
                        {resourceNavSelection === 'nodes' && (
                          <>
                            <th className="px-5 py-3 font-semibold text-slate-600 dark:text-zinc-400">Node Name</th>
                            <th className="px-5 py-3 font-semibold text-slate-600 dark:text-zinc-400">Status</th>
                            <th className="px-5 py-3 font-semibold text-slate-600 dark:text-zinc-400">CPU</th>
                            <th className="px-5 py-3 font-semibold text-slate-600 dark:text-zinc-400">Memory</th>
                          </>
                        )}
                        {resourceNavSelection === 'templates' && (
                          <>
                            <th className="px-5 py-3 font-semibold text-slate-600 dark:text-zinc-400">Template Name</th>
                            <th className="px-5 py-3 font-semibold text-slate-600 dark:text-zinc-400">Node</th>
                            <th className="px-5 py-3 font-semibold text-slate-600 dark:text-zinc-400">Status</th>
                          </>
                        )}
                        {resourceNavSelection === 'networks' && (
                          <>
                            <th className="px-5 py-3 font-semibold text-slate-600 dark:text-zinc-400">Network Name</th>
                            <th className="px-5 py-3 font-semibold text-slate-600 dark:text-zinc-400">Provider Network</th>
                            <th className="px-5 py-3 font-semibold text-slate-600 dark:text-zinc-400">CIDR</th>
                            <th className="px-5 py-3 font-semibold text-slate-600 dark:text-zinc-400">Status</th>
                          </>
                        )}
                        {resourceNavSelection === 'datastores' && (
                          <>
                            <th className="px-5 py-3 font-semibold text-slate-600 dark:text-zinc-400">Datastore</th>
                            <th className="px-5 py-3 font-semibold text-slate-600 dark:text-zinc-400">Type</th>
                            <th className="px-5 py-3 font-semibold text-slate-600 dark:text-zinc-400">Capacity / Usage</th>
                            <th className="px-5 py-3 font-semibold text-slate-600 dark:text-zinc-400">Status</th>
                          </>
                        )}
                        {resourceNavSelection === 'vms' && (
                          <>
                            <th className="px-5 py-3 font-semibold text-slate-600 dark:text-zinc-400">VM Name</th>
                            <th className="px-5 py-3 font-semibold text-slate-600 dark:text-zinc-400">VMID</th>
                            <th className="px-5 py-3 font-semibold text-slate-600 dark:text-zinc-400">Node</th>
                            <th className="px-5 py-3 font-semibold text-slate-600 dark:text-zinc-400">IP Address</th>
                            <th className="px-5 py-3 font-semibold text-slate-600 dark:text-zinc-400">Status</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {resourceNavSelection === 'nodes' && nodes.filter(item => (item.nodeName || '').toLowerCase().includes(resourceSearch.toLowerCase())).map((item, idx) => (
                        <tr key={idx} className="table-row-optimized border-b border-slate-100 dark:border-theme last:border-0 group">
                          <td className="px-5 py-3 font-medium text-slate-800 dark:text-zinc-200">{item.nodeName}</td>
                          <td className="px-5 py-3"><Pill tone={item.status === 'online' ? 'success' : 'danger'} label={item.status} /></td>
                          <td className="px-5 py-3 text-slate-600 dark:text-zinc-400">{item.cpuCount != null ? `${item.cpuCount} vCPU` : '—'}</td>
                          <td className="px-5 py-3 text-slate-600 dark:text-zinc-400">{item.totalMemory != null ? `${Math.round(item.totalMemory / 1024 / 1024 / 1024)} GB` : '—'}</td>
                        </tr>
                      ))}
                      {resourceNavSelection === 'templates' && templates.filter(item => (item.templateName || '').toLowerCase().includes(resourceSearch.toLowerCase())).map((item, idx) => (
                        <tr key={idx} className="table-row-optimized border-b border-slate-100 dark:border-theme last:border-0 group">
                          <td className="px-5 py-3 font-medium text-slate-800 dark:text-zinc-200">{item.templateName}</td>
                          <td className="px-5 py-3 text-slate-600 dark:text-zinc-400">{item.nodeName}</td>
                          <td className="px-5 py-3"><Pill tone={item.discoveredStatus === 'Active' ? 'info' : 'neutral'} label={item.discoveredStatus} /></td>
                        </tr>
                      ))}
                      {resourceNavSelection === 'networks' && networks.filter(item => (item.networkName || '').toLowerCase().includes(resourceSearch.toLowerCase())).map((item, idx) => (
                        <tr key={idx} className="table-row-optimized border-b border-slate-100 dark:border-theme last:border-0 group">
                          <td className="px-5 py-3 font-medium text-slate-800 dark:text-zinc-200">{item.networkName}</td>
                          <td className="px-5 py-3 text-slate-600 dark:text-zinc-400">{item.networkName}</td>
                          <td className="px-5 py-3 text-slate-600 dark:text-zinc-400">{item.cidr || '—'}</td>
                          <td className="px-5 py-3"><Pill tone={item.discoveredStatus === 'Active' ? 'success' : 'neutral'} label={item.discoveredStatus} /></td>
                        </tr>
                      ))}
                      {resourceNavSelection === 'datastores' && datastores.filter(item => (item.datastoreName || '').toLowerCase().includes(resourceSearch.toLowerCase())).map((item, idx) => (
                        <tr key={idx} className="table-row-optimized border-b border-slate-100 dark:border-theme last:border-0 group">
                          <td className="px-5 py-3 font-medium text-slate-800 dark:text-zinc-200">{item.datastoreName}</td>
                          <td className="px-5 py-3 text-slate-600 dark:text-zinc-400">{item.datastoreType || '—'}</td>
                          <td className="px-5 py-3 text-slate-600 dark:text-zinc-400">{item.totalSpace != null ? `${Math.round((item.totalSpace - (item.availableSpace || 0)) / 1024 / 1024 / 1024)} GB / ${Math.round(item.totalSpace / 1024 / 1024 / 1024)} GB` : '—'}</td>
                          <td className="px-5 py-3"><Pill tone={item.discoveredStatus === 'Active' ? 'success' : 'danger'} label={item.discoveredStatus} /></td>
                        </tr>
                      ))}
                      {resourceNavSelection === 'vms' && vms.filter(item => (item.vmName || '').toLowerCase().includes(resourceSearch.toLowerCase())).map((item, idx) => (
                        <tr key={idx} className="table-row-optimized border-b border-slate-100 dark:border-theme last:border-0 group">
                          <td className="px-5 py-3 font-medium text-slate-800 dark:text-zinc-200">{item.vmName}</td>
                          <td className="px-5 py-3 text-slate-600 dark:text-zinc-400 font-mono">{item.externalVmid}</td>
                          <td className="px-5 py-3 text-slate-600 dark:text-zinc-400">{item.nodeName}</td>
                          <td className="px-5 py-3 text-slate-600 dark:text-zinc-400 font-mono">{item.ipAddress || '—'}</td>
                          <td className="px-5 py-3">{vmStatusBadge(item)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {/* Empty State / Not Found */}
                  {!loading && ((resourceNavSelection === 'nodes' && nodes.filter(i => (i.nodeName || '').toLowerCase().includes(resourceSearch.toLowerCase())).length === 0) ||
                    (resourceNavSelection === 'templates' && templates.filter(i => (i.templateName || '').toLowerCase().includes(resourceSearch.toLowerCase())).length === 0) ||
                    (resourceNavSelection === 'networks' && networks.filter(i => (i.networkName || '').toLowerCase().includes(resourceSearch.toLowerCase())).length === 0) ||
                    (resourceNavSelection === 'datastores' && datastores.filter(i => (i.datastoreName || '').toLowerCase().includes(resourceSearch.toLowerCase())).length === 0) ||
                    (resourceNavSelection === 'vms' && vms.filter(i => (i.vmName || '').toLowerCase().includes(resourceSearch.toLowerCase())).length === 0)) && (
                    <div className="py-12 flex flex-col items-center justify-center text-slate-500 dark:text-zinc-400 bg-slate-50/30 dark:bg-zinc-800/30">
                      <Search size={32} className="opacity-30 mb-3" />
                      <p className="text-[14px]">{resourceSearch ? `No resources found matching "${resourceSearch}"` : 'No resources discovered yet.'}</p>
                    </div>
                  )}
                </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      </div>

      {/* Backdrops */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 dark:bg-black/40 backdrop-blur-sm z-[90] animate-in fade-in duration-300"
          onClick={onClose}
        />
      )}
    </>,
    document.body
  );
}
