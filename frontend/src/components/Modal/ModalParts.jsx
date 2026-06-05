// Shared pieces used by the project modals

export function ModalHead({ title, sub, onClose }) {
  return (
    <div style={{ padding: '26px 28px 0' }}>
      <h2 style={{ margin: '0 0 5px', fontSize: 22, fontWeight: 600, letterSpacing: '-0.3px', color: 'var(--ink)' }}>
        {title}
      </h2>
      {sub && <p style={{ margin: 0, fontSize: 13.5, color: 'var(--ink-dim)' }}>{sub}</p>}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 18,
          right: 18,
          width: 30,
          height: 30,
          display: 'grid',
          placeItems: 'center',
          borderRadius: 7,
          border: '1px solid var(--line)',
          background: 'var(--panel-2)',
          color: 'var(--ink-dim)',
          cursor: 'pointer',
          fontSize: 17,
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}

export function ModalFoot({ children }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 10,
        padding: '16px 28px 20px',
        borderTop: '1px solid var(--line-soft)',
      }}
    >
      {children}
    </div>
  );
}

// enter, esc for the modal footers
export function Kbd({ children }) {
  return (
    <span
      style={{
        fontFamily: 'var(--mono)',
        fontSize: 11,
        padding: '2px 6px',
        borderRadius: 5,
        border: '1px solid var(--line)',
        background: 'var(--panel-3)',
        color: 'var(--ink-dim)',
      }}
    >
      {children}
    </span>
  );
}
