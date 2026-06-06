import { useRef, useState } from 'react';
import ModalFrame from '../components/Modal/ModalFrame';
import { ModalHead, ModalFoot } from '../components/Modal/ModalParts';
import Button from '../components/Button';
import { UploadIcon } from '../components/icons';

const ALLOWED = ['wav', 'mp3', 'flac'];
const MAX_MB = 15;

const extOf = (name) => name.split('.').pop().toLowerCase();
const sizeMB = (bytes) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

// Temp client-side check until real upload validation is built
function validate(file) {
  if (!ALLOWED.includes(extOf(file.name))) return 'Unsupported format. Use WAV, MP3 or FLAC.';
  if (file.size > MAX_MB * 1024 * 1024) return `File is too large. Max ~${MAX_MB} MB.`;
  return '';
}

function UploadHistory({ versions, nextLabel, ready }) {
  const ordered = [...versions].reverse();
  const latest = versions[0]?.v;

  return (
    <div style={{ flex: '0 0 118px' }}>
      <div className="wt-eyebrow" style={{ marginBottom: 16 }}>History</div>
      <div style={{ position: 'relative', paddingLeft: 20 }}>
        <div style={{ position: 'absolute', left: 5, top: 6, bottom: 16, width: 2, background: 'var(--line)' }} />
        {ordered.map((v) => (
          <div key={v.v} style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16, position: 'relative' }}>
            <span style={{ position: 'absolute', left: -20, top: 1, width: 12, height: 12, borderRadius: '50%', background: 'var(--panel-3)', border: '2px solid var(--line)' }} />
            <span className="mono" style={{ fontSize: 13, color: 'var(--ink-dim)' }}>{v.v}</span>
            <span className="mono faint" style={{ fontSize: 11 }}>{v.v === latest ? 'current' : v.when}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, position: 'relative' }}>
          <span style={{ position: 'absolute', left: -20, top: 1, width: 12, height: 12, borderRadius: '50%', background: 'var(--accent)', boxShadow: ready ? '0 0 0 3px var(--accent-soft)' : '0 0 0 3px var(--accent-softer)' }} />
          <span className="mono" style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700 }}>{nextLabel}</span>
          <span className="mono faint" style={{ fontSize: 11 }}>{ready ? 'ready' : 'new'}</span>
        </div>
      </div>
    </div>
  );
}

function DropZone({ onPick }) {
  const inputRef = useRef(null);

  function onDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) onPick(file);
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, height: 172, border: '1.5px dashed var(--line)', borderRadius: 10, background: 'var(--panel-2)', cursor: 'pointer', textAlign: 'center' }}
    >
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 15.5V4M7 9l5-5 5 5" /><path d="M5 19.5h14" opacity=".45" />
      </svg>
      <div>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>Drop audio or browse</div>
        <div className="mono faint" style={{ fontSize: 12, marginTop: 6 }}>WAV / MP3 / FLAC · max ~{MAX_MB} MB</div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".wav,.mp3,.flac,audio/*"
        hidden
        onChange={(e) => e.target.files[0] && onPick(e.target.files[0])}
      />
    </div>
  );
}

function SelectedFile({ file, onRemove }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: 14, border: '1px solid var(--accent-line)', background: 'var(--accent-softer)', borderRadius: 10 }}>
        <div style={{ width: 38, height: 38, flex: 'none', borderRadius: 8, display: 'grid', placeItems: 'center', background: 'var(--accent-soft)', border: '1px solid var(--accent-line)', color: 'var(--accent)' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
            <path d="M9 1.6H4.2A1.5 1.5 0 0 0 2.7 3.1v9.8a1.5 1.5 0 0 0 1.5 1.5h7.6a1.5 1.5 0 0 0 1.5-1.5V6L9 1.6z" strokeLinejoin="round" />
            <path d="M9 1.6V6h4.3" strokeLinejoin="round" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</div>
          <div className="mono faint" style={{ fontSize: 11.5, marginTop: 3 }}>{sizeMB(file.size)} · {extOf(file.name).toUpperCase()}</div>
        </div>
        <button
          type="button"
          aria-label="Remove"
          onClick={onRemove}
          style={{ width: 28, height: 28, flex: 'none', border: '1px solid var(--line)', background: 'var(--panel-2)', color: 'var(--ink-faint)', borderRadius: 6, cursor: 'pointer', fontSize: 15, lineHeight: 1 }}
        >
          ×
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 14, fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ok)' }}>
        <span className="wt-dot" /> passed validation · analysis runs after upload
      </div>
    </div>
  );
}

// Mock upload, a valid file enables Upload and appends a new version
export default function UploadVersionModal({ versions, projectName, onClose, onUpload }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const nextLabel = `v${versions.length + 1}`;

  function pick(picked) {
    const problem = validate(picked);
    if (problem) {
      setError(problem);
      setFile(null);
      return;
    }
    setError('');
    setFile(picked);
  }

  return (
    <ModalFrame onClose={onClose} width={560}>
      <ModalHead title="Upload next version" sub={projectName} onClose={onClose} />

      <div style={{ display: 'flex', gap: 24, padding: '22px 28px 6px', alignItems: 'stretch' }}>
        <UploadHistory versions={versions} nextLabel={nextLabel} ready={Boolean(file)} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {file ? (
            <SelectedFile file={file} onRemove={() => setFile(null)} />
          ) : (
            <>
              <DropZone onPick={pick} />
              {error && (
                <div className="mono" style={{ fontSize: 12, color: 'var(--bad)', marginTop: 12 }}>{error}</div>
              )}
            </>
          )}
        </div>
      </div>

      <ModalFoot>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" disabled={!file} onClick={() => onUpload(file)}>
          <UploadIcon /> Upload
        </Button>
      </ModalFoot>
    </ModalFrame>
  );
}
