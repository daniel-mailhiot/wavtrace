// Small rounded tag over .wt-pill. `tone` colors it; `square` uses the 5px
// radius variant. 'plain' is the neutral white-text look
// tone: 'accent' | 'rev' | 'ok' | 'warn' | 'bad' | 'plain'

export default function Pill({ tone, square = false, className = '', children, ...props }) {
  const cls = ['wt-pill', tone, square && 'sq', className].filter(Boolean).join(' ');
  return (
    <span className={cls} {...props}>
      {children}
    </span>
  );
}
