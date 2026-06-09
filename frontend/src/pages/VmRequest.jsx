import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2 } from 'lucide-react';
import api from '../lib/api';
import { useUI } from '../stores/uiStore';
import { useEnvironmentContext } from '../contexts/EnvironmentContext';
import { useCatalogContext } from '../contexts/CatalogContext';

const EMPTY_ALLOWED = { providers: [], tiers: [], networks: [], datastores: [] };

export default function VmRequest() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pushToast = useUI((s) => s.pushToast);

  const { environments } = useEnvironmentContext();
  const { allowedResources } = useEnvironmentContext();
  const { catalogs } = useCatalogContext();

  // Wizard state — store IDs only (resolved to provider values by the backend).
  const [step, setStep] = useState(1);
  const [environmentId, setEnvironmentId] = useState(location.state?.environmentId || '');
  const [providerId, setProviderId] = useState(location.state?.providerId || '');
  const [allowed, setAllowed] = useState(EMPTY_ALLOWED);
  const [loadingAllowed, setLoadingAllowed] = useState(false);

  const [vmPrefix, setVmPrefix] = useState(location.state?.vmPrefix || 'APP');
  const [vmCount, setVmCount] = useState(location.state?.vmCount || 1);
  const [catalogId, setCatalogId] = useState(location.state?.catalogId || searchParams.get('catalog_id') || '');
  const [tierId, setTierId] = useState(location.state?.tierId || '');
  const [networkId, setNetworkId] = useState(location.state?.networkId || '');
  const [datastoreId, setDatastoreId] = useState(location.state?.datastoreId || '');
  const [bootDiskGb, setBootDiskGb] = useState('');
  const [description, setDescription] = useState(location.state?.description || '');
  const [securityHardening, setSecurityHardening] = useState(false);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const activeEnvironments = useMemo(
    () => (environments || []).filter((e) => e.status === 'Active'),
    [environments]
  );

  // Load the environment policy (allowed providers/tiers/networks/datastores) on selection.
  useEffect(() => {
    if (!environmentId) {
      setAllowed(EMPTY_ALLOWED);
      return;
    }
    let active = true;
    setLoadingAllowed(true);
    allowedResources(environmentId)
      .then((data) => active && setAllowed({ ...EMPTY_ALLOWED, ...data }))
      .catch(() => active && setAllowed(EMPTY_ALLOWED))
      .finally(() => active && setLoadingAllowed(false));
    return () => {
      active = false;
    };
  }, [environmentId, allowedResources]);

  // Reset dependent selections when environment changes.
  const handleSelectEnvironment = (id) => {
    setEnvironmentId(id);
    setProviderId('');
    setCatalogId('');
    setTierId('');
    setNetworkId('');
    setDatastoreId('');
  };

  const selectedEnv = activeEnvironments.find((e) => String(e.id) === String(environmentId));
  const isPermanentEnv = selectedEnv && (selectedEnv.expiryType === 'permanent' || selectedEnv.expiryType === 'lifetime');
  const envDuration = isPermanentEnv ? 'Lifetime' : selectedEnv ? `${selectedEnv.expiryValue} Days` : '';

  // Catalogs are scoped by the selected provider and must be Active.
  const availableCatalogs = useMemo(
    () => (catalogs || []).filter((c) => String(c.providerId) === String(providerId) && c.status === 'Active'),
    [catalogs, providerId]
  );
  const selectedCatalog = availableCatalogs.find((c) => String(c.id) === String(catalogId));
  const providerNodeId = selectedCatalog?.providerNodeId ?? '';

  const selectedTier = (allowed.tiers || []).find((t) => String(t.id) === String(tierId));
  const tierDiskFloor = selectedTier?.diskGb ?? 0;

  const generatedNames = useMemo(() => {
    const names = [];
    const count = parseInt(vmCount, 10) || 0;
    for (let i = 1; i <= count; i += 1) names.push(`${vmPrefix}${i.toString().padStart(2, '0')}`);
    return names;
  }, [vmPrefix, vmCount]);

  const count = parseInt(vmCount, 10) || 1;
  const totalCpu = (selectedTier?.cpu || 0) * count;
  const totalRam = (selectedTier ? selectedTier.ramMb / 1024 : 0) * count;
  const totalDisk = (selectedTier?.diskGb || 0) * count;

  // Unsaved-changes protection.
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (step > 1 || environmentId !== '') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [step, environmentId]);

  const handleNext = (nextStep) => {
    if (nextStep === 2 && (!environmentId || !providerId)) return;
    if (nextStep === 3 && (!catalogId || !vmPrefix || !vmCount || !tierId || !networkId || !datastoreId)) return;
    setStep(nextStep);
  };

  const executeSubmit = async () => {
    setSubmitting(true);
    try {
      const effectiveBootDisk = bootDiskGb === '' ? null : Math.max(parseInt(bootDiskGb, 10) || 0, tierDiskFloor);
      await api.post('/provision-requests', {
        vmName: vmPrefix,
        environmentId: Number(environmentId),
        providerId: Number(providerId),
        providerNodeId: providerNodeId ? Number(providerNodeId) : null,
        catalogId: Number(catalogId),
        tierId: Number(tierId),
        networkId: Number(networkId),
        datastoreId: Number(datastoreId),
        instanceCount: count,
        securityHardening,
        bootDiskGb: effectiveBootDisk,
        requestedExpiry: null,
        description,
      });
      pushToast({ kind: 'success', message: 'Provision request submitted. Pending approval.' });
      navigate('/catalog');
    } catch (e) {
      pushToast({ kind: 'error', message: e.message || 'Submission failed.' });
      setShowConfirmModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    'w-full p-2.5 border border-gray-200 dark:border-theme rounded-lg text-[13px] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-gray-50 dark:bg-surface dark:text-gray-100';
  const selectCls = `${inputCls} appearance-none cursor-pointer`;

  return (
    <div className="max-w-[700px] animate-in fade-in slide-in-from-bottom-4 duration-500 mx-auto">
      {/* Wizard Steps */}
      <div className="flex items-center gap-0 mb-8 bg-white dark:bg-card p-2 rounded-card shadow-card border border-gray-100 dark:border-theme">
        {[
          { num: 1, label: 'Environment' },
          { num: 2, label: 'Configuration' },
          { num: 3, label: 'Review' },
        ].map((s, idx) => (
          <React.Fragment key={s.num}>
            <div className={`flex items-center gap-2 text-[12px] flex-1 px-3 py-2 rounded-xl transition-opacity duration-300 ${step === s.num ? 'bg-teal-50 dark:bg-teal-900/30' : step > s.num ? 'opacity-90' : 'opacity-50'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0
                ${step === s.num ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-sm' :
                  step > s.num ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400' : 'bg-gray-100 dark:bg-surface text-gray-400 dark:text-gray-500'}`}
              >
                {step > s.num ? '✓' : s.num}
              </div>
              <div className={`${step === s.num ? 'text-teal-700 dark:text-teal-400 font-bold' : step > s.num ? 'text-emerald-700 dark:text-emerald-400 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                {s.label}
              </div>
            </div>
            {idx < 2 && <div className="w-4 h-px bg-gray-200 dark:bg-slate-600 mx-1 shrink-0"></div>}
          </React.Fragment>
        ))}
      </div>

      <div className="bg-white dark:bg-card border border-gray-100 dark:border-theme rounded-card p-6 shadow-card">
        {step === 1 && (
          <div className="animate-in fade-in duration-300">
            <div className="mb-1.5 text-[14px] font-medium text-gray-800 dark:text-gray-100">Select deployment environment</div>
            <div className="text-[12px] text-gray-500 dark:text-gray-400 mb-5">Environment determines lifecycle and expiration policy.</div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {activeEnvironments.map((e) => {
                const permanent = e.expiryType === 'permanent' || e.expiryType === 'lifetime';
                return (
                  <div
                    key={e.id}
                    onClick={() => handleSelectEnvironment(e.id)}
                    className={`text-center p-5 bg-white dark:bg-card border rounded-xl cursor-pointer transition-[transform,box-shadow] duration-200 hover:shadow-md hover:scale-[1.02] ${String(environmentId) === String(e.id) ? 'border-teal-500 shadow-md ring-2 ring-teal-500/20 bg-teal-50/10 dark:bg-teal-900/10' : 'border-gray-200 dark:border-theme'}`}
                  >
                    <div className="text-[15px] font-semibold text-gray-800 dark:text-gray-100 mb-2">{e.environmentName}</div>
                    <div className="text-[11px] px-3 py-1 rounded-full inline-block font-medium bg-gray-50 dark:bg-surface text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-theme">
                      {permanent ? 'Lifetime' : `${e.expiryValue} Days`}
                    </div>
                  </div>
                );
              })}
              {activeEnvironments.length === 0 && (
                <div className="col-span-3 text-center text-[13px] text-gray-400 py-8">No environments available.</div>
              )}
            </div>

            {selectedEnv && (
              <div className="bg-gray-50 dark:bg-surface rounded-xl p-4 border border-gray-200 dark:border-theme flex gap-3 animate-in fade-in duration-300 mb-6">
                <div className="text-teal-600 dark:text-teal-400 shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-gray-800 dark:text-gray-200 mb-1">{selectedEnv.environmentName} Environment</div>
                  <div className="text-[12px] text-gray-600 dark:text-gray-400">
                    {isPermanentEnv
                      ? 'Permanent VM. No automatic expiration.'
                      : `Expires automatically after ${envDuration}. Renewal request can be submitted before expiration.`}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Provider</label>
                <select
                  disabled={!environmentId || loadingAllowed}
                  className={`${selectCls} disabled:opacity-50 disabled:cursor-not-allowed`}
                  value={providerId}
                  onChange={(e) => { setProviderId(e.target.value); setCatalogId(''); }}
                >
                  <option value="" disabled>{loadingAllowed ? 'Loading…' : 'Select Provider...'}</option>
                  {(allowed.providers || []).map((p) => (
                    <option key={p.id} value={p.id}>{p.providerName}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t border-gray-100 dark:border-theme">
              <button
                disabled={!environmentId || !providerId}
                onClick={() => handleNext(2)}
                className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white px-6 py-2.5 text-[13px] font-medium rounded-lg shadow-md shadow-teal-500/20 transition-[transform,opacity,box-shadow] disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg disabled:hover:shadow-none disabled:hover:-translate-y-0 hover:-translate-y-0.5"
              >
                Next Step →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-[14px] font-semibold text-gray-800 dark:text-gray-100 mb-4">VM Configuration</div>

            {/* Deployment Context */}
            <div className="bg-gray-50 dark:bg-blue-900/10 border border-gray-200 dark:border-blue-900/30 rounded-xl p-4 mb-6">
              <div className="text-[11px] font-bold text-gray-500 dark:text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                Deployment Context
              </div>
              <div className="grid grid-cols-3 gap-4 items-center">
                <div>
                  <div className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Environment</div>
                  <div className={`${inputCls} text-gray-800`}>{selectedEnv?.environmentName || '—'}</div>
                </div>
                <div>
                  <div className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Provider</div>
                  <div className={`${inputCls} text-gray-800`}>{(allowed.providers || []).find((p) => String(p.id) === String(providerId))?.providerName || '—'}</div>
                </div>
                <div>
                  <div className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Node</div>
                  <div className={`${inputCls} text-gray-800`}>{selectedCatalog?.nodeName || 'From catalog'}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">VM Name Prefix</label>
                <input
                  type="text"
                  className={inputCls}
                  value={vmPrefix}
                  onChange={(e) => setVmPrefix(e.target.value.toUpperCase())}
                  placeholder="e.g. APP, WEB, DB"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Number of Instances</label>
                <input
                  type="number"
                  className={inputCls}
                  value={vmCount}
                  onChange={(e) => setVmCount(Math.max(1, Math.min(20, parseInt(e.target.value, 10) || 1)))}
                  min="1" max="20"
                />
              </div>
            </div>

            {/* Naming Preview */}
            <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg p-3 mb-6">
              <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mb-1.5 flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                Generated Names Preview
              </div>
              <div className="flex flex-wrap gap-2">
                {generatedNames.map((name, i) => (
                  <span key={i} className="text-[12px] bg-white dark:bg-card border border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded font-mono shadow-sm">{name}</span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Catalog</label>
                <select className={selectCls} value={catalogId} onChange={(e) => setCatalogId(e.target.value)}>
                  <option value="" disabled>Select Catalog...</option>
                  {availableCatalogs.map((c) => (
                    <option key={c.id} value={c.id}>{c.catalogName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Compute Tier</label>
                <select className={selectCls} value={tierId} onChange={(e) => setTierId(e.target.value)}>
                  <option value="" disabled>Select Tier...</option>
                  {(allowed.tiers || []).map((t) => (
                    <option key={t.id} value={t.id}>{t.tierName} — {t.cpu} vCPU / {Math.round(t.ramMb / 1024)} GB RAM / {t.diskGb} GB Disk</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Network</label>
                <select className={selectCls} value={networkId} onChange={(e) => setNetworkId(e.target.value)}>
                  <option value="" disabled>Select Network...</option>
                  {(allowed.networks || []).map((n) => (
                    <option key={n.id} value={n.id}>{n.networkName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Datastore</label>
                <select className={selectCls} value={datastoreId} onChange={(e) => setDatastoreId(e.target.value)}>
                  <option value="" disabled>Select Datastore...</option>
                  {(allowed.datastores || []).map((d) => (
                    <option key={d.id} value={d.id}>{d.datastoreName}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Boot Disk Size (GB)</label>
                <input
                  type="number"
                  className={inputCls}
                  value={bootDiskGb}
                  min={tierDiskFloor || 1}
                  onChange={(e) => setBootDiskGb(e.target.value)}
                  placeholder={tierDiskFloor ? `Default ${tierDiskFloor} GB (min)` : 'Template default'}
                />
                <p className="text-[11px] text-gray-400 mt-1">Boot/root disk. Grown on first boot via cloud-init. Must be ≥ tier/template size{tierDiskFloor ? ` (${tierDiskFloor} GB)` : ''}.</p>
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-theme pt-5 mb-5">
              <div className="text-[13px] font-semibold text-gray-800 dark:text-gray-200 mb-3">Additional Configuration</div>
              <div className="mb-4">
                <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Description (Optional)</label>
                <textarea
                  rows="2"
                  className={inputCls}
                  placeholder="Purpose of this VM, Business Justification..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                ></textarea>
              </div>

              <div className="bg-gray-50 dark:bg-surface border border-gray-200 dark:border-theme rounded-xl p-4 flex items-start gap-3">
                <div className="mt-0.5">
                  <input
                    type="checkbox"
                    id="hardening"
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                    checked={securityHardening}
                    onChange={(e) => setSecurityHardening(e.target.checked)}
                  />
                </div>
                <div>
                  <label htmlFor="hardening" className="text-[13px] font-medium text-gray-800 dark:text-gray-200 cursor-pointer hover:text-teal-600 dark:hover:text-teal-400">
                    Enable Security Hardening
                  </label>
                  <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-1">Ansible will execute security baseline configuration after VM provisioning.</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-6 pt-4 border-t border-gray-100 dark:border-theme">
              <button onClick={() => handleNext(1)} className="bg-white dark:bg-card text-gray-700 dark:text-gray-200 px-5 py-2.5 text-[13px] font-medium rounded-lg border border-gray-200 dark:border-theme hover:bg-gray-50 dark:hover:bg-slate-700 shadow-sm">← Back</button>
              <button
                onClick={() => handleNext(3)}
                disabled={!catalogId || !vmPrefix || !vmCount || !tierId || !networkId || !datastoreId}
                className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white px-6 py-2.5 text-[13px] font-medium rounded-lg shadow-md shadow-teal-500/20 transition-[transform,opacity,box-shadow] disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg disabled:hover:shadow-none hover:-translate-y-0.5 disabled:hover:-translate-y-0"
              >
                Review Request →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-[14px] font-semibold text-gray-800 dark:text-gray-100 mb-4">Review Your Request</div>

            <div className="bg-gray-50 dark:bg-blue-900/10 border border-gray-200 dark:border-blue-900/30 rounded-xl p-5 mb-5 shadow-inner">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-5 gap-x-6">
                {[
                  ['Environment', selectedEnv?.environmentName],
                  ['Provider', (allowed.providers || []).find((p) => String(p.id) === String(providerId))?.providerName],
                  ['Node', selectedCatalog?.nodeName || '—'],
                  ['Catalog', selectedCatalog?.catalogName],
                  ['Compute Tier', selectedTier?.tierName],
                  ['Network', (allowed.networks || []).find((n) => String(n.id) === String(networkId))?.networkName],
                  ['Datastore', (allowed.datastores || []).find((d) => String(d.id) === String(datastoreId))?.datastoreName],
                  ['VM Name Prefix', vmPrefix],
                  ['Instances', vmCount],
                  ['Boot Disk', bootDiskGb ? `${Math.max(parseInt(bootDiskGb, 10) || 0, tierDiskFloor)} GB` : `Template default${tierDiskFloor ? ` (${tierDiskFloor} GB)` : ''}`],
                  ['Security Hardening', securityHardening ? <span className="text-emerald-600 font-bold">YES</span> : <span className="text-gray-500 font-bold">NO</span>],
                  ['Description', description || <span className="text-gray-400 italic">No description provided</span>],
                ].map(([k, v], i) => (
                  <div key={i} className="flex flex-col">
                    <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{k}</div>
                    <div className="text-[13px] font-medium text-gray-800 dark:text-gray-200 mt-1">{v ?? '—'}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              <div className="bg-white dark:bg-card border border-teal-100 dark:border-teal-900/50 rounded-xl p-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-teal-50 dark:bg-teal-900/20 rounded-bl-full -mr-4 -mt-4 z-0"></div>
                <div className="relative z-10">
                  <div className="text-[13px] font-semibold text-teal-800 dark:text-teal-400 mb-3 flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                    Total Resource Estimation
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-teal-50/50 dark:bg-teal-900/10 rounded-lg p-2">
                      <div className="text-[18px] font-bold text-teal-700 dark:text-teal-300">{totalCpu}</div>
                      <div className="text-[10px] uppercase text-teal-600/70 font-semibold mt-0.5">vCPU</div>
                    </div>
                    <div className="bg-teal-50/50 dark:bg-teal-900/10 rounded-lg p-2">
                      <div className="text-[18px] font-bold text-teal-700 dark:text-teal-300">{totalRam}</div>
                      <div className="text-[10px] uppercase text-teal-600/70 font-semibold mt-0.5">GB RAM</div>
                    </div>
                    <div className="bg-teal-50/50 dark:bg-teal-900/10 rounded-lg p-2">
                      <div className="text-[18px] font-bold text-teal-700 dark:text-teal-300">{totalDisk}</div>
                      <div className="text-[10px] uppercase text-teal-600/70 font-semibold mt-0.5">GB Disk</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4 shadow-sm">
                <div className="text-[13px] font-semibold text-blue-800 dark:text-blue-400 mb-3 flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  Generated VM Names
                </div>
                <div className="flex flex-wrap gap-1.5 h-[64px] overflow-y-auto pr-2 custom-scrollbar">
                  {generatedNames.map((name, i) => (
                    <span key={i} className="text-[12px] bg-white dark:bg-card border border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded font-mono shadow-sm">{name}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-200/60 dark:border-amber-700/50 rounded-xl p-4 text-[13px] text-amber-800 dark:text-amber-300 mb-5 shadow-sm flex items-start gap-3">
              <span className="text-amber-500 dark:text-amber-400 mt-0.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              </span>
              <div>This request will be submitted for manager approval before provisioning begins. Status will change to <strong className="font-semibold">Pending Approval</strong>.</div>
            </div>

            <div className="flex justify-between border-t border-gray-100 dark:border-theme pt-4">
              <button onClick={() => handleNext(2)} className="bg-white dark:bg-card text-gray-700 dark:text-gray-200 px-5 py-2.5 text-[13px] font-medium rounded-lg border border-gray-200 dark:border-theme hover:bg-gray-50 dark:hover:bg-slate-700 shadow-sm">← Back</button>
              <button onClick={() => setShowConfirmModal(true)} className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white px-6 py-2.5 text-[13px] font-medium rounded-lg shadow-md shadow-teal-500/20 transition-[transform,opacity,box-shadow] hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                Submit Provision Request
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-card w-full max-w-[450px] rounded-modal shadow-modal overflow-hidden border border-gray-200 dark:border-theme animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="shrink-0 flex items-center justify-between p-4 border-b border-gray-100 dark:border-theme">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-teal-500" />
                Confirm Provision Request
              </h3>
              <button onClick={() => setShowConfirmModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div className="p-5 overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-theme rounded-md p-4">
                <p className="text-[13px] text-slate-700 dark:text-slate-300">Are you sure you want to submit this VM request?</p>
              </div>
            </div>
            <div className="shrink-0 px-5 py-4 border-t border-gray-100 dark:border-theme flex items-center justify-end gap-3 bg-white dark:bg-card">
              <button onClick={() => setShowConfirmModal(false)} className="px-4 py-2 text-[13px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-input transition-colors">Cancel</button>
              <button onClick={executeSubmit} disabled={submitting} className="px-4 py-2 text-[13px] font-medium text-white bg-teal-600 border border-teal-700 rounded-input hover:bg-teal-700 transition-colors shadow-sm disabled:opacity-60 flex items-center gap-2">
                {submitting && <Loader2 size={14} className="animate-spin" />} Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
