// Text input over .wt-input. `mono` swaps to the monospace variant used for metadata-style fields
// Extra props (type, value, onChange, ref) pass through

export default function Input({ mono = false, className = '', ...props }) {
  const cls = ['wt-input', mono && 'mono', className].filter(Boolean).join(' ');
  return <input className={cls} {...props} />;
}
