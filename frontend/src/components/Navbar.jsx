// src/components/Navbar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { showToast }    = useToast();
  const navigate         = useNavigate();

  function handleLogout() {
    logout();
    showToast('Logged out', 'info');
    navigate('/login');
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        Edu<span>Event</span>
      </Link>
      <ul className="navbar-links">
        {user ? (
          <>
            <li>
              <Link to={user.role === 'student' ? '/dashboard' : user.role === 'club_manager' ? '/club-manager' : '/staff'}>
                Dashboard
              </Link>

            </li>
            <li><Link to="/clubs">Clubs</Link></li>
            <li><Link to="/events">Events</Link></li>
            <li style={{ color:'var(--text-muted)', fontSize:'.83rem' }}>{user.name}</li>
            <li>

              {/* Add the Profile link here */}
              <Link to="/profile" style={{ marginRight: '1rem', textDecoration: 'none', color: 'inherit' }}>
              My Profile
              </Link>
              <button className="btn btn-outline btn-sm" onClick={handleLogout}>
                Logout
              </button>
            </li>
          </>
        ) : (
          <>
            <li><Link to="/#features">Features</Link></li>
            <li>
              <Link to="/login" className="btn btn-primary btn-sm">Login</Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}
