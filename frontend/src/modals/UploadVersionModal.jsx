import { useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import ModalFrame from '../components/Modal/ModalFrame';
import { ModalHead, ModalFoot } from '../components/Modal/ModalParts';
import Button from '../components/Button';
import { UploadIcon } from '../components/icons';

const ALLOWED = ['wav', 'mp3', 'flac'];
const MAX_MB = 50;

const extOf = (name) => name.split('.').pop().toLowerCase();
const sizeMB = (bytes) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

// Check before upload (server validates)
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

function SelectedFile({ file, description, busy, onDescription, onRemove }) {
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
      <textarea
        className="wt-input"
        rows={2}
        maxLength={300}
        value={description}
        disabled={busy}
        onChange={(e) => onDescription(e.target.value)}
        placeholder="Add a note for this version (optional)"
        style={{ marginTop: 14 }}
      />
    </div>
  );
}

export default function UploadVersionModal({ versions, projectName, onClose, onUpload }) {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const isFirst = versions.length === 0;
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

  async function submit() {
    setBusy(true);
    setError('');
    try {
      await onUpload(file, description.trim());
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  function close() {
    if (!busy) onClose();
  }

  return (
    <ModalFrame onClose={close} width={560}>
      <ModalHead title={isFirst ? 'Upload first version' : 'Upload next version'} sub={projectName} onClose={close} />

      <div style={{ display: 'flex', gap: 24, padding: '22px 28px 6px', alignItems: 'stretch' }}>
        <UploadHistory versions={versions} nextLabel={nextLabel} ready={Boolean(file)} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {file ? (
            <SelectedFile
              file={file}
              description={description}
              busy={busy}
              onDescription={setDescription}
              onRemove={() => !busy && setFile(null)}
            />
          ) : (
            <DropZone onPick={pick} />
          )}
          {error && (
            <div className="mono" style={{ fontSize: 12, color: 'var(--bad)', marginTop: 12 }}>{error}</div>
          )}
        </div>
      </div>

      {!user?.hasStorage && (
        <div className="mono faint" style={{ fontSize: 11.5, lineHeight: 1.6, padding: '14px 28px 0' }}>
          <p style={{ margin: 0 }}>
            This account doesn't have upload access. You can add audio to be analyzed for metadata, but the file isn't kept after you leave the page.
          </p>
          <p style={{ margin: '8px 0 0' }}>
            To enable upload storage for this account contact daniel.mailhiot.dev@gmail.com
          </p>
        </div>
      )}

      <ModalFoot>
        <Button variant="ghost" onClick={close} disabled={busy}>Cancel</Button>
        <Button variant="primary" disabled={!file || busy} onClick={submit}>
          <UploadIcon /> {busy ? 'Uploading…' : 'Upload'}
        </Button>
      </ModalFoot>
    </ModalFrame>
  );
}
