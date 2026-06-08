// Inline SVG icons ported from original design draft (replace later if needed)
// They paint with currentColor so the parent's text color sets their color

export function PlayIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor">
      <path d="M4 2.5v11l9-5.5z" />
    </svg>
  );
}

export function PauseIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor">
      <rect x="3.5" y="2.5" width="3" height="11" rx="1" />
      <rect x="9.5" y="2.5" width="3" height="11" rx="1" />
    </svg>
  );
}

export function SkipIcon({ dir }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" style={{ transform: dir === 'back' ? 'scaleX(-1)' : 'none' }}>
      <path d="M3 3.5v9l6-4.5z" />
      <rect x="10.5" y="3" width="2.2" height="10" rx="1" />
    </svg>
  );
}

export function LoopIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 6a4 4 0 0 1 4-4h4l-1.6-1.6M13 10a4 4 0 0 1-4 4H5l1.6 1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CompareIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 13, height: 13 }}>
      <path d="M5 2L2 5l3 3M11 14l3-3-3-3M2 5h9M14 11H5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function UploadIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 13, height: 13 }}>
      <path d="M8 11V3M5 6l3-3 3 3M3 12v1.5h10V12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PlusIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ width: 13, height: 13 }}>
      <path d="M8 3v10M3 8h10" strokeLinecap="round" />
    </svg>
  );
}

export function TrashIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ width: 13, height: 13 }}>
      <path d="M3 4h10M6.4 4V2.8h3.2V4M4.5 4l.5 9h6l.5-9M6.7 6.4v4.4M9.3 6.4v4.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function InfoIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ width: 15, height: 15 }}>
      <circle cx="8" cy="8" r="6" />
      <path d="M8 7.3v3.4" strokeLinecap="round" />
      <circle cx="8" cy="5.3" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

// Door with an arrow leaving it (used for sign out)
export function SignOutIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ width: 15, height: 15 }}>
      <path d="M6.5 2.5H3.5v11h3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 5l3 3-3 3M12.5 8H6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
