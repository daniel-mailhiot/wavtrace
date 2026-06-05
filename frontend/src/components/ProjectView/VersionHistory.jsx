import Eyebrow from '../Eyebrow';
import Pill from '../Pill';
import Button from '../Button';
import { CompareIcon, UploadIcon } from '../icons';

function CurrentVersionRow({ version, playing, onTogglePlay, onDiff, onNewVersion }) {
  return (
    <div className="wt-vrow active">
      <span className="wt-vbadge">{version.v}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 7 }}>
          current version ·
          <Pill tone="accent" style={{ cursor: 'pointer' }} onClick={onTogglePlay}>
            {playing ? 'selected' : 'play'}
          </Pill>
        </div>
        <div className="mono faint" style={{ fontSize: 11.5, marginTop: 2 }}>
          {version.when} · {version.meta}
        </div>
      </div>
      <Button size="sm" variant="accent" onClick={onDiff}>
        <CompareIcon /> Diff view
      </Button>
      <Button size="sm" onClick={onNewVersion}>
        <UploadIcon /> New version
      </Button>
    </div>
  );
}

function OlderVersionRow({ version }) {
  return (
    <div className="wt-vrow" style={{ border: '1px solid var(--line-soft)', background: 'var(--panel-2)' }}>
      <span className="wt-vbadge">{version.v}</span>
      <div style={{ flex: 1 }} className="mono faint">
        <span style={{ fontSize: 12.5, color: 'var(--ink-dim)' }}>{version.who}</span>
        <span style={{ fontSize: 11.5 }}> · {version.when} · {version.meta}</span>
      </div>
    </div>
  );
}

// Git-style spine with a hollow older-versions node above the accent current-version node
export default function VersionHistory({ versions, expanded, onToggleExpand, playing, onTogglePlay, onDiff, onNewVersion }) {
  const current = versions[0];
  const older = versions.slice(1);

  return (
    <div>
      <Eyebrow style={{ marginBottom: 10 }}>Versions</Eyebrow>
      <div style={{ position: 'relative', paddingLeft: 24 }}>
        {/* vertical spine connecting the nodes */}
        <div style={{ position: 'absolute', left: 9, top: 24, bottom: 30, width: 2, background: 'var(--line)' }} />

        {/* older versions collapsed summary that expands */}
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
              <OlderVersionRow key={v.v} version={v} />
            ))}
          </div>
        )}

        <div style={{ height: 8 }} />

        {/* current version node */}
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: -20, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 0 4px var(--accent-soft)' }} />
          <CurrentVersionRow version={current} playing={playing} onTogglePlay={onTogglePlay} onDiff={onDiff} onNewVersion={onNewVersion} />
        </div>
      </div>
    </div>
  );
}
