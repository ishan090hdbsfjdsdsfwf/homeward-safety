import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { api } from '../api.js';

const POLL_MS = 10000;

function ago(iso) {
  const s = Math.max(
    0,
    Math.round((Date.now() - Date.parse(iso)) / 1000)
  );

  if (s < 30) return 'just now';

  if (s < 3600) {
    return `${Math.round(s / 60)} min ago`;
  }

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

  useEffect(() => {
    let alive = true;

    const load = () => {
      api
        .track(token)
        .then((result) => {
          if (!alive) return;

          setData(result);
          setGone(false);
        })
        .catch((e) => {
          if (alive && e.status === 404) {
            setGone(true);
          }
        });
    };

    load();

    const timer = setInterval(load, POLL_MS);

    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [token]);

  useEffect(() => {
    if (!mapEl.current) return;

    map.current = L.map(mapEl.current, {
      zoomControl: false,
    }).setView([22.5, 79], 4);

    L.control
      .zoom({
        position: 'bottomright',
      })
      .addTo(map.current);

    L.tileLayer(
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        attribution:
          '&copy; OpenStreetMap contributors',
      }
    ).addTo(map.current);

    return () => {
      if (map.current) {
        map.current.remove();
      }

      map.current = null;
      marker.current = null;
    };
  }, []);

  useEffect(() => {
    if (
      !map.current ||
      data?.latitude == null ||
      data?.longitude == null
    ) {
      return;
    }

    const position = [
      data.latitude,
      data.longitude,
    ];

    if (!marker.current) {
      marker.current = L.circleMarker(position, {
        radius: 11,

        color: '#ffffff',
        weight: 4,

        fillColor:
          data.status === 'ALERTED'
            ? '#c84747'
            : '#267b63',

        fillOpacity: 1,
      }).addTo(map.current);
    } else {
      marker.current.setLatLng(position);

      marker.current.setStyle({
        fillColor:
          data.status === 'ALERTED'
            ? '#c84747'
            : '#267b63',
      });
    }

    if (!centered.current) {
      map.current.setView(position, 16);

      centered.current = true;
    } else {
      map.current.panTo(position);
    }
  }, [data]);

  let state = 'loading';

  if (gone) {
    state = 'expired';
  } else if (data?.status === 'ARRIVED') {
    state = 'arrived';
  } else if (data?.status === 'ALERTED') {
    state = 'alerted';
  } else if (data?.status === 'CANCELLED') {
    state = 'cancelled';
  } else if (data) {
    state = 'travelling';
  }

  const config = {
    loading: {
      eyebrow: 'HOMEWARD',
      title: 'Finding the journey…',
      message: 'Please wait while we connect to the tracking link.',
      icon: '○',
    },

    travelling: {
      eyebrow: 'LIVE JOURNEY',
      title: `${data.name} is on the way`,
      message: `Heading to ${data.destination || 'their destination'}.`,
      icon: '●',
    },

    arrived: {
      eyebrow: 'JOURNEY COMPLETE',
      title: `${data.name} arrived safely`,
      message: 'This journey has ended. No further tracking is needed.',
      icon: '✓',
    },

    alerted: {
      eyebrow: 'CHECK-IN MISSED',
      title: `${data.name} hasn't checked in`,
      message:
        'Their expected arrival time has passed and their trusted contacts have been alerted.',
      icon: '!',
    },

    cancelled: {
      eyebrow: 'JOURNEY ENDED',
      title: `${data.name} ended the journey`,
      message: 'This tracking link is no longer updating.',
      icon: '✓',
    },

    expired: {
      eyebrow: 'HOMEWARD',
      title: 'Tracking link unavailable',
      message:
        'This link has expired or is no longer valid.',
      icon: '—',
    },
  }[state];

  return (
    <main className={`public-track public-track-${state}`}>
      <header className="public-track-header">
        <div className="public-brand">
          <span className="public-brand-mark">H</span>

          <span>Homeward</span>
        </div>

        <span className="public-live-label">
          {state === 'travelling'
            ? 'LIVE'
            : 'SAFETY TRACKING'}
        </span>
      </header>

      <section className="public-track-info">
        <div className="public-track-state">
          <span>{config.icon}</span>

          {config.eyebrow}
        </div>

        <h1>{config.title}</h1>

        <p>{config.message}</p>

        {data && !gone && (
          <div className="public-meta">
            {data.lastSeen && (
              <span>
                <b>●</b>
                Updated {ago(data.lastSeen)}
              </span>
            )}

            {data.batteryPct != null && (
              <span>
                Battery {data.batteryPct}%
              </span>
            )}
          </div>
        )}

        {state === 'alerted' && (
          <div className="public-alert">
            <strong>Action may be needed</strong>

            <span>
              Try calling them now. If you cannot reach them,
              call 112.
            </span>
          </div>
        )}
      </section>

      <section className="public-map-wrap">
        <div
          ref={mapEl}
          className="public-map"
          aria-label="Map showing the last known location"
        />

        {state === 'loading' && (
          <div className="map-loading">
            <span />
            Loading location…
          </div>
        )}

        {state === 'expired' && (
          <div className="map-message">
            <div>—</div>
            No active tracking
          </div>
        )}
      </section>

      <footer className="public-track-footer">
        <span>
          Homeward keeps journeys private.
        </span>

        <span>
          Location refreshes automatically.
        </span>
      </footer>
    </main>
  );
}