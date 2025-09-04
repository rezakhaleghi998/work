import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import FitnessTracker from './components/FitnessTracker';
import AdminDashboard from './components/AdminDashboard';
import Navbar from './components/Navbar';

function App() {
  return (
    <AuthProvider>
      <div className="fitness-tracker">
        <AppContent />
      </div>
    </AuthProvider>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {user && <Navbar />}
      <Routes>
        <Route 
          path="/login" 
          element={!user ? <Login /> : <Navigate to="/tracker" />} 
        />
        <Route 
          path="/register" 
          element={!user ? <Register /> : <Navigate to="/tracker" />} 
        />
        <Route 
          path="/tracker" 
          element={user ? <FitnessTracker /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/admin" 
          element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/tracker" />} 
        />
        <Route 
          path="/" 
          element={<Navigate to={user ? "/tracker" : "/login"} />} 
        />
      </Routes>
    </>
  );
}

export default App;
