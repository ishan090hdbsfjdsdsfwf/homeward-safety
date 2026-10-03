import { useState } from 'react';
import { api } from '../api.js';

export default function Auth({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ name: '', email: '', password: '', cancelPin: '', duressPin: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const registering = mode === 'register';

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (registering && f.cancelPin && f.cancelPin === f.duressPin) {
      setError('Your two PINs must be different.');
      return;
    }
    setBusy(true);
    try {
      const res = registering
        ? await api.register({
            name: f.name, email: f.email, password: f.password,
            cancelPin: f.cancelPin || null, duressPin: f.duressPin || null,
          })
        : await api.login({ email: f.email, password: f.password });
      onAuth(res.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page auth">
      <h1>Homeward</h1>
      <p className="lead">Tell us when you're on your way. If you don't check in, the people you trust get your location.</p>

      <form onSubmit={submit}>
        {registering && (
          <label className="field">Your name
            <input value={f.name} onChange={set('name')} autoComplete="name" required />
          </label>
        )}
        <label className="field">Email
          <input type="email" value={f.email} onChange={set('email')} autoComplete="email" required />
        </label>
        <label className="field">Password
          <input type="password" value={f.password} onChange={set('password')}
                 autoComplete={registering ? 'new-password' : 'current-password'} minLength={registering ? 8 : undefined} required />
          {registering && <small>At least 8 characters.</small>}
        </label>

        {registering && (
          <>
            <label className="field">Check-in PIN (optional)
              <input inputMode="numeric" pattern="\d{4,6}" maxLength={6} value={f.cancelPin} onChange={set('cancelPin')} />
              <small>4–6 digits. You enter it when you tap "I've arrived".</small>
            </label>
            <label className="field">Silent alert PIN (optional)
              <input inputMode="numeric" pattern="\d{4,6}" maxLength={6} value={f.duressPin} onChange={set('duressPin')} />
              <small>Enter this instead if someone is forcing you to check in. It looks the same on screen but secretly alerts your contacts.</small>
            </label>
          </>
        )}

        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn primary big" disabled={busy}>
          {busy ? 'Please wait…' : registering ? 'Create account' : 'Sign in'}
        </button>
      </form>

      <button className="link center" onClick={() => { setMode(registering ? 'login' : 'register'); setError(''); }}>
        {registering ? 'I already have an account' : 'Create an account'}
      </button>
    </main>
  );
}
