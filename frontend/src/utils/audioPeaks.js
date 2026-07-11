// Decode an audio clip into a peak envelope plus alignment features
// Cached per url since decoding the whole file is slow

// Fixed peaks per second so clips of different lengths keep a real time axis
// (the old version squeezed every file into 1024 buckets which stretched them)
const PEAKS_PER_SEC = 50;

// Spectral frames for the diff alignment, loudness envelopes alone can't tell
// "same bar with a new layer" from "different bar of the same loop"
const FEATURE_RATE = 10; // frames per second
const FFT_SIZE = 2048;
const BAND_COUNT = 12;
const BAND_LO = 60; // Hz
const BAND_HI = 8000;

const cache = new Map();
let audioCtx;

// Reuse one context (browsers cap how many can exist at once)
function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

// Returns { peaks, rate, duration, features, featureRate, bandCount }
// peaks are for drawing, features are per-frame spectral fingerprints
export async function getPeaks(url) {
  if (cache.has(url)) return cache.get(url);

  const res = await fetch(url);
  const buffer = await getCtx().decodeAudioData(await res.arrayBuffer());

  const buckets = Math.max(1, Math.ceil(buffer.duration * PEAKS_PER_SEC));
  const peaks = new Float32Array(buckets);
  const step = buffer.length / buckets;

  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const samples = buffer.getChannelData(ch);
    for (let i = 0; i < buckets; i++) {
      let max = 0;
      const start = Math.floor(i * step);
      const end = Math.min(Math.floor((i + 1) * step) || start + 1, samples.length);
      for (let j = start; j < end; j++) {
        const v = Math.abs(samples[j]);
        if (v > max) max = v;
      }
      peaks[i] += max;
    }
  }
  for (let i = 0; i < buckets; i++) peaks[i] /= buffer.numberOfChannels;

  const features = spectralFeatures(buffer);
  const levels = frameLevels(peaks, buffer.duration);

  const result = {
    peaks,
    rate: PEAKS_PER_SEC,
    duration: buffer.duration,
    features,
    levels,
    featureRate: FEATURE_RATE,
    bandCount: BAND_COUNT,
  };
  cache.set(url, result);
  return result;
}

// Per-feature-frame loudness, normalized per file (95th percentile = 1)
// Spectral vectors are loudness-blind on purpose, but the aligner still needs
// to know a quiet tail is not the same thing as a loud bar of music
function frameLevels(peaks, duration) {
  const frames = Math.max(1, Math.round(duration * FEATURE_RATE));
  const levels = new Float32Array(frames);
  const step = peaks.length / frames;
  for (let f = 0; f < frames; f++) {
    let max = 0;
    const from = Math.floor(f * step);
    const to = Math.max(Math.floor((f + 1) * step), from + 1);
    for (let i = from; i < to && i < peaks.length; i++) {
      if (peaks[i] > max) max = peaks[i];
    }
    levels[f] = max;
  }
  const sorted = Array.from(levels).sort((x, y) => x - y);
  const ref = sorted[Math.floor(sorted.length * 0.95)] || 1;
  for (let f = 0; f < frames; f++) levels[f] = Math.min(levels[f] / ref, 1.5);
  return levels;
}

// Loudest stored peak inside a time range, for drawing one bar
export function peakInRange(env, startSec, endSec) {
  const from = Math.max(0, Math.floor(startSec * env.rate));
  const to = Math.min(env.peaks.length, Math.max(Math.ceil(endSec * env.rate), from + 1));
  let max = 0;
  for (let i = from; i < to; i++) {
    if (env.peaks[i] > max) max = env.peaks[i];
  }
  return max;
}

// Per-frame band energies, compressed then unit-length so overall loudness
// drops out and only the frequency balance is compared
function spectralFeatures(buffer) {
  const sr = buffer.sampleRate;
  const mono = new Float32Array(buffer.length);
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const samples = buffer.getChannelData(ch);
    for (let i = 0; i < buffer.length; i++) mono[i] += samples[i];
  }
  if (buffer.numberOfChannels > 1) {
    for (let i = 0; i < buffer.length; i++) mono[i] /= buffer.numberOfChannels;
  }

  const hop = sr / FEATURE_RATE;
  const frames = Math.max(1, Math.round(buffer.duration * FEATURE_RATE));
  const features = new Float32Array(frames * BAND_COUNT);

  const hann = new Float32Array(FFT_SIZE);
  for (let i = 0; i < FFT_SIZE; i++) {
    hann[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (FFT_SIZE - 1));
  }

  // geometric band edges mapped to fft bins
  const hi = Math.min(BAND_HI, sr / 2);
  const ratio = Math.pow(hi / BAND_LO, 1 / BAND_COUNT);
  const binOf = (hz) => Math.min(FFT_SIZE / 2, Math.max(1, Math.round((hz * FFT_SIZE) / sr)));
  const edges = [];
  for (let b = 0; b <= BAND_COUNT; b++) edges.push(binOf(BAND_LO * Math.pow(ratio, b)));

  const re = new Float32Array(FFT_SIZE);
  const im = new Float32Array(FFT_SIZE);

  for (let f = 0; f < frames; f++) {
    const start = Math.floor(f * hop);
    for (let i = 0; i < FFT_SIZE; i++) {
      re[i] = (mono[start + i] || 0) * hann[i];
      im[i] = 0;
    }
    fft(re, im);

    let norm = 0;
    for (let b = 0; b < BAND_COUNT; b++) {
      let energy = 0;
      for (let k = edges[b]; k < Math.max(edges[b + 1], edges[b] + 1); k++) {
        energy += re[k] * re[k] + im[k] * im[k];
      }
      // 4th root squashes the huge dynamic range before comparing balance
      const v = Math.pow(energy, 0.25);
      features[f * BAND_COUNT + b] = v;
      norm += v * v;
    }
    norm = Math.sqrt(norm);
    if (norm > 1e-6) {
      for (let b = 0; b < BAND_COUNT; b++) features[f * BAND_COUNT + b] /= norm;
    }
    // near-silent frames stay zero vectors and the aligner treats them as quiet
  }
  return features;
}

// In-place iterative radix-2 FFT
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang);
    const wi = Math.sin(ang);
    const half = len >> 1;
    for (let i = 0; i < n; i += len) {
      let curR = 1;
      let curI = 0;
      for (let k = 0; k < half; k++) {
        const ur = re[i + k];
        const ui = im[i + k];
        const vr = re[i + k + half] * curR - im[i + k + half] * curI;
        const vi = re[i + k + half] * curI + im[i + k + half] * curR;
        re[i + k] = ur + vr;
        im[i + k] = ui + vi;
        re[i + k + half] = ur - vr;
        im[i + k + half] = ui - vi;
        const nr = curR * wr - curI * wi;
        curI = curR * wi + curI * wr;
        curR = nr;
      }
    }
  }
}
