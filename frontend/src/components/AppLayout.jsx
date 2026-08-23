// src/components/AppLayout.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardSidebar from './DashboardSidebar';

export default function AppLayout() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="page-wrapper">
      <div className="dashboard-shell">
        <DashboardSidebar user={user} />
        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
