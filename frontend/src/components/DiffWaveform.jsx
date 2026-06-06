import { useRef } from 'react';
import { useWavesurfer } from '@wavesurfer/react';

export default function DiffWaveform({ url, accent = false, height = 160 }) {
  const containerRef = useRef(null);
  const color = accent ? '#a87bff' : '#565a67';

  useWavesurfer({
    container: containerRef,
    url,
    height,
    waveColor: color,
    progressColor: color,
    cursorWidth: 0,
    barWidth: 2.5,
    barGap: 2,
    barRadius: 1.5,
    interact: false,
  });

  return <div className="wt-wave" ref={containerRef} style={{ minHeight: height }} />;
}
