import { Fragment, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import AppBar from '../components/AppBar';
import Eyebrow from '../components/Eyebrow';
import Pill from '../components/Pill';
import DiffWaveform from '../components/DiffWaveform';
import { CompareIcon } from '../components/icons';
import initials from '../utils/initials';
import { getProject, getCachedProject } from '../api/projects';
import { DIFF_VERSIONS, computeDiff, isAnalyzed } from '../mocks/diff';
import v1 from '../assets/audio-demo-V1.wav';
import v2 from '../assets/audio-demo-V2.wav';
import v3 from '../assets/audio-demo-V3.wav';

const CLIPS = { v1, v2, v3 };

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

function VersionSelect({ value, onChange, accent = false }) {
  const accentStyle = accent
    ? { color: 'var(--accent)', borderColor: 'var(--accent-line)', background: 'var(--accent-soft)' }
    : undefined;
  return (
    <select className="wt-select" value={value} onChange={(e) => onChange(e.target.value)} style={accentStyle}>
      {DIFF_VERSIONS.map((v) => (
        <option key={v} value={v}>{v}</option>
      ))}
    </select>
  );
}

function VsHeader({ aVer, bVer, onA, onB, pending }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <VersionSelect value={aVer} onChange={onA} />
      <span className="mono faint" style={{ fontSize: 16 }}>→</span>
      <VersionSelect value={bVer} onChange={onB} accent />
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
  const [aVer, setAVer] = useState('v2');
  const [bVer, setBVer] = useState('v3');

  useEffect(() => {
    getProject(id).then(setProject).catch(() => {});
  }, [id]);

  // Waveforms are peak data but metadata diff needs both sides analyzed
  const pendingVer = !isAnalyzed(bVer) ? bVer : !isAnalyzed(aVer) ? aVer : null;
  const rows = pendingVer ? [] : computeDiff(aVer, bVer);
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
        <VsHeader aVer={aVer} bVer={bVer} onA={setAVer} onB={setBVer} pending={Boolean(pendingVer)} />

        <div className="wt-diff-top">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <Eyebrow style={{ margin: 0 }}>Waveform overlay</Eyebrow>
              <span className="wt-grow" />
              <Legend aVer={aVer} />
            </div>
            <DiffWaveform baselineUrl={CLIPS[aVer]} compareUrl={CLIPS[bVer]} />
          </div>

          {pendingVer ? <PendingDiff version={pendingVer} /> : <CompareCard aVer={aVer} bVer={bVer} rows={rows} />}
        </div>

        {!pendingVer && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '30px 0 12px' }}>
              <Eyebrow>Full metadata diff</Eyebrow>
              <span className="wt-divsoft" style={{ flex: 1 }} />
            </div>
            <UnifiedDiff fileName={fileName} aVer={aVer} bVer={bVer} rows={rows} />
          </>
        )}
      </div>
    </>
  );
}
