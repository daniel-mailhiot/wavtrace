import Card from '../components/Card';
import Wordmark from '../components/Wordmark';

// Placeholder shell for the auth screen
export default function AuthScreen() {
  return (
    <div
      className="wt-dots"
      style={{ flex: 1, background: 'var(--board-dark)', display: 'grid', placeItems: 'center', padding: 24 }}
    >
      <Card style={{ width: 420, padding: 34, textAlign: 'center' }}>
        <Wordmark size={18} />
        <p className="dim" style={{ marginTop: 16 }}>
          Login and register coming soon
        </p>
      </Card>
    </div>
  );
}
