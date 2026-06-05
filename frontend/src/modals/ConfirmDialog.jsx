import ModalFrame from '../components/Modal/ModalFrame';
import { ModalFoot } from '../components/Modal/ModalParts';
import Button from '../components/Button';

// Generic confirm dialog for destructive actions (currently project delete)
export default function ConfirmDialog({ title, message, confirmLabel = 'Confirm', busy, onConfirm, onClose }) {
  return (
    <ModalFrame onClose={onClose} width={420}>
      <div style={{ padding: '26px 28px 22px' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 19, fontWeight: 600, letterSpacing: '-0.3px', color: 'var(--ink)' }}>
          {title}
        </h2>
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--ink-dim)', lineHeight: 1.5 }}>{message}</p>
      </div>
      <ModalFoot>
        <Button type="button" onClick={onClose}>Cancel</Button>
        <Button type="button" variant="danger" onClick={onConfirm} disabled={busy}>{confirmLabel}</Button>
      </ModalFoot>
    </ModalFrame>
  );
}
