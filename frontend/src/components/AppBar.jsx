import { Fragment } from 'react';
import Wordmark from './Wordmark';
import { Avatar } from './Avatar';

// Top bar: wordmark, slash-joined breadcrumbs, an optional right slot, and current user's avatar far right
// The last crumb is the current location
export default function AppBar({ crumbs = [], right = null, user = 'DM' }) {
  return (
    <div className="wt-appbar">
      <Wordmark />
      {crumbs.length > 0 && (
        <span className="wt-crumbs" style={{ marginLeft: 6 }}>
          {crumbs.map((c, i) => (
            <Fragment key={i}>
              <span className="sep">/</span>
              <span className={i === crumbs.length - 1 ? 'here' : ''}>{c}</span>
            </Fragment>
          ))}
        </span>
      )}
      <div className="wt-grow" />
      {right}
      <Avatar size={24} accent title="you">{user}</Avatar>
    </div>
  );
}
