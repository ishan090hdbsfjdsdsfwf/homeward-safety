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
    if (registering && f.cancelPin && f.duressPin && f.cancelPin === f.duressPin) {
      setError('Your check-in PIN and silent alert PIN must be different.');
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
    <main className="auth-v3">
      <section className="auth-showcase">
        <div className="showcase-orb orb-a" />
        <div className="showcase-orb orb-b" />

        <NavBrand />

        <div className="showcase-copy">
          <div className="mini-label"><span className="pulse" /> PERSONAL SAFETY COMPANION</div>
          <h1>Get there.<br /><em>Safely.</em></h1>
          <p>Homeward keeps the people you trust connected to your journey — without making safety feel complicated.</p>

          <div className="showcase-grid">
            <div><span>⌖</span><strong>Live location</strong><small>Share while your journey is active.</small></div>
            <div><span>♧</span><strong>Trusted contacts</strong><small>Keep your safety network close.</small></div>
            <div><span>⏱</span><strong>Smart check-in</strong><small>Know when it's time to check in.</small></div>
            <div><span>🔐</span><strong>Silent protection</strong><small>A private PIN for emergencies.</small></div>
          </div>
        </div>

        <div className="showcase-footer">
          <span>Designed for calm journeys</span>
          <span>•</span>
          <span>Your privacy matters</span>
        </div>
      </section>

      <section className="auth-form-side">
        <div className="auth-form-card">
          <div className="mobile-only-brand"><NavBrand /></div>
          <div className="form-kicker">{registering ? 'WELCOME TO HOMEWARD' : 'WELCOME BACK'}</div>
          <h2>{registering ? 'Create your safe space' : 'Ready to head home?'}</h2>
          <p className="form-sub">{registering ? 'A few details and you’re ready to start.' : 'Sign in and keep your next journey protected.'}</p>

          <form onSubmit={submit}>
            {registering && (
              <label className="field-v3">
                <span>Your name</span>
                <div className="input-wrap"><i>◉</i><input value={f.name} onChange={set('name')} autoComplete="name" placeholder="Your name" required /></div>
              </label>
            )}

            <label className="field-v3">
              <span>Email</span>
              <div className="input-wrap"><i>✉</i><input type="email" value={f.email} onChange={set('email')} autoComplete="email" placeholder="you@example.com" required /></div>
            </label>

            <label className="field-v3">
              <span>Password</span>
              <div className="input-wrap"><i>⌾</i><input type="password" value={f.password} onChange={set('password')} autoComplete={registering ? 'new-password' : 'current-password'} minLength={registering ? 8 : undefined} placeholder="Your password" required /></div>
              {registering && <small>At least 8 characters.</small>}
            </label>

            {registering && (
              <div className="pin-fields">
                <label className="field-v3">
                  <span>Check-in PIN <b>Optional</b></span>
                  <div className="input-wrap"><i>✓</i><input inputMode="numeric" pattern="\d{4,6}" maxLength={6} value={f.cancelPin} onChange={set('cancelPin')} placeholder="4–6 digits" /></div>
                  <small>Use this when you've arrived safely.</small>
                </label>
                <label className="field-v3">
                  <span>Silent alert PIN <b>Optional</b></span>
                  <div className="input-wrap"><i>!</i><input inputMode="numeric" pattern="\d{4,6}" maxLength={6} value={f.duressPin} onChange={set('duressPin')} placeholder="Different 4–6 digits" /></div>
                  <small>Looks like a normal check-in but can quietly alert your contacts.</small>
                </label>
              </div>
            )}

            {error && <p className="error" role="alert">{error}</p>}

            <button className="btn-v3 primary-v3 auth-submit" disabled={busy}>
              {busy ? 'Please wait…' : registering ? 'Create my account  →' : 'Continue securely  →'}
            </button>
          </form>

          <div className="switch-auth">
            {registering ? 'Already have an account?' : 'New to Homeward?'}
            <button onClick={() => { setMode(registering ? 'login' : 'register'); setError(''); }}>
              {registering ? 'Sign in' : 'Create an account'}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function NavBrand() {
  return <div className="brand-v3"><span className="brand-symbol">✦</span><strong>Homeward</strong></div>;
}
