// Round initials avatar, map the numeric prop to the matching class. `accent` marks the current user ("you")

const sizeClass = { 20: 's20', 24: 's24', 32: 's32' };

export function Avatar({ children, size = 24, accent = false, className = '', ...props }) {
  const cls = ['wt-av', sizeClass[size], accent && 'accent', className]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={cls} {...props}>
      {children}
    </div>
  );
}

// Overlapping row of avatars (members column, project header)
export function AvatarStack({ children }) {
  return <div className="wt-stack">{children}</div>;
}
