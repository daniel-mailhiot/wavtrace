import Eyebrow from '../Eyebrow';
import Pill from '../Pill';

const HERO = ['Loudness', 'True peak', 'Loudness range', 'Clipping'];
const SPECS = ['Duration', 'Format', 'Size', 'Sample rate', 'Bit depth', 'Bitrate'];

function UploadGlyph() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 15.5V4M7 9l5-5 5 5" />
      <path d="M5 19.5h14" opacity=".45" />
    </svg>
  );
}

function SpecRow({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, padding: '8px 16px', fontFamily: 'var(--mono)', fontSize: 13 }}>
      <span className="faint" style={{ whiteSpace: 'nowrap' }}>{label}</span>
      <span style={{ flex: 1, borderBottom: '1px dotted var(--line)', transform: 'translateY(-3px)' }} />
      <span style={{ color: 'var(--ink-faint)' }}>—</span>
    </div>
  );
}

export default function EmptyProject({ isOwner, onUpload }) {
  return (
    <>
      <div style={{ height: 22 }} />

      <Eyebrow style={{ marginBottom: 10 }}>Versions</Eyebrow>
      <div style={{ position: 'relative', paddingLeft: 24 }}>
        <div style={{ position: 'absolute', left: -20, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, borderRadius: '50%', border: '2px dashed var(--line)', background: 'var(--board)' }} />
        {/* Not clickable so skip the row hover lift */}
        <div className="wt-vrow" style={{ border: '1px dashed var(--line)', background: 'var(--panel-2)', pointerEvents: 'none' }}>
          <span className="wt-vbadge" style={{ color: 'var(--ink-faint)' }}>v1</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, color: 'var(--ink-dim)' }}>No versions yet</div>
            <div className="mono faint" style={{ fontSize: 11.5, marginTop: 2 }}>
              {isOwner ? 'Upload audio to start the first version' : 'Waiting on the first upload'}
            </div>
          </div>
        </div>
      </div>

      <div style={{ height: 22 }} />
      {/* Only owners can upload */}
      {isOwner ? (
        <button type="button" className="wt-wave-empty" onClick={onUpload}>
          <UploadGlyph />
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>Upload the first version</div>
            <div className="mono faint" style={{ fontSize: 12, marginTop: 6 }}>Click to add audio for review · WAV / MP3 / FLAC</div>
          </div>
        </button>
      ) : (
        <div className="wt-wave-empty" style={{ pointerEvents: 'none' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>No audio yet</div>
            <div className="mono faint" style={{ fontSize: 12, marginTop: 6 }}>The owner hasn't uploaded the first version</div>
          </div>
        </div>
      )}

      <div style={{ height: 26 }} />
      <Eyebrow style={{ marginBottom: 12 }}>
        Audio metadata <Pill>awaiting upload</Pill>
      </Eyebrow>

      <div className="wt-meta-hero">
        {HERO.map((k) => (
          <div key={k} style={{ background: 'var(--panel-2)', padding: '14px 16px' }}>
            <div className="faint mono" style={{ fontSize: 10.5, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{k}</div>
            <div className="mono" style={{ fontSize: 24, marginTop: 6, color: 'var(--ink-faint)' }}>—</div>
          </div>
        ))}
      </div>

      <div className="wt-card-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '6px 0', marginTop: 10 }}>
        <div style={{ borderRight: '1px solid var(--line-soft)' }}>
          {SPECS.slice(0, 3).map((k) => (
            <SpecRow key={k} label={k} />
          ))}
        </div>
        <div>
          {SPECS.slice(3).map((k) => (
            <SpecRow key={k} label={k} />
          ))}
        </div>
      </div>
    </>
  );
}
