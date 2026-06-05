// Search input with the CSS-drawn magnifier (.wt-mag) - used in the app bar
// Passes input props (value, onChange, placeholder) to the field

export default function SearchField({ className = '', ...props }) {
  const cls = ['wt-search', className].filter(Boolean).join(' ');
  return (
    <div className={cls}>
      <span className="wt-mag" />
      <input {...props} />
    </div>
  );
}
