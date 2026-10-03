import { useState } from 'react';

export default function PinSheet({ onSubmit, onCancel, busy, error }) {
  const [pin, setPin] = useState('');
  const press = (d) => setPin((p) => (p.length < 6 ? p + d : p));

  return (
    <div className="backdrop" role="dialog" aria-modal="true" aria-label="Enter your PIN">
      <div className="sheet">
        <h2>Enter your PIN</h2>
        <p className="hint">Leave it empty if you didn't set one.</p>
        <div className="dots" aria-label={`${pin.length} digits entered`}>
          {Array.from({ length: 6 }, (_, i) => <span key={i} className={i < pin.length ? 'on' : ''} />)}
        </div>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="keys">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
            <button key={d} type="button" onClick={() => press(String(d))}>{d}</button>
          ))}
          <span />
          <button type="button" onClick={() => press('0')}>0</button>
          <button type="button" aria-label="Delete last digit" onClick={() => setPin((p) => p.slice(0, -1))}>⌫</button>
        </div>
        <button className="btn primary big" disabled={busy} onClick={() => onSubmit(pin)}>
          {busy ? 'Checking in…' : "Confirm I've arrived"}
        </button>
        <button className="btn ghost" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
