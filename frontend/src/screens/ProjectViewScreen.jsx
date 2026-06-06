import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import AppBar from '../components/AppBar';
import Waveform from '../components/Waveform';
import ProjectHeader from '../components/ProjectView/ProjectHeader';
import VersionHistory from '../components/ProjectView/VersionHistory';
import MetadataPanel from '../components/ProjectView/MetadataPanel';
import CommentsRail from '../components/ProjectView/CommentsRail';
import initials from '../utils/initials';
import { getProject, deleteProject } from '../api/projects';
import { PV_VERSIONS, PV_COMMENTS_BY_VERSION } from '../mocks/projectView';
import v1 from '../assets/audio-demo-V1.wav';
import v2 from '../assets/audio-demo-V2.wav';
import v3 from '../assets/audio-demo-V3.wav';
import RenameProjectModal from '../modals/RenameProjectModal';
import CollaboratorsModal from '../modals/CollaboratorsModal';
import ConfirmDialog from '../modals/ConfirmDialog';
import UploadVersionModal from '../modals/UploadVersionModal';

// Temp audio, uploaded versions reuse the latest clip since there's no upload backend yet...
const CLIPS = { v1, v2, v3 };
const clipFor = (v) => CLIPS[v] || v3;

const fractionOf = (c) => (c.region ? c.region[0] : c.t);

// Number comments by time so pins and cards stay in sync top to bottom
function numberComments(comments) {
  return [...comments]
    .sort((a, b) => fractionOf(a) - fractionOf(b))
    .map((c, i) => ({ ...c, n: i + 1 }));
}

export default function ProjectViewScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // 'rename' | 'collab' | 'delete'
  const [deleting, setDeleting] = useState(false);

  // Review and commenting state (waveform reached through wsRef)
  const [versions, setVersions] = useState(PV_VERSIONS);
  const [currentVersion, setCurrentVersion] = useState('v3');
  const [commentsByVersion, setCommentsByVersion] = useState(PV_COMMENTS_BY_VERSION);
  const [activeId, setActiveId] = useState(null);
  const [draft, setDraft] = useState(null); // pending { t } or { region } from a wave click/drag
  const [text, setText] = useState('');
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const wsRef = useRef(null);

  const numberedComments = useMemo(
    () => numberComments(commentsByVersion[currentVersion] ?? []),
    [commentsByVersion, currentVersion]
  );

  useEffect(() => {
    getProject(id)
      .then(setProject)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  // Spacebar play/pause (not while typing a comment)
  useEffect(() => {
    function onKey(e) {
      if (e.code !== 'Space' || e.repeat) return;
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON' || e.target.isContentEditable) return;
      e.preventDefault();
      wsRef.current?.playPause();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const myRole = project?.members.find((m) => m.userId?._id === user?.id)?.role;
  const isOwner = myRole === 'owner';

  // Waveform reports its instance once - use for play pill + seeking
  const handleReady = useCallback((ws) => {
    wsRef.current = ws;
  }, []);

  function selectVersion(v) {
    if (v === currentVersion) return;
    setCurrentVersion(v);
    setActiveId(null);
    setDraft(null);
    setText('');
  }

  // On card click, highlight and seek the playhead to its time
  function selectComment(comment) {
    setActiveId(comment.id);
    wsRef.current?.seekTo(fractionOf(comment));
  }

  function addComment() {
    if (!draft || !text.trim()) return;
    const comment = {
      id: crypto.randomUUID(),
      who: user?.name || 'You',
      av: initials(user?.name),
      text: text.trim(),
      ...(draft.region ? { region: draft.region } : { t: draft.t }),
    };
    setCommentsByVersion((prev) => ({
      ...prev,
      [currentVersion]: [...(prev[currentVersion] ?? []), comment],
    }));
    setActiveId(comment.id);
    setDraft(null);
    setText('');
  }

  // Mock upload
  function handleUpload(file) {
    const v = `v${versions.length + 1}`;
    const newVersion = {
      v,
      file: file.name,
      who: 'uploaded by you',
      when: 'just now',
      meta: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
    };
    setVersions((prev) => [newVersion, ...prev]);
    setCurrentVersion(v);
    setActiveId(null);
    setDraft(null);
    setText('');
    setModal(null);
  }

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
            versions={versions}
            selected={currentVersion}
            expanded={expanded}
            onToggleExpand={() => setExpanded((v) => !v)}
            playing={playing}
            onTogglePlay={() => wsRef.current?.playPause()}
            onSelectVersion={selectVersion}
            onDiff={() => navigate(`/projects/${id}/diff`)}
            onNewVersion={() => setModal('upload')}
          />

          <div style={{ height: 22 }} />
          <Waveform
            url={clipFor(currentVersion)}
            comments={numberedComments}
            activeId={activeId}
            draft={draft}
            onReady={handleReady}
            onPlayingChange={setPlaying}
            onDuration={setDuration}
            onPick={setDraft}
            onSelect={setActiveId}
          />

          <div style={{ height: 26 }} />
          <MetadataPanel />
        </div>

        <CommentsRail
          comments={numberedComments}
          activeId={activeId}
          duration={duration}
          draft={draft}
          text={text}
          onSelect={selectComment}
          onText={setText}
          onSubmit={addComment}
        />
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

      {modal === 'upload' && (
        <UploadVersionModal
          versions={versions}
          projectName={project.name}
          onClose={() => setModal(null)}
          onUpload={handleUpload}
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
