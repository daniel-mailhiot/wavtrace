import { Fragment, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import AppBar from '../components/AppBar';
import Eyebrow from '../components/Eyebrow';
import Pill from '../components/Pill';
import DiffWaveform from '../components/DiffWaveform';
import { CompareIcon } from '../components/icons';
import initials from '../utils/initials';
import { getProject, getCachedProject } from '../api/projects';
import { listVersions } from '../api/versions';
import { diffMetadata } from '../utils/formatMetadata';
import { computeDiff } from '../mocks/diff';

const TONE_COLOR = {
  accent: 'var(--accent)',
  ok: 'var(--ok)',
  dim: 'var(--ink-dim)',
  bad: 'var(--bad)',
  faint: 'var(--ink-faint)',
};

// Unified diff field name ('True peak' becomes 'true_peak')
const fieldKey = (k) => k.toLowerCase().replace(' ', '_');
const slug = (s) => (s || 'project').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function Caret({ open }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 11 11"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      style={{ opacity: 0.6, transition: 'transform 0.14s ease', transform: open ? 'rotate(180deg)' : 'none' }}
    >
      <path d="M2 4l3.5 3.5L9 4" />
    </svg>
  );
}

function VersionSelect({ value, options, onChange, accent = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (!ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const accentStyle = accent
    ? { color: 'var(--accent)', borderColor: 'var(--accent-line)', background: 'var(--accent-soft)' }
    : undefined;

  const current = options.find((o) => o.id === value);

  function pick(id) {
    onChange(id);
    setOpen(false);
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        className="wt-select"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, ...accentStyle }}
      >
        {current?.label}
        <Caret open={open} />
      </button>

      {open && (
        <div className="wt-menu" role="listbox">
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              role="option"
              aria-selected={o.id === value}
              className={'wt-menu-item' + (o.id === value ? ' active' : '')}
              onClick={() => pick(o.id)}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function VsHeader({ options, aId, bId, onA, onB, pending }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <VersionSelect value={aId} options={options} onChange={onA} />
      <span className="mono faint" style={{ fontSize: 16 }}>→</span>
      <VersionSelect value={bId} options={options} onChange={onB} accent />
      <span className="wt-grow" />
      {pending ? <Pill tone="warn">analysis pending</Pill> : <Pill tone="ok">both analyzed</Pill>}
    </div>
  );
}

// Metadata diff needs both sides analyzed so this is use until then
function PendingDiff({ version }) {
  return (
    <div className="wt-card" style={{ padding: '30px 18px', textAlign: 'center' }}>
      <div style={{ fontSize: 14, fontWeight: 600 }}>{version} is still being analyzed</div>
      <div className="mono faint" style={{ fontSize: 12, marginTop: 7 }}>
        The metadata diff appears once both versions have finished analysis
      </div>
    </div>
  );
}

// Color key for the overlay
function Legend({ aVer }) {
  const item = (color, label) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
      <span className="mono faint" style={{ fontSize: 11 }}>{label}</span>
    </span>
  );
  return (
    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
      {item('#565a67', `${aVer} baseline`)}
      {item('var(--ok)', 'louder')}
      {item('var(--bad)', 'quieter')}
    </div>
  );
}

function CompareCard({ aVer, bVer, rows }) {
  const heroes = rows.slice(0, 2);
  return (
    <div className="wt-card-2" style={{ padding: 16 }}>
      <div className="mono faint" style={{ fontSize: 12, marginBottom: 14 }}>
        {aVer} <span style={{ color: 'var(--ink-faint)' }}>→</span> {bVer}
      </div>
      {heroes.map((r) => (
        <div key={r.k} style={{ marginBottom: 13 }}>
          <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 }}>
            {r.k}
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 15, display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ color: r.flagA ? 'var(--bad)' : 'var(--ink-dim)' }}>{r.aVal}</span>
            <span style={{ color: 'var(--ink-faint)', fontSize: 12 }}>→</span>
            <span style={{ color: r.changed ? TONE_COLOR[r.tone] : 'var(--ink)' }}>{r.bVal}</span>
            {r.unit && <small style={{ fontSize: 11, color: 'var(--ink-faint)' }}>{r.unit}</small>}
          </div>
          {r.changed && r.delta && (
            <div className="mono" style={{ fontSize: 11.5, color: 'var(--ink-dim)', marginTop: 3 }}>{r.delta}</div>
          )}
        </div>
      ))}
    </div>
  );
}

// One field rendered as either context or a -/+ pair
function DiffLine({ row }) {
  const join = (val) => `${fieldKey(row.k)}: ${val}${row.unit ? ' ' + row.unit : ''}`;

  if (!row.changed) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '34px 1fr', fontSize: 13, color: 'var(--ink-faint)' }}>
        <span style={{ textAlign: 'center', opacity: 0.5 }}> </span>
        <span style={{ padding: '5px 12px' }}>&nbsp;&nbsp;{join(row.bVal)}</span>
      </div>
    );
  }
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '34px 1fr', fontSize: 13, background: 'var(--bad-faint)' }}>
        <span style={{ textAlign: 'center', color: 'var(--bad)' }}>−</span>
        <span style={{ padding: '5px 12px', color: 'var(--bad)' }}>{join(row.aVal)}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '34px 1fr', fontSize: 13, background: 'var(--ok-faint)' }}>
        <span style={{ textAlign: 'center', color: 'var(--ok)' }}>+</span>
        <span style={{ padding: '5px 12px', color: 'var(--ok)', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <span>{join(row.bVal)}</span>
          {row.delta && <span style={{ color: TONE_COLOR[row.tone], opacity: 0.9 }}>{'// ' + row.delta}</span>}
        </span>
      </div>
    </>
  );
}

function UnifiedDiff({ fileName, aVer, bVer, rows }) {
  return (
    <div className="wt-card" style={{ overflow: 'hidden', fontFamily: 'var(--mono)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid var(--line)', background: 'var(--head)', fontSize: 13 }}>
        <CompareIcon />
        <span style={{ color: 'var(--ink)' }}>{fileName}</span>
        <span style={{ color: 'var(--ink-faint)' }}>{aVer} → {bVer}</span>
      </div>
      <div style={{ padding: '7px 16px', background: 'var(--accent-softer)', color: 'var(--accent)', fontSize: 12.5, borderBottom: '1px solid var(--line-soft)' }}>
        @@ file metadata @@
      </div>
      {rows.map((r) => (
        <Fragment key={r.k}>
          <DiffLine row={r} />
        </Fragment>
      ))}
    </div>
  );
}

// Compare two analyzed versions, diff recomputes when either select changes
export default function DiffScreen() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(() => getCachedProject(id));
  const [versions, setVersions] = useState([]);
  const [versionsLoaded, setVersionsLoaded] = useState(false);
  const [aId, setAId] = useState(null);
  const [bId, setBId] = useState(null);

  useEffect(() => {
    getProject(id).then(setProject).catch(() => {});
  }, [id]);

  // Default to comparing the two newest, the list comes back newest first
  useEffect(() => {
    listVersions(id)
      .then((data) => {
        setVersions(data);
        setBId(data[0]?._id ?? null);
        setAId((data[1] ?? data[0])?._id ?? null);
      })
      .catch(() => {})
      .finally(() => setVersionsLoaded(true));
  }, [id]);

  const options = versions.map((v) => ({ id: v._id, label: `v${v.versionNumber}` }));
  const aVersion = versions.find((v) => v._id === aId) ?? null;
  const bVersion = versions.find((v) => v._id === bId) ?? null;
  const vlabel = (v) => (v ? `v${v.versionNumber}` : '');

  // Waveforms draw from peak data but the metadata diff needs both sides analyzed
  const ready = (v) => v?.analysisStatus === 'ready';
  const pendingVer = !ready(bVersion) ? bVersion : !ready(aVersion) ? aVersion : null;
  const rows =
    ready(aVersion) && ready(bVersion)
      ? computeDiff(diffMetadata(aVersion), diffMetadata(bVersion))
      : [];
  const fileName = `${slug(project?.name)}.metadata`;

  return (
    <>
      <AppBar
        crumbs={[
          { label: 'Projects', to: '/projects' },
          { label: project?.name ?? '…', to: `/projects/${id}` },
          'Compare Versions',
        ]}
        user={initials(user?.name)}
      />

      <div style={{ flex: 1, overflow: 'auto', padding: '28px 30px 40px' }}>
        {!versionsLoaded ? (
          <p className="mono dim" style={{ fontSize: 13 }}>Loading versions…</p>
        ) : versions.length < 2 ? (
          <p className="mono dim" style={{ fontSize: 13 }}>Need at least two versions to compare</p>
        ) : (
          <>
            <VsHeader options={options} aId={aId} bId={bId} onA={setAId} onB={setBId} pending={Boolean(pendingVer)} />

            <div className="wt-diff-top">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <Eyebrow style={{ margin: 0 }}>Waveform overlay</Eyebrow>
                  <span className="wt-grow" />
                  <Legend aVer={vlabel(aVersion)} />
                </div>
                <DiffWaveform baselineUrl={aVersion.url} compareUrl={bVersion.url} />
              </div>

              {pendingVer ? (
                <PendingDiff version={vlabel(pendingVer)} />
              ) : (
                <CompareCard aVer={vlabel(aVersion)} bVer={vlabel(bVersion)} rows={rows} />
              )}
            </div>

            {!pendingVer && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '30px 0 12px' }}>
                  <Eyebrow>Full metadata diff</Eyebrow>
                  <span className="wt-divsoft" style={{ flex: 1 }} />
                </div>
                <UnifiedDiff fileName={fileName} aVer={vlabel(aVersion)} bVer={vlabel(bVersion)} rows={rows} />
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
