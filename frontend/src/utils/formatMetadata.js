import formatTime from './formatTime';

// Round to one decimal or dash when missing
function fixed1(n) {
  return typeof n === 'number' ? n.toFixed(1) : '—';
}

// Format raw analysis numbers so the panel and diff share one formatter
export function panelMetadata(version) {
  const a = version?.analysis ?? {};
  const hero = {
    loudness: fixed1(a.loudness),
    truePeak: fixed1(a.truePeak),
    lra: fixed1(a.lra),
    clipping: Boolean(a.clipping),
  };
  const file = [
    ['Duration', formatTime(a.durationSec)],
    ['Format', (a.format ?? '').toUpperCase()],
    ['Size', `${((version?.size ?? 0) / (1024 * 1024)).toFixed(1)} MB`],
    ['Sample rate', a.sampleRate ? `${a.sampleRate / 1000} kHz` : '—'],
    ['Bit depth', a.bitDepth ? `${a.bitDepth}-bit` : '—'],
    ['Bitrate', a.bitrate ? `${(a.bitrate / 1e6).toFixed(1)} Mb/s` : '—'],
  ];
  return { hero, file };
}

// Diff needs raw numbers to compute deltas
export function diffMetadata(version) {
  const a = version.analysis ?? {};
  return {
    loudness: a.loudness,
    truePeak: a.truePeak,
    lra: a.lra,
    duration: a.durationSec,
    clipping: Boolean(a.clipping),
    size: (version.size ?? 0) / (1024 * 1024),
    bitrate: (a.bitrate ?? 0) / 1e6,
    sampleRate: a.sampleRate ? `${a.sampleRate / 1000} kHz` : '—',
    bitDepth: a.bitDepth ? `${a.bitDepth}-bit` : '—',
    format: (a.format ?? '').toUpperCase(),
  };
}
