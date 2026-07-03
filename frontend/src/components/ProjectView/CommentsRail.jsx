import { useState } from 'react';
import Pill from '../Pill';
import Button from '../Button';
import { Avatar } from '../Avatar';
import { EditIcon, TrashIcon } from '../icons';
import formatTime from '../../utils/formatTime';

// Uploader's note for the selected version
// Owner can add one after the fact or edit the existing one, everyone else just sees the text
function VersionNote({ description, versionLabel, isOwner, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Nothing to show and no rights to add one
  if (!description && !isOwner) return null;

  function startEdit() {
    setDraft(description);
    setError('');
    setEditing(true);
  }

  async function save() {
    setBusy(true);
    setError('');
    try {
      await onSave(draft.trim());
      setEditing(false);
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  }

  return (
    <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
      {(description || editing) && (
        <div className="mono faint" style={{ fontSize: 11.5, marginBottom: 7 }}>{versionLabel} description</div>
      )}

      {editing ? (
        <>
          <textarea
            className="wt-input"
            rows={2}
            maxLength={300}
            autoFocus
            value={draft}
            disabled={busy}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add a note for this version"
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 9 }}>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => setEditing(false)}>Cancel</Button>
            <Button size="sm" variant="primary" disabled={busy} onClick={save}>Save</Button>
          </div>
          {error && <div className="mono" style={{ fontSize: 12, color: 'var(--bad)', marginTop: 8 }}>{error}</div>}
        </>
      ) : description ? (
        // Icon on the text row
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
          <p style={{ flex: 1, minWidth: 0, margin: 0, fontSize: 13, color: 'var(--ink-dim)', lineHeight: 1.5, overflowWrap: 'break-word', whiteSpace: 'pre-wrap' }}>{description}</p>
          {isOwner && (
            <button type="button" className="wt-cedit" aria-label="Edit description" onClick={startEdit}>
              <EditIcon />
            </button>
          )}
        </div>
      ) : (
        <button type="button" className="wt-note-btn" onClick={startEdit}>+ Add a note for {versionLabel}</button>
      )}
    </div>
  );
}

// Comment's fraction to timecode, range for regions
function timecode(comment, duration) {
  if (comment.region) {
    return `${formatTime(comment.region[0] * duration)}–${formatTime(comment.region[1] * duration)}`;
  }
  return formatTime(comment.t * duration);
}

// Numbered node (circle for points, rounded square for regions)
// Edit and trash buttons only render on the viewer's own comments (backend enforces author-only too)
function CommentCard({ comment, active, duration, isAuthor, onEdit, onDelete, onClick }) {
  const isRegion = Boolean(comment.region);
  const time = timecode(comment, duration);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function startEdit(e) {
    e.stopPropagation();
    setDraft(comment.text);
    setError('');
    setEditing(true);
  }

  async function save() {
    setBusy(true);
    setError('');
    try {
      await onEdit(comment.id, draft.trim());
      setEditing(false);
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  }

  return (
    <div className={'wt-comment' + (active ? ' active' : '')} onClick={onClick}>
      <div className={'wt-cn' + (isRegion ? ' region' : '')}>{comment.n}</div>
      <div className="wt-cbody">
        <div className="wt-crow">
          <Avatar size={20} userId={comment.author}>{comment.av}</Avatar>
          <span className="wt-cwho">{comment.who}</span>
          <Pill tone="plain" style={{ marginLeft: 'auto' }}>{time}</Pill>
        </div>
        {editing ? (
          // So clicks inside the editor don't select the card and jump the playhead
          <div onClick={(e) => e.stopPropagation()}>
            <textarea
              className="wt-input"
              rows={2}
              autoFocus
              value={draft}
              disabled={busy}
              onChange={(e) => setDraft(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
              <Button size="sm" variant="ghost" disabled={busy} onClick={() => setEditing(false)}>Cancel</Button>
              <Button size="sm" variant="primary" disabled={busy || !draft.trim()} onClick={save}>Save</Button>
            </div>
            {error && <div className="mono" style={{ fontSize: 12, color: 'var(--bad)', marginTop: 6 }}>{error}</div>}
          </div>
        ) : (
          <div className="wt-cfoot">
            <div className="wt-ctext">{comment.text}</div>
            {isAuthor && (
              <>
                <button type="button" className="wt-cedit" aria-label="Edit comment" onClick={startEdit}>
                  <EditIcon />
                </button>
                <button
                  type="button"
                  className="wt-cdel"
                  aria-label="Delete comment"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(comment.id);
                  }}
                >
                  <TrashIcon />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Disabled until a point or region is picked on the waveform
function AddComment({ hasVersion, draft, text, duration, onText, onSubmit }) {
  const hasDraft = Boolean(draft);
  const isRegion = Boolean(draft?.region);
  const detail = !hasDraft
    ? ''
    : isRegion
    ? `${formatTime(draft.region[0] * duration)}–${formatTime(draft.region[1] * duration)}`
    : formatTime(draft.t * duration);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      {hasDraft && (
        <Pill tone="accent" className="wt-draft-pill" style={{ padding: '6px 11px', fontSize: 12, gap: 7, alignSelf: 'flex-start' }}>
          {isRegion ? 'Region' : 'Point'}
          <span className="mono" style={{ opacity: 0.7 }}>{detail}</span>
        </Pill>
      )}
      <div className="wt-search" style={{ height: 40 }}>
        <input
          value={text}
          disabled={!hasDraft}
          onChange={(e) => onText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
          placeholder={
            !hasVersion
              ? 'Upload audio to add comments'
              : hasDraft
              ? isRegion
                ? `Add feedback on ${detail}…`
                : `Add feedback @ ${detail}…`
              : 'Click or drag on waveform to comment…'
          }
        />
      </div>
      <Button variant="primary" full disabled={!hasDraft || !text.trim()} onClick={onSubmit}>
        Comment
      </Button>
    </div>
  );
}

export default function CommentsRail({ comments, loading, hasVersion, description, versionLabel, isOwner, activeId, duration, draft, text, canComment, currentUserId, onSelect, onText, onSubmit, onEdit, onDelete, onSaveDescription }) {
  return (
    <div className="wt-pv-rail">
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '16px 18px', borderBottom: '1px solid var(--line)' }}>
        <span style={{ fontSize: 14.5, fontWeight: 600 }}>Comments</span>
        <Pill>{loading ? '…' : comments.length}</Pill>
        <span className="wt-grow" />
        <span className="mono faint" style={{ fontSize: 11.5 }}>by time ▾</span>
      </div>

      {/* Key resets the editor state when the selected version changes */}
      {hasVersion && (
        <VersionNote
          key={versionLabel}
          description={description}
          versionLabel={versionLabel}
          isOwner={isOwner}
          onSave={onSaveDescription}
        />
      )}

      <div className="wt-pv-rail-list" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 9 }}>
        {loading ? (
          // Placeholder cards while the selected version's comments load
          <>
            <div className="wt-skel" style={{ height: 74 }} />
            <div className="wt-skel" style={{ height: 74 }} />
          </>
        ) : comments.length === 0 ? (
          <p className="mono faint" style={{ fontSize: 13, margin: 0 }}>No comments yet</p>
        ) : (
          comments.map((c) => (
            <CommentCard
              key={c.id}
              comment={c}
              active={activeId === c.id}
              duration={duration}
              isAuthor={c.author === currentUserId}
              onEdit={onEdit}
              onDelete={onDelete}
              onClick={() => onSelect(c)}
            />
          ))
        )}

        {/* How-to-comment hint, goes away once this user has commented on the version */}
        {/* Dash gets its own flex column so wrapped lines stay aligned with the text */}
        {!loading && hasVersion && canComment && !comments.some((c) => c.author === currentUserId) && (
          <p className="mono faint" style={{ display: 'flex', gap: 6, margin: 0, paddingLeft: 9, fontSize: 13, lineHeight: 1.5 }}>
            <span>-</span>
            <span>Click the waveform to seek and drop a comment marker, drag to select a region</span>
          </p>
        )}
      </div>

      {/* Viewers can read but commenting is owner/reviewer only */}
      {canComment && (
        <div style={{ padding: 16, borderTop: '1px solid var(--line)' }}>
          <AddComment hasVersion={hasVersion} draft={draft} text={text} duration={duration} onText={onText} onSubmit={onSubmit} />
        </div>
      )}
    </div>
  );
}
