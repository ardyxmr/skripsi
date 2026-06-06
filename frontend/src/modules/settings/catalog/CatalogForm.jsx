import React from 'react';
import { createPortal } from 'react-dom';
import { X, Play, Loader2, CheckCircle2 } from 'lucide-react';

export default function CatalogForm({ modal, setModal, handleAddEditCatalogSubmit, providers, onChange }) {
  if (!modal.isOpen || modal.type !== 'catalog') return null;

  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`bg-white dark:bg-card rounded-modal shadow-modal border border-gray-200 dark:border-theme w-full overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-w-[600px]`}>
        
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-theme">
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
        
        <div className="p-5 flex-1 overflow-y-auto custom-scrollbar max-h-[calc(100vh-200px)]">
          <form onSubmit={handleAddEditCatalogSubmit} onChange={onChange} id="catalogForm">
            <div className="space-y-4">
              <div>
                <h4 className="text-[13px] font-bold text-slate-800 dark:text-slate-200 mb-3 border-b border-gray-100 dark:border-theme pb-1">Catalog Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Catalog Name <span className="text-rose-500">*</span></label>
                    <input type="text" name="name" defaultValue={modal.data?.name} required placeholder="e.g. Ubuntu Production" className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-slate-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors shadow-sm" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                    <input type="text" name="description" defaultValue={modal.data?.description} placeholder="Optional details..." className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-slate-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Provider <span className="text-rose-500">*</span></label>
                    <select name="provider" defaultValue={modal.data?.provider || ''} required className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-slate-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors shadow-sm cursor-pointer">
                      <option value="" disabled>Select provider</option>
                      {providers.map(p => (
                        <option key={p.id} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Template <span className="text-rose-500">*</span></label>
                    <select name="template" defaultValue={modal.data?.template || ''} required className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-slate-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors shadow-sm cursor-pointer">
                      <option value="" disabled>Select template</option>
                      <option value="ubuntu-22-template">ubuntu-22-template</option>
                      <option value="win-2022-template">win-2022-template</option>
                      <option value="rocky-9-template">rocky-9-template</option>
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
              <div>
                <h4 className="text-[13px] font-bold text-slate-800 dark:text-slate-200 mb-3 border-b border-gray-100 dark:border-theme pb-1">Assignments</h4>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-2">Environments</label>
                    <div className="flex flex-col gap-2">
                      {['Production', 'Development', 'Staging', 'Testing'].map(env => (
                        <label key={env} className="flex items-center gap-2 text-[13px] text-slate-700 dark:text-slate-300 cursor-pointer">
                          <input type="checkbox" name="environment" value={env} defaultChecked={modal.data?.environments?.includes(env)} className="rounded text-blue-600 focus:ring-blue-500 bg-page border-theme cursor-pointer" />
                          {env}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-2">Resource Tiers</label>
                    <div className="flex flex-col gap-2">
                      {['Bronze', 'Silver', 'Gold'].map(tier => (
                        <label key={tier} className="flex items-center gap-2 text-[13px] text-slate-700 dark:text-slate-300 cursor-pointer">
                          <input type="checkbox" name="tiers" value={tier} defaultChecked={modal.data?.tiers?.includes(tier)} className="rounded text-blue-600 focus:ring-blue-500 bg-page border-theme cursor-pointer" />
                          {tier}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Form Actions */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-theme">
              <div className="flex items-center gap-3">
                <button type="button" className="px-3 py-2 text-[13px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-surface dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-input transition-colors">
                  Preview Catalog
                </button>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setModal({ isOpen: false, type: null, mode: null, data: null })} className="px-4 py-2 text-[13px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-input transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 text-[13px] font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-input transition-colors shadow-sm">
                  {modal.mode === 'add' ? 'Save' : 'Update'}
                </button>
              </div>
            </div>
          </form>
        </div>

      </div>
    </div>,
    document.body
  );
}
