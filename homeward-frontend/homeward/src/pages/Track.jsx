import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../api.js';

const POLL_MS = 10000;

function ago(iso) {
  if (!iso) return '';

  const parsed = Date.parse(iso);

  if (Number.isNaN(parsed)) {
    return '';
  }

  const seconds = Math.max(
    0,
    Math.round((Date.now() - parsed) / 1000)
  );

  if (seconds < 30) {
    return 'just now';
  }

  if (seconds < 3600) {
    return `${Math.round(seconds / 60)} min ago`;
  }

  return `${Math.round(seconds / 3600)} h ago`;
}

export default function Track() {
  const { token } = useParams();

  const [data, setData] = useState(null);
  const [gone, setGone] = useState(false);
  const [error, setError] = useState('');

  const mapEl = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const centered = useRef(false);

  /*
   * Load tracking information from the backend.
   */
  useEffect(() => {
    if (!token) {
      setGone(true);
      return undefined;
    }

    let alive = true;

    const load = async () => {
      try {
        const result = await api.track(token);

        if (!alive) {
          return;
        }

        setData(result);
        setGone(false);
        setError('');
      } catch (err) {
        if (!alive) {
          return;
        }

        if (err.status === 404) {
          setGone(true);
          setError('');
        } else {
          setError(
            err.message ||
            'Unable to load the journey.'
          );
        }
      }
    };

    load();

    const timer = setInterval(
      load,
      POLL_MS
    );

    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [token]);

  /*
   * Create Leaflet map.
   */
  useEffect(() => {
    if (!mapEl.current) {
      return undefined;
    }

    let leafletMap;

    try {
      leafletMap = L.map(
        mapEl.current,
        {
          center: [22.5, 79],
          zoom: 5,
          zoomControl: true,
        }
      );

      map.current = leafletMap;

      L.tileLayer(
        'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          maxZoom: 19,
          attribution:
            '&copy; OpenStreetMap contributors',
        }
      ).addTo(leafletMap);

      /*
       * Leaflet sometimes calculates the container size
       * incorrectly immediately after mounting.
       */
      setTimeout(() => {
        if (map.current) {
          map.current.invalidateSize();
        }
      }, 100);
    } catch (err) {
      console.error(
        'Leaflet initialization failed:',
        err
      );

      setError(
        'The map could not be loaded. Please refresh the page.'
      );
    }

    return () => {
      if (leafletMap) {
        leafletMap.remove();
      }

      map.current = null;
      marker.current = null;
      centered.current = false;
    };
  }, []);

  /*
   * Update the marker whenever new location data arrives.
   */
  useEffect(() => {
    if (!map.current) {
      return;
    }

    if (
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

    const position = [
      latitude,
      longitude,
    ];

    if (!marker.current) {
      marker.current =
        L.circleMarker(
          position,
          {
            radius: 10,
            color: '#121829',
            weight: 3,
            fillColor: '#f4b942',
            fillOpacity: 1,
          }
        ).addTo(map.current);

      marker.current.bindPopup(
        '<strong>Current location</strong>'
      );
    } else {
      marker.current.setLatLng(
        position
      );
    }

    if (!centered.current) {
      map.current.setView(
        position,
        16
      );

      centered.current = true;
    } else {
      map.current.panTo(
        position,
        {
          animate: true,
          duration: 0.5,
        }
      );
    }

    /*
     * Make sure Leaflet redraws correctly.
     */
    setTimeout(() => {
      if (map.current) {
        map.current.invalidateSize();
      }
    }, 50);
  }, [data]);

  let headline = 'Loading…';
  let tone = '';

  if (gone) {
    headline =
      'This link has expired or is not valid.';
  } else if (data) {
    if (data.status === 'ARRIVED') {
      headline =
        `${data.name} arrived safely`;
      tone = 'ok';
    } else if (data.status === 'ALERTED') {
      headline =
        `${data.name} hasn't checked in`;
      tone = 'bad';
    } else if (
      data.status === 'CANCELLED'
    ) {
      headline =
        `${data.name} ended the journey`;
      tone = 'ok';
    } else {
      headline =
        `${data.name} is on the way to ${data.destination || 'their destination'
        }`;
    }
  }

  const hasLocation =
    data?.latitude != null &&
    data?.longitude != null;

  return (
    <main className="track">
      <section
        className={`track-head ${tone}`}
      >
        <h1>{headline}</h1>

        {data && !gone && (
          <p>
            {hasLocation
              ? `Location updated ${ago(data.lastSeen) ||
              'recently'
              }`
              : 'Waiting for the first location update'}

            {data.batteryPct != null &&
              ` · battery ${data.batteryPct}%`}
          </p>
        )}

        {error && (
          <p className="track-error">
            {error}
          </p>
        )}

        {!gone &&
          data &&
          !hasLocation &&
          !error && (
            <p className="track-waiting">
              The journey is active, but the
              phone has not sent a location yet.
              Keep the journey screen open and
              allow location access.
            </p>
          )}

        {tone === 'bad' && (
          <p>
            <strong>
              Try calling them now. If you can't
              reach them, call 112.
            </strong>
          </p>
        )}
      </section>

      <div
        ref={mapEl}
        className="map"
        aria-label="Map showing the last known location"
      />

      {!hasLocation &&
        !gone &&
        !error && (
          <div className="map-overlay">
            <div className="map-overlay-card">
              <div className="map-loader" />

              <strong>
                Waiting for location
              </strong>

              <span>
                The traveler's location will
                appear here as soon as the phone
                sends its first GPS update.
              </span>
            </div>
          </div>
        )}
    </main>
  );
}