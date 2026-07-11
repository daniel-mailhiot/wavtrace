import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import AppBar from '../components/AppBar';
import ErrorCard from '../components/ErrorCard';
import Eyebrow from '../components/Eyebrow';
import Pill from '../components/Pill';
import DiffWaveform from '../components/DiffWaveform';
import Select from '../components/Select';
import { CompareIcon } from '../components/icons';
import { getProject, getCachedProject } from '../api/projects';
import { listVersions } from '../api/versions';
import { diffMetadata } from '../utils/formatMetadata';
import { computeDiff } from '../utils/computeDiff';
import { invertEdits } from '../utils/alignWaveforms';

const TONE_COLOR = {
  accent: '#8ab7ff',
  ok: 'var(--ok)',
  dim: 'var(--ink-dim)',
  bad: 'var(--bad)',
  faint: 'var(--ink-faint)',
};

// Unified diff field name ('True peak' becomes 'true_peak')
const fieldKey = (k) => k.toLowerCase().replace(' ', '_');
const slug = (s) => (s || 'project').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function VsHeader({ options, aId, bId, onA, onB, pending }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <Select value={aId} options={options} onChange={onA} />
      <span className="mono faint" style={{ fontSize: 16 }}>→</span>
      <Select value={bId} options={options} onChange={onB} accent />
      <span className="wt-grow" />
      {pending && <Pill tone="warn">analysis pending</Pill>}
    </div>
  );
}

// Analyzed but not stored versions have metadata but no audio to draw
function MissingAudioNotice({ labels }) {
  return (
    <div className="wt-card-2" style={{ minHeight: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 18 }}>
      <div style={{ fontSize: 14, fontWeight: 600 }}>Waveform overlay unavailable</div>
      <div className="mono faint" style={{ fontSize: 12, marginTop: 7 }}>
        {labels.join(' and ')} {labels.length === 1 ? "isn't" : "aren't"} kept in storage, so there's no audio to overlay. The metadata diff below still works
      </div>
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

// Color key for the overlay, section entries appear only when detected
function Legend({ bVer, sections }) {
  const item = (label, swatch) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 10, height: 10, borderRadius: 2, ...swatch }} />
      <span className="mono faint" style={{ fontSize: 11 }}>{label}</span>
    </span>
  );
  return (
    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
      {item('shared overlap', { background: '#565a67' })}
      {item(`${bVer} louder`, { background: 'var(--ok)' })}
      {item(`${bVer} quieter`, { background: 'var(--bad)' })}
      {sections?.added && item('section added', { background: 'rgba(79, 215, 100, 0.15)', border: '1px solid #4fd764' })}
      {sections?.removed && item('section removed', { background: 'rgba(220, 105, 90, 0.15)', border: '1px solid #dc695a' })}
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
            {/*One number when no change */}
            {r.changed ? (
              <>
                <span style={{ color: r.flagA ? 'var(--bad)' : 'var(--ink-dim)' }}>{r.aVal}</span>
                <span style={{ color: 'var(--ink-faint)', fontSize: 12 }}>→</span>
                <span style={{ color: TONE_COLOR[r.tone] }}>{r.bVal}</span>
              </>
            ) : (
              <span style={{ color: 'var(--ink)' }}>{r.bVal}</span>
            )}
            {r.unit && <small style={{ fontSize: 11, color: 'var(--ink-faint)' }}>{r.unit}</small>}
          </div>
          {r.changed ? (
            <div className="mono" style={{ fontSize: 11.5, color: 'var(--ink-dim)', marginTop: 3 }}>{r.delta}</div>
          ) : (
            <div className="mono" style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 3 }}>no change</div>
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
  // Count fields that actually differ so the hunk header reflects
  const changed = rows.filter((r) => r.changed).length;
  const changeLabel = `${changed} ${changed === 1 ? 'metadata change' : 'metadata changes'}`;
  return (
    <div className="wt-card" style={{ overflow: 'hidden', fontFamily: 'var(--mono)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid var(--line)', background: 'var(--head)', fontSize: 13 }}>
        <CompareIcon />
        <span style={{ color: 'var(--ink)' }}>{fileName}</span>
        <span style={{ color: 'var(--ink-faint)' }}>{aVer} → {bVer}</span>
      </div>
      <div style={{ padding: '7px 16px', background: 'var(--diff-hunk-soft)', color: 'var(--diff-hunk)', fontSize: 12.5, borderBottom: '1px solid var(--line-soft)' }}>
        @@ {changeLabel} @@
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
  const [project, setProject] = useState(() => getCachedProject(id));
  const [versions, setVersions] = useState([]);
  const [versionsLoaded, setVersionsLoaded] = useState(false);
  const [error, setError] = useState(null); // the versions fetch fails with 403/404 for non-members
  const [aId, setAId] = useState(null);
  const [bId, setBId] = useState(null);
  const [sections, setSections] = useState(null); // which legend entries the overlay needs

  // Breadcrumb name only
  useEffect(() => {
    getProject(id).then(setProject).catch(() => {});
  }, [id]);

  // Default to comparing the two newest
  useEffect(() => {
    listVersions(id)
      .then((data) => {
        setVersions(data);
        setBId(data[0]?._id ?? null);
        setAId((data[1] ?? data[0])?._id ?? null);
      })
      .catch(setError)
      .finally(() => setVersionsLoaded(true));
  }, [id]);

  // Stale legend entries shouldn't linger while the next pair decodes
  useEffect(() => {
    setSections(null);
  }, [aId, bId]);

  const options = versions.map((v) => ({ id: v._id, label: `v${v.versionNumber}` }));
  const aVersion = versions.find((v) => v._id === aId) ?? null;
  const bVersion = versions.find((v) => v._id === bId) ?? null;
  const vlabel = (v) => (v ? `v${v.versionNumber}` : '');

  // Uploader marks only describe a version against the previous one,
  // a reversed compare (newer on the left) reuses them flipped
  const manualEdits = useMemo(() => {
    if (!aVersion || !bVersion) return null;
    if (bVersion.versionNumber === aVersion.versionNumber + 1 && bVersion.edits?.length) {
      return bVersion.edits;
    }
    if (aVersion.versionNumber === bVersion.versionNumber + 1 && aVersion.edits?.length) {
      return invertEdits(aVersion.edits);
    }
    return null;
  }, [aVersion, bVersion]);

  // Same-value updates bail out so the overlay callback can't loop renders
  const handleSections = useCallback((s) => {
    setSections((prev) => (prev?.added === s.added && prev?.removed === s.removed ? prev : s));
  }, []);

  // Waveforms draw from peak data but the metadata diff needs both sides analyzed
  const ready = (v) => v?.analysisStatus === 'ready';
  const pendingVer = !ready(bVersion) ? bVersion : !ready(aVersion) ? aVersion : null;
  // Either side without a stored file means no overlay (metadata diff still fine)
  const missingAudio = [aVersion, bVersion].filter((v) => v && !v.url);
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
      />

      <div style={{ flex: 1, overflow: 'auto', padding: '28px 30px 40px' }}>
        {error ? (
          <ErrorCard status={error.status} />
        ) : !versionsLoaded ? (
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
                  {missingAudio.length === 0 && <Legend bVer={vlabel(bVersion)} sections={sections} />}
                </div>
                {missingAudio.length === 0 ? (
                  // Key remounts the waveform to keep stale bars from showing while a new pair decodes
                  <DiffWaveform key={aId + bId} baselineUrl={aVersion.url} compareUrl={bVersion.url} edits={manualEdits} onSections={handleSections} />
                ) : (
                  <MissingAudioNotice labels={missingAudio.map(vlabel)} />
                )}
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
