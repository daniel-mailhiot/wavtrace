import Pill from './Pill';

// Role tag: owner -> accent, reviewer -> blue, viewer -> plain
const roleTone = { owner: 'accent', reviewer: 'rev' };

export default function Role({ role }) {
  return <Pill tone={roleTone[role]}>{role}</Pill>;
}
