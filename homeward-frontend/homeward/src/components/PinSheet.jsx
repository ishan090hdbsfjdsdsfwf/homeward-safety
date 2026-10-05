import { useState } from 'react';

export default function PinSheet({
  onSubmit,
  onCancel,
  busy,
  error,
}) {
  const [pin, setPin] = useState('');

  const press = (digit) => {
    setPin((current) =>
      current.length < 6 ? current + digit : current
    );
  };

  const remove = () => {
    setPin((current) => current.slice(0, -1));
  };

  return (
    <div
      className="pin-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Check in safely"
    >
      <div className="pin-sheet">
        <button
          type="button"
          className="pin-close"
          onClick={onCancel}
          aria-label="Close"
        >
          ×
        </button>

        <div className="pin-icon">
          ✓
        </div>

        <div className="pin-eyebrow">
          CHECK IN
        </div>

        <h2>You're safe?</h2>

        <p className="pin-description">
          Enter your check-in PIN to let your contacts know
          you've arrived safely.
        </p>

        <div
          className="pin-dots"
          aria-label={`${pin.length} digits entered`}
        >
          {Array.from({ length: 6 }, (_, i) => (
            <span
              key={i}
              className={i < pin.length ? 'filled' : ''}
            />
          ))}
        </div>

        {error && (
          <div className="pin-error" role="alert">
            {error}
          </div>
        )}

        <div className="pin-keypad">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => press(String(digit))}
            >
              {digit}
            </button>
          ))}

          <span />

          <button
            type="button"
            onClick={() => press('0')}
          >
            0
          </button>

          <button
            type="button"
            className="delete-key"
            aria-label="Delete last digit"
            onClick={remove}
          >
            ⌫
          </button>
        </div>

        <button
          type="button"
          className="pin-confirm"
          disabled={busy}
          onClick={() => onSubmit(pin)}
        >
          {busy ? 'Checking in…' : "I've arrived safely"}
          {!busy && <span>→</span>}
        </button>

        <button
          type="button"
          className="pin-cancel"
          onClick={onCancel}
        >
          Cancel
        </button>

        <p className="pin-footer">
          Don't have a PIN? You can still continue.
        </p>
      </div>
    </div>
  );
}