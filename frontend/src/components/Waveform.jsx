import { useMemo } from 'react';

// Placeholder waveform drawn as flex bars (temp)
// A seed makes a given track draw the same shape consistently

// Repeatable random-looking numbers, the same seed always gives the same sequence
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// Bar heights (0..1) with a slow drifting envelope plus per-bar jitter
function buildBars(seed, count, waves = 3) {
  const next = rng(seed);
  const bars = [];
  let energy = 0.5;
  for (let i = 0; i < count; i++) {
    const env = 0.45 + 0.4 * Math.sin((i / count) * Math.PI * waves + seed);
    energy = energy * 0.6 + next() * 0.4;
    bars.push(Math.max(0.12, Math.min(1, env * (0.55 + energy * 0.7))));
  }
  return bars;
}

// markers: [{ t: 0..1, n } | { region: [start, end], n }]
// playhead: 0..1 lights bars up to that point and draws the cursor; null lights all
export default function Waveform({
  seed = 7,
  height = 180,
  count = 112,
  playhead = null,
  markers = [],
  tone = 'accent',
}) {
  const bars = useMemo(() => buildBars(seed, count), [seed, count]);
  const lit = playhead == null ? 1 : playhead;

  return (
    <div className="wt-wave-wrap">
      {markers.length > 0 && (
        <div className="wt-mk-rail">
          {markers.map((m, i) => (
            <div
              key={i}
              className={'wt-mk' + (m.region ? ' region' : '')}
              style={m.region ? { left: `calc(${m.region[0] * 100}% + 5px)` } : { left: `${m.t * 100}%` }}
            >
              {m.n}
            </div>
          ))}
        </div>
      )}

      <div className="wt-wave" style={{ height }}>
        {markers
          .filter((m) => m.region)
          .map((m, i) => (
            <div
              key={i}
              className="wt-region"
              style={{ left: `${m.region[0] * 100}%`, width: `${(m.region[1] - m.region[0]) * 100}%` }}
            />
          ))}

        <div className="wt-bars">
          {bars.map((h, i) => {
            const on = tone === 'accent' && (playhead == null || i / count <= lit);
            return (
              <div
                key={i}
                className={'wt-bar' + (on ? ' on' : '')}
                style={{ height: `${h * 100}%`, opacity: tone === 'muted' ? 0.4 : undefined }}
              />
            );
          })}
        </div>

        {playhead != null && <div className="wt-playhead" style={{ left: `${playhead * 100}%` }} />}
      </div>
    </div>
  );
}
