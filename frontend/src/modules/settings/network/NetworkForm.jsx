import React, { useState, useEffect } from 'react';

export default function NetworkForm({ modal, setModal, handleAddEditNetworkSubmit, providers, onChange }) {
  const [selectedNetworkProvider, setSelectedNetworkProvider] = useState('');
  const [selectedNetworkNode, setSelectedNetworkNode] = useState('');

  // Sync state with modal data when it opens
  useEffect(() => {
    if (modal.isOpen && modal.type === 'network') {
      setSelectedNetworkProvider(modal.data?.provider || '');
      setSelectedNetworkNode(modal.data?.node || '');
    }
  }, [modal.isOpen, modal.type, modal.data]);

  if (!modal.isOpen || modal.type !== 'network') return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-card rounded-modal shadow-modal border border-gray-200 dark:border-theme w-full overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-w-[600px]">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-theme bg-slate-50/50 dark:bg-surface/50">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">
            {modal.mode === 'add' ? 'Add Network' : 'Edit Network'}
          </h3>
          <button 
            onClick={() => setModal({ isOpen: false, type: null, mode: null, data: null })}
            className="p-1.5 text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 transition-colors bg-slate-100 hover:bg-slate-200 dark:bg-surface dark:hover:bg-slate-700 p-1.5 rounded-full"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <form onSubmit={handleAddEditNetworkSubmit} onChange={onChange} className="flex flex-col max-h-[85vh]">
          <div className="p-5 overflow-y-auto custom-scrollbar">
            <div className="space-y-4">
              <div>
                <h4 className="text-[13px] font-bold text-slate-800 dark:text-slate-200 mb-3 border-b border-gray-100 dark:border-theme pb-1">Network Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Network Name <span className="text-rose-500">*</span></label>
                    <input type="text" name="name" defaultValue={modal.data?.name} required placeholder="e.g. Production VM Network" className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-slate-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                    <input type="text" name="description" defaultValue={modal.data?.description} placeholder="Optional details..." className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-slate-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Provider <span className="text-rose-500">*</span></label>
                    <select name="provider" value={selectedNetworkProvider} onChange={(e) => { setSelectedNetworkProvider(e.target.value); setSelectedNetworkNode(''); }} required className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-slate-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors">
                      <option value="" disabled>Select provider</option>
                      {providers.filter(p => p.connectionStatus === 'Connected').map(p => (
                        <option key={p.id} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Node <span className="text-rose-500">*</span></label>
                    <select name="node" value={selectedNetworkNode} onChange={(e) => setSelectedNetworkNode(e.target.value)} required disabled={!selectedNetworkProvider} className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-slate-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors disabled:opacity-50">
                      <option value="" disabled>Select node</option>
                      {selectedNetworkProvider === 'Proxmox DC1' ? (
                        <>
                          <option value="pve01">pve01</option>
                          <option value="pve02">pve02</option>
                        </>
                      ) : selectedNetworkProvider === 'Proxmox LAB' ? (
                        <>
                          <option value="pve02">pve02</option>
                          <option value="pve03">pve03</option>
                          <option value="pve-lab1">pve-lab1</option>
                        </>
                      ) : null}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Provider Network <span className="text-rose-500">*</span></label>
                    <select name="providerNetwork" defaultValue={modal.data?.providerNetwork || ''} required disabled={!selectedNetworkNode} className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-slate-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors disabled:opacity-50">
                      <option value="" disabled>Select discovered network</option>
                      {selectedNetworkNode === 'pve01' ? (
                        <>
                          <option value="vmbr0">vmbr0</option>
                          <option value="vmbr1">vmbr1</option>
                        </>
                      ) : selectedNetworkNode === 'pve02' ? (
                        <>
                          <option value="vmbr1">vmbr1</option>
                          <option value="vmbr3">vmbr3</option>
                        </>
                      ) : selectedNetworkNode === 'pve03' ? (
                        <>
                          <option value="vmbr2">vmbr2</option>
                        </>
                      ) : selectedNetworkNode === 'pve-lab1' ? (
                        <>
                          <option value="vmbr0">vmbr0</option>
                        </>
                      ) : null}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-2">Environment <span className="text-rose-500">*</span></label>
                    <div className="flex flex-col gap-2">
                      {['Production', 'Development', 'Staging', 'Testing'].map(env => (
                        <label key={env} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" name="environment" value={env} defaultChecked={Array.isArray(modal.data?.environment) ? modal.data.environment.includes(env) : modal.data?.environment === env} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4" />
                          <span className="text-[13px] text-slate-700 dark:text-slate-300">{env}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-2">Resource Tiers</label>
                    <div className="flex flex-col gap-2">
                      {['Bronze', 'Silver', 'Gold'].map(tier => (
                        <label key={tier} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" name="tiers" value={tier} defaultChecked={modal.data?.tiers?.includes(tier)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4" />
                          <span className="text-[13px] text-slate-700 dark:text-slate-300">{tier}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                    <select name="status" defaultValue={modal.data?.status || 'Active'} className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-slate-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors">
                      <option value="Active">Active</option>
                      <option value="Disabled">Disabled</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-gray-100 dark:border-theme bg-slate-50 dark:bg-surface flex justify-end gap-3 shrink-0">
            <button 
              type="button" 
              onClick={() => setModal({ isOpen: false, type: null, mode: null, data: null })}
              className="px-4 py-2 text-[13px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-transparent dark:hover:border-theme"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-4 py-2 text-[13px] font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors shadow-sm shadow-blue-500/20"
            >
              {modal.mode === 'add' ? 'Add Network' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
