import { PlayIcon, PauseIcon } from './icons';

// Play/pause button and current/total timecode
export default function Transport({ cur = '0:48', dur = '3:12', playing = false, onToggle }) {
  return (
    <div className="wt-transport">
      <button className="wt-tbtn play" aria-label="Play" onClick={onToggle}>
        {playing ? <PauseIcon /> : <PlayIcon />}
      </button>
      <span className="wt-time" style={{ marginLeft: 6 }}>
        {cur} <small>/ {dur}</small>
      </span>
    </div>
  );
}
