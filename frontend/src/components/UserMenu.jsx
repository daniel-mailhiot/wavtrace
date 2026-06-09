import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { Avatar } from './Avatar';
import { InfoIcon, SignOutIcon } from './icons';
import AboutModal from '../modals/AboutModal';
import initials from '../utils/initials';

// Profile icon dropdown
export default function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click or Escape (same as the Select dropdown)
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (!ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const clip = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        onClick={() => setOpen((o) => !o)}
        style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}
      >
        <Avatar size={24} userId={user?._id || user?.id}>{initials(user?.name)}</Avatar>
      </button>

      {open && (
        <div className="wt-menu" role="menu" style={{ left: 'auto', right: 0, width: 250, padding: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: 13 }}>
            <Avatar size={32} userId={user?._id || user?.id}>{initials(user?.name)}</Avatar>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', ...clip }}>{user?.name}</div>
              <div className="mono faint" style={{ fontSize: 12, ...clip }}>{user?.email}</div>
            </div>
          </div>

          <div className="wt-divsoft" />

          <div style={{ padding: 4 }}>
            <button
              type="button"
              role="menuitem"
              className="wt-menu-item"
              style={{ gap: 10 }}
              onClick={() => { setOpen(false); setAboutOpen(true); }}
            >
              <InfoIcon /> About
            </button>
          </div>

          <div className="wt-divsoft" />

          <div style={{ padding: 4 }}>
            <button
              type="button"
              role="menuitem"
              className="wt-menu-item danger"
              style={{ gap: 10 }}
              onClick={() => { setOpen(false); logout(); }}
            >
              <SignOutIcon /> Sign out
            </button>
          </div>
        </div>
      )}

      {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}
    </div>
  );
}
