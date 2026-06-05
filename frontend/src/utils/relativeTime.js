// 'time ago' label for activity timestamps
const units = [
  ['y', 31536000],
  ['mo', 2592000],
  ['w', 604800],
  ['d', 86400],
  ['h', 3600],
  ['m', 60],
];

export default function relativeTime(date) {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';

  for (const [label, secs] of units) {
    const value = Math.floor(seconds / secs);
    if (value >= 1) return `${value}${label}`;
  }
  return 'just now';
}
