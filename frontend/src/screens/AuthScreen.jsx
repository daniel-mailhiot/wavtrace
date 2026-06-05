import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Card from '../components/Card';
import Wordmark from '../components/Wordmark';
import Label from '../components/Label';
import Input from '../components/Input';
import Button from '../components/Button';

// Login/register card
export default function AuthScreen() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isLogin = mode === 'login';

  // Drop any stale error when switching between login and register
  function switchMode(next) {
    setMode(next);
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (isLogin) {
        await login({ email, password });
      } else {
        await register({ name, email, password });
      }
      navigate('/projects', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="wt-dots"
      style={{ flex: 1, background: 'var(--board-dark)', display: 'grid', placeItems: 'center', padding: 24 }}
    >
      <Card style={{ width: 420, padding: 34 }}>
        <div style={{ marginBottom: 22 }}>
          <Wordmark size={18} />
        </div>

        {/* login/register toggle */}
        <div
          style={{
            display: 'flex',
            background: 'var(--panel-2)',
            border: '1px solid var(--line)',
            borderRadius: 8,
            padding: 4,
            marginBottom: 26,
          }}
        >
          {[
            ['login', 'Log in'],
            ['register', 'Register'],
          ].map(([value, text]) => (
            <button
              key={value}
              type="button"
              onClick={() => switchMode(value)}
              className="mono"
              style={{
                flex: 1,
                height: 34,
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                background: mode === value ? 'var(--accent)' : 'transparent',
                color: mode === value ? 'var(--accent-ink)' : 'var(--ink-dim)',
                transition: '0.15s',
              }}
            >
              {text}
            </button>
          ))}
        </div>

        <h1 style={{ margin: '0 0 22px', fontSize: 24, fontWeight: 600, letterSpacing: '-0.4px' }}>
          {isLogin ? 'Welcome back' : 'Create account'}
        </h1>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {!isLogin && (
            <div>
              <Label>Display name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
            </div>
          )}
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <Label>Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isLogin ? '••••••••' : '8+ characters'}
              required
            />
          </div>

          {error && (
            <p className="mono" style={{ margin: 0, fontSize: 13, color: 'var(--bad)' }}>
              {error}
            </p>
          )}

          <Button variant="primary" size="lg" full type="submit" disabled={submitting}>
            {submitting ? 'Please wait…' : isLogin ? 'Log in' : 'Create account'}
          </Button>

          <div className="wt-divsoft" />

          <div style={{ fontSize: 13, color: 'var(--ink-dim)', textAlign: 'center' }}>
            {isLogin ? 'No account? ' : 'Have one? '}
            <a
              onClick={() => switchMode(isLogin ? 'register' : 'login')}
              style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}
            >
              {isLogin ? 'Register →' : 'Log in →'}
            </a>
          </div>
        </form>
      </Card>
    </div>
  );
}
