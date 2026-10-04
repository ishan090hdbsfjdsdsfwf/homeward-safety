import { useEffect, useState } from 'react';
import { Navigate, NavLink, Outlet, Route, Routes, useNavigate } from 'react-router-dom';
import { getToken, setToken } from './api.js';
import Auth from './pages/Auth.jsx';
import Home from './pages/Home.jsx';
import Contacts from './pages/Contacts.jsx';
import Track from './pages/Track.jsx';

export default function App() {
  const [authed, setAuthed] = useState(!!getToken());
  const navigate = useNavigate();

  useEffect(() => {
    const onLogout = () => { setAuthed(false); navigate('/login'); };
    window.addEventListener('hw-logout', onLogout);
    return () => window.removeEventListener('hw-logout', onLogout);
  }, [navigate]);

  const onAuth = (token) => { setToken(token); setAuthed(true); navigate('/'); };

  const logout = () => {
    if (localStorage.getItem('hw_journey') &&
      !window.confirm('You have a journey in progress. If you sign out, you cannot check in from this device. Sign out anyway?')) return;
    setToken(null);
    setAuthed(false);
    navigate('/login');
  };

  return (
    <Routes>
      <Route path="/track/:token" element={<Track />} />
      <Route path="/login" element={authed ? <Navigate to="/" replace /> : <Auth onAuth={onAuth} />} />
      <Route element={authed ? <Shell onLogout={logout} /> : <Navigate to="/login" replace />}>
        <Route index element={<Home />} />
        <Route path="contacts" element={<Contacts />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function Shell({ onLogout }) {
  return (
    <div className="shell">
      <header className="topbar">
        <NavLink to="/" className="brand" aria-label="Homeward home">
          <span className="brand-symbol">✦</span>
          <span className="brand-word">Homeward</span>
        </NavLink>

        <div className="topbar-right">
          <nav className="desktop-nav">
            <NavLink to="/" end>Home</NavLink>
            <NavLink to="/contacts">Contacts</NavLink>
          </nav>
          <button className="avatar-button" onClick={onLogout} title="Sign out" aria-label="Sign out">↪</button>
        </div>
      </header>

      <Outlet />

      <nav className="mobile-dock" aria-label="Mobile navigation">
        <NavLink to="/" end><span>⌂</span><small>Home</small></NavLink>
        <NavLink to="/contacts"><span>♧</span><small>Contacts</small></NavLink>
        <button onClick={onLogout}><span>↪</span><small>Sign out</small></button>
      </nav>
    </div>
  );
}
