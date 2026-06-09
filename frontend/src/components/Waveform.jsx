import { useEffect, useRef, useState } from 'react';
import { useWavesurfer } from '@wavesurfer/react';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import Transport from './Transport';
import formatTime from '../utils/formatTime';

// Canvas can't read CSS vars, so region fill is a color mirroring --accent-soft
const REGION_FILL = 'rgba(108, 151, 230, 0.14)';

// Owns wavesurfer instance and renders its own transport
// Passes state up through callbacks so the screen can control playback, version switching and the comment composerr
// Callbacks must be stable (the setup effect keys on them)
export default function Waveform({
  url,
  comments = [],
  activeId,
  draft,
  onReady,
  onPlayingChange,
  onDuration,
  onPick,
  onSelect,
}) {
  const containerRef = useRef(null);
  const regionsRef = useRef(null);
  // true while drawing committed regions, so their region-created events aren't mistaken for a fresh user drag
  const drawingRef = useRef(false);
  const [duration, setDuration] = useState(0);

  const { wavesurfer, isReady, isPlaying, currentTime } = useWavesurfer({
    container: containerRef,
    url,
    height: 180,
    waveColor: '#565a67',
    progressColor: '#f2f2f2e5',
    cursorColor: '#6c97e6',
    barWidth: 2.5,
    barGap: 2,
    barRadius: 1.5,
  });

  // Set up regions + click/drag handlers once per instance
  useEffect(() => {
    if (!wavesurfer) return;

    const regions = wavesurfer.registerPlugin(RegionsPlugin.create());
    regionsRef.current = regions;
    regions.enableDragSelection({ color: REGION_FILL });

    const fracOf = (sec) => sec / (wavesurfer.getDuration() || 1);
    const clearDrafts = () => regions.getRegions().forEach((r) => r.drag && r.remove());

    const subs = [
      // user dragged a new region -> keep a single draft, report its bounds
      regions.on('region-created', (region) => {
        if (drawingRef.current) return; // committed region being drawn, not a drag
        regions.getRegions().forEach((r) => {
          if (r !== region && r.drag) r.remove();
        });
        onPick?.({ region: [fracOf(region.start), fracOf(region.end)] });
      }),
      // click a committed region -> select its comment and seek there
      regions.on('region-clicked', (region, e) => {
        e?.stopPropagation();
        if (region.drag) return; // the draft has no comment behind it
        wavesurfer.setTime(region.start);
        onSelect?.(region.id);
      }),
      // plain click on the wave -> arm a point comment (wavesurfer also seeks)
      wavesurfer.on('interaction', (time) => {
        clearDrafts();
        onPick?.({ t: fracOf(time) });
      }),
      // duration is only known once the clip decodes
      wavesurfer.on('decode', (dur) => {
        setDuration(dur);
        onDuration?.(dur);
      }),
    ];

    onReady?.(wavesurfer, regions);

    return () => subs.forEach((unsub) => unsub?.());
  }, [wavesurfer, onPick, onSelect, onReady, onDuration]);

  // Mirror committed region comments onto the wave (point comments are HTML pins)
  useEffect(() => {
    const regions = regionsRef.current;
    // On a version swap the clip's comments change in the same render the old instance is torn down
    if (!wavesurfer || !isReady || !regions || regions.isDestroyed) return;

    const dur = wavesurfer.getDuration() || 1;
    drawingRef.current = true;
    regions.clearRegions();
    comments
      .filter((c) => c.region)
      .forEach((c) => {
        regions.addRegion({
          id: c.id,
          start: c.region[0] * dur,
          end: c.region[1] * dur,
          color: REGION_FILL,
          drag: false,
          resize: false,
        });
      });
    drawingRef.current = false;
  }, [wavesurfer, isReady, comments]);

  // Lift playback state up for the version play pill
  useEffect(() => {
    onPlayingChange?.(isPlaying);
  }, [isPlaying, onPlayingChange]);

  return (
    <div className="wt-wave-wrap">
      {(comments.length > 0 || draft) && (
        <div className="wt-mk-rail">
          {comments.map((c) => {
            const isRegion = Boolean(c.region);
            const left = isRegion ? `calc(${c.region[0] * 100}% + 5px)` : `${c.t * 100}%`;
            return (
              <div
                key={c.id}
                className={'wt-mk' + (isRegion ? ' region' : '') + (c.id === activeId ? ' active' : '')}
                style={{ left }}
                onClick={() => {
                  wavesurfer?.seekTo(isRegion ? c.region[0] : c.t);
                  onSelect?.(c.id);
                }}
              >
                {c.n}
              </div>
            );
          })}

          {/* Pending comment indicator for spot clicked before its comment is saved */}
          {draft && (
            <div
              className={'wt-mk draft' + (draft.region ? ' region' : '')}
              style={{ left: draft.region ? `calc(${draft.region[0] * 100}% + 5px)` : `${draft.t * 100}%` }}
            />
          )}
        </div>
      )}

      <div className="wt-wave" ref={containerRef} />

      <div className="note" style={{ marginTop: 12 }}>
        Click the waveform to seek and drop a comment marker, drag to select a region
      </div>

      <div style={{ height: 14 }} />
      <Transport
        cur={formatTime(currentTime)}
        dur={formatTime(duration)}
        playing={isPlaying}
        onToggle={() => wavesurfer?.playPause()}
      />
    </div>
  );
}
