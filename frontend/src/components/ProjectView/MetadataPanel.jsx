import Eyebrow from '../Eyebrow';
import Pill from '../Pill';
import { panelMetadata } from '../../utils/formatMetadata';

// Meter placing loudness in a -30 to -6 LUFS window with a target of -14
function LoudnessMeter({ value }) {
  const pct = (v) => ((v - -30) / (-6 - -30)) * 100;
  return (
    <div style={{ position: 'relative', height: 6, borderRadius: 3, background: 'var(--panel-3)', marginTop: 12 }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: pct(value) + '%', background: 'var(--accent)', borderRadius: 3 }} />
      <div style={{ position: 'absolute', left: pct(-14) + '%', top: -3, bottom: -3, width: 2, background: 'var(--ink-dim)' }} title="target -14 LUFS" />
    </div>
  );
}

// Key/value line with a dotted leader (ffprobe readout style)
function LeaderRow({ label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, padding: '8px 16px', fontFamily: 'var(--mono)', fontSize: 13 }}>
      <span className="faint" style={{ whiteSpace: 'nowrap' }}>{label}</span>
      <span style={{ flex: 1, borderBottom: '1px dotted var(--line)', transform: 'translateY(-3px)' }} />
      <span style={{ color: 'var(--ink)', whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  );
}

// No entry for done. pill only shows while analysis is running or failed
const STATUS_PILL = {
  processing: { tone: 'warn', label: 'processing' },
  failed: { tone: 'bad', label: 'failed' },
};

// Shown in place of metrics while analysis is running or after it errored
function StatePanel({ title, detail, bad }) {
  return (
    <div className="wt-card-2" style={{ padding: '26px 18px', textAlign: 'center' }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: bad ? 'var(--bad)' : 'var(--ink)' }}>{title}</div>
      <div className="mono faint" style={{ fontSize: 12, marginTop: 7 }}>{detail}</div>
    </div>
  );
}

function ReadyMetrics({ version }) {
  const { hero, file } = panelMetadata(version);
  const heroes = [
    { k: 'Loudness', v: hero.loudness, u: 'LUFS', meter: true },
    { k: 'True peak', v: hero.truePeak, u: 'dB', tone: 'ok' },
    { k: 'Loudness range', v: hero.lra, u: 'LU' },
    { k: 'Clipping', chip: true },
  ];

  return (
    <>
      <div className="wt-meta-hero">
        {heroes.map((h) => (
          <div key={h.k} style={{ background: 'var(--panel-2)', padding: '14px 16px' }}>
            <div className="faint mono" style={{ fontSize: 10.5, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{h.k}</div>
            {h.chip ? (
              <div className="mono" style={{ fontSize: 13, marginTop: 12, color: hero.clipping ? 'var(--bad)' : 'var(--ok)' }}>
                {hero.clipping ? 'clipping' : 'no clipping'}
              </div>
            ) : (
              <div className="mono" style={{ fontSize: 24, marginTop: 6, color: h.tone === 'ok' ? 'var(--ok)' : 'var(--ink)', display: 'flex', alignItems: 'baseline', gap: 5 }}>
                {h.v}
                <small style={{ fontSize: 11, color: 'var(--ink-faint)' }}>{h.u}</small>
              </div>
            )}
            {h.meter && <LoudnessMeter value={parseFloat(h.v)} />}
          </div>
        ))}
      </div>

      <div className="wt-card-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '6px 0', marginTop: 10 }}>
        <div style={{ borderRight: '1px solid var(--line-soft)' }}>
          {file.slice(0, 3).map(([k, v]) => (
            <LeaderRow key={k} label={k} value={v} />
          ))}
        </div>
        <div>
          {file.slice(3).map(([k, v]) => (
            <LeaderRow key={k} label={k} value={v} />
          ))}
        </div>
      </div>
    </>
  );
}

export default function MetadataPanel({ version }) {
  const status = version?.status ?? 'ready';
  const badge = STATUS_PILL[status];

  return (
    <div>
      <Eyebrow style={{ marginBottom: 12 }}>
        Audio metadata {badge && <Pill tone={badge.tone}>{badge.label}</Pill>}
      </Eyebrow>

      {status === 'processing' && (
        <StatePanel title="Analyzing audio…" detail="Loudness, peak and file specs appear once analysis finishes" />
      )}
      {status === 'failed' && (
        <StatePanel bad title="Couldn't analyze this file" detail="Re-upload the version to run analysis again" />
      )}
      {status !== 'processing' && status !== 'failed' && <ReadyMetrics version={version} />}
    </div>
  );
}
