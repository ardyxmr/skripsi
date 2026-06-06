import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function UserForm({ mode, data, onClose, onSubmit, onChange, groups, roles }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const submitData = Object.fromEntries(formData);
    onSubmit(submitData);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-card rounded-modal shadow-modal border border-gray-200 dark:border-theme w-full max-w-[450px] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-theme">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            {mode === 'add' ? '➕ Create User' : '✏️ Edit User'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700">
            <X size={18} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} onChange={onChange} className="p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-slate-700 dark:text-slate-300">Full Name</label>
            <input name="name" required defaultValue={data?.name} className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-slate-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors" placeholder="e.g. John Doe" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-slate-700 dark:text-slate-300">Email</label>
            <input type="email" name="email" required defaultValue={data?.email} className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-slate-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors" placeholder="john@example.com" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-slate-700 dark:text-slate-300">Group</label>
              <select name="groupId" required defaultValue={data?.groupId} className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-slate-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors">
                <option value="">Select Group</option>
                {groups.filter(g => !g.deletedAt).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-slate-700 dark:text-slate-300">Role</label>
              <select name="roleId" required defaultValue={data?.roleId} className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-slate-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors">
                <option value="">Select Role</option>
                {roles.filter(r => !r.deletedAt).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 mt-1">
            <label className="text-[12px] font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                <input type="radio" name="status" value="Active" defaultChecked={mode === 'add' || data?.status === 'Active'} className="text-blue-600 focus:ring-blue-500 bg-page border-theme" /> Active
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                <input type="radio" name="status" value="Disabled" defaultChecked={mode === 'edit' && data?.status === 'Disabled'} className="text-blue-600 focus:ring-blue-500 bg-page border-theme" /> Disabled
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end mt-6 pt-4 border-t border-gray-100 dark:border-theme gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-[13px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-input transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 text-[13px] font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-input transition-colors shadow-sm">
              {mode === 'add' ? 'Save' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
