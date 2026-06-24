import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Box, Clock, Shield, Server, Cloud, Share2, ShieldCheck
} from 'lucide-react';
import { useProviderContext } from '../../../contexts/ProviderContext';
import { useNodeContext } from '../../../contexts/NodeContext';

export default function EnvironmentExplorer({ envDrawer, setEnvDrawer }) {
  const { providers } = useProviderContext();
  const { nodes } = useNodeContext();

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

  // Associated Provider + Node, derived from the environment's allow-lists (etc.txt items 5 & 6).
  const assignedProviders = providers.filter(p => (env.allowedProviderIds || []).includes(p.id));
  const assignedNodes = nodes.filter(n => (env.allowedNodeIds || []).includes(n.id));
  // Counts follow live status: a disconnected provider / offline node drops out of the active tally.
  const activeProviders = assignedProviders.filter(p => p.status === 'Connected').length;
  const activeNodes = assignedNodes.filter(n => n.operational === 'Online' && n.status === 'Active').length;

  const formatExpiry = (type, value) => {
    if (type === 'lifetime') return 'Lifetime';
    return `${value} ${type.charAt(0).toUpperCase() + type.slice(1)}`;
  };

  return createPortal(
    <>
      <div className={`fixed inset-y-0 right-0 w-[800px] bg-slate-50 dark:bg-[#18181b] shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${envDrawer.isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
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
                <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100">Environment Explorer</h2>
                <p className="text-[13px] text-slate-500 dark:text-zinc-400 mt-1">Policy & mapping overview for {env.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${env.status === 'Active' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' : 'bg-slate-50 border border-slate-200 text-slate-700 dark:bg-surface dark:border-theme dark:text-zinc-400'}`}>
                {env.status}
              </span>
              <span className="text-slate-300 dark:text-zinc-600">|</span>
              <span className="text-[12px] font-medium text-slate-600 dark:text-zinc-400 flex items-center gap-1.5">
                {env.type === 'System' ? <Shield size={14} className="text-slate-400" /> : <Server size={14} className="text-slate-400" />}
                {env.type} Environment
              </span>
              <span className="text-slate-300 dark:text-zinc-600">|</span>
              <span className="text-[12px] font-medium text-slate-600 dark:text-zinc-400 flex items-center gap-1.5"><Clock size={14} className="text-slate-400" /> Updated {env.lastUpdated}</span>
            </div>
          </div>
          <button onClick={() => setEnvDrawer({ isOpen: false, environment: null })} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-6">
          
          {/* Policy Information */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white dark:bg-card border border-slate-200 dark:border-theme rounded-card p-5 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both delay-100">
              <h3 className="text-[13px] font-bold text-slate-800 dark:text-zinc-200 mb-4 flex items-center gap-2"><Clock size={16} className="text-indigo-500" /> Expiry Policy</h3>
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold text-slate-800 dark:text-zinc-200">{formatExpiry(env.expiryType, env.expiryValue)}</span>
                {env.expiryType === 'lifetime' && <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">No Expiration</span>}
              </div>
              {env.expiryType !== 'lifetime' && (
                <div className="mt-2 flex items-center gap-2 text-[12px] text-slate-600 dark:text-zinc-400">
                  <span className="font-medium">Grace period:</span>
                  <span className="px-2 py-0.5 rounded font-medium bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">{formatExpiry(env.gracePeriodType ?? 'days', env.gracePeriodValue ?? 7)}</span>
                  <span className="text-slate-400">before auto-destroy</span>
                </div>
              )}
              <p className="text-[12px] text-slate-500 mt-2">Maximum duration allowed for VMs provisioned under this environment, then a grace window before the VM is automatically destroyed.</p>
            </div>
            
            <div className="bg-white dark:bg-card border border-slate-200 dark:border-theme rounded-card p-5 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both delay-200">
              <h3 className="text-[13px] font-bold text-slate-800 dark:text-zinc-200 mb-4 flex items-center gap-2"><ShieldCheck size={16} className="text-indigo-500" /> Approval Policy</h3>
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold text-slate-800 dark:text-zinc-200">{env.approvalRequired ? 'Required' : 'Optional'}</span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${env.approvalRequired ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400'}`}>Manager Approval</span>
              </div>
              <p className="text-[12px] text-slate-500 mt-2">Determines if manager approval is required before VM provisioning begins.</p>
            </div>
          </div>

          {/* Associated Resources Topology */}
          <div className="bg-white dark:bg-card border border-slate-200 dark:border-theme rounded-card p-5 shadow-sm animate-in fade-in slide-in-from-bottom-8 duration-500 fill-mode-both delay-300">
            <h3 className="text-[13px] font-bold text-slate-800 dark:text-zinc-200 mb-4 border-b border-slate-100 dark:border-theme pb-2 flex items-center gap-2">
              <Share2 size={16} className="text-indigo-500" /> Cross-Module Usage
            </h3>
            
            <div className="relative mt-6 mb-4 px-4">
                {/* Vertical Connecting Line */}
                <div className="absolute left-[39px] top-[24px] bottom-[24px] w-px bg-slate-200 dark:bg-zinc-700 animate-in fade-in duration-1000 delay-500"></div>

                {/* Environment Node (Root) */}
                <div className="relative z-10 flex items-start gap-4 mb-8 animate-in fade-in slide-in-from-left-4 duration-500 fill-mode-both delay-400">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/40 border-4 border-white dark:border-[#27272a] flex items-center justify-center shrink-0 shadow-sm text-indigo-600 dark:text-indigo-400">
                    <Box size={20} />
                  </div>
                  <div className="flex-1 bg-slate-50 dark:bg-surface border border-slate-200 dark:border-theme rounded-lg p-3">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Environment Domain</div>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[14px] font-bold text-slate-800 dark:text-zinc-200">{env.name}</span>
                        <span className="text-[12px] text-slate-500 font-mono mt-0.5">ID: env-{env.id}</span>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded">Policy Root</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Associated Providers (etc.txt item 5) */}
                <div className="relative z-10 flex items-start gap-4 mb-8 animate-in fade-in slide-in-from-left-4 duration-500 fill-mode-both delay-[500ms]">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 border-4 border-white dark:border-[#27272a] flex items-center justify-center shrink-0 shadow-sm text-blue-600 dark:text-blue-400">
                    <Cloud size={20} />
                  </div>
                  <div className="flex-1 bg-slate-50 dark:bg-surface border border-slate-200 dark:border-theme rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Associated Providers</div>
                      <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">{activeProviders} Active</span>
                    </div>
                    {assignedProviders.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {assignedProviders.map(p => (
                          <span key={p.id} className={`px-2.5 py-1 text-[12px] font-medium rounded-md border ${p.status === 'Connected' ? 'bg-white dark:bg-card text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-theme' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'}`}>
                            {p.providerName ?? p.name}{p.status !== 'Connected' ? ' · offline' : ''}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[12px] text-slate-500 italic">No providers allowed in this environment.</span>
                    )}
                  </div>
                </div>

                {/* Associated Nodes (etc.txt items 5 & 6) — count follows online/active status */}
                <div className="relative z-10 flex items-start gap-4 animate-in fade-in slide-in-from-left-4 duration-500 fill-mode-both delay-[600ms]">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/40 border-4 border-white dark:border-[#27272a] flex items-center justify-center shrink-0 shadow-sm text-indigo-600 dark:text-indigo-400">
                    <Server size={20} />
                  </div>
                  <div className="flex-1 bg-slate-50 dark:bg-surface border border-slate-200 dark:border-theme rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Associated Nodes</div>
                      <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">{activeNodes} Online</span>
                    </div>
                    {assignedNodes.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {assignedNodes.map(n => {
                          const ok = n.operational === 'Online' && n.status === 'Active';
                          return (
                            <span key={n.id} className={`px-2.5 py-1 text-[12px] font-medium rounded-md border ${ok ? 'bg-white dark:bg-card text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-theme' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'}`}>
                              {n.name}{n.rawNode ? ` · ${n.rawNode}` : ''}{!ok ? ` · ${n.operational === 'Online' ? n.status : n.operational}` : ''}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-[12px] text-slate-500 italic">No nodes allowed in this environment.</span>
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
