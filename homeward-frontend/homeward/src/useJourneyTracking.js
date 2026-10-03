import { useEffect, useRef, useState } from 'react';
import { api } from './api.js';

const INTERVAL_MS = 20000;

/**
 * Sends the user's location to the backend while a journey is active.
 * Keeps the screen awake where supported (a web app cannot track reliably with the screen locked).
 * Returns 'waiting' | 'sharing' | 'denied' | 'unsupported'.
 */
export default function useJourneyTracking(journeyId) {
  const [state, setState] = useState('waiting');
  const position = useRef(null);

  useEffect(() => {
    if (!journeyId) return undefined;
    if (!('geolocation' in navigator)) {
      setState('unsupported');
      return undefined;
    }

    let lastSent = 0;
    let battery = null;
    let wakeLock = null;

    navigator.getBattery?.().then((b) => { battery = Math.round(b.level * 100); }).catch(() => {});

    const send = async () => {
      if (!position.current) return;
      lastSent = Date.now();
      try {
        await api.ping(journeyId, {
          latitude: position.current.latitude,
          longitude: position.current.longitude,
          batteryPct: battery,
        });
      } catch {
        /* offline or journey ended: the ETA timer on the server is still the safety net */
      }
    };

    const watchId = navigator.geolocation.watchPosition(
      (p) => {
        position.current = p.coords;
        setState('sharing');
        if (lastSent === 0) send();
      },
      (err) => { if (err.code === 1) setState('denied'); },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 30000 }
    );
    const timer = setInterval(send, INTERVAL_MS);

    const lockScreen = async () => {
      try { wakeLock = await navigator.wakeLock?.request('screen'); } catch { /* not supported */ }
    };
    const onVisible = () => { if (document.visibilityState === 'visible') lockScreen(); };
    lockScreen();
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      wakeLock?.release?.();
    };
  }, [journeyId]);

  return state;
}
