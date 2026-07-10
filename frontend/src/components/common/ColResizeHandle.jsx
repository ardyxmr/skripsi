// Drag handle for a resizable table-column header. Render as the LAST child of a `relative` <th>;
// wire `onMouseDown` to `startResize(columnIndex, e)` from useResizableColumns. Stops click
// propagation so grabbing the handle never triggers the column's sort.
export default function ColResizeHandle({ onMouseDown }) {
  return (
    <span
      onMouseDown={onMouseDown}
      onClick={(e) => e.stopPropagation()}
      className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize select-none hover:bg-teal-400/60 active:bg-teal-500/70"
      aria-hidden="true"
    />
  );
}
