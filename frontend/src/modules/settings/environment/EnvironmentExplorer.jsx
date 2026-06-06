import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Box, Database, Network, Grid, Clock, Shield, Server, FileText, Share2, ShieldCheck
} from 'lucide-react';
import { useCatalogContext } from '../../../contexts/CatalogContext';
import { useNetworkContext } from '../../../contexts/NetworkContext';
import { useDatastoreContext } from '../../../contexts/DatastoreContext';

export default function EnvironmentExplorer({ envDrawer, setEnvDrawer }) {
  const { catalogs } = useCatalogContext();
  const { networks } = useNetworkContext();
  const { datastores } = useDatastoreContext();

  const env = envDrawer.environment || {};

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && envDrawer.isOpen) {
        setEnvDrawer({ isOpen: false, environment: null });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [envDrawer.isOpen, setEnvDrawer]);

  // Calculate Associated Resources
  const assignedCatalogs = catalogs.filter(c => Array.isArray(c.environment) ? c.environment.includes(env.name) : c.environment === env.name);
  const assignedNetworks = networks.filter(n => Array.isArray(n.environment) ? n.environment.includes(env.name) : n.environment === env.name);
  const assignedDatastores = datastores.filter(d => Array.isArray(d.environment) ? d.environment.includes(env.name) : d.environment === env.name);

  const formatExpiry = (type, value) => {
    if (type === 'lifetime') return 'Lifetime';
    return `${value} ${type.charAt(0).toUpperCase() + type.slice(1)}`;
  };

  return createPortal(
    <>
      <div className={`fixed inset-y-0 right-0 w-[800px] bg-slate-50 dark:bg-[#0f172a] shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${envDrawer.isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {envDrawer.isOpen && env.name && (
          <div className="flex flex-col h-full h-screen overflow-hidden">
            {/* Header */}
            <div className="bg-white dark:bg-card border-b border-slate-200 dark:border-theme p-6 shrink-0 flex items-start justify-between z-10 shadow-sm relative">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 rounded-lg">
                <Box size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Environment Explorer</h2>
                <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Policy & mapping overview for {env.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${env.status === 'Active' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' : 'bg-slate-50 border border-slate-200 text-slate-700 dark:bg-surface dark:border-theme dark:text-slate-400'}`}>
                {env.status}
              </span>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <span className="text-[12px] font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                {env.type === 'System' ? <Shield size={14} className="text-slate-400" /> : <Server size={14} className="text-slate-400" />}
                {env.type} Environment
              </span>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <span className="text-[12px] font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5"><Clock size={14} className="text-slate-400" /> Updated {env.lastUpdated}</span>
            </div>
          </div>
          <button onClick={() => setEnvDrawer({ isOpen: false, environment: null })} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-6">
          
          {/* Policy Information */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white dark:bg-card border border-slate-200 dark:border-theme rounded-card p-5 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both delay-100">
              <h3 className="text-[13px] font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2"><Clock size={16} className="text-indigo-500" /> Expiry Policy</h3>
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold text-slate-800 dark:text-slate-200">{formatExpiry(env.expiryType, env.expiryValue)}</span>
                {env.expiryType === 'lifetime' && <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">No Expiration</span>}
              </div>
              <p className="text-[12px] text-slate-500 mt-2">Maximum duration allowed for VMs provisioned under this environment.</p>
            </div>
            
            <div className="bg-white dark:bg-card border border-slate-200 dark:border-theme rounded-card p-5 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both delay-200">
              <h3 className="text-[13px] font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2"><ShieldCheck size={16} className="text-indigo-500" /> Approval Policy</h3>
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold text-slate-800 dark:text-slate-200">{env.approvalRequired ? 'Required' : 'Optional'}</span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${env.approvalRequired ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>Manager Approval</span>
              </div>
              <p className="text-[12px] text-slate-500 mt-2">Determines if manager approval is required before VM provisioning begins.</p>
            </div>
          </div>

          {/* Associated Resources Topology */}
          <div className="bg-white dark:bg-card border border-slate-200 dark:border-theme rounded-card p-5 shadow-sm animate-in fade-in slide-in-from-bottom-8 duration-500 fill-mode-both delay-300">
            <h3 className="text-[13px] font-bold text-slate-800 dark:text-slate-200 mb-4 border-b border-slate-100 dark:border-theme pb-2 flex items-center gap-2">
              <Share2 size={16} className="text-indigo-500" /> Cross-Module Usage
            </h3>
            
            <div className="relative mt-6 mb-4 px-4">
                {/* Vertical Connecting Line */}
                <div className="absolute left-[39px] top-[24px] bottom-[24px] w-px bg-slate-200 dark:bg-slate-700 animate-in fade-in duration-1000 delay-500"></div>

                {/* Environment Node (Root) */}
                <div className="relative z-10 flex items-start gap-4 mb-8 animate-in fade-in slide-in-from-left-4 duration-500 fill-mode-both delay-400">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/40 border-4 border-white dark:border-[#17243E] flex items-center justify-center shrink-0 shadow-sm text-indigo-600 dark:text-indigo-400">
                    <Box size={20} />
                  </div>
                  <div className="flex-1 bg-slate-50 dark:bg-surface border border-slate-200 dark:border-theme rounded-lg p-3">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Environment Domain</div>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[14px] font-bold text-slate-800 dark:text-slate-200">{env.name}</span>
                        <span className="text-[12px] text-slate-500 font-mono mt-0.5">ID: env-{env.id}</span>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded">Policy Root</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Catalogs Node */}
                <div className="relative z-10 flex items-start gap-4 mb-8 animate-in fade-in slide-in-from-left-4 duration-500 fill-mode-both delay-[500ms]">
                  <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/40 border-4 border-white dark:border-[#17243E] flex items-center justify-center shrink-0 shadow-sm text-purple-600 dark:text-purple-400">
                    <Grid size={20} />
                  </div>
                  <div className="flex-1 bg-slate-50 dark:bg-surface border border-slate-200 dark:border-theme rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Associated Catalogs</div>
                      <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">{assignedCatalogs.length} Active</span>
                    </div>
                    {assignedCatalogs.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {assignedCatalogs.map(cat => (
                          <span key={cat.id} className="px-2.5 py-1 text-[12px] font-medium rounded-md border bg-white dark:bg-card text-slate-700 dark:text-slate-300 border-slate-200 dark:border-theme">
                            {cat.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[12px] text-slate-500 italic">No catalogs assigned to this environment.</span>
                    )}
                  </div>
                </div>

                {/* Networks Node */}
                <div className="relative z-10 flex items-start gap-4 mb-8 animate-in fade-in slide-in-from-left-4 duration-500 fill-mode-both delay-[600ms]">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 border-4 border-white dark:border-[#17243E] flex items-center justify-center shrink-0 shadow-sm text-blue-600 dark:text-blue-400">
                    <Network size={20} />
                  </div>
                  <div className="flex-1 bg-slate-50 dark:bg-surface border border-slate-200 dark:border-theme rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Associated Networks</div>
                      <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">{assignedNetworks.length} Active</span>
                    </div>
                    {assignedNetworks.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {assignedNetworks.map(net => (
                          <span key={net.id} className="px-2.5 py-1 text-[12px] font-medium rounded-md border bg-white dark:bg-card text-slate-700 dark:text-slate-300 border-slate-200 dark:border-theme">
                            {net.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[12px] text-slate-500 italic">No networks assigned to this environment.</span>
                    )}
                  </div>
                </div>

                {/* Datastores Node */}
                <div className="relative z-10 flex items-start gap-4 animate-in fade-in slide-in-from-left-4 duration-500 fill-mode-both delay-[700ms]">
                  <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/40 border-4 border-white dark:border-[#17243E] flex items-center justify-center shrink-0 shadow-sm text-amber-600 dark:text-amber-400">
                    <Database size={20} />
                  </div>
                  <div className="flex-1 bg-slate-50 dark:bg-surface border border-slate-200 dark:border-theme rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Associated Datastores</div>
                      <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">{assignedDatastores.length} Active</span>
                    </div>
                    {assignedDatastores.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {assignedDatastores.map(ds => (
                          <span key={ds.id} className="px-2.5 py-1 text-[12px] font-medium rounded-md border bg-white dark:bg-card text-slate-700 dark:text-slate-300 border-slate-200 dark:border-theme">
                            {ds.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[12px] text-slate-500 italic">No datastores assigned to this environment.</span>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
          
        </div>
        )}
      </div>

      {/* Backdrop */}
      {envDrawer.isOpen && (
      <div 
        className="fixed inset-0 bg-slate-900/20 dark:bg-black/40 backdrop-blur-sm z-40 animate-in fade-in duration-300"
        onClick={() => setEnvDrawer({ isOpen: false, environment: null })}
      />
      )}
    </>,
    document.body
  );
}
