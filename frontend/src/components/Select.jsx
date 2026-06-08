import { useEffect, useRef, useState } from 'react';

// Caret that flips when the menu opens
function Caret({ open }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 11 11"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      style={{ opacity: 0.6, transition: 'transform 0.14s ease', transform: open ? 'rotate(180deg)' : 'none' }}
    >
      <path d="M2 4l3.5 3.5L9 4" />
    </svg>
  );
}

// Custom dropdown over .wt-select + .wt-menu so the open list can be themed
export default function Select({ value, options, onChange, accent = false, width }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click or Escape
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

  const current = options.find((o) => o.id === value);

  const accentStyle = accent
    ? { color: 'var(--accent)', borderColor: 'var(--accent-line)', background: 'var(--accent-soft)' }
    : null;

  function pick(id) {
    onChange(id);
    setOpen(false);
  }

  return (
    <div ref={ref} style={{ position: 'relative', width, flex: width ? 'none' : undefined }}>
      <button
        type="button"
        className="wt-select"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        style={{
          display: width ? 'flex' : 'inline-flex',
          alignItems: 'center',
          justifyContent: width ? 'space-between' : undefined,
          gap: 8,
          width: width ? '100%' : undefined,
          ...accentStyle,
        }}
      >
        {current?.label}
        <Caret open={open} />
      </button>

      {open && (
        <div className="wt-menu" role="listbox">
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              role="option"
              aria-selected={o.id === value}
              className={'wt-menu-item' + (o.id === value ? ' active' : '')}
              onClick={() => pick(o.id)}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
