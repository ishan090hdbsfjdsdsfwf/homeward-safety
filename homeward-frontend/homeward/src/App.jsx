import { useEffect, useState } from 'react';
import {
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom';

import {
  getToken,
  setToken,
  getJourneyKey,
} from './api.js';

import Auth from './pages/Auth.jsx';
import Home from './pages/Home.jsx';
import Contacts from './pages/Contacts.jsx';
import Track from './pages/Track.jsx';

export default function App() {
  const [authed, setAuthed] = useState(!!getToken());
  const navigate = useNavigate();

  useEffect(() => {
    const onLogout = () => {
      setAuthed(false);
      navigate('/login');
    };

    window.addEventListener('hw-logout', onLogout);

    return () => {
      window.removeEventListener('hw-logout', onLogout);
    };
  }, [navigate]);

  const onAuth = (token) => {
    setToken(token);
    setAuthed(true);
    navigate('/');
  };

  const logout = () => {
    const journeyKey = getJourneyKey();

    const hasJourney =
      journeyKey &&
      localStorage.getItem(journeyKey);

    if (
      hasJourney &&
      !window.confirm(
        'You have a journey in progress. If you sign out, you cannot check in from this device. Sign out anyway?'
      )
    ) {
      return;
    }

    setToken(null);
    setAuthed(false);
    navigate('/login');
  };

  return (
    <Routes>
      <Route
        path="/track/:token"
        element={<Track />}
      />

      <Route
        path="/login"
        element={
          authed ? (
            <Navigate to="/" replace />
          ) : (
            <Auth onAuth={onAuth} />
          )
        }
      />

      <Route
        element={
          authed ? (
            <AppShell onLogout={logout} />
          ) : (
            <Navigate
              to="/login"
              replace
            />
          )
        }
      >
        <Route
          index
          element={<Home />}
        />

        <Route
          path="contacts"
          element={<Contacts />}
        />
      </Route>

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />
    </Routes>
  );
}

function AppShell({ onLogout }) {
  return (
    <div className="app-shell">
      <header className="site-header">
        <NavLink
          to="/"
          className="site-brand"
        >
          <span className="site-brand-mark">
            H
          </span>

          <span>Homeward</span>
        </NavLink>

        <nav className="site-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive
                ? 'nav-link nav-link-active'
                : 'nav-link'
            }
          >
            Home
          </NavLink>

          <NavLink
            to="/contacts"
            className={({ isActive }) =>
              isActive
                ? 'nav-link nav-link-active'
                : 'nav-link'
            }
          >
            Contacts
          </NavLink>

          <button
            type="button"
            className="nav-signout"
            onClick={onLogout}
          >
            Sign out
          </button>
        </nav>
      </header>

      <Outlet />
    </div>
  );
}