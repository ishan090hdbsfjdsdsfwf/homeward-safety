import { useEffect, useState } from 'react';
import { api } from '../api.js';

const MAX = 5;

export default function Contacts() {
  const [list, setList] = useState(null);
  const [f, setF] = useState({ name: '', email: '', telegramChatId: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const load = () => api.contacts().then(setList).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  async function add(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api.addContact({ name: f.name, email: f.email || null, telegramChatId: f.telegramChatId || null });
      setF({ name: '', email: '', telegramChatId: '' });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(c) {
    if (!window.confirm(`Remove ${c.name} from your trusted contacts?`)) return;
    try { await api.deleteContact(c.id); await load(); } catch (err) { setError(err.message); }
  }

  return (
    <main className="page">
      <h1>Trusted contacts</h1>
      <p className="lead">These people get your live location if you miss a check-in. Pick people who will pick up the phone.</p>

      {list && list.length === 0 && <p className="empty">No one added yet. Add at least one contact before you start a journey.</p>}
      <ul className="rows">
        {list?.map((c) => (
          <li key={c.id}>
            <div>
              <strong>{c.name}</strong>
              <span>{[c.email, c.telegramChatId && 'Telegram'].filter(Boolean).join(', ')}</span>
            </div>
            <button className="link danger-text" onClick={() => remove(c)} aria-label={`Remove ${c.name}`}>Remove</button>
          </li>
        ))}
      </ul>

      {(list?.length ?? 0) < MAX ? (
        <form onSubmit={add}>
          <h2>Add a contact</h2>
          <label className="field">Name
            <input value={f.name} onChange={set('name')} required />
          </label>
          <label className="field">Email
            <input type="email" value={f.email} onChange={set('email')} />
          </label>
          <label className="field">Telegram chat ID
            <input value={f.telegramChatId} onChange={set('telegramChatId')} inputMode="numeric" />
            <small>Free instant alerts. They message your Homeward bot once, then you paste their chat ID here. Email or Telegram is required.</small>
          </label>
          {error && <p className="error" role="alert">{error}</p>}
          <button className="btn primary big" disabled={busy}>{busy ? 'Adding…' : 'Add contact'}</button>
        </form>
      ) : (
        <p className="hint">You've added the maximum of {MAX} contacts. Remove one to add someone new.</p>
      )}
    </main>
  );
}
