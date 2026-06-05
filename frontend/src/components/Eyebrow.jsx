// Small uppercase mono section label over .wt-eyebrow

export default function Eyebrow({ children, className = '', ...props }) {
  const cls = ['wt-eyebrow', className].filter(Boolean).join(' ');
  return (
    <div className={cls} {...props}>
      {children}
    </div>
  );
}
