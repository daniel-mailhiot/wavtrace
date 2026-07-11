import { Fragment, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import ModalFrame from '../components/Modal/ModalFrame';
import { ModalHead, ModalFoot } from '../components/Modal/ModalParts';
import Button from '../components/Button';
import Select from '../components/Select';
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

const MARK_TYPES = [
  { id: 'added', label: 'Added' },
  { id: 'removed', label: 'Removed' },
];

// m:ss.mmm, m:ss or plain seconds
function parseTimecode(str) {
  const m = str.trim().match(/^(?:(\d+):)?(\d+(?:\.\d+)?)$/);
  if (!m) return null;
  const min = m[1] ? parseInt(m[1], 10) : 0;
  const sec = parseFloat(m[2]);
  if (m[1] && sec >= 60) return null;
  return min * 60 + sec;
}

// '5' = bar 5, '5.3' = bar 5 beat 3 (4/4)
function parseBarBeat(str) {
  const m = str.trim().match(/^(\d+)(?:\.([1-4]))?$/);
  if (!m) return null;
  const bar = parseInt(m[1], 10);
  if (bar < 1) return null;
  return { bar, beat: m[2] ? parseInt(m[2], 10) : null };
}

// Marks read as inclusive ranges ("5 to 8" covers bars 5 through 8),
// so from = start of the named unit and to = end of it
function barBeatRange(fromStr, toStr, barLen) {
  const from = parseBarBeat(fromStr);
  const to = parseBarBeat(toStr);
  if (!from || !to) return null;
  const beatLen = barLen / 4;
  const start = (from.bar - 1) * barLen + ((from.beat ?? 1) - 1) * beatLen;
  const end = to.beat == null ? to.bar * barLen : (to.bar - 1) * barLen + to.beat * beatLen;
  return end > start ? { start, end } : null;
}

const fmtSec = (s) => `${Math.floor(s / 60)}:${(s % 60).toFixed(3).padStart(6, '0')}`;

const linkStyle = {
  background: 'none',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  fontFamily: 'var(--mono)',
  fontSize: 11.5,
  color: 'var(--ink-faint)',
  textAlign: 'left',
};

// Compact rows for marking added/removed sections, collapsed to one line until used
function SectionMarks({ marks, units, bpm, busy, setMarks, setUnits, setBpm }) {
  const setRow = (i, patch) => setMarks(marks.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));
  const addRow = () => setMarks([...marks, { type: 'added', from: '', to: '' }]);
  const removeRow = (i) => setMarks(marks.filter((_, idx) => idx !== i));

  if (!marks.length) {
    return (
      <button type="button" style={{ ...linkStyle, marginTop: 12 }} onClick={addRow} disabled={busy}>
        + Mark an added/removed section (optional)
      </button>
    );
  }

  const colLabel = (text) => (
    <span className="mono faint" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>{text}</span>
  );

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className="wt-eyebrow" style={{ margin: 0 }}>Section changes</span>
        <span className="wt-grow" />
        <div style={{ display: 'inline-flex', border: '1px solid var(--line)', borderRadius: 6, overflow: 'hidden' }}>
          {[['time', 'time'], ['bars', 'bars']].map(([id, label]) => (
            <button
              key={id}
              type="button"
              disabled={busy}
              onClick={() => setUnits(id)}
              style={{
                padding: '3px 10px', fontSize: 11, fontFamily: 'var(--mono)', border: 'none', cursor: 'pointer',
                background: units === id ? 'var(--accent-soft)' : 'transparent',
                color: units === id ? 'var(--accent)' : 'var(--ink-faint)',
              }}
            >
              {label}
            </button>
          ))}
        </div>
        {units === 'bars' && (
          <input
            className="wt-input mono"
            value={bpm}
            disabled={busy}
            placeholder="BPM"
            onChange={(e) => setBpm(e.target.value)}
            style={{ width: 56, fontSize: 12, padding: '4px 8px' }}
          />
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '104px 1fr 1fr 28px', gap: 8, marginTop: 10, alignItems: 'center' }}>
        <span />
        {colLabel('From')}
        {colLabel('To')}
        <span />
        {marks.map((m, i) => {
          // live conversion so a misread range is visible before uploading
          const bpmNum = parseFloat(bpm);
          const range = units === 'bars' && bpmNum >= 20 && bpmNum <= 400
            ? barBeatRange(m.from, m.to, 240 / bpmNum)
            : null;
          return (
            <Fragment key={i}>
              <Select value={m.type} options={MARK_TYPES} onChange={(t) => setRow(i, { type: t })} width={104} />
              <input
                className="wt-input mono"
                value={m.from}
                disabled={busy}
                placeholder={units === 'time' ? '0:07.5' : '5'}
                onChange={(e) => setRow(i, { from: e.target.value })}
                style={{ fontSize: 12.5, padding: '7px 9px' }}
              />
              <input
                className="wt-input mono"
                value={m.to}
                disabled={busy}
                placeholder={units === 'time' ? '0:15.0' : '8'}
                onChange={(e) => setRow(i, { to: e.target.value })}
                style={{ fontSize: 12.5, padding: '7px 9px' }}
              />
              <button
                type="button"
                aria-label="Remove mark"
                onClick={() => !busy && removeRow(i)}
                style={{ width: 28, height: 28, border: '1px solid var(--line)', background: 'var(--panel-2)', color: 'var(--ink-faint)', borderRadius: 6, cursor: 'pointer', fontSize: 14, lineHeight: 1 }}
              >
                ×
              </button>
              {range && (
                <span className="mono faint" style={{ gridColumn: '2 / 4', fontSize: 10, marginTop: -4 }}>
                  = {fmtSec(range.start)} – {fmtSec(range.end)}
                </span>
              )}
            </Fragment>
          );
        })}
      </div>

      <button type="button" style={{ ...linkStyle, marginTop: 10 }} onClick={addRow} disabled={busy}>
        + add another
      </button>
      <p className="mono faint" style={{ fontSize: 10.5, lineHeight: 1.55, margin: '8px 0 0' }}>
        Added = where it sits in this file. Removed = where it was in the previous version.
        {units === 'bars' && (
          <>
            <br />
            Ranges include both ends: 5 to 8 covers bars 5–8. Beats go after a dot (5.3 = bar 5, beat 3). 4/4 assumed.
          </>
        )}
      </p>
    </div>
  );
}

export default function UploadVersionModal({ versions, projectName, onClose, onUpload }) {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState('');
  const [marks, setMarks] = useState([]);
  const [units, setUnits] = useState('time');
  const [bpm, setBpm] = useState('');
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

  // Marks convert to seconds here so the server only ever sees one format
  function buildEdits() {
    const rows = marks.filter((m) => m.from.trim() || m.to.trim());
    if (!rows.length) return [];
    const bpmNum = parseFloat(bpm);
    if (units === 'bars' && !(bpmNum >= 20 && bpmNum <= 400)) {
      throw new Error('Bars mode needs a BPM between 20 and 400.');
    }
    const barLen = 240 / bpmNum; // 4/4 assumed
    return rows.map((m) => {
      if (units === 'time') {
        const start = parseTimecode(m.from);
        const end = parseTimecode(m.to);
        if (start == null || end == null || end <= start) {
          throw new Error('Marks need a valid time range, like 0:07.5 to 0:15.');
        }
        return { type: m.type, start, end };
      }
      const range = barBeatRange(m.from, m.to, barLen);
      if (!range) {
        throw new Error('Marks need a bar range like 5 to 8, or bar.beat like 5.3.');
      }
      return { type: m.type, start: range.start, end: range.end };
    });
  }

  async function submit() {
    let edits;
    try {
      edits = buildEdits();
    } catch (err) {
      setError(err.message);
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onUpload(file, description.trim(), edits);
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
            <>
              <SelectedFile
                file={file}
                description={description}
                busy={busy}
                onDescription={setDescription}
                onRemove={() => !busy && setFile(null)}
              />
              {!isFirst && (
                <SectionMarks
                  marks={marks}
                  units={units}
                  bpm={bpm}
                  busy={busy}
                  setMarks={setMarks}
                  setUnits={setUnits}
                  setBpm={setBpm}
                />
              )}
            </>
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
