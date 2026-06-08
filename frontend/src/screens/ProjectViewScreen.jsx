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
import relativeTime from '../utils/relativeTime';
import formatTime from '../utils/formatTime';
import { getProject, deleteProject, getCachedProject } from '../api/projects';
import { listVersions } from '../api/versions';
import { PV_COMMENTS_BY_VERSION } from '../mocks/projectView';
import RenameProjectModal from '../modals/RenameProjectModal';
import CollaboratorsModal from '../modals/CollaboratorsModal';
import ConfirmDialog from '../modals/ConfirmDialog';
import UploadVersionModal from '../modals/UploadVersionModal';

const fractionOf = (c) => (c.region ? c.region[0] : c.t);

// Map an API version to the fields the UI reads
function adaptVersion(v, userId) {
  const ready = v.analysisStatus === 'ready';
  const mb = `${(v.size / (1024 * 1024)).toFixed(1)} MB`;
  return {
    _id: v._id,
    v: `v${v.versionNumber}`,
    file: v.originalName,
    who: v.uploaderId?._id === userId ? 'uploaded by you' : `uploaded by ${v.uploaderId?.name}`,
    when: relativeTime(v.createdAt),
    meta: ready ? `${formatTime(v.analysis.durationSec)} · ${mb}` : mb,
    status: v.analysisStatus,
    url: v.url,
    analysis: v.analysis,
    size: v.size,
  };
}

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

  const [project, setProject] = useState(() => getCachedProject(id));
  const [loading, setLoading] = useState(!project);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // 'rename' | 'collab' | 'delete'
  const [deleting, setDeleting] = useState(false);

  // Review and commenting state (waveform reached through wsRef)
  const [versions, setVersions] = useState([]);
  const [versionsLoaded, setVersionsLoaded] = useState(false);
  const [currentId, setCurrentId] = useState(null); // selected version by _id
  const [commentsByVersion, setCommentsByVersion] = useState(PV_COMMENTS_BY_VERSION);
  const [activeId, setActiveId] = useState(null);
  const [draft, setDraft] = useState(null); // pending { t } or { region } from a wave click/drag
  const [text, setText] = useState('');
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const wsRef = useRef(null);

  const currentVersion = versions.find((v) => v._id === currentId) ?? null;

  // Comments still use mock data keyed by version label for now
  const numberedComments = useMemo(
    () => numberComments(commentsByVersion[currentVersion?.v] ?? []),
    [commentsByVersion, currentVersion]
  );

  useEffect(() => {
    getProject(id)
      .then(setProject)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  // Load the project's versions and select the latest one
  useEffect(() => {
    listVersions(id)
      .then((data) => {
        const adapted = data.map((v) => adaptVersion(v, user?.id));
        setVersions(adapted);
        setCurrentId(adapted[0]?._id ?? null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setVersionsLoaded(true));
  }, [id, user?.id]);

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

  // Waveform reports its instance once used for seeking
  const handleReady = useCallback((ws) => {
    wsRef.current = ws;
  }, []);

  function selectVersion(versionId) {
    if (versionId === currentId) return;
    setCurrentId(versionId);
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
      [currentVersion.v]: [...(prev[currentVersion.v] ?? []), comment],
    }));
    setActiveId(comment.id);
    setDraft(null);
    setText('');
  }

// Mock upload until the upload backend is implemented
// Reuses the latest version's clip and analysis for now
  function handleUpload(file) {
    const latest = versions[0];
    const newVersion = {
      _id: crypto.randomUUID(),
      v: `v${versions.length + 1}`,
      file: file.name,
      who: 'uploaded by you',
      when: 'just now',
      meta: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      status: 'ready',
      url: latest?.url,
      analysis: latest?.analysis,
      size: file.size,
    };
    setVersions((prev) => [newVersion, ...prev]);
    setCurrentId(newVersion._id);
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
        <AppBar crumbs={[{ label: 'Projects', to: '/projects' }, '…']} user={initials(user?.name)} />
        <div style={{ padding: '30px 36px' }}>
          <p className="mono dim" style={{ fontSize: 13 }}>Loading project…</p>
        </div>
      </>
    );
  }

  if (error || !project) {
    return (
      <>
        <AppBar crumbs={[{ label: 'Projects', to: '/projects' }, 'Not found']} user={initials(user?.name)} />
        <div style={{ padding: '30px 36px' }}>
          <p className="mono" style={{ fontSize: 13, color: 'var(--bad)' }}>{error || 'Project not found'}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <AppBar crumbs={[{ label: 'Projects', to: '/projects' }, project.name]} user={initials(user?.name)} />

      <div className="wt-pv">
        <div className="wt-pv-main">
          <ProjectHeader
            project={project}
            role={myRole}
            isOwner={isOwner}
            currentUserId={user?.id}
            onMembers={() => setModal('collab')}
            onRename={() => setModal('rename')}
            onDelete={() => setModal('delete')}
          />

          {!versionsLoaded ? (
            <p className="mono dim" style={{ fontSize: 13, marginTop: 22 }}>Loading versions…</p>
          ) : !currentVersion ? (
            <p className="mono dim" style={{ fontSize: 13, marginTop: 22 }}>No versions yet</p>
          ) : (
            <>
              <div style={{ height: 22 }} />
              <VersionHistory
                versions={versions}
                selected={currentId}
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
                url={currentVersion.url}
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
              <MetadataPanel version={currentVersion} />
            </>
          )}
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
