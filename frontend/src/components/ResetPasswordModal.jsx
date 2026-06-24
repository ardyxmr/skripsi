import React, { useState, useEffect, useCallback } from 'react';
import { X, KeyRound, Eye, EyeOff, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import api from '../lib/api';
import { useUI } from '../stores/uiStore';

/**
 * Self-service password change. Fields: email (prefilled with the signed-in user, editable for
 * verification), current password, new password, retype. Submits POST /auth/change-password
 * ({ email, currentPassword, password, passwordConfirmation } → decamelized server-side).
 *
 * UX mirrors the other modals (z-[70], bg-card/rounded-modal, zoom-in, ESC + overlay-click to close)
 * and adds exit protection: closing (ESC / overlay / Cancel / X) while the form is dirty asks to
 * discard first.
 *
 * Props: open (bool), user (current user), onClose().
 */
export default function ResetPasswordModal({ open, user, onClose }) {
  const pushToast = useUI((s) => s.pushToast);
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [retype, setRetype] = useState('');
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [currentLocked, setCurrentLocked] = useState(true);   // readOnly until focus → blocks browser autofill
  const [verified, setVerified] = useState(null);             // null = unchecked, true/false = result
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  // Reset all state each time the modal opens.
  useEffect(() => {
    if (!open) return;
    setEmail(user?.email || '');
    setCurrentPassword(''); setNewPassword(''); setRetype('');
    setShow(false); setSubmitting(false); setError(''); setConfirmDiscard(false); setCurrentLocked(true);
    setVerified(null); setVerifying(false); setVerifyError('');
  }, [open, user?.email]);

  // Verify the existing password (on blur / Enter). Until it checks out, the new-password fields
  // and the Reset button stay disabled.
  const verifyCurrent = async () => {
    if (!currentPassword || verifying || verified === true) return;
    setVerifying(true); setVerifyError('');
    try {
      const res = await api.post('/auth/verify-password', { password: currentPassword });
      if (res?.valid) {
        setVerified(true);
      } else {
        setVerified(false);
        setVerifyError('Current password is incorrect.');
      }
    } catch (e) {
      setVerified(false);
      setVerifyError(e?.message || 'Could not verify password.');
    } finally {
      setVerifying(false);
    }
  };

  // Email is locked, so the form is "dirty" only once a password field has any value.
  const isDirty = currentPassword !== '' || newPassword !== '' || retype !== '';

  const attemptClose = useCallback(() => {
    if (submitting) return;
    if (isDirty) { setConfirmDiscard(true); return; }
    onClose();
  }, [submitting, isDirty, onClose]);

  // ESC: while the discard prompt is up it cancels the prompt; otherwise it attempts to close.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (confirmDiscard) setConfirmDiscard(false);
      else attemptClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, confirmDiscard, attemptClose]);

  if (!open) return null;

  const mismatch = retype.length > 0 && newPassword !== retype;
  const sameAsCurrent = newPassword.length > 0 && newPassword === currentPassword;
  const canSubmit =
    !submitting && verified === true && email.trim() && currentPassword && newPassword.length >= 8 && !sameAsCurrent && !mismatch && newPassword === retype;

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    try {
      await api.post('/auth/change-password', {
        email: email.trim(),
        currentPassword,
        password: newPassword,
        passwordConfirmation: retype,
      });
      pushToast({ message: 'Password updated successfully.' });
      onClose();
    } catch (e) {
      setError(e?.message || 'Could not change the password.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    'w-full bg-gray-50 dark:bg-zinc-900/40 border border-gray-200 dark:border-theme rounded-input px-3 py-2 text-[13px] text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-colors';
  const labelCls = 'block text-[11px] font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-gray-900/60 dark:bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={attemptClose}></div>
      <div className="relative bg-white dark:bg-card w-full max-w-[440px] rounded-modal shadow-modal overflow-hidden border border-gray-200 dark:border-theme animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between p-4 border-b border-gray-100 dark:border-theme">
          <h3 className="font-semibold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
            <KeyRound size={18} className="text-teal-600 dark:text-teal-400" /> Reset Password
          </h3>
          <button onClick={attemptClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-700"><X size={18} /></button>
        </div>

        <div className="p-5 overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-4">
          <div>
            <label className={labelCls}>Email</label>
            <input type="email" value={email} readOnly disabled autoComplete="username" title="Email cannot be changed" className={`${inputCls} opacity-60 cursor-not-allowed bg-gray-100 dark:bg-zinc-800/60`} />
          </div>

          <div>
            <label className={labelCls}>Existing password</label>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => { setCurrentPassword(e.target.value); setVerified(null); setVerifyError(''); }}
                onBlur={verifyCurrent}
                onKeyDown={(e) => { if (e.key === 'Enter') verifyCurrent(); }}
                readOnly={currentLocked}
                onFocus={() => setCurrentLocked(false)}
                autoComplete="new-password"
                name="rp-existing-password"
                className={`${inputCls} pr-9 ${verified === false ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : ''} ${verified === true ? 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/20' : ''}`}
                placeholder="Current password"
              />
              {verifying && <Loader2 size={15} className="absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />}
              {!verifying && verified === true && <CheckCircle2 size={15} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-500" />}
            </div>
            {verified === false && <p className="text-[11px] text-rose-500 mt-1">{verifyError}</p>}
            {verified === true && <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">Password verified.</p>}
            {verified === null && !verifying && currentPassword === '' && <p className="text-[11px] text-gray-400 mt-1">Verify your current password to continue.</p>}
          </div>

          <div>
            <label className={labelCls}>New password</label>
            <div className="relative">
              <input type={show ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={verified !== true} autoComplete="new-password" className={`${inputCls} pr-10 ${verified !== true ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-zinc-800/60' : ''} ${sameAsCurrent ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : ''}`} placeholder={verified === true ? 'At least 8 characters' : 'Verify current password first'} />
              <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300" aria-label={show ? 'Hide passwords' : 'Show passwords'}>
                {show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {sameAsCurrent && <p className="text-[11px] text-rose-500 mt-1">New password must be different from your current password.</p>}
          </div>

          <div>
            <label className={labelCls}>Retype new password</label>
            <input type={show ? 'text' : 'password'} value={retype} onChange={(e) => setRetype(e.target.value)} disabled={verified !== true} autoComplete="new-password" className={`${inputCls} ${verified !== true ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-zinc-800/60' : ''} ${mismatch ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : ''}`} placeholder={verified === true ? 'Re-enter new password' : 'Verify current password first'} />
            {mismatch && <p className="text-[11px] text-rose-500 mt-1">Passwords do not match.</p>}
          </div>

          {error && (
            <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/40 rounded-md p-3 flex items-start gap-2 text-[12px] text-rose-700 dark:text-rose-400">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" /> <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 py-4 border-t border-gray-100 dark:border-theme flex items-center justify-end gap-3 bg-white dark:bg-card">
          <button onClick={attemptClose} className="px-4 py-2 text-[13px] font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-input transition-colors">Cancel</button>
          <button onClick={submit} disabled={!canSubmit} className="px-4 py-2 text-[13px] font-medium text-white border rounded-input shadow-sm transition-colors bg-teal-600 hover:bg-teal-700 border-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
            {submitting && <Loader2 size={14} className="animate-spin" />} Reset
          </button>
        </div>

        {/* Unsaved-changes exit protection */}
        {confirmDiscard && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-900/50 dark:bg-black/60 backdrop-blur-sm rounded-modal">
            <div className="bg-white dark:bg-card border border-gray-200 dark:border-theme rounded-modal shadow-modal w-[300px] p-5 animate-in zoom-in-95 duration-150">
              <div className="flex items-start gap-2 mb-4">
                <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[13px] text-slate-700 dark:text-zinc-200">You have unsaved changes. Discard them and close?</p>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button onClick={() => setConfirmDiscard(false)} className="px-3 py-1.5 text-[12px] font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-input">Keep editing</button>
                <button onClick={() => { setConfirmDiscard(false); onClose(); }} className="px-3 py-1.5 text-[12px] font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-input">Discard</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
