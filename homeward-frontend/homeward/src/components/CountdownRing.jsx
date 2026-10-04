const R = 92;
const C = 2 * Math.PI * R;

export default function CountdownRing({ progress, phase, main, sub }) {
  const color = phase === 'ontime' ? 'var(--safe)' : phase === 'late' ? 'var(--warn)' : 'var(--alarm)';
  const p = Math.min(1, Math.max(0, progress));

  return (
    <div className="ring ring-v3" role="timer" aria-live="off">
      <svg viewBox="0 0 220 220" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <circle cx="110" cy="110" r={R} className="ring-track" />
        <circle cx="110" cy="110" r={R} className="ring-bar"
          style={{ stroke: color, strokeDasharray: C, strokeDashoffset: C * (1 - p) }}
          transform="rotate(-90 110 110)" />
      </svg>
      <div className="ring-text"><span className="ring-small">{phase === 'ontime' ? 'TIME REMAINING' : phase === 'late' ? 'ALERT IN' : 'STATUS'}</span><strong>{main}</strong><span>{sub}</span></div>
    </div>
  );
}
