// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

import Navbar          from './components/Navbar';
import ProtectedRoute  from './components/ProtectedRoute';
import Landing         from './pages/Landing';
import Login           from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import StaffDashboard  from './pages/StaffDashboard';
import ClubManagerDashboard from './pages/ClubManagerDashboard';
import Clubs           from './pages/Clubs';
import ClubDetails     from './pages/ClubDetails';
import Events          from './pages/Events';
import Profile         from './pages/Profile';
import AppLayout       from './components/AppLayout';

// Auto-redirect logged-in users to their dashboard
function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Landing />;
  return <Navigate to={
    user.role === 'student' ? '/dashboard' :
    user.role === 'club_manager' ? '/club-manager' :
    '/staff'
  } replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Navbar />
          <Routes>
            <Route path="/"        element={<HomeRedirect />} />
            <Route path="/login"   element={<Login />} />

            {/* Authenticated routes sharing the persistent AppLayout */}
            <Route element={<AppLayout />}>
              {/* Student-only */}
              <Route path="/dashboard" element={
                <ProtectedRoute roles={['student']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }/>

              {/* Staff-only */}
              <Route path="/staff" element={
                <ProtectedRoute roles={['admin','coordinator']}>
                  <StaffDashboard />
                </ProtectedRoute>
              }/>

              {/* Club Manager only */}
              <Route path="/club-manager" element={
                <ProtectedRoute roles={['club_manager']}>
                  <ClubManagerDashboard />
                </ProtectedRoute>
              }/>

              {/* Shared — any logged-in user */}
              <Route path="/clubs"  element={<ProtectedRoute><Clubs /></ProtectedRoute>} />
              <Route path="/clubs/:id" element={<ProtectedRoute><ClubDetails /></ProtectedRoute>} />
              <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

