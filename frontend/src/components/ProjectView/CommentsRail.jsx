import Pill from '../Pill';
import Button from '../Button';
import { Avatar } from '../Avatar';
import { TrashIcon } from '../icons';
import formatTime from '../../utils/formatTime';

// Comment's fraction to timecode, range for regions
function timecode(comment, duration) {
  if (comment.region) {
    return `${formatTime(comment.region[0] * duration)}–${formatTime(comment.region[1] * duration)}`;
  }
  return formatTime(comment.t * duration);
}

// Numbered node (circle for points, rounded square for regions)
// Trash button only renders on the viewer's own comments (author-only delete)
function CommentCard({ comment, active, duration, canDelete, onDelete, onClick }) {
  const isRegion = Boolean(comment.region);
  const time = timecode(comment, duration);
  return (
    <div className={'wt-comment' + (active ? ' active' : '')} onClick={onClick}>
      <div className={'wt-cn' + (isRegion ? ' region' : '')}>{comment.n}</div>
      <div className="wt-cbody">
        <div className="wt-crow">
          <Avatar size={20} userId={comment.author}>{comment.av}</Avatar>
          <span className="wt-cwho">{comment.who}</span>
          <Pill tone="plain" style={{ marginLeft: 'auto' }}>
            {isRegion ? time : '@ ' + time}
          </Pill>
          {canDelete && (
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
          )}
        </div>
        <div className="wt-ctext">{comment.text}</div>
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
        <Pill tone="accent" style={{ padding: '6px 11px', fontSize: 12, gap: 7, alignSelf: 'flex-start' }}>
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
              : 'Click or drag the waveform to comment…'
          }
        />
      </div>
      <Button variant="primary" full disabled={!hasDraft || !text.trim()} onClick={onSubmit}>
        Comment
      </Button>
    </div>
  );
}

export default function CommentsRail({ comments, hasVersion, activeId, duration, draft, text, currentUserId, onSelect, onText, onSubmit, onDelete }) {
  return (
    <div className="wt-pv-rail">
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '16px 18px', borderBottom: '1px solid var(--line)' }}>
        <span style={{ fontSize: 14.5, fontWeight: 600 }}>Comments</span>
        <Pill>{comments.length}</Pill>
        <span className="wt-grow" />
        <span className="mono faint" style={{ fontSize: 11.5 }}>by time ▾</span>
      </div>

      <div className="wt-pv-rail-list" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 9 }}>
        {comments.length === 0 ? (
          <p className="mono faint" style={{ fontSize: 13, margin: 0 }}>No comments yet</p>
        ) : (
          comments.map((c) => (
            <CommentCard
              key={c.id}
              comment={c}
              active={activeId === c.id}
              duration={duration}
              canDelete={c.author === currentUserId}
              onDelete={onDelete}
              onClick={() => onSelect(c)}
            />
          ))
        )}
      </div>

      <div style={{ padding: 16, borderTop: '1px solid var(--line)' }}>
        <AddComment hasVersion={hasVersion} draft={draft} text={text} duration={duration} onText={onText} onSubmit={onSubmit} />
      </div>
    </div>
  );
}
