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
import Clubs           from './pages/Clubs';
import ClubDetails     from './pages/ClubDetails';
import Events          from './pages/Events';
import Profile         from './pages/Profile';

// Auto-redirect logged-in users to their dashboard
function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Landing />;
  return <Navigate to={user.role === 'student' ? '/dashboard' : '/staff'} replace />;
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

            {/* Shared — any logged-in user */}
            <Route path="/clubs"  element={<ProtectedRoute><Clubs /></ProtectedRoute>} />
            <Route path="/clubs/:id" element={<ProtectedRoute><ClubDetails /></ProtectedRoute>} />
            <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />

            <Route path="/profile" element={
            <ProtectedRoute>
            <Profile />
            </ProtectedRoute>
            } />

          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
