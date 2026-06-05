// Mock data for the project view; the audio, comment and metadata
// backends don't exist yet, so these are stand-ins

// Newest first; v3 is the current version
export const PV_VERSIONS = [
  { v: 'v3', tag: 'current', who: 'uploaded by you', when: '2d ago', meta: '8.4 MB · WAV' },
  { v: 'v2', who: 'uploaded by you', when: '6d ago', meta: '8.1 MB · WAV' },
  { v: 'v1', who: 'uploaded by you', when: '2w ago', meta: '7.9 MB · WAV' },
];

// t and region are fractions (0..1) of track length, used to place waveform markers
export const PV_COMMENTS = [
  { n: '1', who: 'Kai', av: 'K', time: '0:34', t: 0.18, text: 'Low end is muddy here. Try a high-pass on the pad?' },
  { n: '2', who: 'Ana', av: 'A', time: '1:20–1:38', region: [0.42, 0.5], text: 'This part repeats a little too long. Trimming a few bars could keep momentum.' },
  { n: '3', who: 'Kai', av: 'K', time: '2:22', t: 0.72, text: 'Vocal sits a touch too far back in the mix now.' },
  { n: '4', who: 'Kai', av: 'K', time: '3:01', t: 0.93, text: "Everything else sounds great! I'll lock final version after changes." },
];

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
