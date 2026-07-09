import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import api from '../lib/api';
import { useUI } from '../stores/uiStore';
import { useEnvironmentContext } from '../contexts/EnvironmentContext';
import { useCatalogContext } from '../contexts/CatalogContext';
import { useTierContext } from '../contexts/TierContext';
import { useNodeContext } from '../contexts/NodeContext';
import { checkEnvCompat } from '../lib/envCompat';
import { capacityBadge } from '../lib/nodeCapacity';
import { useNetworkContext } from '../contexts/NetworkContext';
import { useDatastoreContext } from '../contexts/DatastoreContext';

// Env policy now allow-lists providers/tiers/nodes; networks & datastores follow the node.
const EMPTY_ALLOWED = { providers: [], tiers: [], nodes: [] };

export default function VmRequest() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pushToast = useUI((s) => s.pushToast);

  const { environments } = useEnvironmentContext();
  const { allowedResources } = useEnvironmentContext();
  const { catalogs } = useCatalogContext();
  const { tiers } = useTierContext();
  const { nodes: allNodes } = useNodeContext();
  const { networks } = useNetworkContext();
  const { datastores } = useDatastoreContext();

  // Wizard state — store IDs only (resolved to provider values by the backend).
  const [step, setStep] = useState(1);
  const [environmentId, setEnvironmentId] = useState(location.state?.environmentId || '');
  const [providerId, setProviderId] = useState(location.state?.providerId || '');
  const [nodeId, setNodeId] = useState(location.state?.nodeId || '');
  const [allowed, setAllowed] = useState(EMPTY_ALLOWED);
  const [loadingAllowed, setLoadingAllowed] = useState(false);
  // The env an `allowed` allow-list was loaded for — gates the catalog-origin reconcile so it only
  // runs against a fresh allow-list (never the stale/empty one mid-load).
  const [allowedEnvId, setAllowedEnvId] = useState(null);

  const [vmPrefix, setVmPrefix] = useState(location.state?.vmPrefix || 'APP');
  const [vmCount, setVmCount] = useState(location.state?.vmCount ?? '');
  const [catalogId, setCatalogId] = useState(location.state?.catalogId || searchParams.get('catalog_id') || '');
  const [tierId, setTierId] = useState(location.state?.tierId || '');
  const [networkId, setNetworkId] = useState(location.state?.networkId || '');
  const [datastoreId, setDatastoreId] = useState(location.state?.datastoreId || '');
  const [bootDiskGb, setBootDiskGb] = useState('');
  const [description, setDescription] = useState(location.state?.description || '');

  // Catalog-origin flow: when the user comes from the Catalog page we remember the catalog + tier
  // they picked so we can auto-derive the provider/node that host that catalog and restore both —
  // once per environment selection (so any manual change afterward sticks; no snap-back).
  const desiredCatalogId = location.state?.catalogId || searchParams.get('catalog_id') || '';
  const desiredTierId = location.state?.tierId || '';
  // Catalog-origin ONLY — a revert also carries catalogId but pre-fills the whole form and must be
  // left untouched here (its own validation is a separate, later pass), so exclude requestId flows.
  const fromCatalog = useRef(!!desiredCatalogId && !location.state?.requestId);
  const reconciledEnvRef = useRef(null);
  // The pre-selected catalog row (carries providerId + providerNodeId) and friendly names for the
  // environment-compatibility badges shown in step 1.
  const desiredCatalog = useMemo(
    () => (catalogs || []).find((c) => String(c.id) === String(desiredCatalogId)) || null,
    [catalogs, desiredCatalogId]
  );
  const desiredCatalogName = desiredCatalog?.catalogName || 'the selected catalog';
  const desiredTierName =
    (tiers || []).find((t) => String(t.id) === String(desiredTierId))?.tierName || 'the selected tier';

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [warn, setWarn] = useState(false); // shown when the user clicks an incomplete step's button

  const activeEnvironments = useMemo(
    () => (environments || []).filter((e) => e.status === 'Active'),
    [environments]
  );

  // Load the environment policy (allowed providers/tiers/networks/datastores) on selection.
  useEffect(() => {
    if (!environmentId) {
      setAllowed(EMPTY_ALLOWED);
      setAllowedEnvId(null);
      return;
    }
    let active = true;
    setLoadingAllowed(true);
    allowedResources(environmentId)
      .then((data) => active && setAllowed({ ...EMPTY_ALLOWED, ...data }))
      .catch(() => active && setAllowed(EMPTY_ALLOWED))
      .finally(() => {
        if (!active) return;
        setLoadingAllowed(false);
        setAllowedEnvId(environmentId); // allow-list is now fresh for this env
      });
    return () => {
      active = false;
    };
  }, [environmentId, allowedResources]);

  // Reset dependent selections when environment changes.
  const handleSelectEnvironment = (id) => {
    if (String(id) === String(environmentId)) return; // re-clicking the current env shouldn't wipe the form
    setEnvironmentId(id);
    setProviderId('');
    setNodeId('');
    setCatalogId('');
    setTierId('');
    setNetworkId('');
    setDatastoreId('');
  };

  // Catalog-origin reconcile (see desiredCatalogId above): once the chosen environment's allow-list
  // has loaded, auto-select the provider + node that host the picked catalog (a catalog row is bound
  // to exactly one node) and restore the catalog + tier — but only the ones the env policy actually
  // permits. Runs once per environment selection, so any manual change the user makes afterward sticks.
  useEffect(() => {
    if (!fromCatalog.current) return;
    if (!environmentId || allowedEnvId !== environmentId) return; // wait for a fresh allow-list
    if (reconciledEnvRef.current === environmentId) return;       // already reconciled this env
    if (!(catalogs || []).length || !(allNodes || []).length) return; // wait for catalog/node data
    reconciledEnvRef.current = environmentId;

    const cat = (catalogs || []).find((c) => String(c.id) === String(desiredCatalogId));
    if (cat) {
      const providerOk = (allowed.providers || []).some((p) => String(p.id) === String(cat.providerId));
      // The published catalog is bound to one discovered node — find that node, if the env allows it.
      const node = (allNodes || []).find(
        (n) =>
          String(n.providerId) === String(cat.providerId) &&
          String(n.providerNodeId) === String(cat.providerNodeId) &&
          n.status === 'Active' &&
          (allowed.nodes || []).some((an) => String(an.id) === String(n.id))
      );
      if (providerOk && node) {
        setProviderId(String(cat.providerId));
        setNodeId(String(node.id));
        setCatalogId(String(cat.id));
      }
    }
    // Tier is env-scoped (not node-bound) — restore it whenever the env permits it.
    if ((allowed.tiers || []).some((t) => String(t.id) === String(desiredTierId))) {
      setTierId(String(desiredTierId));
    }
  }, [environmentId, allowedEnvId, allowed, catalogs, allNodes, desiredCatalogId, desiredTierId]);

  const selectedEnv = activeEnvironments.find((e) => String(e.id) === String(environmentId));
  const isPermanentEnv = selectedEnv && (selectedEnv.expiryType === 'permanent' || selectedEnv.expiryType === 'lifetime');
  const envDuration = isPermanentEnv ? 'Lifetime' : selectedEnv ? `${selectedEnv.expiryValue} Days` : '';

  // Published nodes allowed in this env, narrowed to the chosen provider (etc.txt / ADR-17).
  const allowedNodeIds = useMemo(() => (allowed.nodes || []).map((n) => n.id), [allowed.nodes]);
  const providerNodes = useMemo(
    () => (allNodes || []).filter((n) => allowedNodeIds.includes(n.id) && String(n.providerId) === String(providerId) && n.status === 'Active'),
    [allNodes, allowedNodeIds, providerId]
  );
  const selectedNode = (allNodes || []).find((n) => String(n.id) === String(nodeId));
  const selPnid = selectedNode?.providerNodeId;
  // Admin hard-block: a node at critical capacity with the block toggle on can't be provisioned to.
  const nodeBlocked = !!selectedNode?.capacity?.provisioningBlocked;

  // Catalog/network/datastore are bound to the node: filter to the selected node's discovered node.
  const availableCatalogs = useMemo(
    () => (catalogs || []).filter((c) => String(c.providerId) === String(providerId) && c.providerNodeId === selPnid && c.status === 'Active'),
    [catalogs, providerId, selPnid]
  );
  const availableNetworks = useMemo(
    () => (networks || []).filter((n) => n.providerNodeId === selPnid && n.status === 'Active'),
    [networks, selPnid]
  );
  const availableDatastores = useMemo(
    () => (datastores || []).filter((d) => d.providerNodeId === selPnid && d.status === 'Active'),
    [datastores, selPnid]
  );
  const selectedCatalog = availableCatalogs.find((c) => String(c.id) === String(catalogId));

  const selectedTier = (allowed.tiers || []).find((t) => String(t.id) === String(tierId));
  const tierDiskFloor = selectedTier?.diskGb ?? 0;

  const generatedNames = useMemo(() => {
    const c = parseInt(vmCount, 10) || 0;
    if (!vmPrefix || c <= 0) return [];
    // Mirror the backend (ProvisionRequestService): a single instance keeps the exact name; a batch
    // gets "-01".."-0N" suffixes.
    if (c === 1) return [vmPrefix];
    const names = [];
    for (let i = 1; i <= c; i += 1) names.push(`${vmPrefix}-${i.toString().padStart(2, '0')}`);
    return names;
  }, [vmPrefix, vmCount]);

  const count = parseInt(vmCount, 10) || 1;

  // VM name must match the backend rule (DNS-label): letters/digits + internal hyphens, must start
  // and end alphanumeric, max 60. Surface a live, specific hint so the user fixes it before submit.
  const vmNameErr = (() => {
    if (!vmPrefix) return null; // emptiness is handled by step gating (required)
    if (vmPrefix.length > 60) return 'Maximum 60 characters.';
    if (!/^[A-Za-z0-9-]+$/.test(vmPrefix)) return 'Only letters, numbers and hyphens (-) are allowed — no spaces or symbols.';
    if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(vmPrefix)) return 'Must start and end with a letter or number (no leading/trailing hyphen).';
    return null;
  })();
  const vmNameValid = !!vmPrefix && !vmNameErr;

  // Boot disk must be ≥ the tier/template floor. Empty = use the tier default (allowed); any typed
  // value below the floor gets a warning and blocks Next.
  const bootDiskErr = (() => {
    if (bootDiskGb === '' || !tierDiskFloor) return null;
    const v = parseInt(bootDiskGb, 10);
    if (Number.isNaN(v) || v < tierDiskFloor) return `Minimum ${tierDiskFloor} GB (tier size). Increase it or leave empty for the default.`;
    return null;
  })();

  // Per-step completeness — drives both the button state and the "fill all fields" warning.
  const step1Valid = !!(environmentId && providerId);
  const step2Valid = !!(nodeId && catalogId && vmNameValid && vmCount && tierId && networkId && datastoreId) && !nodeBlocked && !bootDiskErr;
  const totalCpu = (selectedTier?.cpu || 0) * count;
  const totalRam = (selectedTier ? selectedTier.ramMb / 1024 : 0) * count;
  // Per-VM boot disk: use the user's custom size when provided (floored at the tier size),
  // otherwise fall back to the tier default. Mirrors the submit payload (effectiveBootDisk).
  const perVmDisk = bootDiskGb === '' ? tierDiskFloor : Math.max(parseInt(bootDiskGb, 10) || 0, tierDiskFloor);
  const totalDisk = perVmDisk * count;

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
    if (nextStep === 3 && (!nodeId || !catalogId || !vmPrefix || !vmCount || !tierId || !networkId || !datastoreId || nodeBlocked)) return;
    setStep(nextStep);
  };

  const executeSubmit = async () => {
    setSubmitting(true);
    try {
      const effectiveBootDisk = bootDiskGb === '' ? null : Math.max(parseInt(bootDiskGb, 10) || 0, tierDiskFloor);
      const payload = {
        vmName: vmPrefix,
        environmentId: Number(environmentId),
        providerId: Number(providerId),
        nodeId: Number(nodeId),
        catalogId: Number(catalogId),
        tierId: Number(tierId),
        networkId: Number(networkId),
        datastoreId: Number(datastoreId),
        instanceCount: count,
        bootDiskGb: effectiveBootDisk,
        requestedExpiry: null,
        description,
      };
      const resubmitId = location.state?.requestId;
      // Revert → edit → resubmit updates the SAME request (no duplicate); a fresh submit POSTs.
      const res = resubmitId
        ? await api.put(`/provision-requests/${resubmitId}`, payload)
        : await api.post('/provision-requests', payload);

      // Branch the UX on what actually happened (res.status), not the environment policy:
      // privileged actors bypass approval and provision immediately, everyone else waits.
      const verb = resubmitId ? 'resubmitted' : 'submitted';
      if (res?.status === 'pending_approval') {
        pushToast({ kind: 'success', message: `Request ${verb} — awaiting manager approval.` });
        navigate('/approvals');
      } else {
        const vmLabel = count > 1 ? `${count} VMs` : 'VM';
        pushToast({
          kind: 'success',
          message: res?.bypassed
            ? `Provisioning started (${vmLabel}) — approval skipped.`
            : `Provisioning started (${vmLabel}).`,
        });
        navigate('/inventory');
      }
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
            {idx < 2 && <div className="w-4 h-px bg-gray-200 dark:bg-zinc-600 mx-1 shrink-0"></div>}
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
                // When the user arrived from the Catalog page, flag whether this env can actually host
                // their pre-selected catalog + tier (warn-but-selectable — see checkEnvCompat).
                const compat = fromCatalog.current
                  ? checkEnvCompat(e, { desiredCatalog, desiredTierId }, allNodes)
                  : null;
                const incompatTitle = compat && !compat.ok
                  ? `This environment doesn't allow ${compat.reasons.includes('catalog') ? desiredCatalogName : ''}${compat.reasons.length === 2 ? ' or ' : ''}${compat.reasons.includes('tier') ? `the ${desiredTierName} tier` : ''}. You can still select it, but you'll need to pick a compatible ${compat.reasons.join(' & ')}.`
                  : '';
                return (
                  <div
                    key={e.id}
                    onClick={() => handleSelectEnvironment(e.id)}
                    className={`text-center p-5 bg-white dark:bg-card border rounded-xl cursor-pointer transition-[transform,box-shadow] duration-200 hover:shadow-md hover:scale-[1.02] ${String(environmentId) === String(e.id) ? 'border-teal-500 shadow-md ring-2 ring-teal-500/20 bg-teal-50/10 dark:bg-teal-900/10' : compat && !compat.ok ? 'border-amber-300 dark:border-amber-700/60' : 'border-gray-200 dark:border-theme'}`}
                  >
                    <div className="text-[15px] font-semibold text-gray-800 dark:text-gray-100 mb-2">{e.environmentName}</div>
                    <div className="text-[11px] px-3 py-1 rounded-full inline-block font-medium bg-gray-50 dark:bg-surface text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-theme">
                      {permanent ? 'Lifetime' : `${e.expiryValue} Days`}
                    </div>
                    {compat && (
                      compat.ok ? (
                        <div
                          className="mt-2 flex items-center justify-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400"
                          title={`Allows ${desiredCatalogName}${desiredTierId ? ` and the ${desiredTierName} tier` : ''}.`}
                        >
                          <CheckCircle2 size={11} /> Supports your selection
                        </div>
                      ) : (
                        <div
                          className="mt-2 flex items-center justify-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400"
                          title={incompatTitle}
                        >
                          <AlertCircle size={11} />
                          {compat.reasons.length === 2
                            ? 'Catalog & tier not available'
                            : compat.reasons[0] === 'catalog'
                              ? `${desiredCatalogName} not available`
                              : `${desiredTierName} tier not allowed`}
                        </div>
                      )
                    )}
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

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Provider</label>
                <select
                  disabled={!environmentId || loadingAllowed}
                  className={`${selectCls} disabled:opacity-50 disabled:cursor-not-allowed`}
                  value={providerId}
                  onChange={(e) => { setProviderId(e.target.value); setNodeId(''); setCatalogId(''); setNetworkId(''); setDatastoreId(''); }}
                >
                  <option value="" disabled>{loadingAllowed ? 'Loading…' : 'Select Provider...'}</option>
                  {(allowed.providers || []).map((p) => (
                    <option key={p.id} value={p.id}>{p.providerName}</option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-400 mt-1.5">Choose the environment and provider here — you'll pick the deployment node in the next step.</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-theme">
              {warn && !step1Valid && (
                <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-[12px] font-medium text-rose-600 dark:text-rose-400">
                  <AlertCircle size={14} /> Please fill all required fields first.
                </div>
              )}
              <div className="flex justify-end">
                <button
                  onClick={() => { if (!step1Valid) { setWarn(true); return; } setWarn(false); handleNext(2); }}
                  className={`bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white px-6 py-2.5 text-[13px] font-medium rounded-lg shadow-md shadow-teal-500/20 transition-[transform,opacity,box-shadow] hover:shadow-lg hover:-translate-y-0.5 ${step1Valid ? '' : 'opacity-50 cursor-not-allowed hover:translate-y-0 hover:shadow-md'}`}
                >
                  Next Step →
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-[14px] font-semibold text-gray-800 dark:text-gray-100 mb-4">VM Configuration</div>

            {/* Deployment Context */}
            <div className="bg-gray-50 dark:bg-zinc-900/40 border border-gray-200 dark:border-theme rounded-xl p-4 mb-6">
              <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
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
                  <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Node <span className="text-rose-500">*</span></label>
                  <select
                    disabled={!providerId}
                    className={`${selectCls} disabled:opacity-50 disabled:cursor-not-allowed`}
                    value={nodeId}
                    onChange={(e) => { setNodeId(e.target.value); setCatalogId(''); setNetworkId(''); setDatastoreId(''); }}
                  >
                    <option value="" disabled>{providerNodes.length === 0 ? 'No nodes allowed here' : 'Select Node...'}</option>
                    {providerNodes.map((n) => {
                      const blocked = !!n.capacity?.provisioningBlocked;
                      const suffix = blocked ? ' — blocked (critical capacity)' : n.capacity?.level === 'warning' ? ' — high load' : '';
                      return (
                        <option key={n.id} value={n.id} disabled={blocked}>{n.name}{suffix}</option>
                      );
                    })}
                  </select>
                </div>
              </div>
              {!nodeId && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-2">Select a node to load its catalogs, networks and datastores below.</p>
              )}
              {selectedNode && (() => {
                const cb = capacityBadge(selectedNode.capacity);
                if (!cb) return null;
                return (
                  <div className={`mt-2 flex items-start gap-2 rounded-lg border px-3 py-2 text-[12px] ${cb.level === 'critical'
                    ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-300'
                    : 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-300'}`}>
                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                    <div>
                      <span className="font-semibold">{cb.level === 'critical' ? 'Node at critical capacity' : 'Node under high load'} — {cb.detail}.</span>{' '}
                      {cb.blocked
                        ? 'An administrator has blocked provisioning on this node. Pick another node or free up resources.'
                        : 'You can still provision here, but consider another node if one is lighter.'}
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">VM Name Prefix</label>
                <input
                  type="text"
                  className={`${inputCls}${vmNameErr ? ' border-rose-500 ring-1 ring-rose-500 focus:border-rose-500 focus:ring-rose-500' : ''}`}
                  value={vmPrefix}
                  onChange={(e) => setVmPrefix(e.target.value.toUpperCase())}
                  placeholder="e.g. APP, WEB, DB"
                  maxLength={60}
                  aria-invalid={!!vmNameErr}
                />
                {vmNameErr ? (
                  <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">{vmNameErr}</p>
                ) : (
                  <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">Letters, numbers &amp; hyphens only — must start/end with a letter or number (max 60).</p>
                )}
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Number of Instances</label>
                <input
                  type="number"
                  className={inputCls}
                  value={vmCount}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === '') { setVmCount(''); return; }       // allow clearing to retype freely
                    const n = parseInt(v, 10);
                    if (!Number.isNaN(n)) setVmCount(Math.min(20, Math.max(0, n)));
                  }}
                  placeholder="e.g. 1"
                  min="1" max="20"
                />
              </div>
            </div>

            {/* Naming Preview */}
            <div className="bg-teal-50/50 dark:bg-teal-900/10 border border-teal-100 dark:border-teal-900/30 rounded-lg p-3 mb-6">
              <div className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold mb-1.5 flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                Generated Names Preview
              </div>
              <div className="flex flex-wrap gap-2">
                {generatedNames.map((name, i) => (
                  <span key={i} className="text-[12px] bg-white dark:bg-card border border-teal-100 dark:border-teal-800 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded font-mono shadow-sm">{name}</span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Catalog</label>
                <select className={selectCls} value={catalogId} onChange={(e) => setCatalogId(e.target.value)}>
                  <option value="" disabled>{!nodeId ? 'Select a node first' : 'Select Catalog...'}</option>
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
                  <option value="" disabled>{!nodeId ? 'Select a node first' : 'Select Network...'}</option>
                  {availableNetworks.map((n) => (
                    <option key={n.id} value={n.id}>{n.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Datastore</label>
                <select className={selectCls} value={datastoreId} onChange={(e) => setDatastoreId(e.target.value)}>
                  <option value="" disabled>{!nodeId ? 'Select a node first' : 'Select Datastore...'}</option>
                  {availableDatastores.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Boot Disk Size (GB)</label>
                <input
                  type="number"
                  className={`${inputCls}${bootDiskErr ? ' border-rose-500 ring-1 ring-rose-500 focus:border-rose-500 focus:ring-rose-500' : ''}`}
                  value={bootDiskGb}
                  min={tierDiskFloor || 1}
                  onChange={(e) => setBootDiskGb(e.target.value)}
                  placeholder={tierDiskFloor ? `Default ${tierDiskFloor} GB (min)` : 'Template default'}
                  aria-invalid={!!bootDiskErr}
                />
                {bootDiskErr ? (
                  <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">{bootDiskErr}</p>
                ) : (
                  <p className="text-[11px] text-gray-400 mt-1">Boot/root disk. Grown on first boot via cloud-init. Must be ≥ tier/template size{tierDiskFloor ? ` (${tierDiskFloor} GB)` : ''}.</p>
                )}
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

            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-theme">
              {warn && !step2Valid && (
                <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-[12px] font-medium text-rose-600 dark:text-rose-400">
                  <AlertCircle size={14} /> Please fill all required fields first.
                </div>
              )}
              <div className="flex justify-between">
                <button onClick={() => { setWarn(false); handleNext(1); }} className="bg-white dark:bg-card text-gray-700 dark:text-gray-200 px-5 py-2.5 text-[13px] font-medium rounded-lg border border-gray-200 dark:border-theme hover:bg-gray-50 dark:hover:bg-zinc-700 shadow-sm">← Back</button>
                <button
                  onClick={() => { if (!step2Valid) { setWarn(true); return; } setWarn(false); handleNext(3); }}
                  className={`bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white px-6 py-2.5 text-[13px] font-medium rounded-lg shadow-md shadow-teal-500/20 transition-[transform,opacity,box-shadow] hover:shadow-lg hover:-translate-y-0.5 ${step2Valid ? '' : 'opacity-50 cursor-not-allowed hover:translate-y-0 hover:shadow-md'}`}
                >
                  Review Request →
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-[14px] font-semibold text-gray-800 dark:text-gray-100 mb-4">Review Your Request</div>

            <div className="bg-gray-50 dark:bg-zinc-900/40 border border-gray-200 dark:border-theme rounded-xl p-5 mb-5 shadow-inner">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-5 gap-x-6">
                {[
                  ['Environment', selectedEnv?.environmentName],
                  ['Provider', (allowed.providers || []).find((p) => String(p.id) === String(providerId))?.providerName],
                  ['Node', selectedNode?.name || '—'],
                  ['Catalog', selectedCatalog?.catalogName],
                  ['Compute Tier', selectedTier?.tierName],
                  ['Network', availableNetworks.find((n) => String(n.id) === String(networkId))?.name],
                  ['Datastore', availableDatastores.find((d) => String(d.id) === String(datastoreId))?.name],
                  ['VM Name Prefix', vmPrefix],
                  ['Instances', vmCount],
                  ['Boot Disk', bootDiskGb ? `${Math.max(parseInt(bootDiskGb, 10) || 0, tierDiskFloor)} GB` : `Template default${tierDiskFloor ? ` (${tierDiskFloor} GB)` : ''}`],
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

              <div className="bg-teal-50/50 dark:bg-teal-900/10 border border-teal-100 dark:border-teal-900/30 rounded-xl p-4 shadow-sm">
                <div className="text-[13px] font-semibold text-teal-800 dark:text-teal-400 mb-3 flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  Generated VM Names
                </div>
                <div className="flex flex-wrap gap-1.5 h-[64px] overflow-y-auto pr-2 custom-scrollbar">
                  {generatedNames.map((name, i) => (
                    <span key={i} className="text-[12px] bg-white dark:bg-card border border-teal-100 dark:border-teal-800 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded font-mono shadow-sm">{name}</span>
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
              <button onClick={() => handleNext(2)} className="bg-white dark:bg-card text-gray-700 dark:text-gray-200 px-5 py-2.5 text-[13px] font-medium rounded-lg border border-gray-200 dark:border-theme hover:bg-gray-50 dark:hover:bg-zinc-700 shadow-sm">← Back</button>
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
              <h3 className="font-semibold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-teal-500" />
                Confirm Provision Request
              </h3>
              <button onClick={() => setShowConfirmModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-700">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div className="p-5 overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-4">
              <div className="bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-theme rounded-md p-4">
                <p className="text-[13px] text-slate-700 dark:text-zinc-300">Are you sure you want to submit this VM request?</p>
              </div>
            </div>
            <div className="shrink-0 px-5 py-4 border-t border-gray-100 dark:border-theme flex items-center justify-end gap-3 bg-white dark:bg-card">
              <button onClick={() => setShowConfirmModal(false)} className="px-4 py-2 text-[13px] font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-input transition-colors">Cancel</button>
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
