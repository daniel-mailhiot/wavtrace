import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import AppBar from '../components/AppBar';
import Button from '../components/Button';
import Role from '../components/Role';
import initials from '../utils/initials';
import { getProject, deleteProject } from '../api/projects';
import RenameProjectModal from '../modals/RenameProjectModal';
import CollaboratorsModal from '../modals/CollaboratorsModal';
import ConfirmDialog from '../modals/ConfirmDialog';

// Minimal project header for now
export default function ProjectViewScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // 'rename' | 'collab' | 'delete'
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getProject(id)
      .then(setProject)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const myRole = project?.members.find((m) => m.userId?._id === user?.id)?.role;
  const isOwner = myRole === 'owner';

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteProject(id);
      navigate('/projects');
    } catch (err) {
      setError(err.message);
      setDeleting(false);
      setModal(null);
    }
  }

  if (loading) {
    return (
      <>
        <AppBar crumbs={['Projects', '…']} user={initials(user?.name)} />
        <div style={{ padding: '30px 36px' }}>
          <p className="mono dim" style={{ fontSize: 13 }}>Loading project…</p>
        </div>
      </>
    );
  }

  if (error || !project) {
    return (
      <>
        <AppBar crumbs={['Projects', 'Not found']} user={initials(user?.name)} />
        <div style={{ padding: '30px 36px' }}>
          <p className="mono" style={{ fontSize: 13, color: 'var(--bad)' }}>{error || 'Project not found'}</p>
        </div>
      </>
    );
  }

  const collaborators = project.members.length - 1;

  return (
    <>
      <AppBar crumbs={['Projects', project.name]} user={initials(user?.name)} />

      <div style={{ flex: 1, overflow: 'auto', padding: '30px 36px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: '-0.4px' }}>{project.name}</h1>
              {myRole && <Role role={myRole} />}
            </div>
            <span className="mono faint" style={{ fontSize: 13 }}>
              {collaborators} {collaborators === 1 ? 'collaborator' : 'collaborators'}
            </span>
          </div>

          {isOwner && (
            <div style={{ display: 'flex', gap: 9 }}>
              <Button onClick={() => setModal('collab')}>Members</Button>
              <Button onClick={() => setModal('rename')}>Rename</Button>
              <Button variant="danger" onClick={() => setModal('delete')}>Delete</Button>
            </div>
          )}
        </div>

        {/* Do waveform, versions and comments later */}
        <p className="mono faint" style={{ fontSize: 13 }}>Project workspace coming soon</p>
      </div>

      {modal === 'rename' && (
        <RenameProjectModal
          project={project}
          onClose={() => setModal(null)}
          onRenamed={(name) => setProject((p) => ({ ...p, name }))}
        />
      )}

      {modal === 'collab' && (
        <CollaboratorsModal
          project={project}
          onClose={() => setModal(null)}
          onMembersChanged={(members) => setProject((p) => ({ ...p, members }))}
        />
      )}

      {modal === 'delete' && (
        <ConfirmDialog
          title="Delete project?"
          message={`"${project.name}" and everything in it will be permanently removed. This can't be undone.`}
          confirmLabel="Delete project"
          busy={deleting}
          onConfirm={handleDelete}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
