import Eyebrow from '../Eyebrow';
import Pill from '../Pill';
import { PV_LOUDNESS, PV_FILE } from '../../mocks/projectView';

// Meter placing loudness in a -30..-6 LUFS window with a target of -14
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

// Loudness-forward metadata shown as a 4-up hero strip over the file readout
export default function MetadataPanel() {
  const { loudness, truePeak, lra } = PV_LOUDNESS;
  const heroes = [
    { k: 'Loudness', v: loudness, u: 'LUFS', meter: true },
    { k: 'True peak', v: truePeak, u: 'dB', tone: 'ok' },
    { k: 'Loudness range', v: lra, u: 'LU' },
    { k: 'Clipping', chip: true },
  ];

  return (
    <div>
      <Eyebrow style={{ marginBottom: 12 }}>
        Audio metadata <Pill tone="ok">ready</Pill>
      </Eyebrow>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: 'var(--line-soft)', border: '1px solid var(--line-soft)', borderRadius: 'var(--r-sm)', overflow: 'hidden' }}>
        {heroes.map((h) => (
          <div key={h.k} style={{ background: 'var(--panel-2)', padding: '14px 16px' }}>
            <div className="faint mono" style={{ fontSize: 10.5, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{h.k}</div>
            {h.chip ? (
              <div style={{ marginTop: 8 }}>
                <Pill tone="ok">✓ none</Pill>
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
          {PV_FILE.slice(0, 3).map(([k, v]) => (
            <LeaderRow key={k} label={k} value={v} />
          ))}
        </div>
        <div>
          {PV_FILE.slice(3).map(([k, v]) => (
            <LeaderRow key={k} label={k} value={v} />
          ))}
        </div>
      </div>
    </div>
  );
}
