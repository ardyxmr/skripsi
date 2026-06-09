import React, { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';

export default function DatastoreForm({ modal, setModal, handleAddEditDatastoreSubmit, providers, onChange }) {
  if (!modal.isOpen || modal.type !== 'datastore') return null;

  const [selectedDatastoreProvider, setSelectedDatastoreProvider] = useState(modal.data?.provider || '');
  const [selectedDatastoreNode, setSelectedDatastoreNode] = useState(modal.data?.node || '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-card rounded-modal shadow-modal border border-gray-200 dark:border-theme w-full max-w-[600px] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh]">
        <div className="shrink-0 flex items-center justify-between p-4 border-b border-gray-100 dark:border-theme">
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              {modal.mode === 'add' ? '➕ ' : '✏️ '} 
              {modal.mode === 'add' ? 'Add Datastore' : 'Edit Datastore'}
            </h3>
          </div>
          <button 
            onClick={() => setModal({ isOpen: false, type: null, mode: null, data: null })}
            className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 transition-colors bg-slate-100 hover:bg-slate-200 dark:bg-surface dark:hover:bg-slate-700 p-1.5 rounded-full"
          >
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleAddEditDatastoreSubmit} onChange={onChange} className="flex flex-col overflow-hidden min-h-0">
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 flex flex-col gap-5">
            
                  <div className="space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-theme rounded-md p-4">
                      <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 block">Datastore Information</label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Datastore Name <span className="text-rose-500">*</span></label>
                          <input type="text" name="datastoreName" defaultValue={modal.data?.datastoreName ?? modal.data?.name} required placeholder="e.g. VM-STORAGE-PROD" className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-slate-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors" />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                          <input type="text" name="description" defaultValue={modal.data?.description} placeholder="Optional details..." className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-slate-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors" />
                        </div>
                        <div>
                          <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Provider <span className="text-rose-500">*</span></label>
                          <select name="provider" value={selectedDatastoreProvider} onChange={(e) => { setSelectedDatastoreProvider(e.target.value); setSelectedDatastoreNode(''); }} required className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-slate-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors">
                            <option value="" disabled>Select provider</option>
                            {providers.filter(p => (p.status ?? p.connectionStatus) === 'Connected').map(p => (
                              <option key={p.id} value={p.providerName ?? p.name}>{p.providerName ?? p.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Node <span className="text-rose-500">*</span></label>
                          <select name="node" value={selectedDatastoreNode} onChange={(e) => setSelectedDatastoreNode(e.target.value)} required disabled={!selectedDatastoreProvider} className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-slate-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors disabled:opacity-50">
                            <option value="" disabled>Select node</option>
                            {selectedDatastoreProvider === 'Proxmox DC1' ? (
                              <>
                                <option value="pve01">pve01</option>
                                <option value="pve02">pve02</option>
                              </>
                            ) : selectedDatastoreProvider === 'Proxmox LAB' ? (
                              <>
                                <option value="pve02">pve02</option>
                                <option value="pve03">pve03</option>
                                <option value="pve-lab1">pve-lab1</option>
                              </>
                            ) : null}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Discovered Datastore <span className="text-rose-500">*</span></label>
                          <select name="providerDatastore" defaultValue={modal.data?.providerDatastore || ''} required disabled={!selectedDatastoreNode} className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-slate-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors disabled:opacity-50">
                            <option value="" disabled>Select discovered datastore</option>
                            {selectedDatastoreNode === 'pve01' ? (
                              <>
                                <option value="local-lvm">local-lvm</option>
                                <option value="local-zfs">local-zfs</option>
                              </>
                            ) : selectedDatastoreNode === 'pve02' ? (
                              <>
                                <option value="local-zfs">local-zfs</option>
                                <option value="ceph-pool">ceph-pool</option>
                              </>
                            ) : selectedDatastoreNode === 'pve03' ? (
                              <>
                                <option value="nfs-backup">nfs-backup</option>
                              </>
                            ) : selectedDatastoreNode === 'pve-lab1' ? (
                              <>
                                <option value="local-lvm">local-lvm</option>
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
          <div className="shrink-0 px-5 py-4 border-t border-gray-100 dark:border-theme flex items-center justify-end gap-3 bg-white dark:bg-card">
            <button 
              type="button" 
              onClick={() => setModal({ isOpen: false, type: null, mode: null, data: null })}
              className="px-4 py-2 text-[13px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-input transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-4 py-2 text-[13px] font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-input transition-colors shadow-sm"
            >
              {modal.mode === 'add' ? 'Save' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
