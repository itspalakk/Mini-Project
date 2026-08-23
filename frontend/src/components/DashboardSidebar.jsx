// src/components/DashboardSidebar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const ROLE_LABEL = {
  student: 'Student',
  coordinator: 'Coordinator',
  admin: 'Admin',
  club_manager: 'Club Manager',
};

const ROLE_BADGE = {
  student: 'badge-green',
  coordinator: 'badge-purple',
  admin: 'badge-red',
  club_manager: 'badge-blue',
};

export default function DashboardSidebar({ user }) {
  const location = useLocation();
  const role = user?.role || 'student';
  const dashboardPath =
    role === 'student' ? '/dashboard' :
    role === 'club_manager' ? '/club-manager' :
    '/staff';

  const commonItems = [
    { icon: '⌂', label: 'Home', to: dashboardPath },
    { icon: '◫', label: 'Clubs', to: '/clubs' },
    { icon: '◷', label: 'Events', to: '/events' },
  ];

  const studentItems = [
    { icon: '◎', label: 'Interests', to: '/dashboard#interests-sec' },
    { icon: '☑', label: 'My Requests', to: '/dashboard#requests-sec' },
    { icon: '◇', label: 'Profile', to: '/profile' },
  ];

  const staffItems = [
    { icon: '☑', label: 'Requests', to: '/staff#requests-panel' },
    { icon: '+', label: 'Create Event', to: '/staff#create-event' },
    { icon: '◇', label: 'Profile', to: '/profile' },
  ];

  const managerItems = [
    { icon: '⌂', label: 'Home', to: '/club-manager' },
    { icon: '◫', label: 'Clubs', to: '/clubs' },
    { icon: '◷', label: 'Events', to: '/events' },
    { icon: '◇', label: 'Profile', to: '/profile' },
  ];

  const items = role === 'student'
    ? [...commonItems, ...studentItems]
    : role === 'club_manager'
    ? managerItems
    : [...commonItems, ...staffItems];

  function isActive(item) {
    const [path, hash] = item.to.split('#');

    if (hash) {
      return location.pathname === path && location.hash === `#${hash}`;
    }

    if (path === '/clubs') {
      return location.pathname.startsWith('/clubs');
    }
    if (path === '/events') {
      return location.pathname.startsWith('/events');
    }

    return location.pathname === path && !location.hash;
  }

  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-profile-card">
        <div className="sidebar-avatar">
          {(user?.name || 'U').slice(0, 1).toUpperCase()}
        </div>
        <div className="sidebar-user-name">{user?.name || 'User'}</div>
        <div className="sidebar-user-role">{ROLE_LABEL[role]}</div>
        <span className={`badge ${ROLE_BADGE[role] || 'badge-blue'}`}>Active</span>
      </div>

      <nav className="sidebar-nav">
        {items.map(item => (
          <Link
            key={item.label}
            to={item.to}
            className={`sidebar-nav-item ${isActive(item) ? 'active' : ''}`}
          >
            <span className="sidebar-nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}

