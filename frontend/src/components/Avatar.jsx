import { useAuth } from '../auth/AuthContext';

const sizeClass = { 20: 's20', 24: 's24', 32: 's32' };

export function Avatar({ children, size = 24, userId, className = '', ...props }) {
  const user = useAuth()?.user;
  const myId = user?._id || user?.id; // /me sends _id, login and register send id
  const isMe = Boolean(userId) && userId === myId;
  const cls = ['wt-av', sizeClass[size], isMe && 'plain', className]
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
