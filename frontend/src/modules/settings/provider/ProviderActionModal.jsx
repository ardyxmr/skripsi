import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, XCircle, Trash2 } from 'lucide-react';

export default function ProviderActionModal({ isOpen, action, provider, isBlocking, onClose, onConfirm }) {
  const [confirmText, setConfirmText] = useState('');

  if (!isOpen || !provider) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-card rounded-modal shadow-modal border border-gray-200 dark:border-theme w-full max-w-[400px] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="p-5 flex flex-col gap-4">
          {isBlocking && action === 'Delete' ? (
            <>
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded-full flex items-center justify-center mb-1">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                Cannot Delete Provider
              </h3>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Provider masih digunakan oleh resource aktif.<br/><br/>
                Pindahkan atau hapus Catalog, Network, dan Datastore terkait sebelum menghapus Provider.
              </div>
              <div className="flex justify-end mt-2">
                <button onClick={onClose} className="px-4 py-2 text-[13px] font-medium bg-slate-100 dark:bg-surface text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors">Close</button>
              </div>
            </>
          ) : (
            <>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-1 ${
                action === 'Delete' ? 'bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-500' :
                action === 'Enable' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500' :
                'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500'
              }`}>
                {action === 'Delete' ? <Trash2 size={24} /> : action === 'Enable' ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
              </div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                {action} Provider
              </h3>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {action === 'Delete' && 'This action cannot be undone.'}
                {action === 'Enable' && 'This will enable provider sync operations.'}
                {action === 'Disable' && 'This will pause provider sync operations.'}
              </div>
              <div className="bg-slate-50 dark:bg-surface p-3 rounded-card text-[12px] border border-gray-200 dark:border-theme">
                <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Provider:</div>
                <div className="text-slate-500 dark:text-slate-400 font-mono">{provider.name}</div>
              </div>
              <div className="flex flex-col gap-1.5 mt-2">
                <label className="text-[12px] font-medium text-slate-700 dark:text-slate-300">Type the provider name to confirm:</label>
                <input 
                  type="text" 
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={`Type "${provider.name}"`}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-slate-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors shadow-sm" 
                />
              </div>
              <div className="p-4 bg-transparent dark:bg-transparent/50 border-t border-gray-100 dark:border-theme flex justify-end gap-3 mt-2 -mx-5 -mb-5">
                <button onClick={onClose} className="px-4 py-2 text-[13px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-input transition-colors">
                  Cancel
                </button>
                <button 
                  onClick={onConfirm} 
                  disabled={confirmText !== provider.name}
                  className={`px-4 py-2 text-[13px] font-medium text-white rounded-input transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                    action === 'Delete' ? 'bg-rose-600 hover:bg-rose-700' :
                    action === 'Enable' ? 'bg-emerald-600 hover:bg-emerald-700' :
                    'bg-amber-600 hover:bg-amber-700'
                  }`}>
                  {action} Provider
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
