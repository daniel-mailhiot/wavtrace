import AppBar from '../components/AppBar';

// Placeholder for the version diff
export default function DiffScreen() {
  return (
    <>
      <AppBar crumbs={['Projects', 'Project', 'Compare Versions']} />
      <div style={{ padding: '28px 30px' }}>
        <p className="dim mono">Version diff coming soon</p>
      </div>
    </>
  );
}
