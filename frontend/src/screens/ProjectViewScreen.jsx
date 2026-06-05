import AppBar from '../components/AppBar';

// temp placeholder for project workspace (waveform, metadata, comments)
export default function ProjectViewScreen() {
  return (
    <>
      <AppBar crumbs={['Projects', 'Project']} />
      <div style={{ padding: '26px 32px' }}>
        <p className="dim mono">Project view coming soon</p>
      </div>
    </>
  );
}
