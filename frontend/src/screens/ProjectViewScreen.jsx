import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import AppBar from '../components/AppBar';
import ErrorCard from '../components/ErrorCard';
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
import { listVersions, uploadVersion, updateVersionDescription } from '../api/versions';
import { listComments, createComment, updateComment, deleteComment } from '../api/comments';
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
    description: v.description || '',
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

// Number comments by time so pins and cards stay ordered
function numberComments(comments) {
  return [...comments]
    .sort((a, b) => fractionOf(a) - fractionOf(b))
    .map((c, i) => ({ ...c, n: i + 1 }));
}

function AudioUnavailable() {
  return (
    <div className="wt-card-2" style={{ padding: '34px 18px', textAlign: 'center' }}>
      <div style={{ fontSize: 14, fontWeight: 600 }}>Audio unavailable</div>
      <div className="mono faint" style={{ fontSize: 12, marginTop: 7 }}>
        This file wasn't kept in storage. To enable upload storage for this account, please email me at daniel.mailhiot.dev@gmail.com
      </div>
    </div>
  );
}

export default function ProjectViewScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(() => getCachedProject(id));
  const [loading, setLoading] = useState(!project);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null); // 'rename' | 'collab' | 'delete'
  const [deleting, setDeleting] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null); // comment id pending confirm
  const [deletingComment, setDeletingComment] = useState(false);

  // Review and commenting state (waveform reached through wsRef)
  const [versions, setVersions] = useState([]);
  const [versionsLoaded, setVersionsLoaded] = useState(false);
  const [currentId, setCurrentId] = useState(null); // selected version by _id
  const [comments, setComments] = useState([]); // raw API comments for the current version
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [draft, setDraft] = useState(null); // pending { t } or { region } from a wave click/drag
  const [text, setText] = useState('');
  const [duration, setDuration] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const wsRef = useRef(null);
  // First-seen playback url per version id
  // Presigned urls come different on every fetch and a changed url makes the waveform rebuild mid-play,
  // poll reuses the cached one instead
  const audioUrlRef = useRef(new Map());

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
      .catch(setError)
      .finally(() => setLoading(false));
  }, [id]);

  // Fetch and adapt versions without touching the selection (poll reuses this)
  const refreshVersions = useCallback(async () => {
    const data = await listVersions(id);
    const urls = audioUrlRef.current;
    const adapted = data.map((v) => {
      const out = adaptVersion(v, user?.id);
      if (urls.has(out._id)) out.url = urls.get(out._id);
      else if (out.url) urls.set(out._id, out.url);
      return out;
    });
    setVersions(adapted);
    return adapted;
  }, [id, user?.id]);

  // Initial load also selects the latest version
  useEffect(() => {
    refreshVersions()
      .then((adapted) => setCurrentId(adapted[0]?._id ?? null))
      .catch(setError)
      .finally(() => setVersionsLoaded(true));
  }, [refreshVersions]);

  // While anything is analyzing poll until every version settles
  const anyProcessing = versions.some((v) => v.status === 'processing');
  useEffect(() => {
    if (!anyProcessing) return;
    const timer = setInterval(() => refreshVersions().catch(() => {}), 3000);
    return () => clearInterval(timer);
  }, [anyProcessing, refreshVersions]);

  // Load the selected version's comments and re-fetched whenever the version changes
  useEffect(() => {
    if (!currentId) return;
    listComments(id, currentId)
      .then(setComments)
      .catch(() => setComments([]))
      .finally(() => setCommentsLoading(false));
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
  // Viewers get read only everything (also enforced on backedn)
  const canComment = myRole === 'owner' || myRole === 'reviewer';

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
    setDuration(0);
    // The old wavesurfer gets destroyed on switch and a version without audio never mounts a new one,
    // so null the ref or spacebar would still control the old destroyed instance
    wsRef.current = null;
    setComments([]); // the fetch effect reloads for the new version
    setCommentsLoading(true);
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

  // Throws on failure so the card's editor can show the error and stay open
  async function editComment(commentId, body) {
    const updated = await updateComment(id, currentId, commentId, body);
    setComments((prev) => prev.map((c) => (c._id === commentId ? updated : c)));
  }

  // Runs after the confirm dialog, trash icon only sets commentToDelete
  async function removeComment() {
    setDeletingComment(true);
    try {
      await deleteComment(id, currentId, commentToDelete);
      setComments((prev) => prev.filter((c) => c._id !== commentToDelete));
      setActiveId((cur) => (cur === commentToDelete ? null : cur));
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
    setDeletingComment(false);
    setCommentToDelete(null);
  }

  // Rail's note editor saves through this so the versions state stays in sync
  async function saveDescription(text) {
    const updated = await updateVersionDescription(id, currentId, text);
    setVersions((prev) =>
      prev.map((v) => (v._id === currentId ? { ...v, description: updated.description } : v))
    );
  }

  async function handleUpload(file, description, edits) {
    const created = await uploadVersion(id, file, description, edits);
    audioUrlRef.current.set(created._id, URL.createObjectURL(file));
    await refreshVersions();
    selectVersion(created._id);
    setModal(null);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteProject(id);
      navigate('/projects');
    } catch (err) {
      setError(err);
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
        <AppBar crumbs={[{ label: 'Projects', to: '/projects' }, '…']} />
        <ErrorCard status={error?.status} />
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
            <EmptyProject isOwner={isOwner} onUpload={() => setModal('upload')} />
          ) : (
            <>
              <div style={{ height: 22 }} />
              <VersionHistory
                versions={versions}
                selected={currentId}
                expanded={expanded}
                isOwner={isOwner}
                onToggleExpand={() => setExpanded((v) => !v)}
                onSelectVersion={selectVersion}
                onDiff={() => navigate(`/projects/${id}/diff`)}
                onNewVersion={() => setModal('upload')}
              />

              <div style={{ height: 22 }} />
              {currentVersion.url ? (
                <Waveform
                  url={currentVersion.url}
                  comments={numberedComments}
                  activeId={activeId}
                  draft={draft}
                  canComment={canComment}
                  onReady={handleReady}
                  onDuration={setDuration}
                  onPick={setDraft}
                  onSelect={setActiveId}
                />
              ) : (
                <AudioUnavailable />
              )}

              <div style={{ height: 26 }} />
              <MetadataPanel version={currentVersion} />
            </>
          )}
        </div>

        <CommentsRail
          comments={numberedComments}
          // Empty projects never fetch comments
          loading={!versionsLoaded || (Boolean(currentVersion) && commentsLoading)}
          hasVersion={Boolean(currentVersion)}
          description={currentVersion?.description}
          versionLabel={currentVersion?.v}
          isOwner={isOwner}
          activeId={activeId}
          duration={dur}
          draft={draft}
          text={text}
          canComment={canComment}
          currentUserId={user?.id}
          onSelect={selectComment}
          onText={setText}
          onSubmit={addComment}
          onEdit={editComment}
          onDelete={setCommentToDelete}
          onSaveDescription={saveDescription}
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

      {commentToDelete && (
        <ConfirmDialog
          title="Delete comment?"
          message="Are you sure you want to delete this comment? This can't be undone."
          confirmLabel="Delete comment"
          busy={deletingComment}
          onConfirm={removeComment}
          onClose={() => setCommentToDelete(null)}
        />
      )}
    </>
  );
}
