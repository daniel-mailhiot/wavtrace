import Pill from '../Pill';
import Button from '../Button';
import { Avatar } from '../Avatar';
import { PV_COMMENTS } from '../../mocks/projectView';

// Each comment has a numbered node (circle for points, rounded square for regions), author, timecode and text
function CommentCard({ comment, active, onClick }) {
  const isRegion = Boolean(comment.region);
  return (
    <div className={'wt-comment' + (active ? ' active' : '')} onClick={onClick}>
      <div className={'wt-cn' + (isRegion ? ' region' : '')}>{comment.n}</div>
      <div className="wt-cbody">
        <div className="wt-crow">
          <Avatar size={20}>{comment.av}</Avatar>
          <span className="wt-cwho">{comment.who}</span>
          <Pill tone="accent" style={{ marginLeft: 'auto' }}>
            {isRegion ? comment.time : '@ ' + comment.time}
          </Pill>
        </div>
        <div className="wt-ctext">{comment.text}</div>
      </div>
    </div>
  );
}

// Composer shows the point/region selection, an input and the Comment button
// (Selection mode is static for now, later it should follow waveform clicks and drags)
function AddComment({ mode }) {
  const isRegion = mode === 'region';
  const detail = isRegion ? '1:20–1:38' : '0:48';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      <Pill tone="accent" style={{ padding: '6px 11px', fontSize: 12, gap: 7, alignSelf: 'flex-start' }}>
        <span className="wt-dot" style={{ borderRadius: isRegion ? 2 : '50%' }} />
        {isRegion ? 'Region' : 'Point'}
        <span className="mono" style={{ opacity: 0.7 }}>{detail}</span>
      </Pill>
      <div className="wt-search" style={{ height: 40 }}>
        <input placeholder={isRegion ? 'Add feedback on 1:20–1:38…' : 'Add feedback @ 0:48…'} />
      </div>
      <Button variant="primary" full>Comment</Button>
    </div>
  );
}

// Right rail with the count header, scrolling card list and composer footer
export default function CommentsRail({ activeId, onSelect, mode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--rail)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '16px 18px', borderBottom: '1px solid var(--line)' }}>
        <span style={{ fontSize: 14.5, fontWeight: 600 }}>Comments</span>
        <Pill>{PV_COMMENTS.length}</Pill>
        <span className="wt-grow" />
        <span className="mono faint" style={{ fontSize: 11.5 }}>by time ▾</span>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 9 }}>
        {PV_COMMENTS.map((c) => (
          <CommentCard key={c.n} comment={c} active={activeId === c.n} onClick={() => onSelect(c.n)} />
        ))}
      </div>

      <div style={{ padding: 16, borderTop: '1px solid var(--line)' }}>
        <AddComment mode={mode} />
      </div>
    </div>
  );
}
