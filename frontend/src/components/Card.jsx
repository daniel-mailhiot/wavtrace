// Panel container. Default is .wt-card; variant="2" is the lighter .wt-card-2 used for inner/secondary cards

export default function Card({ variant, className = '', children, ...props }) {
  const base = variant === '2' ? 'wt-card-2' : 'wt-card';
  const cls = [base, className].filter(Boolean).join(' ');
  return (
    <div className={cls} {...props}>
      {children}
    </div>
  );
}
