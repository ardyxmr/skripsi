import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';
import api from '../../../lib/api';
import { useNodeContext } from '../../../contexts/NodeContext';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB — any size is accepted; the server resizes to 512×512

export default function CatalogForm({ modal, setModal, handleAddEditCatalogSubmit, providers, onChange }) {
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [imgError, setImgError] = useState('');

  // Provider → Node → Template cascade (a catalog is bound to a published node;
  // templates are filtered to that node's discovered resources).
  const { nodes } = useNodeContext();
  const [providerId, setProviderId] = useState('');
  const [nodeId, setNodeId] = useState('');
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Reset image + cascade state whenever the modal opens.
  useEffect(() => {
    if (modal.isOpen && modal.type === 'catalog') {
      setPreview(modal.data?.catalogImage || modal.data?.catalog_image || null);
      setImgError('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setProviderId(modal.data?.providerId ?? '');
      // Pre-select the published node that abstracts this catalog's discovered node.
      const match = nodes.find((n) => n.providerNodeId === modal.data?.providerNodeId && String(n.providerId) === String(modal.data?.providerId));
      setNodeId(match ? match.id : '');
    }
  }, [modal.isOpen, modal.type, modal.data, nodes]);

  // Load discovered templates for the selected provider.
  useEffect(() => {
    if (!modal.isOpen || !providerId) { setTemplates([]); return; }
    let active = true;
    setLoadingTemplates(true);
    api.get(`/providers/${providerId}/explorer`)
      .then((d) => active && setTemplates((d.templates || []).filter((t) => t.discoveredStatus !== 'Missing')))
      .catch(() => active && setTemplates([]))
      .finally(() => active && setLoadingTemplates(false));
    return () => { active = false; };
  }, [providerId, modal.isOpen]);

  const resetToExisting = () => setPreview(modal.data?.catalogImage || modal.data?.catalog_image || null);

  // Validate type + size only. ANY dimensions are accepted — the server normalizes the upload to a
  // 512×512 PNG (fit-and-center), so we just preview whatever the user picked.
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    setImgError('');
    if (!file) { resetToExisting(); return; }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setImgError('Use a PNG, JPG/JPEG, or WEBP image.');
      e.target.value = '';
      resetToExisting();
      return;
    }
    if (file.size > MAX_BYTES) {
      setImgError('Image must be 8 MB or smaller.');
      e.target.value = '';
      resetToExisting();
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setPreview(url); // any size — server resizes on upload
    };
    img.onerror = () => {
      setImgError('Could not read that image file.');
      URL.revokeObjectURL(url);
      e.target.value = '';
      resetToExisting();
    };
    img.src = url;
  };

  const handleRemoveImage = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
    setPreview(null);
    setImgError('');
  };

  if (!modal.isOpen || modal.type !== 'catalog') return null;

  // Published nodes for the chosen provider; the selected one filters the templates.
  const providerNodes = nodes.filter((n) => String(n.providerId) === String(providerId));
  const selectedNode = nodes.find((n) => String(n.id) === String(nodeId));
  const visibleTemplates = templates.filter((t) => selectedNode == null || t.providerNodeId === selectedNode.providerNodeId);

  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-card rounded-modal shadow-modal border border-gray-200 dark:border-theme w-full max-w-[600px] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh]">
        
        <div className="shrink-0 flex items-center justify-between p-4 border-b border-gray-100 dark:border-theme">
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">
              {modal.mode === 'add' ? 'Add Catalog' : 'Edit Catalog'}
            </h3>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1">
              Configure catalog mapping to map provider templates to environments
            </p>
          </div>
          <button onClick={() => setModal({ isOpen: false, type: null, mode: null, data: null })} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors">
            <X size={16} />
          </button>
        </div>
        
        <form onSubmit={handleAddEditCatalogSubmit} onChange={onChange} id="catalogForm" className="flex flex-col overflow-hidden min-h-0">
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 flex flex-col gap-5">
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-theme rounded-md p-4">
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 block">Catalog Information</label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Catalog Name <span className="text-rose-500">*</span></label>
                    <input type="text" name="catalogName" defaultValue={modal.data?.catalogName ?? modal.data?.name} required placeholder="e.g. Ubuntu Production" className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-slate-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors shadow-sm" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                    <input type="text" name="catalogDescription" defaultValue={modal.data?.catalogDescription ?? modal.data?.description} placeholder="Optional details..." className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-slate-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Provider <span className="text-rose-500">*</span></label>
                    <select name="providerId" value={providerId} onChange={(e) => { setProviderId(e.target.value); setNodeId(''); }} required className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-slate-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors shadow-sm cursor-pointer">
                      <option value="" disabled>Select provider</option>
                      {providers.map(p => (
                        <option key={p.id} value={p.id}>{p.providerName ?? p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Published Node <span className="text-rose-500">*</span></label>
                    <select value={nodeId} onChange={(e) => setNodeId(e.target.value)} required disabled={!providerId} className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-slate-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors shadow-sm cursor-pointer disabled:opacity-50">
                      <option value="" disabled>{!providerId ? 'Select a provider first' : providerNodes.length === 0 ? 'No published nodes — publish one first' : 'Select published node'}</option>
                      {providerNodes.map((n) => (
                        <option key={n.id} value={n.id}>{n.name}{n.rawNode ? ` (${n.rawNode})` : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Template <span className="text-rose-500">*</span></label>
                    <select name="providerTemplateId" defaultValue={modal.data?.providerTemplateId || ''} required disabled={!nodeId || loadingTemplates} className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-slate-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors shadow-sm cursor-pointer disabled:opacity-50">
                      <option value="" disabled>{!providerId ? 'Select a provider first' : !nodeId ? 'Select a node first' : loadingTemplates ? 'Loading…' : 'Select discovered template'}</option>
                      {visibleTemplates.map(t => (
                        <option key={t.id} value={t.id}>{t.templateName} ({t.nodeName})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                    <select name="status" defaultValue={modal.data?.status || 'Active'} className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-slate-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors shadow-sm cursor-pointer">
                      <option value="Active">Active</option>
                      <option value="Disabled">Disabled</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-theme rounded-md p-4">
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 block">Catalog Image</label>
                <div className="flex items-start gap-4">
                  {/* Preview */}
                  <div className="w-20 h-20 shrink-0 rounded-md border border-slate-300 dark:border-theme bg-white dark:bg-page overflow-hidden flex items-center justify-center">
                    {preview ? (
                      <img src={preview} alt="Catalog preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={24} className="text-slate-300 dark:text-slate-600" />
                    )}
                  </div>

                  <div className="flex-1">
                    {/* Hidden real file input — captured by FormData as `catalogImage`. */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      name="catalogImage"
                      accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium bg-white dark:bg-page border border-slate-300 dark:border-theme text-slate-700 dark:text-slate-200 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                      >
                        <Upload size={14} /> {preview ? 'Change Image' : 'Upload Image'}
                      </button>
                      {preview && (
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-md transition-colors"
                        >
                          <Trash2 size={14} /> Remove
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">PNG, JPG/JPEG or WEBP · any size (auto-resized to 512×512) · max 8 MB.</p>
                    {imgError && <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">{imgError}</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
            
          {/* Form Actions */}
          <div className="shrink-0 px-5 py-4 border-t border-gray-100 dark:border-theme flex items-center justify-end gap-3 bg-white dark:bg-card">
              <div className="flex gap-3">
                <button type="button" onClick={() => setModal({ isOpen: false, type: null, mode: null, data: null })} className="px-4 py-2 text-[13px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-input transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 text-[13px] font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-input transition-colors shadow-sm">
                  {modal.mode === 'add' ? 'Save' : 'Update'}
                </button>
              </div>
            </div>
          </form>

      </div>
    </div>,
    document.body
  );
}
