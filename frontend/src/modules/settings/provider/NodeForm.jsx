import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';

// Add/Edit a published node — parallel to DatastoreForm. Provider → discovered
// provider_nodes cascade via /providers/{id}/explorer; submits IDs only.
export default function NodeForm({ isOpen, mode, data, providers, publishedNodeIds = [], onSubmit, onClose, onChange }) {
  const [providerId, setProviderId] = useState('');
  const [nodeId, setNodeId] = useState('');          // selected discovered node (controlled → gates Save)
  const [nodeName, setNodeName] = useState('');
  const [discoveredNodes, setDiscoveredNodes] = useState([]);
  const [loading, setLoading] = useState(false);

  // Seed fields when the modal opens (edit prefills; add starts empty).
  useEffect(() => {
    if (isOpen) {
      setProviderId(data?.providerId ?? '');
      setNodeId(data?.providerNodeId ?? '');
      setNodeName(data?.nodeName ?? data?.name ?? '');
    }
  }, [isOpen, data]);

  // Discovered nodes for the selected provider (the raw pveNN list).
  useEffect(() => {
    if (!isOpen || !providerId) { setDiscoveredNodes([]); return; }
    let active = true;
    setLoading(true);
    api.get(`/providers/${providerId}/explorer`)
      .then((d) => active && setDiscoveredNodes((d.nodes || []).filter((n) => n.discoveredStatus !== 'Missing')))
      .catch(() => active && setDiscoveredNodes([]))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [providerId, isOpen]);

  if (!isOpen) return null;

  // A discovered node can back only ONE published node (1 node → 1 published node), so hide ones
  // already published — except the one this row is currently bound to (so edit keeps its option).
  const editingNodeId = data?.providerNodeId ?? null;
  const selectableNodes = discoveredNodes.filter(
    (n) => !publishedNodeIds.includes(n.id) || n.id === editingNodeId,
  );
  const allPublished = !loading && discoveredNodes.length > 0 && selectableNodes.length === 0;
  // Save is only meaningful when a real discovered node is chosen AND a name is given. Gating the
  // button here means the form can never submit in an invalid state — which both blocks empty
  // "saves" and prevents the native-submit navigation glitch (lost ?tab → User Management).
  const canSave = !!nodeId && !!nodeName.trim();

  const inputCls = 'w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-zinc-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-card rounded-modal shadow-modal border border-gray-200 dark:border-theme w-full max-w-[600px] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh]">
        <div className="shrink-0 flex items-center justify-between p-4 border-b border-gray-100 dark:border-theme">
          <h3 className="font-semibold text-slate-800 dark:text-zinc-100">{mode === 'add' ? 'Add Node' : 'Edit Node'}</h3>
          <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-500 dark:hover:text-zinc-300 transition-colors bg-slate-100 hover:bg-slate-200 dark:bg-surface dark:hover:bg-zinc-700 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <form onSubmit={onSubmit} onChange={onChange} className="flex flex-col overflow-hidden min-h-0">
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 flex flex-col gap-5">
            <div className="bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-theme rounded-md p-4">
              <label className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-4 block">Node Information</label>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[12px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">Node Name <span className="text-rose-500">*</span></label>
                  <input type="text" name="nodeName" value={nodeName} onChange={(e) => setNodeName(e.target.value)} required placeholder="e.g. Jakarta Zone A" className={inputCls} />
                </div>
                <div className="col-span-2">
                  <label className="block text-[12px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">Description</label>
                  <input type="text" name="description" defaultValue={data?.description} placeholder="Optional details..." className={inputCls} />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">Provider <span className="text-rose-500">*</span></label>
                  <select name="providerId" value={providerId} onChange={(e) => { setProviderId(e.target.value); setNodeId(''); }} required className={`${inputCls} cursor-pointer`}>
                    <option value="" disabled>Select provider</option>
                    {providers.filter((p) => (p.status ?? p.connectionStatus) === 'Connected').map((p) => (
                      <option key={p.id} value={p.id}>{p.providerName ?? p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">Discovered Node <span className="text-rose-500">*</span></label>
                  <select name="providerNodeId" value={nodeId} onChange={(e) => setNodeId(e.target.value)} required disabled={!providerId || loading || allPublished} className={`${inputCls} cursor-pointer disabled:opacity-50`}>
                    <option value="" disabled>{!providerId ? 'Select a provider first' : loading ? 'Loading…' : allPublished ? 'All discovered nodes already published' : 'Select discovered node'}</option>
                    {selectableNodes.map((n) => (
                      <option key={n.id} value={n.id}>{n.nodeName}{n.cpuCount ? ` (${n.cpuCount} vCPU)` : ''}</option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">{allPublished ? 'Every discovered node on this provider is already published. One node can be published only once.' : 'The raw hypervisor node this friendly name abstracts — already-published nodes are hidden.'}</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-[12px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">Status</label>
                  <select name="status" defaultValue={data?.status === 'Inactive' ? 'Inactive' : 'Active'} className={`${inputCls} cursor-pointer`}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">Publishing makes the node Active; Inactive unpublishes it from the wizard.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="shrink-0 px-5 py-4 border-t border-gray-100 dark:border-theme flex items-center justify-end gap-3 bg-white dark:bg-card">
            <button type="button" onClick={onClose} className="px-4 py-2 text-[13px] font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-input transition-colors">Cancel</button>
            <button type="submit" disabled={!canSave} className="px-4 py-2 text-[13px] font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-input transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600">{mode === 'add' ? 'Save' : 'Update'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
