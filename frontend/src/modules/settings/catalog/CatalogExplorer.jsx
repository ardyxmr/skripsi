import React, { useEffect } from 'react';
import { Layers, Globe, Server, Database, Cloud, AlertCircle, Clock, X } from 'lucide-react';
import { useEnvironmentContext } from '../../../contexts/EnvironmentContext';
import { useNodeContext } from '../../../contexts/NodeContext';
import { environmentsForNode } from '../../../lib/nodeAssignments';

export default function CatalogExplorer({ catalogDrawer, setCatalogDrawer }) {
  const { environments } = useEnvironmentContext();
  const { nodes } = useNodeContext();
  // Environment Assignments are derived: a catalog belongs to an environment iff its
  // node is among that environment's allowed published nodes (etc.txt item 4).
  const assignedEnvs = environmentsForNode(catalogDrawer.catalog?.providerNodeId, environments, nodes);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && catalogDrawer.isOpen) {
        setCatalogDrawer({ isOpen: false, catalog: null });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [catalogDrawer.isOpen, setCatalogDrawer]);

  return (
    <div className={`fixed inset-y-0 right-0 w-[800px] bg-slate-50 dark:bg-[#0f172a] shadow-2xl z-[150] transform transition-transform duration-300 ease-in-out flex flex-col ${catalogDrawer.isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      {catalogDrawer.catalog && (
        <div className="flex flex-col h-full h-screen overflow-hidden">
          {/* Header */}
          <div className="bg-white dark:bg-card border-b border-slate-200 dark:border-theme p-6 shrink-0 flex items-start justify-between z-10 shadow-sm">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 rounded-lg">
                  <Layers size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{catalogDrawer.catalog.name}</h2>
                  <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">{catalogDrawer.catalog.description || 'No description provided'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${catalogDrawer.catalog.status === 'Active' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' : catalogDrawer.catalog.status === 'Offline / Missing' ? 'bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400' : 'bg-slate-50 border border-slate-200 text-slate-700 dark:bg-surface dark:border-theme dark:text-slate-400'}`}>
                  {catalogDrawer.catalog.status}
                </span>
                {catalogDrawer.catalog.status === 'Offline / Missing' && catalogDrawer.catalog.missingReason && (
                  <>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <span className="text-[12px] font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1.5"><AlertCircle size={14} /> {catalogDrawer.catalog.missingReason}</span>
                  </>
                )}
                <span className="text-slate-300 dark:text-slate-600">|</span>
                <span className="text-[12px] font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5"><Server size={14} className="text-slate-400" /> {catalogDrawer.catalog.activeVMs || 0} Active VMs</span>
                <span className="text-slate-300 dark:text-slate-600">|</span>
                <span className="text-[12px] font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5"><Clock size={14} className="text-slate-400" /> Updated {catalogDrawer.catalog.lastUpdated}</span>
              </div>
            </div>
            <button onClick={() => setCatalogDrawer({ isOpen: false, catalog: null })} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
            
            {/* Environment Assignments — derived from environment→node allow-lists (etc.txt item 4) */}
            <div className="bg-white dark:bg-card border border-slate-200 dark:border-theme rounded-card p-5 shadow-sm">
              <h3 className="text-[13px] font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2"><Globe size={16} className="text-blue-500" /> Environment Assignments</h3>
              <div className="flex flex-wrap gap-2">
                {assignedEnvs.length > 0 ? assignedEnvs.map(env => (
                  <span key={env} className="px-2.5 py-1 text-[12px] font-medium rounded-md border bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20">
                    {env}
                  </span>
                )) : <span className="text-[12px] text-slate-500">No environments assigned (this catalog's node is not in any environment's allow-list)</span>}
              </div>
            </div>

            {/* Template Mapping Visual */}
            <div className="bg-white dark:bg-card border border-slate-200 dark:border-theme rounded-card p-5 shadow-sm">
              <h3 className="text-[13px] font-bold text-slate-800 dark:text-slate-200 mb-4 border-b border-slate-100 dark:border-theme pb-2 flex items-center justify-between">
                <span>Template Mapping</span>
              </h3>
              
              <div className="relative mt-6 mb-4 px-4">
                {/* Visual connecting lines */}
                <div className="absolute left-[39px] top-8 bottom-8 w-0.5 bg-gradient-to-b from-blue-200 via-indigo-200 to-emerald-200 dark:from-blue-500/30 dark:via-indigo-500/30 dark:to-emerald-500/30 z-0"></div>
                
                {/* Source Provider */}
                <div className="relative z-10 flex items-start gap-4 mb-8">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 border-4 border-white dark:border-[#17243E] flex items-center justify-center shrink-0 shadow-sm text-blue-600 dark:text-blue-400">
                    <Cloud size={20} />
                  </div>
                  <div className="flex-1 bg-slate-50 dark:bg-surface border border-slate-200 dark:border-theme rounded-lg p-3">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Source Provider</div>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[14px] font-bold text-slate-800 dark:text-slate-200">{catalogDrawer.catalog.provider}</span>
                        <span className="text-[12px] text-slate-500 font-mono mt-0.5">Type: {catalogDrawer.catalog.origin || 'Proxmox'}</span>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${catalogDrawer.catalog.connectivity === 'Disconnected' ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10' : 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10'}`}>
                          {catalogDrawer.catalog.connectivity === 'Disconnected' ? 'Disconnected' : 'Connected'}
                        </span>
                        <span className="text-[10px] text-slate-400">{catalogDrawer.catalog.connectivity === 'Disconnected' ? 'Last Seen:' : 'Last Sync:'} {catalogDrawer.catalog.lastSync || 'Recently'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Source Node */}
                <div className="relative z-10 flex items-start gap-4 mb-8">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/40 border-4 border-white dark:border-[#17243E] flex items-center justify-center shrink-0 shadow-sm text-indigo-600 dark:text-indigo-400">
                    <Server size={20} />
                  </div>
                  <div className="flex-1 bg-slate-50 dark:bg-surface border border-slate-200 dark:border-theme rounded-lg p-3">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Source Node</div>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[14px] font-bold text-slate-800 dark:text-slate-200">{catalogDrawer.catalog.node || 'pve01'}</span>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded">Online</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Source Template */}
                <div className="relative z-10 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 border-4 border-white dark:border-[#17243E] flex items-center justify-center shrink-0 shadow-sm text-emerald-600 dark:text-emerald-400">
                    <Database size={20} />
                  </div>
                  <div className="flex-1 bg-slate-50 dark:bg-surface border border-slate-200 dark:border-theme rounded-lg p-3">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Published Template</div>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[14px] font-bold text-slate-800 dark:text-slate-200">{catalogDrawer.catalog.template}</span>
                        <span className="text-[12px] text-slate-500 font-mono mt-0.5">ID: {catalogDrawer.catalog.discoveryAttributes?.templateId || 'vmid-9000'}</span>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${catalogDrawer.catalog.discoveryStatus === 'Success' ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10' : 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10'}`}>
                          Discovery: {catalogDrawer.catalog.discoveryStatus || 'Success'}
                        </span>
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${catalogDrawer.catalog.status === 'Template Missing' ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10' : 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10'}`}>
                          {catalogDrawer.catalog.status === 'Template Missing' ? 'Missing' : 'Available'}
                        </span>
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
  );
}
