import React, { useState, useRef } from 'react';

const ResizableTh = ({ children, width: initialWidth, minWidth = 80, className = "", onClick, storageKey, columnKey }) => {
  const [width, setWidth] = useState(() => {
    if (storageKey && columnKey) {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          const widths = JSON.parse(stored);
          if (widths[columnKey]) return widths[columnKey];
        } catch (e) {}
      }
    }
    return initialWidth;
  });
  const thRef = useRef(null);

  const startResize = (e) => {
    e.preventDefault();
    const startX = e.pageX;
    const startWidth = thRef.current.offsetWidth;
    const doDrag = (dragEvent) => {
      setWidth(Math.max(minWidth, startWidth + dragEvent.pageX - startX));
    };
    const stopDrag = (dragEvent) => {
      document.removeEventListener('mousemove', doDrag);
      document.removeEventListener('mouseup', stopDrag);
      
      const finalWidth = Math.max(minWidth, startWidth + dragEvent.pageX - startX);
      if (storageKey && columnKey) {
        try {
          const stored = localStorage.getItem(storageKey);
          const widths = stored ? JSON.parse(stored) : {};
          widths[columnKey] = finalWidth;
          localStorage.setItem(storageKey, JSON.stringify(widths));
        } catch(e) {}
      }
    };
    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
  };

  return (
    <th 
      onClick={onClick} 
      ref={thRef} 
      style={{ width: width ? `${width}px` : 'auto' }} 
      className={`relative px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider border-b border-slate-100 dark:border-theme table-header-optimized ${onClick ? 'cursor-pointer select-none hover:brightness-95 dark:hover:brightness-110' : ''} ${className}`}
    >
      {children}
      <div 
        className="absolute top-0 right-0 w-2 h-full cursor-col-resize hover:bg-blue-400 opacity-50 z-10"
        onMouseDown={startResize}
        onClick={(e) => e.stopPropagation()}
      />
    </th>
  );
};

export default ResizableTh;
