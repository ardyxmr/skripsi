import React, { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';

/**
 * Generic confirmation modal.
 *
 * Props:
 *  - isOpen, title, message, confirmLabel, confirmKind ('primary' | 'danger')
 *  - onConfirm, onClose
 *  - typedConfirmation: optional string the user must type exactly to enable confirm
 *    (used for VM delete / resize confirmation).
 */
export default function ConfirmModal({
  isOpen,
  title = 'Confirm',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmKind = 'primary',
  onConfirm,
  onClose,
  typedConfirmation = null,
}) {
  const [typed, setTyped] = useState('');

  useEffect(() => {
    if (isOpen) setTyped('');
  }, [isOpen]);

  if (!isOpen) return null;

  const needsTyping = typedConfirmation != null && typedConfirmation !== '';
  const confirmDisabled = needsTyping && typed !== typedConfirmation;

  const confirmBtn =
    confirmKind === 'danger'
      ? 'bg-rose-600 hover:bg-rose-700 border-rose-700'
      : 'bg-teal-600 hover:bg-teal-700 border-teal-700';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-card w-full max-w-[450px] rounded-modal shadow-modal overflow-hidden border border-gray-200 dark:border-theme animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="shrink-0 flex items-center justify-between p-4 border-b border-gray-100 dark:border-theme">
          <h3 className="font-semibold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
            {confirmKind === 'danger' && <AlertTriangle size={18} className="text-rose-500" />}
            {title}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-700">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-4">
          {typeof message === 'string' ? (
            <p className="text-[13px] text-slate-700 dark:text-zinc-300">{message}</p>
          ) : (
            message
          )}
          {needsTyping && (
            <div className="bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-theme rounded-md p-4">
              <label className="block text-[12px] font-semibold text-slate-700 dark:text-zinc-300 mb-2">
                Type <strong className="font-mono bg-rose-100 dark:bg-rose-900/40 px-1.5 py-0.5 rounded text-rose-700 dark:text-rose-400 select-all">{typedConfirmation}</strong> to confirm:
              </label>
              <input
                type="text"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder={typedConfirmation}
                className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-zinc-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-colors"
              />
            </div>
          )}
        </div>
        <div className="shrink-0 px-5 py-4 border-t border-gray-100 dark:border-theme flex items-center justify-end gap-3 bg-white dark:bg-card">
          <button onClick={onClose} className="px-4 py-2 text-[13px] font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-input transition-colors">
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={confirmDisabled}
            className={`px-4 py-2 text-[13px] font-medium text-white border rounded-input transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${confirmBtn}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
