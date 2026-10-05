import { useEffect, useState } from 'react';
import { api } from '../api.js';

const MAX = 5;

export default function Contacts() {
  const [list, setList] = useState(null);
  const [f, setF] = useState({
    name: '',
    email: '',
    telegramChatId: '',
  });

  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => {
    setF((old) => ({
      ...old,
      [key]: e.target.value,
    }));
  };

  async function load() {
    try {
      setError('');
      const contacts = await api.contacts();
      setList(contacts);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function add(e) {
    e.preventDefault();

    setError('');
    setBusy(true);

    try {
      await api.addContact({
        name: f.name.trim(),
        email: f.email.trim() || null,
        telegramChatId: f.telegramChatId.trim() || null,
      });

      setF({
        name: '',
        email: '',
        telegramChatId: '',
      });

      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(contact) {
    if (
      !window.confirm(
        `Remove ${contact.name} from your trusted contacts?`
      )
    ) {
      return;
    }

    try {
      setError('');
      await api.deleteContact(contact.id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="page contacts-page">
      <div className="page-eyebrow">YOUR SAFETY NETWORK</div>

      <h1>Trusted contacts</h1>

      <p className="lead">
        These are the people Homeward can contact if you miss a
        check-in. Choose people who will answer when you need them.
      </p>

      <section className="contacts-summary">
        <div className="contacts-summary-icon">♡</div>

        <div>
          <strong>
            {list === null
              ? 'Loading contacts…'
              : `${list.length} of ${MAX} contacts added`}
          </strong>

          <span>
            {list?.length
              ? 'Your safety network is ready for your next journey.'
              : 'Add someone you trust before starting a journey.'}
          </span>
        </div>
      </section>

      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}

      {list?.length === 0 && (
        <div className="contacts-empty">
          <div className="contacts-empty-icon">♡</div>

          <strong>No trusted contacts yet</strong>

          <span>
            Add at least one person so someone can be notified if
            you don't check in.
          </span>
        </div>
      )}

      {list && list.length > 0 && (
        <section className="contacts-list">
          <div className="contacts-list-heading">
            <span>YOUR CONTACTS</span>
            <span>{list.length}/{MAX}</span>
          </div>

          {list.map((contact) => (
            <div className="contact-card" key={contact.id}>
              <div className="contact-avatar">
                {contact.name?.charAt(0)?.toUpperCase() || '?'}
              </div>

              <div className="contact-info">
                <strong>{contact.name}</strong>

                {contact.email && (
                  <span>{contact.email}</span>
                )}

                {contact.telegramChatId && (
                  <span className="contact-channel">
                    <i /> Telegram alerts enabled
                  </span>
                )}
              </div>

              <button
                type="button"
                className="contact-remove"
                onClick={() => remove(contact)}
                aria-label={`Remove ${contact.name}`}
              >
                Remove
              </button>
            </div>
          ))}
        </section>
      )}

      {list && list.length < MAX && (
        <section className="contact-form-card">
          <div className="contact-form-heading">
            <div>
              <div className="page-eyebrow">ADD SOMEONE</div>

              <h2>Add a trusted contact</h2>

              <p>
                We'll use these details only when your journey needs
                attention.
              </p>
            </div>

            <div className="contact-form-number">
              {list.length + 1}
            </div>
          </div>

          <form onSubmit={add}>
            <label className="field">
              Name

              <input
                value={f.name}
                onChange={set('name')}
                placeholder="e.g. Mom, Dad, Friend"
                required
              />
            </label>

            <label className="field">
              Email address
              <span className="optional-label">Optional</span>

              <input
                type="email"
                value={f.email}
                onChange={set('email')}
                placeholder="name@example.com"
              />
            </label>

            <label className="field">
              Telegram chat ID
              <span className="optional-label">Optional</span>

              <input
                value={f.telegramChatId}
                onChange={set('telegramChatId')}
                inputMode="numeric"
                placeholder="e.g. 123456789"
              />

              <small>
                Telegram provides instant alerts. The person must
                message your Homeward bot once before you add their
                chat ID.
              </small>
            </label>

            <div className="contact-form-note">
              <span>✓</span>
              <p>
                Add either an email address or Telegram chat ID so
                Homeward has a way to reach them.
              </p>
            </div>

            <button
              type="submit"
              className="btn primary big"
              disabled={
                busy ||
                (!f.email.trim() && !f.telegramChatId.trim())
              }
            >
              {busy ? 'Adding contact…' : 'Add trusted contact →'}
            </button>
          </form>
        </section>
      )}

      {list && list.length >= MAX && (
        <div className="contacts-limit">
          <strong>Your safety network is full.</strong>
          <span>
            You can have up to {MAX} trusted contacts. Remove one
            if you want to add someone new.
          </span>
        </div>
      )}
    </main>
  );
}