import ModalFrame from '../components/Modal/ModalFrame';
import { ModalFoot } from '../components/Modal/ModalParts';
import Button from '../components/Button';

export default function AboutModal({ onClose }) {
  return (
    <ModalFrame onClose={onClose} width={420}>
      <div style={{ padding: '26px 28px 22px' }}>
        <h2 style={{ margin: 0, fontSize: 19, fontWeight: 600, letterSpacing: '-0.3px', color: 'var(--ink)' }}>About</h2>
        <p style={{ margin: '14px 0 0', fontSize: 13.5, color: 'var(--ink-dim)', lineHeight: 1.6 }}>
          wavTrace is an audio review and revision tracking tool. Upload a track, view comments, and follow how a project changes across versions.
        </p>
      </div>
      <ModalFoot>
        <Button type="button" onClick={onClose}>Close</Button>
      </ModalFoot>
    </ModalFrame>
  );
}
