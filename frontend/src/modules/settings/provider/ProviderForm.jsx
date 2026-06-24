import React, { useState, useEffect, useRef } from 'react';
import { X, Eye, EyeOff, Play, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import api from '../../../lib/api';

export default function ProviderForm({ isOpen, mode, data, onSubmit, onClose, onChange }) {
  const [autoDiscoveryEnabled, setAutoDiscoveryEnabled] = useState(true);
  const [showSecret, setShowSecret] = useState(false);

  const [testResult, setTestResult] = useState(null); // { status, version } | { error }
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const isEdit = mode !== 'add';

  useEffect(() => {
    if (isOpen) {
      setAutoDiscoveryEnabled(data ? (data.autoDiscoveryEnabled ?? true) : true);
      setShowSecret(false);
      setTestResult(null);
      setIsTestingConnection(false);
    }
  }, [isOpen, data]);

  const handleTestConnection = async () => {
    // Test Connection requires a saved provider (id) to use stored credentials.
    if (!data?.id) {
      setTestResult({ error: 'Save the provider first, then test the connection.' });
      return;
    }
    setIsTestingConnection(true);
    setTestResult(null);
    try {
      const res = await api.post(`/providers/${data.id}/test-connection`);
      setTestResult({ status: res.status, version: res.version });
    } catch (e) {
      setTestResult({ error: e.message || 'Connection failed' });
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Grey out Save until the form's required fields pass native validation (secrets are only
  // required when adding — in edit mode a blank secret keeps the current one).
  const formRef = useRef(null);
  const [canSave, setCanSave] = useState(false);
  const syncValidity = () => setCanSave(!!formRef.current && formRef.current.checkValidity());
  useEffect(() => { syncValidity(); }); // after every render (covers open/prefill + state changes)

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const result = Object.fromEntries(formData);
    result.autoDiscoveryEnabled = autoDiscoveryEnabled;
    // Never overwrite a stored secret with an empty value (write-only rule).
    ['discoveryTokenSecret', 'provisionTokenSecret'].forEach((k) => {
      if (!result[k] || String(result[k]).trim() === '') delete result[k];
    });
    onSubmit(result);
  };

  const inputCls =
    'w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-zinc-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors';
  const secretPlaceholder = isEdit ? 'Leave blank to keep current' : 'Token Secret…';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-card rounded-modal shadow-modal border border-gray-200 dark:border-theme w-full max-w-[720px] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh]">
        <div className="shrink-0 flex items-center justify-between p-4 border-b border-gray-100 dark:border-theme">
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
              {mode === 'add' ? '➕ Add Provider' : '✏️ Edit Provider'}
            </h3>
            <p className="text-[12px] text-slate-500 dark:text-zinc-400 mt-1">
              {mode === 'add' ? 'Register a new infrastructure provider for resource discovery.' : 'Update provider configuration and discovery settings.'}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-700 self-start"><X size={18} /></button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} onChange={(e) => { onChange?.(e); syncValidity(); }} className="flex flex-col overflow-hidden min-h-0">
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 flex flex-col gap-4">
            <div className="flex flex-col gap-5">

              {/* Basic Information */}
              <div className="bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-theme rounded-md p-4">
                <label className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-4 block">Basic Information</label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-slate-700 dark:text-zinc-300">Provider Name <span className="text-rose-500">*</span></label>
                    <input name="providerName" required defaultValue={data?.providerName} className={inputCls} placeholder="e.g. Proxmox DC1" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-slate-700 dark:text-zinc-300">Provider Type <span className="text-rose-500">*</span></label>
                    <select name="providerType" required defaultValue={data?.providerType || 'proxmox'} className={`${inputCls} cursor-pointer`}>
                      <option value="proxmox">Proxmox</option>
                      <option value="openstack" disabled>OpenStack (Future)</option>
                      <option value="olvm" disabled>OLVM (Future)</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-slate-700 dark:text-zinc-300">Endpoint URL <span className="text-rose-500">*</span></label>
                    <input name="endpoint" required defaultValue={data?.endpoint} className={inputCls} placeholder="e.g. https://pve01.company.local:8006/api2/json" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-slate-700 dark:text-zinc-300">Description</label>
                    <input name="description" defaultValue={data?.description} className={inputCls} placeholder="Optional description" />
                  </div>
                </div>
              </div>

              {/* Discovery Credential (Read Only) */}
              <div className="bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-theme rounded-md p-4">
                <div className="mb-4">
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">Discovery Credential (Read Only)</label>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">Read-only credential used for resource discovery (e.g. PVEAuditor).</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-slate-700 dark:text-zinc-300">Discovery Username <span className="text-rose-500">*</span></label>
                    <input name="discoveryUsername" required defaultValue={data?.discoveryUsername} className={inputCls} placeholder="e.g. root@pam" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-slate-700 dark:text-zinc-300">Discovery Token ID <span className="text-rose-500">*</span></label>
                    <input name="discoveryTokenId" required defaultValue={data?.discoveryTokenId} className={inputCls} placeholder="e.g. discoverer" />
                  </div>
                </div>
                <div className="mt-3 flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-slate-700 dark:text-zinc-300">Discovery Token Secret {!isEdit && <span className="text-rose-500">*</span>}</label>
                  <div className="relative">
                    <input name="discoveryTokenSecret" defaultValue="" type={showSecret ? 'text' : 'password'} required={!isEdit} className={`${inputCls} pr-10`} placeholder={secretPlaceholder} autoComplete="new-password" />
                    <button type="button" onClick={() => setShowSecret(!showSecret)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300">
                      {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Provisioning Credential (Terraform) */}
              <div className="bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-theme rounded-md p-4">
                <div className="mb-4">
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">Provisioning Credential (Terraform)</label>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">Credential used for VM lifecycle operations.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-slate-700 dark:text-zinc-300">Provision Username <span className="text-rose-500">*</span></label>
                    <input name="provisionUsername" required defaultValue={data?.provisionUsername} className={inputCls} placeholder="e.g. root@pam" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-slate-700 dark:text-zinc-300">Provision Token ID <span className="text-rose-500">*</span></label>
                    <input name="provisionTokenId" required defaultValue={data?.provisionTokenId} className={inputCls} placeholder="e.g. provisioner" />
                  </div>
                </div>
                <div className="mt-3 flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-slate-700 dark:text-zinc-300">Provision Token Secret {!isEdit && <span className="text-rose-500">*</span>}</label>
                  <div className="relative">
                    <input name="provisionTokenSecret" defaultValue="" type={showSecret ? 'text' : 'password'} required={!isEdit} className={`${inputCls} pr-10`} placeholder={secretPlaceholder} autoComplete="new-password" />
                    <button type="button" onClick={() => setShowSecret(!showSecret)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300">
                      {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Terraform Provider */}
              <div className="bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-theme rounded-md p-4">
                <label className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-4 block">Terraform Provider</label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-slate-700 dark:text-zinc-300">Provider Source <span className="text-rose-500">*</span></label>
                    <input name="terraformProviderSource" required defaultValue={data?.terraformProviderSource || 'Telmate/proxmox'} className={inputCls} placeholder="Telmate/proxmox" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-slate-700 dark:text-zinc-300">Provider Version <span className="text-rose-500">*</span></label>
                    <input name="terraformProviderVersion" required defaultValue={data?.terraformProviderVersion || '3.0.2-rc04'} className={inputCls} placeholder="3.0.2-rc04" />
                  </div>
                </div>
              </div>

              {/* Discovery Configuration */}
              <div className="bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-theme rounded-md p-4">
                <label className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-4 block">Discovery Configuration</label>

                <div className="flex gap-6 mt-3 mb-4">
                  <label className="flex items-center gap-2 text-[13px] font-medium text-slate-700 dark:text-zinc-300">
                    <input
                      name="autoDiscoveryEnabled"
                      type="checkbox"
                      checked={autoDiscoveryEnabled}
                      onChange={(e) => setAutoDiscoveryEnabled(e.target.checked)}
                      className="rounded border-slate-300 dark:border-theme bg-transparent text-blue-600 focus:ring-blue-500"
                    /> Enable Auto Discovery
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className={`text-[12px] font-medium ${autoDiscoveryEnabled ? 'text-slate-700 dark:text-zinc-300' : 'text-slate-400 dark:text-zinc-500'}`}>Discovery Interval</label>
                    <select
                      name="discoveryInterval"
                      defaultValue={data?.discoveryInterval || '2m'}
                      disabled={!autoDiscoveryEnabled}
                      className={`w-full px-3 py-2 border border-slate-300 dark:border-theme rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors cursor-pointer ${autoDiscoveryEnabled ? 'bg-white dark:bg-page text-slate-900 dark:text-zinc-100' : 'bg-slate-50 dark:bg-zinc-800/50 text-slate-500 dark:text-zinc-400 cursor-not-allowed'}`}
                    >
                      <option value="10s">10 Seconds</option>
                      <option value="15s">15 Seconds</option>
                      <option value="20s">20 Seconds</option>
                      <option value="30s">30 Seconds</option>
                      <option value="1m">1 Minute</option>
                      <option value="2m">2 Minutes</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="shrink-0 px-5 py-4 border-t border-gray-100 dark:border-theme flex items-center justify-between gap-3 bg-white dark:bg-card">
            <div className="flex items-center gap-3">
              <button type="button" onClick={handleTestConnection} disabled={isTestingConnection} className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-surface dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-input transition-colors disabled:opacity-50">
                {isTestingConnection ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                Test Connection
              </button>
              {testResult?.status === 'Connected' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold uppercase tracking-wider rounded">
                  <CheckCircle2 size={12} /> Connected{testResult.version ? ` · v${testResult.version}` : ''}
                </span>
              )}
              {testResult?.status === 'Disconnected' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 text-[11px] font-bold uppercase tracking-wider rounded">
                  <AlertTriangle size={12} /> Disconnected
                </span>
              )}
              {testResult?.error && (
                <span className="text-[12px] text-rose-600 dark:text-rose-400">{testResult.error}</span>
              )}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 text-[13px] font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-input transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={!canSave} className="px-4 py-2 text-[13px] font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-input transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600">
                {mode === 'add' ? 'Create Provider' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
