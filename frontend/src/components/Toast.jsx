import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import { useUI } from '../stores/uiStore';

function ToastItem({ toast }) {
  const dismissToast = useUI((s) => s.dismissToast);
  const isError = toast.kind === 'error';
  const isLoading = toast.kind === 'loading';

  useEffect(() => {
    // Loading toasts stay up until the caller dismisses them (unless given an explicit duration).
    if (isLoading && toast.duration == null) return;
    const timer = setTimeout(() => dismissToast(toast.id), toast.duration ?? 2500);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, isLoading, dismissToast]);

  const tone = isError
    ? 'bg-rose-50 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/50'
    : isLoading
      ? 'bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border-slate-200 dark:border-zinc-700'
      : 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50';

  return (
    <div
      className={`pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-md shadow-md text-[13px] font-medium border animate-in fade-in slide-in-from-top-4 duration-200 ${tone}`}
    >
      {isError ? (
        <AlertCircle size={16} className="text-rose-500" />
      ) : isLoading ? (
        <Loader2 size={16} className="text-slate-500 animate-spin" />
      ) : (
        <CheckCircle2 size={16} className="text-emerald-500" />
      )}
      <span>{toast.message}</span>
      <button onClick={() => dismissToast(toast.id)} className="ml-1 opacity-60 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  );
}

export default function Toast() {
  const toasts = useUI((s) => s.toasts);
  if (!toasts.length) return null;

  return (
    <div className="fixed top-4 left-0 right-0 flex flex-col items-center gap-2 z-[300] pointer-events-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}
