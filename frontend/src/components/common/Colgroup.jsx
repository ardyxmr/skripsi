// Shared column widths for a pinned-header table + its separately-scrolling body table, so their
// columns stay aligned under `table-fixed`. Pass an array of px numbers (or CSS width strings).
export default function Colgroup({ widths }) {
  return (
    <colgroup>
      {widths.map((w, i) => (
        <col key={i} style={{ width: typeof w === 'number' ? `${w}px` : w }} />
      ))}
    </colgroup>
  );
}
