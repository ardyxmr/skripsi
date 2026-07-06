import React, { useRef, useState, useLayoutEffect } from 'react';
import { MoreVertical } from 'lucide-react';
import { createPortal } from 'react-dom';

// Row "⋮" trigger + a fixed-position dropdown. It positions itself from the trigger button's OWN rect
// and flips upward when there isn't room below (e.g. the last row near the Windows taskbar), so the menu
// is never clipped off the bottom of the viewport. Height is measured from the rendered menu, so the flip
// is exact regardless of how many items a caller renders. Runs in useLayoutEffect (before paint) so there
// is no flash. Callers pass isOpen/onToggle/children; any legacy `dropdownPos` prop is ignored.
const TableActionMenu = ({ isOpen, onToggle, children }) => {
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const [pos, setPos] = useState(null);

  useLayoutEffect(() => {
    if (!isOpen || !btnRef.current || !menuRef.current) { setPos(null); return; }
    const rect = btnRef.current.getBoundingClientRect();
    const menuH = menuRef.current.offsetHeight || 220;
    const openUp = rect.bottom + menuH > window.innerHeight - 8; // not enough room below → flip up
    setPos({
      top: openUp ? Math.max(8, rect.top - menuH - 4) : rect.bottom + 4,
      right: window.innerWidth - rect.right,
    });
  }, [isOpen, children]);

  return (
    <div className="relative inline-block w-full text-center action-dropdown-container">
      <button
        ref={btnRef}
        onClick={onToggle}
        className={`p-1.5 rounded-md transition-colors ${isOpen ? 'bg-slate-100 text-slate-800 dark:bg-surface dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700'}`}
      >
        <MoreVertical size={16} />
      </button>
      {isOpen && createPortal(
        <div
          ref={menuRef}
          // Hidden until positioned (measured in the layout effect below), so it never paints at 0,0.
          style={{ ...(pos || { top: 0, right: 0 }), visibility: pos ? 'visible' : 'hidden' }}
          className="action-dropdown-portal fixed w-52 bg-white dark:bg-card border border-slate-200 dark:border-theme rounded-md shadow-lg overflow-hidden z-[100] flex flex-col"
        >
          {children}
        </div>,
        document.body
      )}
    </div>
  );
};

export default TableActionMenu;
