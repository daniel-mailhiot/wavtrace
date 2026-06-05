import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import AppBar from '../components/AppBar';
import Waveform from '../components/Waveform';
import Transport from '../components/Transport';
import ProjectHeader from '../components/ProjectView/ProjectHeader';
import VersionHistory from '../components/ProjectView/VersionHistory';
import MetadataPanel from '../components/ProjectView/MetadataPanel';
import CommentsRail from '../components/ProjectView/CommentsRail';
import initials from '../utils/initials';
import { getProject, deleteProject } from '../api/projects';
import { PV_VERSIONS, PV_COMMENTS } from '../mocks/projectView';
import RenameProjectModal from '../modals/RenameProjectModal';
import CollaboratorsModal from '../modals/CollaboratorsModal';
import ConfirmDialog from '../modals/ConfirmDialog';

// Each comment's point (t) or region becomes a numbered pin on the waveform
const PV_MARKERS = PV_COMMENTS.map((c) => (c.region ? { region: c.region, n: c.n } : { t: c.t, n: c.n }));

export default function ProjectViewScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // 'rename' | 'collab' | 'delete'
  const [deleting, setDeleting] = useState(false);

  // Local UI state on mock data; real playback wiring later
  const [playing, setPlaying] = useState(false);
  const [activeId, setActiveId] = useState('2');
  const [expanded, setExpanded] = useState(false);
  const mode = 'point'; // fixed for now; becomes stateful once the waveform sets point vs region

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

  return (
    <>
      <AppBar crumbs={['Projects', project.name]} user={initials(user?.name)} />

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 360px', overflow: 'hidden' }}>
        <div style={{ overflow: 'auto', padding: '26px 32px 40px', borderRight: '1px solid var(--line)' }}>
          <ProjectHeader
            project={project}
            role={myRole}
            isOwner={isOwner}
            currentUserId={user?.id}
            onMembers={() => setModal('collab')}
            onRename={() => setModal('rename')}
            onDelete={() => setModal('delete')}
          />

          <div style={{ height: 22 }} />
          <VersionHistory
            versions={PV_VERSIONS}
            expanded={expanded}
            onToggleExpand={() => setExpanded((v) => !v)}
            playing={playing}
            onTogglePlay={() => setPlaying((p) => !p)}
            onDiff={() => navigate(`/projects/${id}/diff`)}
          />

          <div style={{ height: 22 }} />
          <Waveform seed={7} height={180} count={112} playhead={0.25} markers={PV_MARKERS} />
          <div style={{ height: 14 }} />
          <Transport playing={playing} onToggle={() => setPlaying((p) => !p)} />

          <div style={{ height: 26 }} />
          <MetadataPanel />
        </div>

        <CommentsRail activeId={activeId} onSelect={setActiveId} mode={mode} />
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
