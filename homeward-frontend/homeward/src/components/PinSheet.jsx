import { useState } from 'react';

export default function PinSheet({ onSubmit, onCancel, busy, error }) {
  const [pin, setPin] = useState('');
  const press = (d) => setPin((p) => (p.length < 6 ? p + d : p));

  return (
    <div className="backdrop" role="dialog" aria-modal="true" aria-label="Enter your PIN">
      <div className="sheet sheet-v3">
        <div className="sheet-top"><span className="shield-icon">🔐</span><button onClick={onCancel} aria-label="Close">×</button></div>
        <div className="mini-label">SECURE CHECK-IN</div>
        <h2>Confirm you're safe</h2>
        <p className="hint">Enter your check-in PIN. If you didn't set one, leave it empty.</p>
        <div className="dots">{Array.from({ length: 6 }, (_, i) => <span key={i} className={i < pin.length ? 'on' : ''} />)}</div>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="keys">{[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => <button key={d} type="button" onClick={() => press(String(d))}>{d}</button>)}<span /><button type="button" onClick={() => press('0')}>0</button><button type="button" onClick={() => setPin((p) => p.slice(0, -1))}>⌫</button></div>
        <button className="btn-v3 primary-v3" disabled={busy} onClick={() => onSubmit(pin)}>{busy ? 'Checking in…' : 'Confirm safely  →'}</button>
        <button className="btn-v3 secondary-v3" style={{ marginTop: '.6rem' }} onClick={onCancel}>Go back</button>
      </div>
    </div>
  );
}
