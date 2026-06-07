// Custom waveform diff view

import { useEffect, useRef, useState } from 'react';
import { getPeaks, resample } from '../utils/audioPeaks';

const BAR_WIDTH = 2.5;
const BAR_GAP = 2;

const BASELINE = '#565a67';
const LOUDER = '#4fd764';
const QUIETER = '#dc695a';

export default function DiffWaveform({ baselineUrl, compareUrl, height = 160 }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const [peaks, setPeaks] = useState(null);

  // Decode both clips whenever the picked versions change
  useEffect(() => {
    let alive = true;
    setPeaks(null);
    Promise.all([getPeaks(baselineUrl), getPeaks(compareUrl)])
      .then(([base, cmp]) => alive && setPeaks({ base, cmp }))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [baselineUrl, compareUrl]);

  // Redraw on load and whenever the container resizes
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap || !peaks) return;

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

      const bars = Math.floor(width / (BAR_WIDTH + BAR_GAP));
      const base = resample(peaks.base, bars);
      const cmp = resample(peaks.cmp, bars);

      // One shared scale so a uniformly louder version reads taller everywhere
      let max = 0;
      for (let i = 0; i < bars; i++) {
        if (base[i] > max) max = base[i];
        if (cmp[i] > max) max = cmp[i];
      }
      if (!max) return;

      const mid = height / 2;
      const cap = mid - 4; // leave a little room top and bottom

      for (let i = 0; i < bars; i++) {
        const x = i * (BAR_WIDTH + BAR_GAP);
        const b = (base[i] / max) * cap;
        const c = (cmp[i] / max) * cap;
        const core = Math.min(b, c);
        const outer = Math.max(b, c);

        // Gray core both versions reach mirrored around the center
        fillBar(ctx, x, mid - core, core * 2, BASELINE);

        // Difference band sits outside the core and shows green when louder else red
        if (outer - core > 0.5) {
          const color = c > b ? LOUDER : QUIETER;
          fillBar(ctx, x, mid - outer, outer - core, color);
          fillBar(ctx, x, mid + core, outer - core, color);
        }
      }
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [peaks, height]);

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
