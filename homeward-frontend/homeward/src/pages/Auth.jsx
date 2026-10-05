import { useState } from 'react';
import { api, setUserKey } from '../api.js';

export default function Auth({ onAuth }) {
  const [mode, setMode] = useState('login');

  const [f, setF] = useState({
    name: '',
    email: '',
    password: '',
    cancelPin: '',
    duressPin: '',
  });

  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const registering = mode === 'register';

  function setField(key) {
    return (e) => {
      setF((old) => ({
        ...old,
        [key]: e.target.value,
      }));
    };
  }

  async function submit(e) {
    e.preventDefault();
    setError('');

    if (
      registering &&
      f.cancelPin &&
      f.duressPin &&
      f.cancelPin === f.duressPin
    ) {
      setError(
        'Your check-in PIN and silent alert PIN must be different.'
      );
      return;
    }

    setBusy(true);

    try {
      const email = f.email.trim().toLowerCase();

      const result = registering
        ? await api.register({
          name: f.name.trim(),
          email,
          password: f.password,
          cancelPin: f.cancelPin || null,
          duressPin: f.duressPin || null,
        })
        : await api.login({
          email,
          password: f.password,
        });

      /*
       * Save the current account identifier.
       *
       * This lets Homeward keep each user's journey
       * separate on the same browser/device.
       */
      setUserKey(email);

      onAuth(result.token);
    } catch (err) {
      setError(
        err.message ||
        'Something went wrong. Please try again.'
      );
    } finally {
      setBusy(false);
    }
  }

  function switchMode() {
    setMode(registering ? 'login' : 'register');
    setError('');
  }

  return (
    <main className="auth-screen">
      <section className="auth-brand">
        <div className="brand-mark">H</div>

        <div>
          <div className="brand-name">Homeward</div>

          <div className="brand-tagline">
            Personal safety companion
          </div>
        </div>
      </section>

      <section className="auth-layout">
        <div className="auth-intro">
          <div className="eyebrow">
            {registering ? 'GET STARTED' : 'WELCOME BACK'}
          </div>

          <h1>
            {registering ? (
              <>
                Make your journey
                <br />
                <em>safer.</em>
              </>
            ) : (
              <>
                Get there.
                <br />
                <em>Safely.</em>
              </>
            )}
          </h1>

          <p>
            Homeward keeps the people you trust connected to your
            journey without making safety feel complicated.
          </p>

          <div className="auth-features">
            <div className="feature">
              <span className="feature-icon">⌖</span>

              <div>
                <strong>Live location</strong>

                <span>
                  Share your location while your journey is active.
                </span>
              </div>
            </div>

            <div className="feature">
              <span className="feature-icon">♡</span>

              <div>
                <strong>Trusted contacts</strong>

                <span>
                  Keep your safety network close.
                </span>
              </div>
            </div>

            <div className="feature">
              <span className="feature-icon">✓</span>

              <div>
                <strong>Smart check-in</strong>

                <span>
                  Know when it is time to check in.
                </span>
              </div>
            </div>

            <div className="feature">
              <span className="feature-icon">!</span>

              <div>
                <strong>Silent protection</strong>

                <span>
                  A private PIN for emergencies.
                </span>
              </div>
            </div>
          </div>

          <div className="auth-note">
            <span>Private by design.</span>
            <span>Your journey belongs to you.</span>
          </div>
        </div>

        <div className="auth-card">
          <div className="card-top">
            <div className="card-kicker">
              {registering
                ? 'CREATE ACCOUNT'
                : 'SIGN IN'}
            </div>

            <h2>
              {registering
                ? 'Create your Homeward account'
                : 'Ready to head home?'}
            </h2>

            <p>
              {registering
                ? 'Set up your safety profile in less than a minute.'
                : 'Sign in and keep your next journey protected.'}
            </p>
          </div>

          <form onSubmit={submit}>
            {registering && (
              <label className="form-field">
                <span>Your name</span>

                <input
                  value={f.name}
                  onChange={setField('name')}
                  autoComplete="name"
                  placeholder="Your name"
                  required
                />
              </label>
            )}

            <label className="form-field">
              <span>Email address</span>

              <input
                type="email"
                value={f.email}
                onChange={setField('email')}
                autoComplete="email"
                placeholder="you@example.com"
                required
              />
            </label>

            <label className="form-field">
              <span>Password</span>

              <input
                type="password"
                value={f.password}
                onChange={setField('password')}
                autoComplete={
                  registering
                    ? 'new-password'
                    : 'current-password'
                }
                placeholder="Enter your password"
                minLength={
                  registering ? 8 : undefined
                }
                required
              />

              {registering && (
                <small>
                  Use at least 8 characters.
                </small>
              )}
            </label>

            {registering && (
              <div className="pin-section">
                <div className="pin-heading">
                  <strong>Safety PINs</strong>
                  <span>Optional</span>
                </div>

                <label className="form-field">
                  <span>Check-in PIN</span>

                  <input
                    inputMode="numeric"
                    pattern="\d{4,6}"
                    maxLength={6}
                    value={f.cancelPin}
                    onChange={setField('cancelPin')}
                    placeholder="4–6 digits"
                  />

                  <small>
                    Used when you safely arrive at your
                    destination.
                  </small>
                </label>

                <label className="form-field">
                  <span>Silent alert PIN</span>

                  <input
                    inputMode="numeric"
                    pattern="\d{4,6}"
                    maxLength={6}
                    value={f.duressPin}
                    onChange={setField('duressPin')}
                    placeholder="4–6 digits"
                  />

                  <small>
                    A different PIN that quietly alerts your
                    trusted contacts.
                  </small>
                </label>
              </div>
            )}

            {error && (
              <div
                className="auth-error"
                role="alert"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              className="auth-submit"
              disabled={busy}
            >
              {busy
                ? 'Please wait…'
                : registering
                  ? 'Create account'
                  : 'Continue securely'}

              {!busy && <span>→</span>}
            </button>
          </form>

          <div className="auth-switch">
            <span>
              {registering
                ? 'Already have a Homeward account?'
                : 'New to Homeward?'}
            </span>

            <button
              type="button"
              onClick={switchMode}
            >
              {registering
                ? 'Sign in'
                : 'Create an account'}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}