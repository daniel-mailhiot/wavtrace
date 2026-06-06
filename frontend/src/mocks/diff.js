// Temp metadata until the analysis backend exists
// The diff is built from these specs so the version selects actually recompute

// Newest last so older to newer reads left to right
export const DIFF_VERSIONS = ['v1', 'v2', 'v3'];

// Whether each version's analysis has finished; all true until the analysis
// backend exists, once it does a freshly uploaded version reads false here
// until its result comes back, and the diff falls back to a pending state
const ANALYZED = { v1: true, v2: true, v3: true };
export const isAnalyzed = (ver) => ANALYZED[ver] ?? false;

// v3 matches the project view metadata panel so the two screens agree
const VERSION_META = {
  v1: { loudness: -18.3, duration: 205, truePeak: 1.4, lra: 9.6, clipping: true, size: 7.9, bitrate: 2.1, sampleRate: '48 kHz', bitDepth: '24-bit', format: 'WAV' },
  v2: { loudness: -16.1, duration: 200, truePeak: 0.3, lra: 8.1, clipping: true, size: 8.1, bitrate: 2.2, sampleRate: '48 kHz', bitDepth: '24-bit', format: 'WAV' },
  v3: { loudness: -14.2, duration: 192, truePeak: -1.0, lra: 6.4, clipping: false, size: 8.4, bitrate: 2.3, sampleRate: '48 kHz', bitDepth: '24-bit', format: 'WAV' },
};

const round1 = (n) => Math.round(n * 10) / 10;
const clock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
// '−' is the unicode minus (U+2212) so deltas line up with the '+' sign
const signed = (n) => (n >= 0 ? `+${n}` : `−${Math.abs(n)}`);

// Each metric formats its value and describes a change between two versions
// delta returns null when a change carries no extra meaning
const METRICS = [
  {
    k: 'Loudness', unit: 'LUFS',
    value: (v) => v.loudness.toFixed(1),
    delta: (a, b) => {
      const d = round1(b.loudness - a.loudness);
      return { text: `${signed(d)} · ${d >= 0 ? 'louder' : 'quieter'}`, tone: 'accent' };
    },
  },
  {
    k: 'Duration', unit: '',
    value: (v) => clock(v.duration),
    delta: (a, b) => {
      const d = b.duration - a.duration;
      return { text: `${signed(d)}s · ${d >= 0 ? 'longer' : 'shorter'}`, tone: 'dim' };
    },
  },
  {
    k: 'True peak', unit: 'dB',
    value: (v) => `${v.truePeak > 0 ? '+' : ''}${v.truePeak.toFixed(1)}`,
    flagA: (a) => a.truePeak > 0, // over 0 dB risks clipping
    delta: (a, b) =>
      a.truePeak > 0 && b.truePeak <= 0
        ? { text: '✓ fixed', tone: 'ok' }
        : { text: `${signed(round1(b.truePeak - a.truePeak))} dB`, tone: 'dim' },
  },
  {
    k: 'LRA', unit: 'LU',
    value: (v) => v.lra.toFixed(1),
    delta: (a, b) => {
      const d = round1(b.lra - a.lra);
      return { text: `${signed(d)} · ${d <= 0 ? 'tighter' : 'wider'}`, tone: 'dim' };
    },
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

export function computeDiff(aVer, bVer) {
  const a = VERSION_META[aVer];
  const b = VERSION_META[bVer];
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
