// Decode an audio clip into a small peak array for the diff overlay
// Cached per url since decoding the whole file is slow

// Resolution stored per clip downsampled to the bar count when drawn
const BUCKETS = 1024;

const cache = new Map();
let audioCtx;

// Reuse one context (browsers cap how many can exist at once)
function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

// One magnitude per bucket (loudest sample in slice) averaged across channels
export async function getPeaks(url) {
  if (cache.has(url)) return cache.get(url);

  const res = await fetch(url);
  const buffer = await getCtx().decodeAudioData(await res.arrayBuffer());

  const peaks = new Float32Array(BUCKETS);
  const step = Math.floor(buffer.length / BUCKETS) || 1;

  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const samples = buffer.getChannelData(ch);
    for (let i = 0; i < BUCKETS; i++) {
      let max = 0;
      const start = i * step;
      for (let j = 0; j < step; j++) {
        const v = Math.abs(samples[start + j] || 0);
        if (v > max) max = v;
      }
      peaks[i] += max;
    }
  }
  for (let i = 0; i < BUCKETS; i++) peaks[i] /= buffer.numberOfChannels;

  cache.set(url, peaks);
  return peaks;
}

// Shrink a peak array to n bars keeping the loudest sample per group
export function resample(peaks, n) {
  const out = new Float32Array(n);
  const step = peaks.length / n;
  for (let i = 0; i < n; i++) {
    const start = Math.floor(i * step);
    const end = Math.max(Math.floor((i + 1) * step), start + 1);
    let max = 0;
    for (let j = start; j < end && j < peaks.length; j++) {
      if (peaks[j] > max) max = peaks[j];
    }
    out[i] = max;
  }
  return out;
}
