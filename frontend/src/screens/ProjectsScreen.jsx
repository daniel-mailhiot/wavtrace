import AppBar from '../components/AppBar';
import SearchField from '../components/SearchField';

// Placeholder for the projects list, live table do later
export default function ProjectsScreen() {
  return (
    <>
      <AppBar
        crumbs={['Projects']}
        right={
          <div style={{ width: 260 }}>
            <SearchField placeholder="Search projects…" />
          </div>
        }
      />
      <div style={{ padding: '30px 36px' }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: '-0.4px' }}>Projects</h1>
        <p className="dim mono" style={{ marginTop: 6 }}>
          Project list coming soon
        </p>
      </div>
    </>
  );
}
