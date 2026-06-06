import React, { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function UserActionModal({ isOpen, type, data, isWarning, assignedUsers, onConfirm, onClose }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;


  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-card rounded-modal shadow-modal border border-gray-200 dark:border-theme w-[400px] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="p-5 flex flex-col items-center text-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-1 ${isWarning ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500' : 'bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-500'}`}>
            <AlertTriangle size={24} />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 leading-tight">
            {isWarning ? 'Cannot Delete' : 'Confirm Deletion'}
          </h3>
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {isWarning ? (
              type === 'user_manager' ? (
                <p>This user is currently assigned as a Group Manager. Please reassign the Group Manager before deleting this user.</p>
              ) : (
                <p>This {type} cannot be deleted because it is assigned to <span className="font-bold text-slate-800 dark:text-slate-200">{assignedUsers.length} user(s)</span>. Please reassign the users first.</p>
              )
            ) : (
              <p>Are you sure you want to delete <span className="font-bold text-slate-800 dark:text-slate-200">"{data?.name}"</span>? This action cannot be undone.</p>
            )}
          </div>
          
          <div className="flex justify-center gap-3 mt-4 w-full">
            {isWarning ? (
              <button onClick={onClose} className="flex-1 px-4 py-2 text-[13px] font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-input transition-colors shadow-sm">Got it</button>
            ) : (
              <>
                <button onClick={onClose} className="flex-1 px-4 py-2 text-[13px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-input transition-colors">Cancel</button>
                <button onClick={onConfirm} className="flex-1 px-4 py-2 text-[13px] font-medium bg-rose-600 hover:bg-rose-700 text-white rounded-input transition-colors shadow-sm">Delete</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
