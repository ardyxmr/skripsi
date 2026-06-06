import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Play, CheckCircle2, Loader2 } from 'lucide-react';

export default function ProviderForm({ isOpen, mode, data, onSubmit, onClose, onChange }) {
  const [autoDiscoveryEnabled, setAutoDiscoveryEnabled] = useState(true);
  const [showSecret, setShowSecret] = useState(false);

  const [testResult, setTestResult] = useState(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAutoDiscoveryEnabled(data ? (data.autoDiscovery ?? true) : true);
      setShowSecret(false);
      setTestResult(null);
      setIsTestingConnection(false);
    }
  }, [isOpen, data]);

  const handleTestConnection = () => {
    setIsTestingConnection(true);
    setTestResult(null);
    setTimeout(() => {
      setIsTestingConnection(false);
      setTestResult('Connected');
    }, 1500);
  };

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const result = Object.fromEntries(formData);
    result.autoDiscovery = autoDiscoveryEnabled;
    onSubmit(result);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-card rounded-modal shadow-modal border border-gray-200 dark:border-theme w-full max-w-[720px] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-theme">
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              {mode === 'add' ? '➕ Add Provider' : '✏️ Edit Provider'}
            </h3>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1">
              {mode === 'add' ? 'Register a new infrastructure provider for resource discovery.' : 'Update provider configuration and discovery settings.'}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 self-start"><X size={18} /></button>
        </div>
        
        <form onSubmit={handleSubmit} onChange={onChange} className="p-5 flex flex-col gap-4">
                {/* PROVIDER FIELDS */}
                <div className="flex flex-col gap-5">
                    
                    {/* Basic Information */}
                    <div>
                      <h4 className="text-[13px] font-bold text-slate-800 dark:text-slate-200 mb-3 border-b border-gray-100 dark:border-theme pb-1">Basic Information</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[12px] font-medium text-slate-700 dark:text-slate-300">Provider Name <span className="text-rose-500">*</span></label>
                          <input name="name" required defaultValue={data?.name} className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-slate-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors" placeholder="e.g. Proxmox DC1" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[12px] font-medium text-slate-700 dark:text-slate-300">Provider Type <span className="text-rose-500">*</span></label>
                          <select name="type" required defaultValue={data?.type || 'Proxmox'} className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-slate-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors cursor-pointer">
                            <option value="Proxmox">Proxmox</option>
                            <option value="VMware" disabled>VMware (Future)</option>
                            <option value="Nutanix" disabled>Nutanix (Future)</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[12px] font-medium text-slate-700 dark:text-slate-300">Endpoint URL <span className="text-rose-500">*</span></label>
                          <input name="endpoint" required defaultValue={data?.endpoint} className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-slate-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors" placeholder="e.g. pve01.company.local" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[12px] font-medium text-slate-700 dark:text-slate-300">Description</label>
                          <input name="description" defaultValue={data?.description} className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-slate-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors" placeholder="Optional description" />
                        </div>
                      </div>
                    </div>

                    {/* Discovery Credential (Read Only) */}
                    <div>
                      <div className="mb-3 border-b border-gray-100 dark:border-theme pb-1">
                        <h4 className="text-[13px] font-bold text-slate-800 dark:text-slate-200">Discovery Credential (Read Only)</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Read-only credential used for resource discovery.</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[12px] font-medium text-slate-700 dark:text-slate-300">Discovery Username <span className="text-rose-500">*</span></label>
                          <input name="discoveryUsername" required defaultValue={data?.discoveryUsername || 'Configured'} className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-slate-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors" placeholder="e.g. root@pam" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[12px] font-medium text-slate-700 dark:text-slate-300">Discovery Token ID <span className="text-rose-500">*</span></label>
                          <input name="discoveryTokenId" required defaultValue={data?.discoveryTokenId || 'Configured'} className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-slate-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors" placeholder="e.g. discoverer" />
                        </div>
                      </div>
                      <div className="mt-3 flex flex-col gap-1.5">
                        <label className="text-[12px] font-medium text-slate-700 dark:text-slate-300">Discovery Token Secret <span className="text-rose-500">*</span></label>
                          <div className="relative">
                            <input name="discoverySecret" defaultValue={data?.secret || ''} type={showSecret ? "text" : "password"} required className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-slate-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors pr-10" placeholder="Token Secret..." />
                            <button type="button" onClick={() => setShowSecret(!showSecret)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                              {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Provisioning Credential (Terraform) */}
                      <div>
                        <div className="mb-3 border-b border-gray-100 dark:border-theme pb-1">
                          <h4 className="text-[13px] font-bold text-slate-800 dark:text-slate-200">Provisioning Credential (Terraform)</h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Credential used for VM lifecycle operations.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[12px] font-medium text-slate-700 dark:text-slate-300">Provision Username <span className="text-rose-500">*</span></label>
                            <input name="provisionUsername" required defaultValue={data?.username || ''} className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-slate-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors" placeholder="e.g. root@pam" />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[12px] font-medium text-slate-700 dark:text-slate-300">Provision Token ID <span className="text-rose-500">*</span></label>
                            <input name="provisionTokenId" required defaultValue={data?.tokenId || ''} className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-slate-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors" placeholder="e.g. provisioner" />
                          </div>
                        </div>
                        <div className="mt-3 flex flex-col gap-1.5">
                          <label className="text-[12px] font-medium text-slate-700 dark:text-slate-300">Provision Token Secret <span className="text-rose-500">*</span></label>
                          <div className="relative">
                            <input name="provisionSecret" defaultValue={data?.secret || ''} type={showSecret ? "text" : "password"} required className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-slate-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors pr-10" placeholder="Token Secret..." />
                            <button type="button" onClick={() => setShowSecret(!showSecret)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                              {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>
                      </div>

                    {/* Discovery Configuration */}
                    <div>
                      <h4 className="text-[13px] font-bold text-slate-800 dark:text-slate-200 mb-3 border-b border-gray-100 dark:border-theme pb-1">Discovery Configuration</h4>
                      
                      <div className="flex gap-6 mt-3 mb-4">
                        <label className="flex items-center gap-2 text-[13px] font-medium text-slate-700 dark:text-slate-300">
                          <input 
                            name="autoDiscovery" 
                            type="checkbox" 
                            checked={autoDiscoveryEnabled} 
                            onChange={(e) => setAutoDiscoveryEnabled(e.target.checked)}
                            className="rounded border-slate-300 dark:border-theme bg-transparent text-blue-600 focus:ring-blue-500" 
                          /> Enable Auto Discovery
                        </label>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className={`text-[12px] font-medium ${autoDiscoveryEnabled ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}`}>Discovery Interval</label>
                          <select 
                            name="discoveryInterval" 
                            defaultValue={data?.discoveryInterval || '30 Minutes'} 
                            disabled={!autoDiscoveryEnabled}
                            className={`w-full px-3 py-2 border border-slate-300 dark:border-theme rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors cursor-pointer ${autoDiscoveryEnabled ? 'bg-white dark:bg-page text-slate-900 dark:text-slate-100' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 cursor-not-allowed'}`}
                          >
                            <option value="15 Minutes">15 Minutes</option>
                            <option value="30 Minutes">30 Minutes</option>
                            <option value="1 Hour">1 Hour</option>
                            <option value="6 Hours">6 Hours</option>
                            <option value="12 Hours">12 Hours</option>
                            <option value="24 Hours">24 Hours</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

          <div className="p-4 bg-transparent dark:bg-transparent/50 border-t border-gray-100 dark:border-theme flex items-center justify-between mt-2 -mx-5 -mb-5">
            <div className="flex items-center gap-3">
              <button type="button" onClick={handleTestConnection} disabled={isTestingConnection} className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-surface dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-input transition-colors disabled:opacity-50">
                {isTestingConnection ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />} 
                Test Connection
              </button>
              {testResult === 'Connected' && <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold uppercase tracking-wider rounded"><CheckCircle2 size={12}/> Connected</span>}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 text-[13px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-input transition-colors">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 text-[13px] font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-input transition-colors shadow-sm">
                {mode === 'add' ? 'Create Provider' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
