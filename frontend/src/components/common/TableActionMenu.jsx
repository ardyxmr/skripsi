import React from 'react';
import { MoreVertical } from 'lucide-react';
import { createPortal } from 'react-dom';

const TableActionMenu = ({ isOpen, onToggle, dropdownPos, children }) => {
  return (
    <div className="relative inline-block w-full text-center action-dropdown-container">
      <button 
        onClick={onToggle}
        className={`p-1.5 rounded-md transition-colors ${isOpen ? 'bg-slate-100 text-slate-800 dark:bg-surface dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
      >
        <MoreVertical size={16} />
      </button>
      {isOpen && createPortal(
        <div 
          style={dropdownPos} 
          className="action-dropdown-portal fixed w-52 bg-white dark:bg-card border border-slate-200 dark:border-theme rounded-md shadow-lg overflow-hidden z-[100] flex flex-col mt-1"
        >
          {children}
        </div>,
        document.body
      )}
    </div>
  );
};

export default TableActionMenu;
