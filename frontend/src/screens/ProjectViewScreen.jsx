import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import AppBar from '../components/AppBar';
import Waveform from '../components/Waveform';
import ProjectHeader from '../components/ProjectView/ProjectHeader';
import VersionHistory from '../components/ProjectView/VersionHistory';
import MetadataPanel from '../components/ProjectView/MetadataPanel';
import CommentsRail from '../components/ProjectView/CommentsRail';
import EmptyProject from '../components/ProjectView/EmptyProject';
import initials from '../utils/initials';
import relativeTime from '../utils/relativeTime';
import formatTime from '../utils/formatTime';
import { getProject, deleteProject, getCachedProject } from '../api/projects';
import { listVersions } from '../api/versions';
import { listComments, createComment, deleteComment } from '../api/comments';
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

// Comments are stored in seconds but rail and waveform use fractions
function adaptComment(c, dur) {
  const base = {
    id: c._id,
    who: c.authorId.name,
    av: initials(c.authorId.name),
    text: c.body,
    author: c.authorId._id, // used for the author-only delete control
  };
  if (c.endTime == null) return { ...base, t: c.startTime / dur };
  return { ...base, region: [c.startTime / dur, c.endTime / dur] };
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
  const [comments, setComments] = useState([]); // raw API comments for the current version
  const [activeId, setActiveId] = useState(null);
  const [draft, setDraft] = useState(null); // pending { t } or { region } from a wave click/drag
  const [text, setText] = useState('');
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const wsRef = useRef(null);

  const currentVersion = versions.find((v) => v._id === currentId) ?? null;
  // Prefer the analyzed duration but fall back to the decoded one before analysis is done
  const dur = currentVersion?.analysis?.durationSec || duration || 1;

  const numberedComments = useMemo(
    () => numberComments(comments.map((c) => adaptComment(c, dur))),
    [comments, dur]
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

  // Load the selected version's comments and re-fetched whenever the version changes
  useEffect(() => {
    if (!currentId) return;
    listComments(id, currentId)
      .then(setComments)
      .catch(() => setComments([]));
  }, [id, currentId]);

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
    setComments([]); // the fetch effect reloads for the new version
  }

  // On card click highlight and seek the playhead to its time
  function selectComment(comment) {
    setActiveId(comment.id);
    wsRef.current?.seekTo(fractionOf(comment));
  }

  async function addComment() {
    if (!draft || !text.trim()) return;
    // Reverse of adaptComment so multiply the draft fractions by dur to get seconds
    const startTime = (draft.region ? draft.region[0] : draft.t) * dur;
    const endTime = draft.region ? draft.region[1] * dur : null;
    try {
      const saved = await createComment(id, currentId, { body: text.trim(), startTime, endTime });
      setComments((prev) => [...prev, saved]);
      setActiveId(saved._id);
      setDraft(null);
      setText('');
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  }

  async function removeComment(commentId) {
    try {
      await deleteComment(id, currentId, commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      setActiveId((cur) => (cur === commentId ? null : cur));
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
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
        <AppBar crumbs={[{ label: 'Projects', to: '/projects' }, '…']} />
        <div style={{ padding: '30px 36px' }}>
          <p className="mono dim" style={{ fontSize: 13 }}>Loading project…</p>
        </div>
      </>
    );
  }

  if (error || !project) {
    return (
      <>
        <AppBar crumbs={[{ label: 'Projects', to: '/projects' }, 'Not found']} />
        <div style={{ padding: '30px 36px' }}>
          <p className="mono" style={{ fontSize: 13, color: 'var(--bad)' }}>{error || 'Project not found'}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <AppBar crumbs={[{ label: 'Projects', to: '/projects' }, project.name]} />

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
            <EmptyProject onUpload={() => setModal('upload')} />
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
          hasVersion={Boolean(currentVersion)}
          activeId={activeId}
          duration={duration}
          draft={draft}
          text={text}
          currentUserId={user?.id}
          onSelect={selectComment}
          onText={setText}
          onSubmit={addComment}
          onDelete={removeComment}
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
