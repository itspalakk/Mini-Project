// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// roles: array of allowed roles. If empty, any logged-in user is allowed.
export default function ProtectedRoute({ children, roles = [] }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (roles.length > 0 && !roles.includes(user.role)) {
    // Redirect to correct dashboard
    if (user.role === 'student') return <Navigate to="/dashboard" replace />;
    if (user.role === 'club_manager') return <Navigate to="/club-manager" replace />;
    return <Navigate to="/staff" replace />;
  }

  return children;
}
