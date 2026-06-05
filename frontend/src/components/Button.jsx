// Button atom over .wt-btn. `variant` picks the fill, `size` the height
// variant: 'primary' | 'accent' | 'ghost' | 'danger' (default plain)

const variantClass = { primary: 'p', accent: 'accent', ghost: 'ghost', danger: 'danger' };

export default function Button({
  variant,
  size,
  full = false,
  className = '',
  children,
  ...props
}) {
  const cls = ['wt-btn', variantClass[variant], size, full && 'full', className]
    .filter(Boolean)
    .join(' ');
  return (
    <button className={cls} {...props}>
      {children}
    </button>
  );
}
