import React, { useState, useEffect, useCallback } from 'react';
import { X, Shield, AlertTriangle, Loader2 } from 'lucide-react';
import api from '../lib/api';
import { useUI } from '../stores/uiStore';

/**
 * Version-aware hardening modal. Lists the VM catalog's active hardening playbook versions, lets the
 * user pick one, and submits POST /inventory/{id}/harden { version_id, force }. Selecting the version
 * already applied to the VM triggers a force-re-harden confirm (drift remediation). UI matches the
 * other Inventory modals (z-[70], bg-card/rounded-modal, zoom-in, ESC + overlay-click to close).
 *
 * Props: vm (selected VM row or null), onClose(), onSubmitted().
 */
export default function HardenModal({ vm, onClose, onSubmitted }) {
  const pushToast = useUI((s) => s.pushToast);
  const [versions, setVersions] = useState(null);   // null = loading
  const [selectedId, setSelectedId] = useState(null);
  const [forceConfirmed, setForceConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const open = !!vm;

  // Load this catalog's active versions when the modal opens.
  useEffect(() => {
    if (!open) return undefined;
    let active = true;
    setVersions(null); setSelectedId(null); setForceConfirmed(false);
    api.get(`/catalogs/${vm.catalogId}/hardening`)
      .then((rows) => {
        if (!active) return;
        const list = (rows || []).filter((r) => r.isActive);
        setVersions(list);
        setSelectedId(list[0]?.id ?? null);   // default: latest active (list is active-first)
      })
      .catch(() => active && setVersions([]));
    return () => { active = false; };
  }, [open, vm?.catalogId]);

  const close = useCallback(() => { if (!submitting) onClose(); }, [submitting, onClose]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  if (!open) return null;

  const alreadyApplied = selectedId != null && selectedId === vm.appliedVersionId;
  const canSubmit = selectedId != null && !submitting && (!alreadyApplied || forceConfirmed);

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await api.post(`/inventory/${vm.id}/harden`, { versionId: selectedId, force: alreadyApplied });
      pushToast({ message: 'Hardening requested.' });
      onSubmitted?.();
      onClose();
    } catch (e) {
      pushToast({ kind: 'error', message: e.message || 'Hardening request failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-gray-900/60 dark:bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={close}></div>
      <div className="relative bg-white dark:bg-card w-full max-w-[520px] rounded-modal shadow-modal overflow-hidden border border-gray-200 dark:border-theme animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between p-4 border-b border-gray-100 dark:border-theme">
          <h3 className="font-semibold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
            <Shield size={18} className="text-teal-600 dark:text-teal-400" /> Harden / Patch
          </h3>
          <button onClick={close} className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-700"><X size={18} /></button>
        </div>

        <div className="p-5 overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-4">
          {/* Target + current status */}
          <div className="text-[13px] text-slate-700 dark:text-zinc-300">
            Target VM: <span className="font-mono font-semibold text-slate-800 dark:text-zinc-100">{vm.name}</span>
            <div className="text-[12px] text-slate-500 dark:text-zinc-400 mt-1">
              {vm.appliedVersion
                ? <>Currently applied: <strong>{vm.appliedVersion.name} {vm.appliedVersion.version}</strong></>
                : 'Not yet hardened.'}
            </div>
          </div>

          {/* Versions */}
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Available versions</div>
            {versions === null ? (
              <div className="flex items-center gap-2 text-[13px] text-slate-500 py-4"><Loader2 size={16} className="animate-spin" /> Loading…</div>
            ) : versions.length === 0 ? (
              <div className="text-[13px] text-slate-500 dark:text-zinc-400 py-3">No active hardening versions for this catalog.</div>
            ) : (
              <div className="border border-slate-200 dark:border-theme rounded-md divide-y divide-slate-100 dark:divide-theme overflow-hidden">
                {versions.map((v) => (
                  <label key={v.id} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-700/40">
                    <input type="radio" name="hv" value={v.id} checked={selectedId === v.id} onChange={() => { setSelectedId(v.id); setForceConfirmed(false); }} className="text-teal-600 focus:ring-teal-500" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-slate-800 dark:text-zinc-100">{v.name} <span className="text-slate-500 font-normal">v{v.version}</span></div>
                      <div className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono truncate">{v.playbookFilename}</div>
                    </div>
                    {v.id === vm.appliedVersionId && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">Applied</span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Smart force-re-harden warning */}
          {alreadyApplied && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-md p-3">
              <div className="flex items-start gap-2 text-[12px] text-amber-700 dark:text-amber-400">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span>This version is already applied. Re-running it is only needed for drift remediation.</span>
              </div>
              <label className="flex items-center gap-2 mt-2 text-[12px] font-medium text-amber-800 dark:text-amber-300 cursor-pointer">
                <input type="checkbox" checked={forceConfirmed} onChange={(e) => setForceConfirmed(e.target.checked)} className="text-amber-600 focus:ring-amber-500" />
                Yes, force re-harden with this version
              </label>
            </div>
          )}

          <p className="text-[11px] text-slate-400 dark:text-zinc-500">Regular users&apos; requests require approval; managers/admins run immediately.</p>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 py-4 border-t border-gray-100 dark:border-theme flex items-center justify-end gap-3 bg-white dark:bg-card">
          <button onClick={close} className="px-4 py-2 text-[13px] font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-input transition-colors">Cancel</button>
          <button onClick={submit} disabled={!canSubmit} className="px-4 py-2 text-[13px] font-medium text-white border rounded-input shadow-sm transition-colors bg-teal-600 hover:bg-teal-700 border-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
            {submitting && <Loader2 size={14} className="animate-spin" />} Harden / Patch
          </button>
        </div>
      </div>
    </div>
  );
}
