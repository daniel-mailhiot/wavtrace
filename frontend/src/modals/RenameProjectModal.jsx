import { useState } from 'react';
import ModalFrame from '../components/Modal/ModalFrame';
import { Kbd } from '../components/Modal/ModalParts';
import { renameProject } from '../api/projects';

// Rename over the project view with a live breadcrumb preview of the new name
export default function RenameProjectModal({ project, onClose, onRenamed }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || busy) return;

    setBusy(true);
    setError('');
    try {
      const updated = await renameProject(project._id, trimmed);
      onRenamed(updated.name);
      onClose();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <ModalFrame onClose={onClose} align="top" width={560}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '14px 20px', borderBottom: '1px solid var(--line-soft)' }}>
          <span className="mono" style={{ fontSize: 12.5, color: 'var(--ink)' }}>wavTrace</span>
          <span className="mono faint" style={{ fontSize: 12 }}>▸</span>
          <span className="mono" style={{ fontSize: 12.5, color: 'var(--ink-faint)', textDecoration: 'line-through' }}>{project.name}</span>
          <span className="mono faint" style={{ fontSize: 12 }}>▸</span>
          <span
            className="mono"
            style={{ fontSize: 12.5, color: 'var(--ink-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {name || '(updates as typed)'}
          </span>
        </div>

        <div style={{ padding: '20px 22px 18px' }}>
          <input
            className="wt-input"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New project name…"
            style={{ height: 52, fontSize: 19, border: 'none', background: 'transparent', padding: 0 }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 22px', borderTop: '1px solid var(--line-soft)', background: 'var(--panel-2)' }}>
          {error ? (
            <span className="mono" style={{ fontSize: 12, color: 'var(--bad)' }}>{error}</span>
          ) : (
            <span className="mono faint" style={{ fontSize: 12, display: 'inline-flex', gap: 6 }}>
              <span style={{ color: 'var(--ink-dim)' }}>owner only</span>· versions &amp; comments are kept
            </span>
          )}
          <div className="wt-grow" />
          <span className="mono faint" style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 7 }}>
            <Kbd>↵</Kbd> rename <Kbd>esc</Kbd> cancel
          </span>
        </div>
      </form>
    </ModalFrame>
  );
}
