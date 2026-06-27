import React, { useState, useEffect, useRef } from 'react';
import { X, Shield, ChevronDown } from 'lucide-react';

// Reusable multi-select dropdown: a button (summary) that opens a checkbox popover.
// Scales cleanly to many providers/nodes without a long inline list.
function MultiSelectDropdown({ summary, disabled, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-zinc-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="truncate text-left">{summary}</span>
        <ChevronDown size={14} className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && !disabled && (
        <div className="absolute z-30 mt-1 w-full max-h-[220px] overflow-y-auto custom-scrollbar border border-slate-200 dark:border-theme rounded-md bg-white dark:bg-card shadow-lg p-2 flex flex-col gap-0.5">
          {children}
        </div>
      )}
    </div>
  );
}

function CheckRow({ checked, onChange, children }) {
  return (
    <label className="flex items-center gap-2 text-[12px] text-slate-700 dark:text-zinc-300 cursor-pointer px-1.5 py-1 rounded hover:bg-slate-50 dark:hover:bg-zinc-700/40">
      <input type="checkbox" checked={checked} onChange={onChange} className="rounded border-slate-300 dark:border-theme text-blue-600 focus:ring-blue-500" />
      <span className="truncate">{children}</span>
    </label>
  );
}

export default function EnvironmentForm({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  title = "Create Environment",
  onChange,
  lists = { providers: [], tiers: [], nodes: [], networks: [], datastores: [] },
}) {
  const EMPTY = {
    name: '',
    description: '',
    expiryType: 'days',
    expiryValue: 30,
    gracePeriodType: 'days',
    gracePeriodValue: 7,
    approvalRequired: true,
    allowDataDisk: false,
    maxDataDisks: 6,
    status: 'Active',
    type: 'Custom',
    allowedProviderIds: [],
    allowedTierIds: [],
    allowedNodeIds: [],
  };
  const [formData, setFormData] = useState(EMPTY);

  // Keep track if it's a default environment since name cannot be changed
  const isDefault = initialData?.type === 'Default';

  useEffect(() => {
    if (initialData && isOpen) {
      setFormData({ ...EMPTY, ...initialData });
    } else if (isOpen) {
      setFormData(EMPTY);
    }
  }, [initialData, isOpen]);

  // Grey out Save until the form's required fields pass native validation.
  const formRef = useRef(null);
  const [canSave, setCanSave] = useState(false);
  const syncValidity = () => setCanSave(!!formRef.current && formRef.current.checkValidity());
  useEffect(() => { syncValidity(); }); // after every render (covers open/prefill + state changes)

  if (!isOpen) return null;

  // Toggle an id within one of the allow-list arrays.
  const toggleAllow = (key, id) => setFormData((f) => {
    const arr = f[key] || [];
    return { ...f, [key]: arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id] };
  });

  // Toggling a provider also prunes that provider's nodes from the node allow-list
  // (a node can't stay allowed once its provider is deselected) — etc.txt item 3.
  const toggleProvider = (providerId) => setFormData((f) => {
    const has = (f.allowedProviderIds || []).includes(providerId);
    const providers = has
      ? (f.allowedProviderIds || []).filter((x) => x !== providerId)
      : [...(f.allowedProviderIds || []), providerId];
    const nodeIdsOnProvider = (lists.nodes || []).filter((n) => n.providerId === providerId).map((n) => n.id);
    const allowedNodeIds = has
      ? (f.allowedNodeIds || []).filter((id) => !nodeIdsOnProvider.includes(id))
      : (f.allowedNodeIds || []);
    return { ...f, allowedProviderIds: providers, allowedNodeIds };
  });

  // Providers currently checked — their published nodes are offered in the Node dropdown.
  const selectedProviders = (lists.providers || []).filter((p) => (formData.allowedProviderIds || []).includes(p.id));

  // Button label for a multi-select: placeholder when empty, names when few, count when many.
  const summarize = (ids, items, nameFn, placeholder) => {
    const sel = (items || []).filter((i) => (ids || []).includes(i.id));
    if (sel.length === 0) return placeholder;
    if (sel.length <= 2) return sel.map(nameFn).join(', ');
    return `${sel.length} selected`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-card rounded-modal shadow-modal border border-gray-200 dark:border-theme w-full max-w-[600px] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh]">
        <div className="shrink-0 flex items-center justify-between p-4 border-b border-gray-100 dark:border-theme">
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
              {initialData ? '✏️ Edit Environment' : '➕ Create Environment'}
            </h3>
            <p className="text-[12px] text-slate-500 dark:text-zinc-400 mt-1">Configure environment policy rules</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-700 self-start">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form id="environment-form" ref={formRef} onSubmit={handleSubmit} onChange={(e) => { onChange?.(e); syncValidity(); }} className="flex flex-col overflow-hidden min-h-0">
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 flex flex-col gap-5">
            <div className="bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-theme rounded-md p-4">
              <label className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-4 block">General Information</label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-[12px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">Environment Name <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. UAT Environment"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-zinc-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors disabled:opacity-50"
                    required
                    disabled={isDefault}
                  />
                  {isDefault && (
                    <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1"><Shield size={12}/> Default environment names cannot be changed.</p>
                  )}
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-[12px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">Description</label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe the purpose of this environment..."
                    className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-zinc-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors resize-y min-h-[80px]"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-theme rounded-md p-4">
              <label className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-4 block">Policy Configuration</label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">Expiry Type</label>
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
                      className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-zinc-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors cursor-pointer"
                    >
                      <option value="days">Days</option>
                      <option value="hours">Hours</option>
                      <option value="minutes">Minutes</option>
                      <option value="lifetime">Lifetime</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">Expiry Value</label>
                  <input 
                    type="number" 
                    min="1"
                    value={formData.expiryValue === null || formData.expiryValue === undefined ? '' : formData.expiryValue}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === '') { setFormData({ ...formData, expiryValue: '' }); return; } // allow clearing to retype freely
                      const n = parseInt(v, 10);
                      if (!Number.isNaN(n)) setFormData({ ...formData, expiryValue: Math.max(0, n) });
                    }}
                    placeholder={formData.expiryType === 'lifetime' ? "Not Applicable" : "Enter amount"}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-zinc-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors disabled:opacity-50"
                    disabled={formData.expiryType === 'lifetime'}
                    required={formData.expiryType !== 'lifetime'}
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">Grace Period Type</label>
                  <select
                    value={formData.gracePeriodType || 'days'}
                    onChange={(e) => setFormData({ ...formData, gracePeriodType: e.target.value })}
                    disabled={formData.expiryType === 'lifetime'}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-zinc-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <option value="days">Days</option>
                    <option value="hours">Hours</option>
                    <option value="minutes">Minutes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">Grace Period Value</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.gracePeriodValue ?? ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === '') { setFormData({ ...formData, gracePeriodValue: '' }); return; }
                      const n = parseInt(v, 10);
                      if (!Number.isNaN(n)) setFormData({ ...formData, gracePeriodValue: Math.max(0, n) });
                    }}
                    placeholder={formData.expiryType === 'lifetime' ? 'Not Applicable' : 'e.g. 7'}
                    disabled={formData.expiryType === 'lifetime'}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-zinc-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors disabled:opacity-50"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">Time after expiry before the VM is auto-destroyed.</p>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">Approval Policy</label>
                  <select 
                    value={formData.approvalRequired ? 'required' : 'optional'}
                    onChange={(e) => setFormData({...formData, approvalRequired: e.target.value === 'required'})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-zinc-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors cursor-pointer"
                  >
                    <option value="required">Required</option>
                    <option value="optional">Not Required</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">Environment Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-zinc-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors cursor-pointer"
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
                      <span className="block text-[12px] font-semibold text-slate-700 dark:text-zinc-300">Allow data disks</span>
                      <span className="block text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">Permit adding extra data disks to VMs in this environment (Inventory → Edit Resources). Default off.</span>
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">Max Data Disks / VM</label>
                  <input
                    type="number"
                    min="0"
                    max="6"
                    value={formData.maxDataDisks ?? ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === '') { setFormData({ ...formData, maxDataDisks: '' }); return; }
                      const n = parseInt(v, 10);
                      if (!Number.isNaN(n)) setFormData({ ...formData, maxDataDisks: Math.min(6, Math.max(0, n)) });
                    }}
                    disabled={!formData.allowDataDisk}
                    placeholder={formData.allowDataDisk ? 'e.g. 2' : 'Enable data disks first'}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-zinc-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className="block text-[11px] text-slate-500 dark:text-zinc-400 mt-1">Policy cap, 0–6 (the infrastructure ceiling). VMs in this environment can hold at most this many data disks.</span>
                </div>

              </div>
            </div>

            {/* Allowed Resources — Tiers + Providers, then per-provider published Nodes (etc.txt item 3).
                Catalogs, networks and datastores follow the selected nodes, so they aren't listed here. */}
            <div className="bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-theme rounded-md p-4">
              <label className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1 block">Allowed Resources</label>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mb-3">Pick the tiers and providers allowed here, then choose which published nodes on each provider this environment may deploy to. Catalogs, networks and datastores follow the selected nodes.</p>

              <div className="grid grid-cols-2 gap-4">
                {/* Tiers */}
                <div>
                  <div className="text-[12px] font-semibold text-slate-700 dark:text-zinc-300 mb-2">Tiers</div>
                  <MultiSelectDropdown summary={summarize(formData.allowedTierIds, lists.tiers, (t) => t.tierName ?? t.name, 'Select tiers')}>
                    {(lists.tiers || []).length === 0 ? (
                      <span className="text-[11px] text-slate-400 italic px-1.5 py-1">None available</span>
                    ) : (lists.tiers || []).map((t) => (
                      <CheckRow key={t.id} checked={(formData.allowedTierIds || []).includes(t.id)} onChange={() => toggleAllow('allowedTierIds', t.id)}>
                        {t.tierName ?? t.name}
                      </CheckRow>
                    ))}
                  </MultiSelectDropdown>
                </div>
                {/* Providers — auto-listed from published providers (scales to many) */}
                <div>
                  <div className="text-[12px] font-semibold text-slate-700 dark:text-zinc-300 mb-2">Providers</div>
                  <MultiSelectDropdown summary={summarize(formData.allowedProviderIds, lists.providers, (p) => p.providerName ?? p.name, 'Select providers')}>
                    {(lists.providers || []).length === 0 ? (
                      <span className="text-[11px] text-slate-400 italic px-1.5 py-1">None available</span>
                    ) : (lists.providers || []).map((p) => (
                      <CheckRow key={p.id} checked={(formData.allowedProviderIds || []).includes(p.id)} onChange={() => toggleProvider(p.id)}>
                        {p.providerName ?? p.name}
                      </CheckRow>
                    ))}
                  </MultiSelectDropdown>
                </div>
                {/* Nodes — grouped under the selected providers; same dropdown behavior */}
                <div className="col-span-2">
                  <div className="text-[12px] font-semibold text-slate-700 dark:text-zinc-300 mb-2">
                    Nodes <span className="text-[11px] font-normal text-slate-400">— on the selected providers</span>
                  </div>
                  <MultiSelectDropdown
                    disabled={selectedProviders.length === 0}
                    summary={selectedProviders.length === 0
                      ? 'Select one or more providers first'
                      : summarize(formData.allowedNodeIds, lists.nodes, (n) => n.nodeName ?? n.name, 'Select nodes')}
                  >
                    {selectedProviders.map((p) => {
                      const provNodes = (lists.nodes || []).filter((n) => n.providerId === p.id);
                      return (
                        <div key={p.id}>
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-1.5 pt-1.5 pb-0.5">{p.providerName ?? p.name}</div>
                          {provNodes.length === 0 ? (
                            <span className="text-[11px] text-slate-400 italic px-1.5 py-1 block">No published nodes</span>
                          ) : provNodes.map((n) => (
                            <CheckRow key={n.id} checked={(formData.allowedNodeIds || []).includes(n.id)} onChange={() => toggleAllow('allowedNodeIds', n.id)}>
                              {n.nodeName ?? n.name}{n.rawNode ? <span className="text-slate-400"> · {n.rawNode}</span> : null}
                            </CheckRow>
                          ))}
                        </div>
                      );
                    })}
                  </MultiSelectDropdown>
                </div>
              </div>
            </div>

          </div>
          <div className="shrink-0 px-5 py-4 border-t border-gray-100 dark:border-theme flex items-center justify-end gap-3 bg-white dark:bg-card">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-[13px] font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-input transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="environment-form"
              disabled={!canSave}
              className="px-4 py-2 text-[13px] font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-input transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
            >
              {initialData ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
