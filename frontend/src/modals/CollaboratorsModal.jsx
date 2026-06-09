import { useState } from 'react';
import ModalFrame from '../components/Modal/ModalFrame';
import { ModalHead, ModalFoot } from '../components/Modal/ModalParts';
import Button from '../components/Button';
import Select from '../components/Select';
import { Avatar } from '../components/Avatar';
import Pill from '../components/Pill';
import Eyebrow from '../components/Eyebrow';
import { PlusIcon } from '../components/icons';
import initials from '../utils/initials';
import { addMember, updateMember, removeMember } from '../api/projects';

// Table columns: member / email / role / remove
const GRID = '1.3fr 1.6fr 116px 40px';

// Roles an owner can assign
const ROLE_OPTIONS = [
  { id: 'reviewer', label: 'reviewer' },
  { id: 'viewer', label: 'viewer' },
];

const LEGEND = [
  ['owner', 'manages versions, members & settings'],
  ['reviewer', 'listens + leaves timestamped feedback'],
  ['viewer', 'listens + reads comments only'],
];

function RemoveButton({ onClick }) {
  return (
    <button
      type="button"
      aria-label="Remove"
      onClick={onClick}
      style={{ width: 28, height: 28, flex: 'none', border: '1px solid var(--line)', background: 'var(--panel-2)', color: 'var(--ink-faint)', borderRadius: 6, cursor: 'pointer', fontSize: 15, lineHeight: 1 }}
    >
      ×
    </button>
  );
}

export default function CollaboratorsModal({ project, onClose, onMembersChanged }) {
  const [members, setMembers] = useState(project.members);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('reviewer');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function sync(updated) {
    setMembers(updated.members);
    onMembersChanged(updated.members);
  }

  async function handleAdd(e) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || busy) return;

    setBusy(true);
    setError('');
    try {
      sync(await addMember(project._id, trimmed, role));
      setEmail('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRoleChange(userId, newRole) {
    setError('');
    try {
      sync(await updateMember(project._id, userId, newRole));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRemove(userId) {
    setError('');
    try {
      sync(await removeMember(project._id, userId));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <ModalFrame onClose={onClose} width={892}>
      <div style={{ display: 'flex' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <ModalHead
            title="Manage collaborators"
            sub={`Owner only · ${members.length} ${members.length === 1 ? 'member' : 'members'}`}
            onClose={onClose}
          />
          <div style={{ padding: '22px 28px 22px' }}>
            <form onSubmit={handleAdd} style={{ display: 'flex', gap: 9, marginBottom: error ? 12 : 18 }}>
              <input
                className="wt-input"
                style={{ flex: 1 }}
                placeholder="Invite by email…"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Select value={role} options={ROLE_OPTIONS} onChange={setRole} width={120} />
              <Button variant="primary" type="submit" disabled={busy}>
                <PlusIcon /> Add
              </Button>
            </form>

            {error && (
              <p className="mono" style={{ margin: '0 0 16px', fontSize: 12, color: 'var(--bad)' }}>{error}</p>
            )}

            <div className="wt-card">
              <div
                style={{ display: 'grid', gridTemplateColumns: GRID, gap: 12, padding: '10px 16px', background: 'var(--head)', borderRadius: 'var(--r-md) var(--r-md) 0 0', borderBottom: '1px solid var(--line)', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.5px' }}
              >
                <span>Member</span>
                <span>Email</span>
                <span>Role</span>
                <span></span>
              </div>

              {members.map((m, i) => {
                const isOwner = m.role === 'owner';
                const u = m.userId;
                return (
                  <div
                    key={u._id}
                    style={{ display: 'grid', gridTemplateColumns: GRID, gap: 12, alignItems: 'center', padding: '13px 16px', borderBottom: i < members.length - 1 ? '1px solid var(--line-soft)' : 'none' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar size={24} userId={u._id}>{initials(u.name)}</Avatar>
                      <span style={{ fontSize: 13.5, fontWeight: 600 }}>{u.name}</span>
                    </div>
                    <span className="mono faint" style={{ fontSize: 12.5 }}>{u.email}</span>
                    {isOwner ? (
                      <Pill tone="owner" style={{ justifySelf: 'end' }}>owner</Pill>
                    ) : (
                      <Select value={m.role} options={ROLE_OPTIONS} width={108} onChange={(newRole) => handleRoleChange(u._id, newRole)} />
                    )}
                    {isOwner ? (
                      <span className="faint" style={{ textAlign: 'center' }}>-</span>
                    ) : (
                      <RemoveButton onClick={() => handleRemove(u._id)} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ flex: '0 0 252px', background: 'var(--panel-2)', borderLeft: '1px solid var(--line)', padding: '26px 24px' }}>
          <Eyebrow style={{ marginBottom: 18 }}>Role permissions</Eyebrow>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {LEGEND.map(([r, d]) => (
              <div key={r}>
                <Pill tone={r === 'owner' ? 'owner' : r === 'reviewer' ? 'rev' : undefined}>{r}</Pill>
                <div style={{ fontSize: 12.5, color: 'var(--ink-dim)', lineHeight: 1.5, marginTop: 9 }}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ModalFoot>
        <Button type="button" onClick={onClose}>Done</Button>
      </ModalFoot>
    </ModalFrame>
  );
}
