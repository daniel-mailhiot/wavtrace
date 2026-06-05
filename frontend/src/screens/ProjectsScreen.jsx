import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import AppBar from '../components/AppBar';
import SearchField from '../components/SearchField';
import Button from '../components/Button';
import Role from '../components/Role';
import { Avatar, AvatarStack } from '../components/Avatar';
import { PlusIcon } from '../components/icons';
import { listProjects } from '../api/projects';
import relativeTime from '../utils/relativeTime';
import initials from '../utils/initials';

// Shared column widths so the header and rows line up
const COLUMNS = '1fr 110px 130px 150px 90px';
const dotColor = { owner: 'var(--accent)', reviewer: 'var(--rev)', viewer: 'var(--ink-faint)' };

export default function ProjectsScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // query is the current text in the box, search copies it after a pause and is what the list filters on
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');

  const myId = user?.id;

  useEffect(() => {
    listProjects()
      .then(setProjects)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Wait until typing pauses before filtering instead of on every keystroke
  useEffect(() => {
    const id = setTimeout(() => setSearch(query), 200);
    return () => clearTimeout(id);
  }, [query]);

  const filtered = useMemo(
    () => projects.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())),
    [projects, search]
  );

  function roleFor(project) {
    const mine = project.members.find((m) => m.userId?._id === myId);
    return mine?.role || 'viewer';
  }

  return (
    <>
      <AppBar
        crumbs={['Projects']}
        user={initials(user?.name)}
        right={
          <SearchField
            placeholder="Search…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: 260, height: 38 }}
          />
        }
      />

      <div style={{ flex: 1, overflow: 'auto', padding: '30px 36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 600, letterSpacing: '-0.4px' }}>Projects</h1>
            <span className="mono faint" style={{ fontSize: 13 }}>
              {filtered.length} {filtered.length === 1 ? 'project' : 'projects'} · sorted by recent
            </span>
          </div>
          {/* Create-project modal not wired up yet */}
          <Button variant="primary">
            <PlusIcon /> New project
          </Button>
        </div>

        {loading && <p className="mono dim" style={{ fontSize: 13 }}>Loading projects…</p>}

        {error && <p className="mono" style={{ fontSize: 13, color: 'var(--bad)' }}>{error}</p>}

        {!loading && !error && (
          <div className="wt-card" style={{ overflow: 'hidden' }}>
            <div
              className="mono"
              style={{
                display: 'grid',
                gridTemplateColumns: COLUMNS,
                gap: 14,
                padding: '11px 18px',
                borderBottom: '1px solid var(--line)',
                background: 'var(--head)',
                fontSize: 11,
                color: 'var(--ink-faint)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              <span>Project</span>
              <span>Role</span>
              <span>Versions</span>
              <span>Last activity</span>
              <span>Members</span>
            </div>

            {filtered.length === 0 ? (
              <div className="mono faint" style={{ padding: '22px 18px', fontSize: 13 }}>
                {projects.length === 0 ? 'No projects yet' : 'No projects match your search'}
              </div>
            ) : (
              filtered.map((p, idx) => {
                const role = roleFor(p);
                const ago = relativeTime(p.updatedAt);
                return (
                  <div
                    key={p._id}
                    onClick={() => navigate(`/projects/${p._id}`)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: COLUMNS,
                      gap: 14,
                      alignItems: 'center',
                      padding: '15px 18px',
                      cursor: 'pointer',
                      borderBottom: idx < filtered.length - 1 ? '1px solid var(--line-soft)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor[role] }} />
                      <span style={{ fontSize: 14.5, fontWeight: 600 }}>{p.name}</span>
                    </div>
                    <Role role={role} />
                    {/* No version count until uploads exist */}
                    <span className="mono faint" style={{ fontSize: 13 }}>—</span>
                    <span className="mono faint" style={{ fontSize: 12.5 }}>
                      {ago === 'just now' ? ago : `${ago} ago`}
                    </span>
                    <AvatarStack>
                      {p.members.map((m) => (
                        <Avatar key={m.userId?._id} size={20} title={m.userId?.name}>
                          {initials(m.userId?.name)}
                        </Avatar>
                      ))}
                    </AvatarStack>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </>
  );
}
