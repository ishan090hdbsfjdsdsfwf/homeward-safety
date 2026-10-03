const BASE = import.meta.env.VITE_API_URL || '';

export const getToken = () => localStorage.getItem('hw_token');
export const setToken = (t) => (t ? localStorage.setItem('hw_token', t) : localStorage.removeItem('hw_token'));

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(BASE + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  } catch {
    const err = new Error('No connection. Check your internet and try again.');
    err.status = 0;
    throw err;
  }

  if (res.status === 401 && auth) {
    setToken(null);
    window.dispatchEvent(new Event('hw-logout'));
  }
  if (!res.ok) {
    let message = 'Something went wrong. Try again.';
    try {
      const d = await res.json();
      message = d.errors?.[0]?.defaultMessage || d.message || message;
    } catch {
      /* no JSON body */
    }
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  register: (b) => request('/api/auth/register', { method: 'POST', body: b, auth: false }),
  login: (b) => request('/api/auth/login', { method: 'POST', body: b, auth: false }),
  contacts: () => request('/api/contacts'),
  addContact: (b) => request('/api/contacts', { method: 'POST', body: b }),
  deleteContact: (id) => request(`/api/contacts/${id}`, { method: 'DELETE' }),
  startJourney: (b) => request('/api/journeys', { method: 'POST', body: b }),
  ping: (id, b) => request(`/api/journeys/${id}/ping`, { method: 'POST', body: b }),
  arrive: (id, pin) => request(`/api/journeys/${id}/arrive`, { method: 'POST', body: { pin } }),
  extend: (id, minutes) => request(`/api/journeys/${id}/extend`, { method: 'PATCH', body: { minutes } }),
  track: (token) => request(`/api/track/${token}`, { auth: false }),
};
