import Button from '../Button';
import { Avatar, AvatarStack } from '../Avatar';
import initials from '../../utils/initials';

// Buttons are owner-only (rename, delete and members are owner endpoints)
export default function ProjectHeader({ project, role, isOwner, currentUserId, onMembers, onRename, onDelete }) {
  const collaborators = project.members.length - 1;

  // Current user first so their avatar leads the stack (accent)
  const members = [...project.members].sort((a, b) => {
    if (a.userId?._id === currentUserId) return -1;
    if (b.userId?._id === currentUserId) return 1;
    return 0;
  });

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
      <div>
        <h1 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 600, letterSpacing: '-0.4px' }}>{project.name}</h1>
        <span className="mono faint" style={{ fontSize: 12.5 }}>
          {role ? `${role} · ` : ''}you · {collaborators} {collaborators === 1 ? 'collaborator' : 'collaborators'}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <AvatarStack>
          {members.map((m) => (
            <Avatar key={m.userId?._id} size={24} userId={m.userId?._id} title={m.userId?.name}>
              {initials(m.userId?.name)}
            </Avatar>
          ))}
        </AvatarStack>
        {isOwner && (
          <>
            <Button size="sm" onClick={onMembers}>Members</Button>
            <Button size="sm" onClick={onRename}>Rename</Button>
            <Button size="sm" variant="danger" onClick={onDelete}>Delete</Button>
          </>
        )}
      </div>
    </div>
  );
}
