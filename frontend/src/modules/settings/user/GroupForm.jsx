import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function GroupForm({ mode, data, onClose, onSubmit, onChange, users }) {
  // Grey out Save until the form's required fields pass native validation.
  const formRef = useRef(null);
  const [canSave, setCanSave] = useState(false);
  const syncValidity = () => setCanSave(!!formRef.current && formRef.current.checkValidity());
  useEffect(() => { syncValidity(); }); // after every render (covers open/prefill)

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const submitData = Object.fromEntries(formData);
    // The field is named group_name (a control named "name" shadows the form's DOM `form.name`);
    // remap back to the API key the backend expects.
    submitData.name = submitData.group_name;
    delete submitData.group_name;
    onSubmit(submitData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-card rounded-modal shadow-modal border border-gray-200 dark:border-theme w-full max-w-[450px] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-theme">
          <h3 className="font-semibold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
            {mode === 'add' ? '➕ Create Group' : '✏️ Edit Group'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-700">
            <X size={18} />
          </button>
        </div>
        
        <form ref={formRef} onSubmit={handleSubmit} onChange={(e) => { onChange?.(e); syncValidity(); }} className="p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-slate-700 dark:text-zinc-300">Group Name</label>
            <input name="group_name" required defaultValue={data?.name} className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-zinc-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors" placeholder="e.g. RTGS Team" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-slate-700 dark:text-zinc-300">Room / Floor</label>
              <input name="room" required defaultValue={data?.room} className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-zinc-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors" placeholder="e.g. Floor 15" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-slate-700 dark:text-zinc-300">Manager Assignment</label>
              <select name="managerId" defaultValue={data?.managerId || ""} className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-zinc-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors">
                <option value="">Not Assigned</option>
                {users.filter(u => !u.deletedAt).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-slate-700 dark:text-zinc-300">Description</label>
            <textarea name="description" rows={3} defaultValue={data?.description} className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-zinc-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors resize-none" placeholder="Group description..." />
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
