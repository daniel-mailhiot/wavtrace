// Mock data for the project view; the audio, comment and metadata
// backends don't exist yet, so these are stand-ins

// Newest first; v3 is the current version
export const PV_VERSIONS = [
  { v: 'v3', tag: 'current', who: 'uploaded by you', when: '2d ago', meta: '8.4 MB · WAV' },
  { v: 'v2', who: 'uploaded by you', when: '6d ago', meta: '8.1 MB · WAV' },
  { v: 'v1', who: 'uploaded by you', when: '2w ago', meta: '7.9 MB · WAV' },
];

// Comments per version so so switching swaps data
// t and region are 0..1 fractions so they map onto the waveform, timecode is fraction x duration
export const PV_COMMENTS_BY_VERSION = {
  v3: [
    { id: 'c1', who: 'Kai', av: 'K', t: 0.18, text: 'Low end is muddy here. Try a high-pass on the pad?' },
    { id: 'c2', who: 'Ana', av: 'A', region: [0.42, 0.5], text: 'This part repeats a little too long. Trimming a few bars could keep momentum.' },
    { id: 'c3', who: 'Kai', av: 'K', t: 0.72, text: 'Vocal sits a touch too far back in the mix now.' },
    { id: 'c4', who: 'Kai', av: 'K', t: 0.93, text: "Everything else sounds great! I'll lock final version after changes." },
  ],
  v2: [
    { id: 'c5', who: 'Ana', av: 'A', t: 0.31, text: 'The intro swell builds nicely now, much better pacing.' },
    { id: 'c6', who: 'Kai', av: 'K', region: [0.6, 0.7], text: 'Drums get a bit buried through this stretch. Bring them up?' },
  ],
  v1: [
    { id: 'c7', who: 'Kai', av: 'K', t: 0.5, text: 'Solid first pass. Melody is catchy, the mix just needs some polish.' },
  ],
};

export const PV_LOUDNESS = {
  loudness: '-14.2',
  truePeak: '-1.0',
  lra: '6.4',
  clipping: 'none',
};

export const PV_FILE = [
  ['Duration', '3:12'],
  ['Format', 'WAV'],
  ['Size', '8.4 MB'],
  ['Sample rate', '48 kHz'],
  ['Bit depth', '24-bit'],
  ['Bitrate', '2.3 Mb/s'],
];
