import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ModalFrame from '../components/Modal/ModalFrame';
import { Kbd } from '../components/Modal/ModalParts';
import { createProject } from '../api/projects';

// enter creates the project then opens it
export default function CreateProjectModal({ onClose }) {
  const navigate = useNavigate();
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
      const project = await createProject(trimmed);
      navigate(`/projects/${project._id}`);
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
          <span className="mono" style={{ fontSize: 12.5, color: 'var(--ink-dim)' }}>new project</span>
        </div>

        <div style={{ padding: '20px 22px 18px' }}>
          <input
            className="wt-input"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name your project…"
            style={{ height: 52, fontSize: 19, border: 'none', background: 'transparent', padding: 0 }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 22px', borderTop: '1px solid var(--line-soft)', background: 'var(--panel-2)' }}>
          {error ? (
            <span className="mono" style={{ fontSize: 12, color: 'var(--bad)' }}>{error}</span>
          ) : (
            <span className="mono faint" style={{ fontSize: 12 }}>name it to get started</span>
          )}
          <div className="wt-grow" />
          <span className="mono faint" style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 7 }}>
            <Kbd>↵</Kbd> create <Kbd>esc</Kbd> cancel
          </span>
        </div>
      </form>
    </ModalFrame>
  );
}
