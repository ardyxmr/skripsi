import React, { useState, useEffect } from 'react';
import { Box, X, Save, Shield, Clock } from 'lucide-react';

export default function EnvironmentForm({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData = null, 
  title = "Create Environment",
  onChange
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    expiryType: 'days',
    expiryValue: 30,
    approvalRequired: true,
    allowDataDisk: false,
    status: 'Active',
    type: 'Custom'
  });

  // Keep track if it's a default environment since name cannot be changed
  const isDefault = initialData?.type === 'Default';

  useEffect(() => {
    if (initialData && isOpen) {
      setFormData({
        ...initialData
      });
    } else if (isOpen) {
      // Reset form on new open
      setFormData({
        name: '',
        description: '',
        expiryType: 'days',
        expiryValue: 30,
        approvalRequired: true,
        status: 'Active',
        type: 'Custom'
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-card rounded-modal shadow-modal border border-gray-200 dark:border-theme w-full max-w-[600px] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh]">
        <div className="shrink-0 flex items-center justify-between p-4 border-b border-gray-100 dark:border-theme">
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              {initialData ? '✏️ Edit Environment' : '➕ Create Environment'}
            </h3>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1">Configure environment policy rules</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 self-start">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form id="environment-form" onSubmit={handleSubmit} onChange={onChange} className="flex flex-col overflow-hidden min-h-0">
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 flex flex-col gap-5">
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-theme rounded-md p-4">
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 block">General Information</label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Environment Name <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. UAT Environment"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-slate-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors disabled:opacity-50"
                    required
                    disabled={isDefault}
                  />
                  {isDefault && (
                    <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1"><Shield size={12}/> Default environment names cannot be changed.</p>
                  )}
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe the purpose of this environment..."
                    className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-slate-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors resize-y min-h-[80px]"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-theme rounded-md p-4">
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 block">Policy Configuration</label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Expiry Type</label>
                  <div className="relative">
                    <select 
                      value={formData.expiryType}
                      onChange={(e) => {
                        const newType = e.target.value;
                        setFormData({
                          ...formData, 
                          expiryType: newType,
                          expiryValue: newType === 'lifetime' ? null : (formData.expiryValue || 30)
                        });
                      }}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-slate-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors cursor-pointer"
                    >
                      <option value="days">Days</option>
                      <option value="hours">Hours</option>
                      <option value="minutes">Minutes</option>
                      <option value="lifetime">Lifetime</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Expiry Value</label>
                  <input 
                    type="number" 
                    min="1"
                    value={formData.expiryValue === null ? '' : formData.expiryValue}
                    onChange={(e) => setFormData({...formData, expiryValue: parseInt(e.target.value) || 0})}
                    placeholder={formData.expiryType === 'lifetime' ? "Not Applicable" : "Enter amount"}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-slate-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors disabled:opacity-50"
                    disabled={formData.expiryType === 'lifetime'}
                    required={formData.expiryType !== 'lifetime'}
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Approval Policy</label>
                  <select 
                    value={formData.approvalRequired ? 'required' : 'optional'}
                    onChange={(e) => setFormData({...formData, approvalRequired: e.target.value === 'required'})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-slate-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors cursor-pointer"
                  >
                    <option value="required">Required</option>
                    <option value="optional">Not Required</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Environment Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-slate-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-start gap-3 cursor-pointer p-3 rounded-md border border-slate-200 dark:border-theme bg-white dark:bg-page">
                    <input
                      type="checkbox"
                      checked={!!formData.allowDataDisk}
                      onChange={(e) => setFormData({ ...formData, allowDataDisk: e.target.checked })}
                      className="mt-0.5 w-4 h-4 rounded border-slate-300 dark:border-theme text-blue-600 focus:ring-blue-500"
                    />
                    <span>
                      <span className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300">Allow data disks</span>
                      <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Permit adding extra data disks to VMs in this environment (Inventory → Edit Resources). Default off.</span>
                    </span>
                  </label>
                </div>

              </div>
            </div>

          </div>
          <div className="shrink-0 px-5 py-4 border-t border-gray-100 dark:border-theme flex items-center justify-end gap-3 bg-white dark:bg-card">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-[13px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-input transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              form="environment-form"
              className="px-4 py-2 text-[13px] font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-input transition-colors shadow-sm"
            >
              {initialData ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
