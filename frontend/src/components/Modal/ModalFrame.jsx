import { useEffect } from 'react';

export default function ModalFrame({ onClose, align = 'center', width = 460, children }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: align === 'top' ? 'flex-start' : 'center',
        justifyContent: 'center',
        padding: align === 'top' ? '88px 24px 24px' : '24px',
        background: 'rgba(5, 6, 9, 0.66)',
        backdropFilter: 'blur(2.5px)',
        WebkitBackdropFilter: 'blur(2.5px)',
      }}
    >
      {/* so clicks inside the card don't close the modal */}
      <div
        className="wt-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width,
          maxWidth: 'calc(100% - 48px)',
          position: 'relative',
          boxShadow: '0 40px 120px -24px rgba(0, 0, 0, 0.85)',
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  );
}
