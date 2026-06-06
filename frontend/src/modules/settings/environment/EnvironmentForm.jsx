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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in" 
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-700/50 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 flex items-center justify-center border border-indigo-500/10">
              <Box className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Configure environment policy rules</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <form id="environment-form" onSubmit={handleSubmit} onChange={onChange} className="p-6 space-y-6">
            
            {/* General Settings */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">General Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Environment Name</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. UAT Environment"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                    disabled={isDefault}
                  />
                  {isDefault && (
                    <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1"><Shield size={12}/> Default environment names cannot be changed.</p>
                  )}
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe the purpose of this environment..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[80px] resize-y"
                    required
                  />
                </div>
              </div>
            </div>

            <hr className="border-slate-100 dark:border-slate-700/50" />

            {/* Policy Settings */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Policy Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Expiry Type</label>
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
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
                    >
                      <option value="days">Days</option>
                      <option value="hours">Hours</option>
                      <option value="minutes">Minutes</option>
                      <option value="lifetime">Lifetime</option>
                    </select>
                    <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Expiry Value</label>
                  <input 
                    type="number" 
                    min="1"
                    value={formData.expiryValue === null ? '' : formData.expiryValue}
                    onChange={(e) => setFormData({...formData, expiryValue: parseInt(e.target.value) || 0})}
                    placeholder={formData.expiryType === 'lifetime' ? "Not Applicable" : "Enter amount"}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={formData.expiryType === 'lifetime'}
                    required={formData.expiryType !== 'lifetime'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Approval Policy</label>
                  <div className="relative">
                    <select 
                      value={formData.approvalRequired ? 'required' : 'optional'}
                      onChange={(e) => setFormData({...formData, approvalRequired: e.target.value === 'required'})}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
                    >
                      <option value="required">Required</option>
                      <option value="optional">Not Required</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Environment Status</label>
                  <div className="relative">
                    <select 
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-4 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30 rounded-b-2xl flex items-center justify-end gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="environment-form"
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95 flex items-center gap-2"
          >
            <Save size={16} />
            <span>{initialData ? 'Save Changes' : 'Create Environment'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
