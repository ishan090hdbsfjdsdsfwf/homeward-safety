import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import CountdownRing from '../components/CountdownRing.jsx';
import PinSheet from '../components/PinSheet.jsx';
import useJourneyTracking from '../useJourneyTracking.js';

const KEY = 'hw_journey';
const CHIPS = [15, 30, 45, 60];
const loadJourney = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };

function fmt(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${String(m).padStart(2, '0')}:${ss}`;
}

export default function Home() {
  const [journey, setJourney] = useState(loadJourney);
  const [done, setDone] = useState(false);

  const save = (j) => {
    setJourney(j);
    if (j) localStorage.setItem(KEY, JSON.stringify(j)); else localStorage.removeItem(KEY);
  };

  if (done) {
    return (
      <main className="page center-page">
        <h1>You're checked in</h1>
        <p className="lead">Your contacts' tracking link has stopped updating. Glad you made it.</p>
        <button className="btn primary big" onClick={() => setDone(false)}>Start another journey</button>
      </main>
    );
  }
  return journey
    ? <Active journey={journey} onChange={save} onEnd={() => { save(null); setDone(true); }} />
    : <Start onStarted={save} />;
}

function Start({ onStarted }) {
  const [dest, setDest] = useState('');
  const [minutes, setMinutes] = useState(30);
  const [grace, setGrace] = useState(10);
  const [contactCount, setContactCount] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { api.contacts().then((c) => setContactCount(c.length)).catch(() => {}); }, []);

  async function start(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
      const j = await api.startJourney({
        destination: dest.trim() || null,
        etaMinutes: Number(minutes),
        graceMinutes: Number(grace),
      });
      onStarted({ id: j.id, destination: j.destination, eta: j.eta, trackingUrl: j.trackingUrl, startedAt: Date.now(), graceMinutes: Number(grace) });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page">
      <h1>Where are you headed?</h1>
      <form onSubmit={start}>
        <label className="field">Destination
          <input value={dest} onChange={(e) => setDest(e.target.value)} placeholder="Home, hostel, office…" />
        </label>

        <fieldset className="field">
          <legend>I'll arrive in</legend>
          <div className="chips">
            {CHIPS.map((m) => (
              <button type="button" key={m} className={Number(minutes) === m ? 'chip on' : 'chip'} onClick={() => setMinutes(m)}>
                {m} min
              </button>
            ))}
          </div>
          <label className="inline">or
            <input type="number" min="1" max="720" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
            minutes
          </label>
        </fieldset>

        <label className="field">If I'm late, alert my contacts after
          <select value={grace} onChange={(e) => setGrace(e.target.value)}>
            <option value="5">5 minutes</option>
            <option value="10">10 minutes</option>
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
          </select>
        </label>

        {contactCount === 0 && (
          <p className="notice">You need a trusted contact first. <Link to="/contacts">Add one</Link></p>
        )}
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn primary big" disabled={busy || contactCount === 0}>
          {busy ? 'Starting…' : 'Start journey'}
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
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const eta = Date.parse(journey.eta);
  const graceMs = journey.graceMinutes * 60000;
  const remaining = eta - now;
  const total = Math.max(eta - journey.startedAt, 1);
  const phase = remaining > 0 ? 'ontime' : -remaining < graceMs ? 'late' : 'alerted';

  // Local nudge the moment the ETA passes, before contacts are alerted.
  const prevPhase = useRef(phase);
  useEffect(() => {
    if (prevPhase.current === 'ontime' && phase === 'late') {
      navigator.vibrate?.([300, 150, 300]);
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Time to check in', { body: `Your contacts will be alerted in ${journey.graceMinutes} minutes.` });
      }
    }
    prevPhase.current = phase;
  }, [phase, journey.graceMinutes]);

  const ring = {
    ontime: { progress: remaining / total, main: fmt(remaining), sub: 'until you arrive' },
    late: { progress: 1 - -remaining / graceMs, main: fmt(graceMs + remaining), sub: 'until your contacts are alerted' },
    alerted: { progress: 1, main: 'Alerted', sub: 'Your contacts have been notified' },
  }[phase];

  async function submitPin(pin) {
    setBusy(true);
    setPinError('');
    try {
      await api.arrive(journey.id, pin || null);
      onEnd();
    } catch (err) {
      if (err.status === 403) setPinError('Incorrect PIN. Try again.');
      else if (err.status === 404 || err.status === 409) onEnd();
      else setPinError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function addTime() {
    setMsg('');
    try {
      const j = await api.extend(journey.id, 15);
      onChange({ ...journey, eta: j.eta });
    } catch (err) {
      setMsg(err.status === 409 ? "Too late to extend. Tap \"I've arrived\" when you're safe." : err.message);
    }
  }

  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: 'Follow my journey', url: journey.trackingUrl });
      else { await navigator.clipboard.writeText(journey.trackingUrl); setMsg('Tracking link copied.'); }
    } catch { /* share dismissed */ }
  }

  const trackingText = {
    sharing: 'Sharing your location every 20 seconds. Keep this screen open.',
    waiting: 'Finding your location…',
    denied: 'Location is blocked. Your contacts will still be alerted if you miss check-in, but they won\'t see where you are.',
    unsupported: 'This device can\'t share location. Your contacts will still be alerted if you miss check-in.',
  }[tracking];

  return (
    <main className="page active">
      <p className="dest">On your way to <strong>{journey.destination}</strong></p>
      <CountdownRing phase={phase} {...ring} />

      <button className="btn primary big" onClick={() => { setPinError(''); setPinOpen(true); }}>I've arrived</button>
      <div className="row">
        {phase === 'ontime' && <button className="btn ghost" onClick={addTime}>Add 15 minutes</button>}
        <button className="btn ghost" onClick={share}>Share tracking link</button>
      </div>

      {msg && <p className="hint" role="status">{msg}</p>}
      <p className={tracking === 'denied' ? 'notice' : 'hint'}>{trackingText}</p>

      {pinOpen && <PinSheet busy={busy} error={pinError} onSubmit={submitPin} onCancel={() => setPinOpen(false)} />}
    </main>
  );
}
