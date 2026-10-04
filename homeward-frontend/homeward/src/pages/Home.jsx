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
  const save = (j) => { setJourney(j); if (j) localStorage.setItem(KEY, JSON.stringify(j)); else localStorage.removeItem(KEY); };

  if (done) return (
    <main className="success-page">
      <div className="success-card">
        <div className="success-icon">✓</div>
        <div className="mini-label">JOURNEY COMPLETE</div>
        <h1>You're home safe.</h1>
        <p>Your tracking link has stopped updating. Your contacts no longer need to follow this journey.</p>
        <button className="btn-v3 primary-v3" onClick={() => setDone(false)}>Start another journey  →</button>
      </div>
    </main>
  );

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

  useEffect(() => { api.contacts().then((c) => setContactCount(c.length)).catch(() => { }); }, []);

  async function start(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
      const j = await api.startJourney({ destination: dest.trim() || null, etaMinutes: Number(minutes), graceMinutes: Number(grace) });
      onStarted({ id: j.id, destination: j.destination, eta: j.eta, trackingUrl: j.trackingUrl, startedAt: Date.now(), graceMinutes: Number(grace) });
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return (
    <main className="dashboard-v3">
      <section className="dashboard-hero">
        <div className="hero-copy-v3">
          <div className="mini-label"><span className="pulse" /> HOMEWARD SAFETY</div>
          <h1>Your journey.<br /><span>Your safety.</span></h1>
          <p>Tell Homeward where you're going. We'll help keep your trusted people connected to you while you're on the move.</p>

          <div className="hero-trust">
            <div><span>✓</span><strong>Private by design</strong></div>
            <div><span>✓</span><strong>Live journey support</strong></div>
            <div><span>✓</span><strong>Trusted-contact alerts</strong></div>
          </div>
        </div>

        <div className="journey-card-v3">
          <div className="card-head-v3">
            <div>
              <span className="card-eyebrow">START A JOURNEY</span>
              <h2>Where are you headed?</h2>
              <p>Set your destination and expected arrival.</p>
            </div>
            <div className="shield-icon">✦</div>
          </div>

          <form onSubmit={start}>
            <label className="field-v3">
              <span>Destination</span>
              <div className="input-wrap large"><i>⌖</i><input value={dest} onChange={(e) => setDest(e.target.value)} placeholder="Home, office, hostel…" /></div>
            </label>

            <fieldset className="field-v3">
              <span>I'll arrive in</span>
              <div className="time-grid-v3">
                {CHIPS.map((m) => <button type="button" key={m} className={Number(minutes) === m ? 'time-chip active' : 'time-chip'} onClick={() => setMinutes(m)}>{m}<small>min</small></button>)}
              </div>
              <label className="custom-time">or <input type="number" min="1" max="720" value={minutes} onChange={(e) => setMinutes(e.target.value)} /> minutes</label>
            </fieldset>

            <label className="field-v3">
              <span>Alert my contacts if I'm late by</span>
              <div className="input-wrap"><i>⏱</i>
                <select value={grace} onChange={(e) => setGrace(e.target.value)}>
                  <option value="5">5 minutes</option><option value="10">10 minutes</option><option value="15">15 minutes</option><option value="30">30 minutes</option>
                </select>
              </div>
            </label>

            {contactCount === 0 && <p className="notice">♧ Add a trusted contact before starting. <Link to="/contacts">Add contact →</Link></p>}
            {error && <p className="error" role="alert">{error}</p>}

            <button className="btn-v3 primary-v3 start-button" disabled={busy || contactCount === 0}>
              <span>{busy ? 'Starting…' : 'Start safe journey'}</span><b>→</b>
            </button>
          </form>

          <div className="ready-row">
            <div><span className="ready-dot" /><b>{contactCount == null ? 'Checking safety setup' : `${contactCount} trusted contact${contactCount === 1 ? '' : 's'} connected`}</b></div>
            <span>🔐 Protected</span>
          </div>
        </div>
      </section>

      <section className="safety-cards-v3">
        <SafetyCard icon="⌖" title="Live location" text="Your location can be shared while an active journey is running." />
        <SafetyCard icon="♧" title="Trusted contacts" text="People you choose can receive a safety alert if you miss check-in." />
        <SafetyCard icon="🔐" title="Private PINs" text="Check in normally or use a separate silent alert PIN when needed." />
      </section>

      <section className="how-v3">
        <div>
          <span className="card-eyebrow">HOW HOMEWARD WORKS</span>
          <h2>Simple when everything is okay.<br /><em>Ready when it's not.</em></h2>
        </div>
        <div className="steps-v3">
          <Step n="01" title="Start" text="Set where you're going and when you expect to arrive." />
          <Step n="02" title="Stay connected" text="Homeward shares journey status and location while active." />
          <Step n="03" title="Check in" text="Arrive safely with your PIN. If you don't, your safety plan kicks in." />
        </div>
      </section>
    </main>
  );
}

function SafetyCard({ icon, title, text }) {
  return <article className="safety-card-v3"><div className="safety-icon">{icon}</div><div><h3>{title}</h3><p>{text}</p></div><span className="arrow-soft">↗</span></article>;
}
function Step({ n, title, text }) {
  return <article className="step-v3"><span>{n}</span><div><h3>{title}</h3><p>{text}</p></div></article>;
}

function Active({ journey, onChange, onEnd }) {
  const [now, setNow] = useState(Date.now());
  const [pinOpen, setPinOpen] = useState(false);
  const [pinError, setPinError] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const tracking = useJourneyTracking(journey.id);

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  const eta = Date.parse(journey.eta);
  const graceMs = journey.graceMinutes * 60000;
  const remaining = eta - now;
  const total = Math.max(eta - journey.startedAt, 1);
  const phase = remaining > 0 ? 'ontime' : -remaining < graceMs ? 'late' : 'alerted';

  const prevPhase = useRef(phase);
  useEffect(() => {
    if (prevPhase.current === 'ontime' && phase === 'late') {
      navigator.vibrate?.([300, 150, 300]);
      if ('Notification' in window && Notification.permission === 'granted') new Notification('Time to check in', { body: `Your contacts will be alerted in ${journey.graceMinutes} minutes.` });
    }
    prevPhase.current = phase;
  }, [phase, journey.graceMinutes]);

  const ring = {
    ontime: { progress: remaining / total, main: fmt(remaining), sub: 'until you arrive' },
    late: { progress: 1 - -remaining / graceMs, main: fmt(graceMs + remaining), sub: 'until your contacts are alerted' },
    alerted: { progress: 1, main: 'Alerted', sub: 'Your contacts have been notified' },
  }[phase];

  async function submitPin(pin) {
    setBusy(true); setPinError('');
    try { await api.arrive(journey.id, pin || null); onEnd(); }
    catch (err) {
      if (err.status === 403) setPinError('Incorrect PIN. Try again.');
      else if (err.status === 404 || err.status === 409) onEnd();
      else setPinError(err.message);
    } finally { setBusy(false); }
  }

  async function addTime() {
    setMsg('');
    try { const j = await api.extend(journey.id, 15); onChange({ ...journey, eta: j.eta }); }
    catch (err) { setMsg(err.status === 409 ? 'Too late to extend. Tap “I’ve arrived safely”.' : err.message); }
  }

  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: 'Follow my Homeward journey', url: journey.trackingUrl });
      else { await navigator.clipboard.writeText(journey.trackingUrl); setMsg('Tracking link copied.'); }
    } catch { }
  }

  const trackingText = {
    sharing: 'Live location sharing is active.',
    waiting: 'Finding your location…',
    denied: 'Location is blocked. Alerts can still work, but your contacts will not see live location.',
    unsupported: 'This device cannot share location. Safety alerts can still work.',
  }[tracking];

  return (
    <main className="active-v3">
      <section className={`active-banner ${phase}`}>
        <div><span className="mini-label"><span className="pulse" /> {phase === 'alerted' ? 'SAFETY ALERT SENT' : 'JOURNEY ACTIVE'}</span><h1>On your way to <em>{journey.destination}</em></h1><p>Homeward is keeping your journey status close.</p></div>
        <div className="active-clock"><span>EXPECTED ARRIVAL</span><strong>{new Date(eta).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</strong></div>
      </section>

      <section className="active-layout-v3">
        <div className="timer-panel-v3">
          <div className="timer-heading"><span>{phase === 'ontime' ? 'YOU ARE ON TRACK' : phase === 'late' ? 'CHECK IN SOON' : 'CONTACTS ALERTED'}</span><b>{phase === 'ontime' ? '● Safe' : phase === 'late' ? '● Attention' : '● Alert'}</b></div>
          <CountdownRing phase={phase} {...ring} />
          <button className="btn-v3 primary-v3 start-button" onClick={() => { setPinError(''); setPinOpen(true); }}><span>✓ I've arrived safely</span><b>→</b></button>
          <div className="active-actions-v3">
            {phase === 'ontime' && <button className="btn-v3 secondary-v3" onClick={addTime}>+15 min</button>}
            <button className="btn-v3 secondary-v3" onClick={share}>↗ Share journey</button>
          </div>
        </div>

        <div className="active-info-v3">
          <InfoRow icon="⏱" title="Expected arrival" value={new Date(eta).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} />
          <InfoRow icon="🚨" title="Safety alert window" value={`${journey.graceMinutes} minutes after ETA`} />
          <InfoRow icon="⌖" title="Location" value={tracking === 'sharing' ? 'Live location sharing active' : trackingText} tone={tracking === 'sharing' ? 'good' : ''} />
          <div className="security-callout"><span>🔐</span><div><strong>Your safety PIN protects this check-in.</strong><p>Use your normal PIN when you arrive. A separate silent alert PIN can discreetly trigger your safety alert.</p></div></div>
          {msg && <p className="hint">{msg}</p>}
        </div>
      </section>

      {pinOpen && <PinSheet busy={busy} error={pinError} onSubmit={submitPin} onCancel={() => setPinOpen(false)} />}
    </main>
  );
}

function InfoRow({ icon, title, value, tone = '' }) {
  return <div className="info-row-v3"><span className="info-icon-v3">{icon}</span><div><small>{title}</small><strong className={tone}>{value}</strong></div><span className="row-check">✓</span></div>;
}
