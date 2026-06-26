import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function RoleForm({ mode, data, onClose, onSubmit, onChange }) {
  // Grey out Save until the form's required fields pass native validation.
  const formRef = useRef(null);
  const [canSave, setCanSave] = useState(false);
  const syncValidity = () => setCanSave(!!formRef.current && formRef.current.checkValidity());
  useEffect(() => { syncValidity(); }); // after every render (covers open/prefill)

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const submitData = Object.fromEntries(formData.entries());
    submitData.permissions = formData.getAll('permissions');
    // The field is named role_name (a control named "name" shadows the form's DOM `form.name`);
    // remap back to the API key the backend expects.
    submitData.name = submitData.role_name;
    delete submitData.role_name;
    onSubmit(submitData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-card rounded-modal shadow-modal border border-gray-200 dark:border-theme w-full max-w-[450px] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-theme">
          <h3 className="font-semibold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
            {mode === 'add' ? '➕ Create Role' : '✏️ Edit Role'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-700">
            <X size={18} />
          </button>
        </div>
        
        <form ref={formRef} onSubmit={handleSubmit} onChange={(e) => { onChange?.(e); syncValidity(); }} className="p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-slate-700 dark:text-zinc-300">Role Name</label>
            <input name="role_name" required defaultValue={data?.name} className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-zinc-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors" placeholder="e.g. Developer" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-slate-700 dark:text-zinc-300">Description</label>
            <textarea name="description" rows={3} defaultValue={data?.description} className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-zinc-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors resize-none" placeholder="Role description..." />
          </div>
          
          <div className="mt-2 bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-theme rounded-md p-3">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block">Permission Preview</label>
            <div className="grid grid-cols-2 gap-2 text-[12px] text-slate-700 dark:text-zinc-300">
              <label className="flex items-center gap-2"><input type="checkbox" name="permissions" value="Provision VM" defaultChecked={data?.permissions?.includes('Provision VM') ?? false} className="rounded border-slate-300 dark:border-theme bg-transparent text-blue-600" /> Provision VM</label>
              <label className="flex items-center gap-2"><input type="checkbox" name="permissions" value="Inventory" defaultChecked={data?.permissions?.includes('Inventory') ?? false} className="rounded border-slate-300 dark:border-theme bg-transparent text-blue-600" /> Inventory</label>
              <label className="flex items-center gap-2"><input type="checkbox" name="permissions" value="Approval" defaultChecked={data?.permissions?.includes('Approval') ?? false} className="rounded border-slate-300 dark:border-theme bg-transparent text-blue-600" /> Approval</label>
              <label className="flex items-center gap-2"><input type="checkbox" name="permissions" value="Settings" defaultChecked={data?.permissions?.includes('Settings') ?? false} className="rounded border-slate-300 dark:border-theme bg-transparent text-blue-600" /> Settings</label>
            </div>
          </div>

          <div className="flex items-center justify-end mt-6 pt-4 border-t border-gray-100 dark:border-theme gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-[13px] font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-input transition-colors">Cancel</button>
            <button type="submit" disabled={!canSave} className="px-4 py-2 text-[13px] font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-input transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600">
              {mode === 'add' ? 'Save' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
