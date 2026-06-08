import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import Wordmark from './Wordmark';
import UserMenu from './UserMenu';

export default function AppBar({ crumbs = [], right = null }) {
  return (
    <div className="wt-appbar">
      <Wordmark />
      {crumbs.length > 0 && (
        <span className="wt-crumbs" style={{ marginLeft: 6 }}>
          {crumbs.map((c, i) => {
            const label = typeof c === 'string' ? c : c.label;
            const last = i === crumbs.length - 1;
            const to = typeof c === 'object' ? c.to : null;
            return (
              <Fragment key={i}>
                <span className="sep">/</span>
                {to && !last
                  ? <Link className="link" to={to}>{label}</Link>
                  : <span className={last ? 'here' : ''}>{label}</span>}
              </Fragment>
            );
          })}
        </span>
      )}
      <div className="wt-grow" />
      {right}
      <UserMenu />
    </div>
  );
}
