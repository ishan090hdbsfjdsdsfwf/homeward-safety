const BASE = import.meta.env.VITE_API_URL || '';

/* =========================================================
   AUTH TOKEN
   ========================================================= */

export const getToken = () =>
  localStorage.getItem('hw_token');

export const setToken = (token) => {
  if (token) {
    localStorage.setItem('hw_token', token);
  } else {
    localStorage.removeItem('hw_token');
  }
};

/* =========================================================
   CURRENT USER
   ========================================================= */

/*
 * We use the user's email as a local browser identifier.
 *
 * This is NOT used for authentication.
 * The JWT token is still responsible for authentication.
 */
export const getUserKey = () =>
  localStorage.getItem('hw_user_key');

export const setUserKey = (value) => {
  if (value) {
    localStorage.setItem(
      'hw_user_key',
      value.trim().toLowerCase()
    );
  } else {
    localStorage.removeItem('hw_user_key');
  }
};

/* =========================================================
   USER-SPECIFIC JOURNEY STORAGE
   ========================================================= */

/*
 * Instead of one global:
 *
 *   hw_journey
 *
 * each account gets its own:
 *
 *   hw_journey_user@example.com
 *
 * This prevents one account's local journey from appearing
 * when another account logs into the same browser.
 */
export const getJourneyKey = () => {
  const userKey = getUserKey();

  if (!userKey) {
    return null;
  }

  return `hw_journey_${userKey}`;
};

/* =========================================================
   API REQUEST HELPER
   ========================================================= */

async function request(
  path,
  {
    method = 'GET',
    body,
    auth = true,
  } = {}
) {
  const headers = {};

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const token = getToken();

  if (auth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let res;

  try {
    res = await fetch(BASE + path, {
      method,
      headers,
      body:
        body !== undefined
          ? JSON.stringify(body)
          : undefined,
    });
  } catch {
    const err = new Error(
      'No connection. Check your internet and try again.'
    );

    err.status = 0;

    throw err;
  }

  /* =======================================================
     UNAUTHORIZED
     ======================================================= */

  if (res.status === 401 && auth) {
    setToken(null);

    window.dispatchEvent(
      new Event('hw-logout')
    );
  }

  /* =======================================================
     API ERROR
     ======================================================= */

  if (!res.ok) {
    let message =
      'Something went wrong. Try again.';

    try {
      const data = await res.json();

      message =
        data.errors?.[0]?.defaultMessage ||
        data.message ||
        message;
    } catch {
      // Response did not contain JSON.
    }

    const err = new Error(message);

    err.status = res.status;

    throw err;
  }

  /* =======================================================
     SUCCESS
     ======================================================= */

  return res.status === 204
    ? null
    : res.json();
}

/* =========================================================
   API
   ========================================================= */

export const api = {
  /* ---------------- AUTH ---------------- */

  register: (body) =>
    request('/api/auth/register', {
      method: 'POST',
      body,
      auth: false,
    }),

  login: (body) =>
    request('/api/auth/login', {
      method: 'POST',
      body,
      auth: false,
    }),

  /* ---------------- CONTACTS ---------------- */

  contacts: () =>
    request('/api/contacts'),

  addContact: (body) =>
    request('/api/contacts', {
      method: 'POST',
      body,
    }),

  deleteContact: (id) =>
    request(`/api/contacts/${id}`, {
      method: 'DELETE',
    }),

  /* ---------------- JOURNEYS ---------------- */

  startJourney: (body) =>
    request('/api/journeys', {
      method: 'POST',
      body,
    }),

  ping: (id, body) =>
    request(`/api/journeys/${id}/ping`, {
      method: 'POST',
      body,
    }),

  arrive: (id, pin) =>
    request(`/api/journeys/${id}/arrive`, {
      method: 'POST',
      body: {
        pin,
      },
    }),

  extend: (id, minutes) =>
    request(`/api/journeys/${id}/extend`, {
      method: 'PATCH',
      body: {
        minutes,
      },
    }),

  /* ---------------- PUBLIC TRACKING ---------------- */

  track: (token) =>
    request(`/api/track/${token}`, {
      auth: false,
    }),
};