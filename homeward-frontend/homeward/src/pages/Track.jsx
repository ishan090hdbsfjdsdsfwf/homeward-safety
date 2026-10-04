import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../api.js';

const POLL_MS = 10000;

function ago(iso) {
  if (!iso) return '';

  const s = Math.max(
    0,
    Math.round((Date.now() - Date.parse(iso)) / 1000)
  );

  if (s < 30) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;

  return `${Math.round(s / 3600)} h ago`;
}

export default function Track() {
  const { token } = useParams();

  const [data, setData] = useState(null);
  const [gone, setGone] = useState(false);
  const [error, setError] = useState('');

  const mapEl = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const accuracyCircle = useRef(null);
  const centered = useRef(false);

  /*
   * Get the latest location from the backend.
   */
  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const d = await api.track(token);

        if (!alive) return;

        setData(d);
        setGone(false);
        setError('');
      } catch (e) {
        if (!alive) return;

        if (e.status === 404) {
          setGone(true);
        } else {
          setError('Unable to load live location.');
        }
      }
    };

    load();

    const timer = setInterval(load, POLL_MS);

    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [token]);

  /*
   * Create Leaflet map once.
   */
  useEffect(() => {
    if (!mapEl.current || map.current) return;

    const mapInstance = L.map(mapEl.current, {
      center: [22.5, 79],
      zoom: 5,
      zoomControl: true,
    });

    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }
    ).addTo(mapInstance);

    map.current = mapInstance;

    /*
     * Force Leaflet to recalculate the container size.
     */
    setTimeout(() => {
      mapInstance.invalidateSize();
    }, 200);

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }

      marker.current = null;
      accuracyCircle.current = null;
      centered.current = false;
    };
  }, []);

  /*
   * Update marker whenever a new location arrives.
   */
  useEffect(() => {
    if (
      !map.current ||
      data?.latitude == null ||
      data?.longitude == null
    ) {
      return;
    }

    const latitude = Number(data.latitude);
    const longitude = Number(data.longitude);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return;
    }

    const position = [latitude, longitude];

    /*
     * Create location marker.
     */
    if (!marker.current) {
      marker.current = L.circleMarker(position, {
        radius: 10,
        color: '#ffffff',
        weight: 3,
        fillColor: '#f4b942',
        fillOpacity: 1,
      }).addTo(map.current);

      marker.current.bindPopup(
        `<strong>Current location</strong><br/>` +
        `Latitude: ${latitude.toFixed(6)}<br/>` +
        `Longitude: ${longitude.toFixed(6)}`
      );
    } else {
      marker.current.setLatLng(position);
    }

    /*
     * Show approximate GPS accuracy if available.
     */
    if (data.accuracy != null) {
      const accuracy = Number(data.accuracy);

      if (Number.isFinite(accuracy) && accuracy > 0) {
        if (!accuracyCircle.current) {
          accuracyCircle.current = L.circle(position, {
            radius: accuracy,
            color: '#f4b942',
            weight: 1,
            fillColor: '#f4b942',
            fillOpacity: 0.12,
          }).addTo(map.current);
        } else {
          accuracyCircle.current.setLatLng(position);
          accuracyCircle.current.setRadius(accuracy);
        }
      }
    }

    /*
     * Center on the first real location.
     */
    if (!centered.current) {
      map.current.setView(position, 17);
      centered.current = true;
    } else {
      map.current.panTo(position);
    }

    /*
     * Recalculate map dimensions after movement.
     */
    setTimeout(() => {
      map.current?.invalidateSize();
    }, 100);
  }, [data]);

  let headline = 'Loading…';
  let tone = '';

  if (gone) {
    headline = 'This link has expired or is not valid.';
  } else if (data) {
    if (data.status === 'ARRIVED') {
      headline = `${data.name} arrived safely`;
      tone = 'ok';
    } else if (data.status === 'ALERTED') {
      headline = `${data.name} hasn't checked in`;
      tone = 'bad';
    } else if (data.status === 'CANCELLED') {
      headline = `${data.name} ended the journey`;
      tone = 'ok';
    } else {
      headline =
        `${data.name} is on the way to ${data.destination}`;
    }
  }

  return (
    <main className="track">

      <section className={`track-head ${tone}`}>
        <h1>{headline}</h1>

        {data && !gone && (
          <p>
            {data.lastSeen
              ? `Location updated ${ago(data.lastSeen)}`
              : 'Waiting for the first location update'}

            {data.batteryPct != null &&
              ` · battery ${data.batteryPct}%`}
          </p>
        )}

        {error && (
          <p className="error">
            {error}
          </p>
        )}

        {tone === 'bad' && (
          <p>
            <strong>
              Try calling them now. If you can't reach them,
              call 112.
            </strong>
          </p>
        )}
      </section>

      <div
        ref={mapEl}
        className="map"
        aria-label="Map showing the last known location"
      />

    </main>
  );
}