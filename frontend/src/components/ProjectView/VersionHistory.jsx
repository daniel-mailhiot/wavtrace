import Eyebrow from '../Eyebrow';
import Pill from '../Pill';
import Button from '../Button';
import { CompareIcon, UploadIcon } from '../icons';

// Play pill shows on whichever version is selected
// (remember to fix positioning selecting older versions)
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

function LatestRow({ version, selected, playing, onTogglePlay, onSelect, onDiff, onNewVersion }) {
  const isSelected = selected === version.v;
  return (
    <div
      className={'wt-vrow' + (isSelected ? ' active' : '')}
      style={isSelected ? undefined : { border: '1px solid var(--line-soft)', background: 'var(--panel-2)', cursor: 'pointer' }}
      onClick={isSelected ? undefined : onSelect}
    >
      <span className="wt-vbadge">{version.v}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 7 }}>
          <span className="mono">{version.file}</span>
          <Pill tone="ok" style={{ fontSize: 10 }}>latest</Pill>
          {/* {isSelected && <PlayPill playing={playing} onTogglePlay={onTogglePlay} />} */}
        </div>
        <div className="mono faint" style={{ fontSize: 11.5, marginTop: 2 }}>
          {version.who} {version.when} · {version.meta}
        </div>
      </div>
      <Button size="sm" variant="accent" onClick={(e) => { e.stopPropagation(); onDiff(); }}>
        <CompareIcon /> Diff view
      </Button>
      <Button size="sm" onClick={(e) => { e.stopPropagation(); onNewVersion?.(); }}>
        <UploadIcon /> New version
      </Button>
    </div>
  );
}

function OlderRow({ version, selected, playing, onTogglePlay, onSelect }) {
  const isSelected = selected === version.v;
  return (
    <div
      className={'wt-vrow' + (isSelected ? ' active' : '')}
      style={isSelected ? { cursor: 'pointer' } : { border: '1px solid var(--line-soft)', background: 'var(--panel-2)', cursor: 'pointer' }}
      onClick={onSelect}
    >
      <span className="wt-vbadge">{version.v}</span>
      <div style={{ flex: 1 }} className="mono faint">
        <span style={{ fontSize: 12.5, color: 'var(--ink-dim)' }}>{version.file}</span>
        <span style={{ fontSize: 11.5 }}> · {version.who} {version.when}</span>
      </div>
      {/* {isSelected && <PlayPill playing={playing} onTogglePlay={onTogglePlay} />} */}
      <span style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>{version.meta}</span>
    </div>
  );
}

// Git spine - clicking a version loads its clip into the waveform
export default function VersionHistory({ versions, selected, expanded, onToggleExpand, playing, onTogglePlay, onSelectVersion, onDiff, onNewVersion }) {
  const latest = versions[0];
  const older = versions.slice(1).reverse();
  const latestSelected = selected === latest.v;

  return (
    <div>
      <Eyebrow style={{ marginBottom: 10 }}>Versions</Eyebrow>
      <div style={{ position: 'relative', paddingLeft: 24 }}>
        {/* vertical spine connecting the nodes */}
        <div style={{ position: 'absolute', left: 9, top: 24, bottom: 30, width: 2, background: 'var(--line)' }} />

        {/* older versions have collapsed summary that expands into selectable rows */}
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: -19, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, borderRadius: '50%', border: '2px solid var(--ink-faint)', background: 'var(--board)' }} />
          <div
            onClick={onToggleExpand}
            style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 14px', border: '1px dashed var(--line)', borderRadius: 8, background: 'var(--panel-2)', cursor: 'pointer' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 11, flex: 1 }}>
              <span className="mono faint" style={{ fontSize: 11 }}>{expanded ? '▾' : '▸'}</span>
              <span style={{ fontSize: 13, color: 'var(--ink-dim)' }}>{older.length} older versions</span>
              {older.map((v) => (
                <Pill key={v.v}>{v.v} · {v.when.replace(' ago', '')}</Pill>
              ))}
            </span>
            <span className="mono" style={{ fontSize: 12, color: 'var(--accent)' }}>{expanded ? 'collapse' : 'expand'}</span>
          </div>
        </div>

        {expanded && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            {older.map((v) => (
              <OlderRow
                key={v.v}
                version={v}
                selected={selected}
                playing={playing}
                onTogglePlay={onTogglePlay}
                onSelect={() => onSelectVersion(v.v)}
              />
            ))}
          </div>
        )}

        <div style={{ height: 8 }} />

        {/* latest version node */}
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: -20, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, borderRadius: '50%', background: latestSelected ? 'var(--accent)' : 'var(--ink-faint)', boxShadow: latestSelected ? '0 0 0 4px var(--accent-soft)' : 'none' }} />
          <LatestRow
            version={latest}
            selected={selected}
            playing={playing}
            onTogglePlay={onTogglePlay}
            onSelect={() => onSelectVersion(latest.v)}
            onDiff={onDiff}
            onNewVersion={onNewVersion}
          />
        </div>
      </div>
    </div>
  );
}
