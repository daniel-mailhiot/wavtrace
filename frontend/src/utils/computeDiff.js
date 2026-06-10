// Builds the metadata diff rows for the compare screen

import formatTime from './formatTime';

const round1 = (n) => Math.round(n * 10) / 10;
// Unicode minus (U+2212) so deltas line up with the '+' sign
const signed = (n) => (n >= 0 ? `+${n}` : `−${Math.abs(n)}`);

// Each row formats a value and describes its change
const METRICS = [
  {
    k: 'Loudness', unit: 'LUFS',
    value: (v) => v.loudness.toFixed(1),
    delta: (a, b) => ({ text: `${signed(round1(b.loudness - a.loudness))} LUFS`, tone: 'accent' }),
  },
  {
    k: 'Duration', unit: '',
    value: (v) => formatTime(v.duration),
    delta: (a, b) => ({ text: `${signed(b.duration - a.duration)}s`, tone: 'dim' }),
  },
  {
    k: 'True peak', unit: 'dB',
    value: (v) => `${v.truePeak > 0 ? '+' : ''}${v.truePeak.toFixed(1)}`,
    flagA: (a) => a.truePeak > 0, // over 0 dB clipping
    delta: (a, b) =>
      a.truePeak > 0 && b.truePeak <= 0
        ? { text: 'fixed', tone: 'ok' }
        : { text: `${signed(round1(b.truePeak - a.truePeak))} dB`, tone: 'dim' },
  },
  {
    k: 'LRA', unit: 'LU',
    value: (v) => v.lra.toFixed(1),
    delta: (a, b) => ({ text: `${signed(round1(b.lra - a.lra))} LU`, tone: 'dim' }),
  },
  {
    k: 'Clipping', unit: '',
    value: (v) => (v.clipping ? 'detected' : 'none'),
    flagA: (a) => a.clipping,
    delta: (a, b) =>
      a.clipping && !b.clipping
        ? { text: 'no clipping', tone: 'ok' }
        : { text: 'now clipping', tone: 'bad' },
  },
  {
    k: 'Size', unit: 'MB',
    value: (v) => v.size.toFixed(1),
    delta: (a, b) => ({ text: `${signed(round1(b.size - a.size))} MB`, tone: 'faint' }),
  },
  {
    k: 'Bitrate', unit: 'Mb/s',
    value: (v) => v.bitrate.toFixed(1),
    delta: (a, b) => ({ text: signed(round1(b.bitrate - a.bitrate)), tone: 'faint' }),
  },
  { k: 'Sample rate', unit: '', value: (v) => v.sampleRate, delta: () => null },
  { k: 'Bit depth', unit: '', value: (v) => v.bitDepth, delta: () => null },
  { k: 'Format', unit: '', value: (v) => v.format, delta: () => null },
];

export function computeDiff(a, b) {
  return METRICS.map((m) => {
    const aVal = m.value(a);
    const bVal = m.value(b);
    const changed = aVal !== bVal;
    const d = changed ? m.delta(a, b) : null;
    return {
      k: m.k,
      unit: m.unit,
      aVal,
      bVal,
      delta: d?.text ?? '',
      tone: d?.tone ?? 'faint',
      changed,
      flagA: m.flagA?.(a) ?? false,
    };
  });
}
