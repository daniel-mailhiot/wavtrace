import { useLayoutEffect, useRef, useState } from 'react';
import Eyebrow from '../Eyebrow';
import Pill from '../Pill';
import Button from '../Button';
import { CompareIcon, UploadIcon } from '../icons';

function PlayPill({ playing, onTogglePlay }) {
  return (
    <Pill
      tone="accent"
      style={{ cursor: 'pointer' }}
      onClick={(e) => {
        e.stopPropagation();
        onTogglePlay();
      }}
    >
      {playing ? 'pause' : 'play'}
    </Pill>
  );
}

// Stays on whichever version row is selected
function DiffButton({ onDiff, compact }) {
  return (
    <Button
      size="sm"
      variant="primary"
      style={{
        background: 'rgba(153, 178, 226, 0.8)',
        borderColor: 'rgba(153, 178, 226, 0.8)',
        ...(compact ? { height: 28, padding: '0 10px', fontSize: 11.5 } : {}),
      }}
      onClick={(e) => { e.stopPropagation(); onDiff(); }}
    >
      <CompareIcon /> Diff view
    </Button>
  );
}

function LatestRow({ version, selected, playing, onTogglePlay, onSelect, onDiff, onNewVersion }) {
  const isSelected = selected === version._id;
  return (
    <div
      className={'wt-vrow' + (isSelected ? ' active' : '')}
      style={isSelected ? undefined : { cursor: 'pointer' }}
      onClick={isSelected ? undefined : onSelect}
    >
      <span className="wt-vbadge">{version.v}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 7 }}>
          <span className="mono">{version.file}</span>
          <Pill tone="plain" style={{ fontSize: 10 }}>latest</Pill>
          {/* {isSelected && <PlayPill playing={playing} onTogglePlay={onTogglePlay} />} */} {/* (disabled) */}
        </div>
        <div className="mono faint" style={{ fontSize: 11.5, marginTop: 2 }}>
          {version.who} {version.when}
        </div>
      </div>
      {isSelected && <DiffButton onDiff={onDiff} />}
      <Button size="sm" onClick={(e) => { e.stopPropagation(); onNewVersion?.(); }}>
        <UploadIcon /> New version
      </Button>
    </div>
  );
}

function OlderRow({ version, selected, playing, onTogglePlay, onSelect, onDiff }) {
  const isSelected = selected === version._id;
  return (
    <div
      className={'wt-vrow compact' + (isSelected ? ' active' : '')}
      style={{ cursor: 'pointer' }}
      onClick={onSelect}
    >
      <span className="wt-vbadge">{version.v}</span>
      <div style={{ flex: 1 }} className="mono faint">
        <span style={{ fontSize: 12.5, color: 'var(--ink-dim)' }}>{version.file}</span>
        <span style={{ fontSize: 11.5 }}> · {version.who} {version.when}</span>
      </div>
      {/* {isSelected && <PlayPill playing={playing} onTogglePlay={onTogglePlay} />} */} {/* (disabled) */}
      {isSelected && <DiffButton onDiff={onDiff} compact />}
      <span style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>{version.meta}</span>
    </div>
  );
}

// Git-ish spine
export default function VersionHistory({ versions, selected, expanded, onToggleExpand, playing, onTogglePlay, onSelectVersion, onDiff, onNewVersion }) {
  const latest = versions[0];
  const older = versions.slice(1).reverse();

  const spineRef = useRef(null);
  const summaryRef = useRef(null);
  const rowRefs = useRef({});
  const wasExpanded = useRef(expanded);
  const [dotTop, setDotTop] = useState(0);
  const [glide, setGlide] = useState(false);

  // Move the accent node onto the selected row and fall back to the group node when that row is collapsed
  useLayoutEffect(() => {
    const spine = spineRef.current;
    const target = rowRefs.current[selected] || summaryRef.current;
    if (!spine || !target) return;
    const spineBox = spine.getBoundingClientRect();
    const rowBox = target.getBoundingClientRect();
    // Glide between selections but snap when expand/collapse shifts the rows so it does not slide in from nowhere
    setGlide(wasExpanded.current === expanded);
    wasExpanded.current = expanded;
    setDotTop(rowBox.top - spineBox.top + rowBox.height / 2);
  }, [selected, expanded, versions]);

  return (
    <div>
      <Eyebrow style={{ marginBottom: 10 }}>Versions</Eyebrow>
      <div ref={spineRef} style={{ position: 'relative', paddingLeft: 24 }}>
        {/* Vertical spine connecting the nodes */}
        <div style={{ position: 'absolute', left: 9, top: 24, bottom: 30, width: 2, background: 'var(--line)' }} />

        {/* Node that glides to whichever version is selected */}
        <div style={{ position: 'absolute', left: 4, top: dotTop, width: 14, height: 14, borderRadius: '50%', background: 'var(--accent-3)', boxShadow: '0 0 0 4px var(--accent-3-soft)', transform: 'translateY(-50%)', transition: glide ? 'top 0.28s cubic-bezier(0.4, 0, 0.2, 1)' : 'none', zIndex: 2, pointerEvents: 'none' }} />

        {/* Older versions have collapsed summary that expands into selectable rows */}
        <div ref={summaryRef} style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: -19, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, borderRadius: '50%', border: '2px solid var(--ink-faint)', background: 'var(--board)' }} />
          <div className="wt-vsummary" onClick={onToggleExpand}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 11, flex: 1 }}>
              <span className="mono faint" style={{ fontSize: 11 }}>{expanded ? '▾' : '▸'}</span>
              <span style={{ fontSize: 13, color: 'var(--ink-dim)' }}>{older.length} older versions</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {[...older].reverse().map((v) => (
                  <Pill key={v._id} style={{ color: 'var(--ink-faint)' }}>{v.v} · {v.when.replace(' ago', '')}</Pill>
                ))}
              </span>
            </span>
            <span className="mono wt-vtoggle" style={{ fontSize: 12 }}>{expanded ? 'collapse' : 'expand'}</span>
          </div>
        </div>

        {expanded && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            {older.map((v) => (
              <div key={v._id} ref={(el) => (rowRefs.current[v._id] = el)}>
                <OlderRow
                  version={v}
                  selected={selected}
                  playing={playing}
                  onTogglePlay={onTogglePlay}
                  onSelect={() => onSelectVersion(v._id)}
                  onDiff={onDiff}
                />
              </div>
            ))}
          </div>
        )}

        <div style={{ height: 8 }} />

        {/* Latest version node */}
        <div ref={(el) => (rowRefs.current[latest._id] = el)} style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: -18, top: '50%', transform: 'translateY(-50%)', width: 10, height: 10, borderRadius: '50%', background: 'var(--ink-faint)' }} />
          <LatestRow
            version={latest}
            selected={selected}
            playing={playing}
            onTogglePlay={onTogglePlay}
            onSelect={() => onSelectVersion(latest._id)}
            onDiff={onDiff}
            onNewVersion={onNewVersion}
          />
        </div>
      </div>
    </div>
  );
}
