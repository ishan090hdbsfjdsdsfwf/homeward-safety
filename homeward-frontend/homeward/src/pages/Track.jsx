import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../api.js';

const POLL_MS = 10000;

function ago(iso) {
  const s = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 1000));
  if (s < 30) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  return `${Math.round(s / 3600)} h ago`;
}

export default function Track() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [gone, setGone] = useState(false);
  const mapEl = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const centered = useRef(false);

  // Poll the public tracking endpoint.
  useEffect(() => {
    let alive = true;
    const load = () => api.track(token)
      .then((d) => { if (alive) { setData(d); setGone(false); } })
      .catch((e) => { if (alive && e.status === 404) setGone(true); });
    load();
    const t = setInterval(load, POLL_MS);
    return () => { alive = false; clearInterval(t); };
  }, [token]);

  // Create the map once.
  useEffect(() => {
    map.current = L.map(mapEl.current).setView([22.5, 79], 4);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map.current);
    return () => { map.current.remove(); map.current = null; marker.current = null; };
  }, []);

  // Move the marker when a new position arrives.
  useEffect(() => {
    if (!map.current || data?.latitude == null) return;
    const pos = [data.latitude, data.longitude];
    if (!marker.current) {
      marker.current = L.circleMarker(pos, { radius: 10, color: '#121829', weight: 3, fillColor: '#f4b942', fillOpacity: 1 }).addTo(map.current);
    } else {
      marker.current.setLatLng(pos);
    }
    if (!centered.current) { map.current.setView(pos, 16); centered.current = true; }
    else map.current.panTo(pos);
  }, [data]);

  let headline = 'Loading…';
  let tone = '';
  if (gone) { headline = 'This link has expired or is not valid.'; }
  else if (data) {
    if (data.status === 'ARRIVED') { headline = `${data.name} arrived safely`; tone = 'ok'; }
    else if (data.status === 'ALERTED') { headline = `${data.name} hasn't checked in`; tone = 'bad'; }
    else if (data.status === 'CANCELLED') { headline = `${data.name} ended the journey`; tone = 'ok'; }
    else { headline = `${data.name} is on the way to ${data.destination}`; }
  }

  return (
    <main className="track">
      <section className={`track-head ${tone}`}>
        <h1>{headline}</h1>
        {data && !gone && (
          <p>
            {data.lastSeen ? `Location updated ${ago(data.lastSeen)}` : 'Waiting for the first location update'}
            {data.batteryPct != null && ` · battery ${data.batteryPct}%`}
          </p>
        )}
        {tone === 'bad' && <p><strong>Try calling them now. If you can't reach them, call 112.</strong></p>}
      </section>
      <div ref={mapEl} className="map" aria-label="Map showing the last known location" />
    </main>
  );
}
