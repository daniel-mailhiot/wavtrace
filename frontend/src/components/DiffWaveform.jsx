// Custom waveform diff view
// Both versions render on a real time axis, aligned so an added or removed
// section shows as a block and everything after it still compares the right
// moments (the old version stretched both clips to the same width)

import { useEffect, useMemo, useRef, useState } from 'react';
import { getPeaks, peakInRange } from '../utils/audioPeaks';
import { alignEnvelopes, segmentsFromEdits } from '../utils/alignWaveforms';

const BAR_WIDTH = 2.5;
const BAR_GAP = 2;

const BASELINE = '#565a67';
const LOUDER = '#4fd763';
const QUIETER = '#dc695a';
const ADDED_BG = 'rgba(79, 215, 100, 0.04)';
const REMOVED_BG = 'rgba(220, 105, 90, 0.04)';
const ADDED_EDGE = 'rgba(79, 215, 100, 0.1)';
const REMOVED_EDGE = 'rgba(220, 105, 90, 0.1)';

export default function DiffWaveform({ baselineUrl, compareUrl, edits = null, height = 160 }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const [peaks, setPeaks] = useState(null);

  // Runs once per mount because DiffScreen keys this by version pair
  useEffect(() => {
    let alive = true;
    Promise.all([getPeaks(baselineUrl), getPeaks(compareUrl)])
      .then(([base, cmp]) => alive && setPeaks({ base, cmp }))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [baselineUrl, compareUrl]);

  // Uploader marks are most important, auto alignment does the rest
  const segments = useMemo(() => {
    if (!peaks) return null;
    return edits?.length
      ? segmentsFromEdits(edits, peaks.base.duration, peaks.cmp.duration)
      : alignEnvelopes(peaks.base, peaks.cmp);
  }, [peaks, edits]);

  // Redraw on load and whenever the container resizes
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap || !peaks || !segments) return;

    const draw = () => {
      const width = wrap.clientWidth;
      if (!width) return;

      // Scale by DPR
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // Lay segments out on one shared timeline
      const spanOf = (s) =>
        s.type === 'match'
          ? Math.max(s.aEnd - s.aStart, s.bEnd - s.bStart)
          : s.type === 'added' ? s.bEnd - s.bStart : s.aEnd - s.aStart;
      const laid = [];
      let total = 0;
      for (const s of segments) {
        const dur = spanOf(s);
        laid.push({ ...s, start: total, dur });
        total += dur;
      }
      if (!total) return;
      const pxPerSec = width / total;

      const bars = Math.floor(width / (BAR_WIDTH + BAR_GAP));
      const secPerBar = total / bars;

      // Sample every bar first so one shared scale keeps loudness comparable
      const samples = new Array(bars);
      let max = 0;
      let si = 0;
      for (let i = 0; i < bars; i++) {
        const t0 = i * secPerBar;
        const t1 = t0 + secPerBar;
        const tMid = (t0 + t1) / 2;
        while (si < laid.length - 1 && tMid > laid[si].start + laid[si].dur) si++;
        const seg = laid[si];
        // Remember which bars each segment owns so the tint can snap to them
        if (seg.firstBar === undefined) seg.firstBar = i;
        seg.lastBar = i;
        const f0 = Math.max(0, (t0 - seg.start) / seg.dur);
        const f1 = Math.min(1, (t1 - seg.start) / seg.dur);

        const slice = (env, from, to) =>
          peakInRange(env, from + f0 * (to - from), from + f1 * (to - from));

        if (seg.type === 'match') {
          const b = slice(peaks.base, seg.aStart, seg.aEnd);
          const c = slice(peaks.cmp, seg.bStart, seg.bEnd);
          samples[i] = { type: 'match', b, c };
          if (b > max) max = b;
          if (c > max) max = c;
        } else if (seg.type === 'added') {
          const c = slice(peaks.cmp, seg.bStart, seg.bEnd);
          samples[i] = { type: 'added', v: c };
          if (c > max) max = c;
        } else {
          const b = slice(peaks.base, seg.aStart, seg.aEnd);
          samples[i] = { type: 'removed', v: b };
          if (b > max) max = b;
        }
      }
      if (!max) return;

      const mid = height / 2;
      const cap = mid - 4; // leave a little room top and bottom

      // Faint tint and edge lines behind added/removed stretches
      // Snapped to the bars the section owns so a bar never sits half outside
      // its own tint (bars pick their segment by midpoint, not exact pixels)
      for (const seg of laid) {
        if (seg.type === 'match') continue;
        let x0 = seg.start * pxPerSec;
        let x1 = x0 + seg.dur * pxPerSec;
        if (seg.firstBar !== undefined) {
          x0 = Math.max(0, seg.firstBar * (BAR_WIDTH + BAR_GAP) - BAR_GAP / 2);
          x1 = Math.min(width, seg.lastBar * (BAR_WIDTH + BAR_GAP) + BAR_WIDTH + BAR_GAP / 2);
        }
        seg.tintX0 = x0;
        seg.tintW = x1 - x0;
        ctx.fillStyle = seg.type === 'added' ? ADDED_BG : REMOVED_BG;
        ctx.fillRect(x0, 0, x1 - x0, height);
        ctx.fillStyle = seg.type === 'added' ? ADDED_EDGE : REMOVED_EDGE;
        ctx.fillRect(x0, 0, 1, height);
        ctx.fillRect(x1 - 1, 0, 1, height);
      }

      for (let i = 0; i < bars; i++) {
        const s = samples[i];
        const x = i * (BAR_WIDTH + BAR_GAP);

        if (s.type === 'match') {
          const b = (s.b / max) * cap;
          const c = (s.c / max) * cap;
          const core = Math.min(b, c);
          const outer = Math.max(b, c);

          // Gray core both versions reach mirrored around the center
          fillBar(ctx, x, mid - core, core * 2, BASELINE);

          // Difference band sits outside the core and shows green when louder else red
          if (outer - core > 0.5) {
            const color = s.c > s.b ? LOUDER : QUIETER;
            fillBar(ctx, x, mid - outer, outer - core, color);
            fillBar(ctx, x, mid + core, outer - core, color);
          }
        } else {
          // Audio that exists on one side only draws as a full colored bar
          const v = (s.v / max) * cap;
          fillBar(ctx, x, mid - v, v * 2, s.type === 'added' ? LOUDER : QUIETER);
        }
      }

      // Section labels when the block is wide enough to fit one
      ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.textBaseline = 'top';
      for (const seg of laid) {
        if (seg.type === 'match') continue;
        if ((seg.tintW ?? 0) < 64) continue;
        const label =
          seg.type === 'added'
            ? `+${seg.dur.toFixed(1)}s added`
            : `−${seg.dur.toFixed(1)}s removed`;
        ctx.fillStyle = '#ffffffcb';
        ctx.fillText(label, seg.tintX0 + 5, 5);
      }
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [peaks, segments, height]);

  return (
    <div className="wt-wave" ref={wrapRef} style={{ minHeight: height }}>
      {!peaks && <div className="wt-spinner" style={{ position: 'absolute', inset: 0, margin: 'auto' }} />}
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height }} />
    </div>
  );
}

function fillBar(ctx, x, y, h, color) {
  if (h <= 0) return;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, BAR_WIDTH, h);
}
