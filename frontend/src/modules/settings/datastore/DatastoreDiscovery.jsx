import React, { useEffect } from 'react';
import {
  X, CheckCircle2, Box, Server, Database, Share2, ServerCrash, Zap, Settings2, Globe, Clock, Shield, AlertTriangle, AlertCircle, XCircle, Cloud, HardDrive
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { useEnvironmentContext } from '../../../contexts/EnvironmentContext';
import { useNodeContext } from '../../../contexts/NodeContext';
import { environmentsForNode } from '../../../lib/nodeAssignments';

export default function DatastoreDiscovery({ datastoreDrawer, setDatastoreDrawer }) {
  const { environments } = useEnvironmentContext();
  const { nodes } = useNodeContext();
  // Derived: a datastore belongs to an environment iff its node is in that env's allow-list (etc.txt item 4).
  const assignedEnvs = environmentsForNode(datastoreDrawer.datastore?.providerNodeId, environments, nodes);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && datastoreDrawer.isOpen) {
        setDatastoreDrawer({ isOpen: false, datastore: null });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [datastoreDrawer.isOpen, setDatastoreDrawer]);

  return createPortal(
    <>
      <div className={`fixed inset-y-0 right-0 w-[800px] bg-slate-50 dark:bg-[#18181b] shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${datastoreDrawer.isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {datastoreDrawer.isOpen && (
          <div className="flex flex-col h-full h-screen overflow-hidden">
          {/* Header */}
          <div className="bg-white dark:bg-card border-b border-slate-200 dark:border-theme p-6 shrink-0 flex items-start justify-between z-10 shadow-sm relative">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 rounded-lg">
                  <Database size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100">Datastore Explorer</h2>
                  <p className="text-[13px] text-slate-500 dark:text-zinc-400 mt-1">Mapping overview for {datastoreDrawer.datastore.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${datastoreDrawer.datastore.status === 'Active' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' : datastoreDrawer.datastore.status === 'Offline / Missing' ? 'bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400' : datastoreDrawer.datastore.status === 'Low Capacity' ? 'bg-amber-50 border border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400' : 'bg-slate-50 border border-slate-200 text-slate-700 dark:bg-surface dark:border-theme dark:text-zinc-400'}`}>
                  {datastoreDrawer.datastore.status}
                </span>
                {datastoreDrawer.datastore.status === 'Offline / Missing' && datastoreDrawer.datastore.missingReason && (
                  <>
                    <span className="text-slate-300 dark:text-zinc-600">|</span>
                    <span className="text-[12px] font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1.5"><AlertCircle size={14} /> {datastoreDrawer.datastore.missingReason}</span>
                  </>
                )}
                <span className="text-slate-300 dark:text-zinc-600">|</span>
                <span className="text-[12px] font-medium text-slate-600 dark:text-zinc-400 flex items-center gap-1.5"><Server size={14} className="text-slate-400" /> {datastoreDrawer.datastore.activeVMs || 0} Active VMs</span>
                <span className="text-slate-300 dark:text-zinc-600">|</span>
                <span className="text-[12px] font-medium text-slate-600 dark:text-zinc-400 flex items-center gap-1.5"><Clock size={14} className="text-slate-400" /> Updated {datastoreDrawer.datastore.lastUpdated}</span>
              </div>
            </div>
            <button onClick={() => setDatastoreDrawer({ isOpen: false, datastore: null })} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors">
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-6">
            
            {/* Environment Assignments — derived from environment→node allow-lists (etc.txt item 4) */}
            <div className="bg-white dark:bg-card border border-slate-200 dark:border-theme rounded-card p-5 shadow-sm">
              <h3 className="text-[13px] font-bold text-slate-800 dark:text-zinc-200 mb-4 flex items-center gap-2"><Globe size={16} className="text-blue-500" /> Environment Assignments</h3>
              <div className="flex flex-wrap gap-2">
                {assignedEnvs.length > 0 ? assignedEnvs.map(env => (
                  <span key={env} className="px-2.5 py-1 text-[12px] font-medium rounded-md border bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20">
                    {env}
                  </span>
                )) : <span className="text-[12px] text-slate-500">No environments assigned (this datastore's node is not in any environment's allow-list)</span>}
              </div>
            </div>

            <div className="bg-white dark:bg-card border border-slate-200 dark:border-theme rounded-card p-5 shadow-sm">
              <h3 className="text-[13px] font-bold text-slate-800 dark:text-zinc-200 mb-4 border-b border-slate-100 dark:border-theme pb-2 flex items-center gap-2">
                <Database size={16} className="text-blue-500" /> Mapping Architecture
              </h3>
              
              <div className="relative mt-6 mb-4 px-4">
                  {/* Connecting Line */}
                  <div className="absolute left-[39px] top-[24px] bottom-[24px] w-px bg-slate-200 dark:bg-zinc-700"></div>

                  {/* Source Provider */}
                  <div className="relative z-10 flex items-start gap-4 mb-8">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 border-4 border-white dark:border-[#27272a] flex items-center justify-center shrink-0 shadow-sm text-blue-600 dark:text-blue-400">
                      <Cloud size={20} />
                    </div>
                    <div className="flex-1 bg-slate-50 dark:bg-surface border border-slate-200 dark:border-theme rounded-lg p-3">
                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Source Provider</div>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[14px] font-bold text-slate-800 dark:text-zinc-200">{datastoreDrawer.datastore.provider}</span>
                          <span className="text-[12px] text-slate-500 font-mono mt-0.5">Type: Proxmox</span>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded">Connected</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Source Node */}
                  <div className="relative z-10 flex items-start gap-4 mb-8">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/40 border-4 border-white dark:border-[#27272a] flex items-center justify-center shrink-0 shadow-sm text-indigo-600 dark:text-indigo-400">
                      <Server size={20} />
                    </div>
                    <div className="flex-1 bg-slate-50 dark:bg-surface border border-slate-200 dark:border-theme rounded-lg p-3">
                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Source Node</div>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[14px] font-bold text-slate-800 dark:text-zinc-200">{datastoreDrawer.datastore.node || 'pve01'}</span>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded">Online</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Discovered Datastore */}
                  <div className="relative z-10 flex items-start gap-4 mb-8">
                    <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/40 border-4 border-white dark:border-[#27272a] flex items-center justify-center shrink-0 shadow-sm text-amber-600 dark:text-amber-400">
                      <HardDrive size={20} />
                    </div>
                    <div className="flex-1 bg-slate-50 dark:bg-surface border border-slate-200 dark:border-theme rounded-lg p-3">
                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Discovered Datastore</div>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[14px] font-bold text-slate-800 dark:text-zinc-200">{datastoreDrawer.datastore.providerDatastore}</span>
                          <span className="text-[12px] text-slate-500 font-mono mt-1">Total: {datastoreDrawer.datastore.capacity.total} | Used: {datastoreDrawer.datastore.capacity.used} | Available: {datastoreDrawer.datastore.capacity.available}</span>
                          <span className="text-[12px] text-slate-500 font-mono mt-0.5">Datastore Type: {datastoreDrawer.datastore.type}</span>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded">Discovery: Success</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Published Datastore */}
                  <div className="relative z-10 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 border-4 border-white dark:border-[#27272a] flex items-center justify-center shrink-0 shadow-sm text-emerald-600 dark:text-emerald-400">
                      <Database size={20} />
                    </div>
                    <div className="flex-1 bg-slate-50 dark:bg-surface border border-slate-200 dark:border-theme rounded-lg p-3">
                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Published Datastore</div>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                          <span className="text-[14px] font-bold text-slate-800 dark:text-zinc-200">{datastoreDrawer.datastore.name}</span>
                          <span className="text-[12px] text-slate-500 font-mono mt-0.5">ID: ds-pub-{datastoreDrawer.datastore.id}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
          )}
      </div>

      {datastoreDrawer.isOpen && (
      <div 
        className="fixed inset-0 bg-slate-900/20 dark:bg-black/40 backdrop-blur-sm z-40 animate-in fade-in duration-300"
        onClick={() => setDatastoreDrawer({ isOpen: false, datastore: null })}
      />
      )}
    </>,
    document.body
  );
}
