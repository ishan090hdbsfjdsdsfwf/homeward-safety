import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, getJourneyKey } from '../api.js';
import CountdownRing from '../components/CountdownRing.jsx';
import PinSheet from '../components/PinSheet.jsx';
import useJourneyTracking from '../useJourneyTracking.js';

const CHIPS = [15, 30, 45, 60];

const loadJourney = () => {
  try {
    const key = getJourneyKey();

    if (!key) {
      return null;
    }

    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
};

function fmt(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));

  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');

  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${ss}`
    : `${String(m).padStart(2, '0')}:${ss}`;
}

export default function Home() {
  const [journey, setJourney] = useState(loadJourney);
  const [done, setDone] = useState(false);

  const save = (j) => {
    setJourney(j);

    const key = getJourneyKey();

    if (!key) {
      return;
    }

    if (j) {
      localStorage.setItem(key, JSON.stringify(j));
    } else {
      localStorage.removeItem(key);
    }
  };

  if (done) {
    return (
      <main className="page journey-complete-page">
        <div className="complete-icon">✓</div>

        <div className="page-eyebrow">
          JOURNEY COMPLETE
        </div>

        <h1>You're home safe.</h1>

        <p className="lead">
          Your tracking link has stopped updating. Your contacts no longer
          need to follow this journey.
        </p>

        <button
          className="btn primary big"
          onClick={() => setDone(false)}
        >
          Start another journey →
        </button>
      </main>
    );
  }

  return journey ? (
    <Active
      journey={journey}
      onChange={save}
      onEnd={() => {
        save(null);
        setDone(true);
      }}
    />
  ) : (
    <Start onStarted={save} />
  );
}

function Start({ onStarted }) {
  const [dest, setDest] = useState('');
  const [minutes, setMinutes] = useState(30);
  const [grace, setGrace] = useState(10);
  const [contactCount, setContactCount] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .contacts()
      .then((c) => setContactCount(c.length))
      .catch(() => { });
  }, []);

  async function start(e) {
    e.preventDefault();

    setBusy(true);
    setError('');

    try {
      if (
        'Notification' in window &&
        Notification.permission === 'default'
      ) {
        Notification.requestPermission();
      }

      const j = await api.startJourney({
        destination: dest.trim() || null,
        etaMinutes: Number(minutes),
        graceMinutes: Number(grace),
      });

      onStarted({
        id: j.id,
        destination: j.destination,
        eta: j.eta,
        trackingUrl: j.trackingUrl,
        startedAt: Date.now(),
        graceMinutes: Number(grace),
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page home-page">
      <div className="page-eyebrow">
        YOUR JOURNEY
      </div>

      <h1>Where are you headed?</h1>

      <p className="lead">
        Tell Homeward where you're going and we'll keep an eye on your
        journey.
      </p>

      <form className="journey-form" onSubmit={start}>
        <div className="form-section">
          <label className="field">
            Destination

            <input
              value={dest}
              onChange={(e) => setDest(e.target.value)}
              placeholder="Home, hostel, office…"
            />
          </label>
        </div>

        <div className="form-section">
          <div className="section-label">
            I'll arrive in
          </div>

          <div className="chips">
            {CHIPS.map((m) => (
              <button
                type="button"
                key={m}
                className={
                  Number(minutes) === m
                    ? 'chip chip-selected'
                    : 'chip'
                }
                onClick={() => setMinutes(m)}
              >
                {m} min
              </button>
            ))}
          </div>

          <label className="custom-time">
            <span>or choose</span>

            <input
              type="number"
              min="1"
              max="720"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
            />

            <span>minutes</span>
          </label>
        </div>

        <div className="form-section">
          <label className="field">
            If I'm late, alert my contacts after

            <select
              value={grace}
              onChange={(e) => setGrace(e.target.value)}
            >
              <option value="5">5 minutes</option>
              <option value="10">10 minutes</option>
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
            </select>
          </label>
        </div>

        {contactCount === 0 && (
          <div className="notice">
            You need a trusted contact first.{' '}
            <Link to="/contacts">
              Add one
            </Link>
          </div>
        )}

        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="btn primary big"
          disabled={busy || contactCount === 0}
        >
          {busy
            ? 'Starting…'
            : 'Start journey →'}
        </button>
      </form>
    </main>
  );
}

function Active({ journey, onChange, onEnd }) {
  const [now, setNow] = useState(Date.now());
  const [pinOpen, setPinOpen] = useState(false);
  const [pinError, setPinError] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const tracking = useJourneyTracking(journey.id);

  useEffect(() => {
    const t = setInterval(
      () => setNow(Date.now()),
      1000
    );

    return () => clearInterval(t);
  }, []);

  const eta = Date.parse(journey.eta);
  const graceMs = journey.graceMinutes * 60000;
  const remaining = eta - now;
  const total = Math.max(
    eta - journey.startedAt,
    1
  );

  const phase =
    remaining > 0
      ? 'ontime'
      : -remaining < graceMs
        ? 'late'
        : 'alerted';

  const prevPhase = useRef(phase);

  useEffect(() => {
    if (
      prevPhase.current === 'ontime' &&
      phase === 'late'
    ) {
      navigator.vibrate?.([
        300,
        150,
        300,
      ]);

      if (
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        new Notification(
          'Time to check in',
          {
            body: `Your contacts will be alerted in ${journey.graceMinutes} minutes.`,
          }
        );
      }
    }

    prevPhase.current = phase;
  }, [phase, journey.graceMinutes]);

  const ring = {
    ontime: {
      progress: remaining / total,
      main: fmt(remaining),
      sub: 'until you arrive',
    },

    late: {
      progress: 1 - -remaining / graceMs,
      main: fmt(graceMs + remaining),
      sub: 'until your contacts are alerted',
    },

    alerted: {
      progress: 1,
      main: 'Alerted',
      sub: 'Your contacts have been notified',
    },
  }[phase];

  async function submitPin(pin) {
    setBusy(true);
    setPinError('');

    try {
      await api.arrive(
        journey.id,
        pin || null
      );

      onEnd();
    } catch (err) {
      if (err.status === 403) {
        setPinError(
          'Incorrect PIN. Try again.'
        );
      } else if (
        err.status === 404 ||
        err.status === 409
      ) {
        onEnd();
      } else {
        setPinError(err.message);
      }
    } finally {
      setBusy(false);
    }
  }

  async function addTime() {
    setMsg('');

    try {
      const j = await api.extend(
        journey.id,
        15
      );

      onChange({
        ...journey,
        eta: j.eta,
      });
    } catch (err) {
      setMsg(
        err.status === 409
          ? 'Too late to extend. Tap "I’ve arrived" when you’re safe.'
          : err.message
      );
    }
  }

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Follow my journey',
          url: journey.trackingUrl,
        });
      } else {
        await navigator.clipboard.writeText(
          journey.trackingUrl
        );

        setMsg(
          'Tracking link copied.'
        );
      }
    } catch {
      // User cancelled share.
    }
  }

  const trackingText = {
    sharing:
      'Sharing your location every 20 seconds. Keep this screen open.',

    waiting:
      'Finding your location…',

    denied:
      'Location is blocked. Your contacts will still be alerted if you miss check-in, but they won’t see where you are.',

    unsupported:
      'This device can’t share location. Your contacts will still be alerted if you miss check-in.',
  }[tracking];

  return (
    <main className="page journey-page">
      <div
        className={`journey-status journey-status-${phase}`}
      >
        <span className="status-dot" />

        {phase === 'ontime'
          ? 'JOURNEY ACTIVE'
          : phase === 'late'
            ? 'CHECK-IN NEEDED'
            : 'CONTACTS ALERTED'}
      </div>

      <div className="journey-heading">
        <div className="page-eyebrow">
          CURRENT JOURNEY
        </div>

        <h1>
          On your way to{' '}
          <em>
            {journey.destination ||
              'your destination'}
          </em>
        </h1>

        <p>
          {phase === 'ontime'
            ? 'Everything looks good. Keep travelling safely.'
            : phase === 'late'
              ? 'Your arrival time has passed. Please check in.'
              : 'Your trusted contacts have been notified.'}
        </p>
      </div>

      <section className="journey-card">
        <CountdownRing
          phase={phase}
          {...ring}
        />

        <div className="journey-actions">
          <button
            className="btn primary big"
            onClick={() => {
              setPinError('');
              setPinOpen(true);
            }}
          >
            ✓ I've arrived safely
          </button>

          <div className="journey-secondary">
            {phase === 'ontime' && (
              <button
                className="btn ghost"
                onClick={addTime}
              >
                +15 minutes
              </button>
            )}

            <button
              className="btn ghost"
              onClick={share}
            >
              ↗ Share journey
            </button>
          </div>
        </div>

        {msg && (
          <div
            className="journey-message"
            role="status"
          >
            {msg}
          </div>
        )}

        <div
          className={
            tracking === 'denied'
              ? 'tracking-status tracking-warning'
              : 'tracking-status'
          }
        >
          <span className="tracking-icon">
            {tracking === 'sharing'
              ? '●'
              : '○'}
          </span>

          <div>
            <strong>
              {tracking === 'sharing'
                ? 'Live location sharing'
                : 'Location status'}
            </strong>

            <span>
              {trackingText}
            </span>
          </div>
        </div>
      </section>

      {pinOpen && (
        <PinSheet
          busy={busy}
          error={pinError}
          onSubmit={submitPin}
          onCancel={() =>
            setPinOpen(false)
          }
        />
      )}
    </main>
  );
}