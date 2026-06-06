export default function LoadingScreen() {
  return (
    <div style={{ flex: 1, display: 'grid', placeItems: 'center', background: 'var(--board)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <span className="wt-spinner" />
        <span className="mono faint" style={{ fontSize: 12 }}>Loading…</span>
      </div>
    </div>
  );
}
