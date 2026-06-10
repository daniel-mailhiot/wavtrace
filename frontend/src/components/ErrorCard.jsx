import { useNavigate } from 'react-router-dom';
import Button from './Button';

// Fallback when a project fetch fails
// 403 = signed in but not a member, 404 = deleted or a bad link
const COPY = {
  403: { title: "You don't have access to this project", detail: 'Ask the project owner to add you as a member' },
  404: { title: 'Project not found', detail: 'It may have been deleted, or the link is wrong' },
};

export default function ErrorCard({ status }) {
  const navigate = useNavigate();
  const { title, detail } = COPY[status] ?? { title: 'Something went wrong', detail: 'Try refreshing the page' };

  return (
    <div className="wt-card-2" style={{ maxWidth: 460, margin: '64px auto', padding: '38px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 15, fontWeight: 600 }}>{title}</div>
      <div className="mono faint" style={{ fontSize: 12, marginTop: 8 }}>{detail}</div>
      <div style={{ marginTop: 20 }}>
        <Button onClick={() => navigate('/projects')}>Back to projects</Button>
      </div>
    </div>
  );
}
