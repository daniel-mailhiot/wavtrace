// Search input with the CSS-drawn magnifier (.wt-mag) - used in the app bar
// `style` sizes the field wrapper, remaining props (value, onChange, placeholder) go to the input

export default function SearchField({ className = '', style, ...props }) {
  const cls = ['wt-search', className].filter(Boolean).join(' ');
  return (
    <div className={cls} style={style}>
      <span className="wt-mag" />
      <input {...props} />
    </div>
  );
}
