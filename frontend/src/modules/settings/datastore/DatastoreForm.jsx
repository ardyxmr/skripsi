import React, { useState, useEffect, useRef } from 'react';
import api from '../../../lib/api';
import { useNodeContext } from '../../../contexts/NodeContext';

export default function DatastoreForm({ modal, setModal, handleAddEditDatastoreSubmit, providers, onChange }) {
  const { nodes } = useNodeContext();
  const [providerId, setProviderId] = useState('');
  const [nodeId, setNodeId] = useState('');
  const [storageId, setStorageId] = useState('');
  const [datastores, setDatastores] = useState([]);
  const [loading, setLoading] = useState(false);

  // Prefill/reset ONCE per open, keyed on the item. WITHOUT this guard the effect re-runs every time
  // `nodes` live-refreshes (~10s poll) and wipes the user's in-progress provider/node/storage selection.
  const prefilledRef = useRef(null);
  useEffect(() => {
    if (!(modal.isOpen && modal.type === 'datastore')) { prefilledRef.current = null; return; }
    const key = modal.data?.id ?? 'new';
    if (prefilledRef.current === key) return;
    prefilledRef.current = key;
    setProviderId(modal.data?.providerId ?? '');
    const match = nodes.find((n) => n.providerNodeId === modal.data?.providerNodeId && String(n.providerId) === String(modal.data?.providerId));
    setNodeId(match ? match.id : '');
    // Controlled storage value: pin to this datastore's own discovered storage despite the async
    // option load (an uncontrolled select would fall back to the first storage and trip "already published").
    setStorageId(modal.data?.providerDatastoreId ?? '');
  }, [modal.isOpen, modal.type, modal.data, nodes]);

  // Discovered datastores for the selected provider.
  useEffect(() => {
    if (!modal.isOpen || !providerId) { setDatastores([]); return; }
    let active = true;
    setLoading(true);
    api.get(`/providers/${providerId}/explorer`)
      .then((d) => active && setDatastores((d.datastores || []).filter((s) => s.discoveredStatus !== 'Missing')))
      .catch(() => active && setDatastores([]))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [providerId, modal.isOpen]);

  // Grey out Save until the full provider → node → storage chain and name pass native validation.
  const formRef = useRef(null);
  const [canSave, setCanSave] = useState(false);
  const syncValidity = () => setCanSave(!!formRef.current && formRef.current.checkValidity());
  useEffect(() => { syncValidity(); }); // after every render (covers open/prefill + cascade changes)

  if (!modal.isOpen || modal.type !== 'datastore') return null;

  const inputCls = 'w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-zinc-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors';

  // Provider → Node → discovered storage cascade.
  const providerNodes = nodes.filter((n) => String(n.providerId) === String(providerId));
  const selectedNode = nodes.find((n) => String(n.id) === String(nodeId));
  const visibleDatastores = datastores.filter((s) => selectedNode == null || s.providerNodeId === selectedNode.providerNodeId);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-card rounded-modal shadow-modal border border-gray-200 dark:border-theme w-full max-w-[600px] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh]">
        <div className="shrink-0 flex items-center justify-between p-4 border-b border-gray-100 dark:border-theme">
          <h3 className="font-semibold text-slate-800 dark:text-zinc-100">{modal.mode === 'add' ? 'Add Datastore' : 'Edit Datastore'}</h3>
          <button onClick={() => setModal({ isOpen: false, type: null, mode: null, data: null })} className="p-1.5 text-slate-400 hover:text-slate-500 dark:hover:text-zinc-300 transition-colors bg-slate-100 hover:bg-slate-200 dark:bg-surface dark:hover:bg-zinc-700 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <form ref={formRef} onSubmit={handleAddEditDatastoreSubmit} onChange={(e) => { onChange?.(e); syncValidity(); }} className="flex flex-col overflow-hidden min-h-0">
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 flex flex-col gap-5">
            <div className="bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-theme rounded-md p-4">
              <label className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-4 block">Datastore Information</label>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[12px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">Datastore Name <span className="text-rose-500">*</span></label>
                  <input type="text" name="datastoreName" defaultValue={modal.data?.datastoreName ?? modal.data?.name} required placeholder="e.g. Standard Storage" className={inputCls} />
                </div>
                <div className="col-span-2">
                  <label className="block text-[12px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">Description</label>
                  <input type="text" name="description" defaultValue={modal.data?.description} placeholder="Optional details..." className={inputCls} />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">Provider <span className="text-rose-500">*</span></label>
                  <select name="providerId" value={providerId} onChange={(e) => { setProviderId(e.target.value); setNodeId(''); setStorageId(''); }} required className={`${inputCls} cursor-pointer`}>
                    <option value="" disabled>Select provider</option>
                    {providers.filter((p) => (p.status ?? p.connectionStatus) === 'Connected').map((p) => (
                      <option key={p.id} value={p.id}>{p.providerName ?? p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">Published Node <span className="text-rose-500">*</span></label>
                  <select value={nodeId} onChange={(e) => { setNodeId(e.target.value); setStorageId(''); }} required disabled={!providerId} className={`${inputCls} cursor-pointer disabled:opacity-50`}>
                    <option value="" disabled>{!providerId ? 'Select a provider first' : providerNodes.length === 0 ? 'No published nodes — publish one first' : 'Select published node'}</option>
                    {providerNodes.map((n) => (
                      <option key={n.id} value={n.id}>{n.name}{n.rawNode ? ` (${n.rawNode})` : ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">Discovered Storage <span className="text-rose-500">*</span></label>
                  <select name="providerDatastoreId" value={storageId} onChange={(e) => setStorageId(e.target.value)} required disabled={!nodeId || loading} className={`${inputCls} cursor-pointer disabled:opacity-50`}>
                    <option value="" disabled>{!providerId ? 'Select a provider first' : !nodeId ? 'Select a node first' : loading ? 'Loading…' : 'Select discovered storage'}</option>
                    {visibleDatastores.map((s) => (
                      <option key={s.id} value={s.id}>{s.datastoreName} ({s.nodeName}{s.datastoreType ? ` · ${s.datastoreType}` : ''})</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[12px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">Status</label>
                  <select name="status" defaultValue={modal.data?.status || 'Active'} className={`${inputCls} cursor-pointer`}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="shrink-0 px-5 py-4 border-t border-gray-100 dark:border-theme flex items-center justify-end gap-3 bg-white dark:bg-card">
            <button type="button" onClick={() => setModal({ isOpen: false, type: null, mode: null, data: null })} className="px-4 py-2 text-[13px] font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-input transition-colors">Cancel</button>
            <button type="submit" disabled={!canSave} className="px-4 py-2 text-[13px] font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-input transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600">{modal.mode === 'add' ? 'Save' : 'Update'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
