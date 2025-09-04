import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar navbar-expand-lg navbar-light">
      <div className="container">
        <Link className="navbar-brand" to="/tracker">
          🏋️ Professional Fitness Tracker
        </Link>

        <div className="navbar-nav ms-auto">
          <div className="d-flex align-items-center">
            <span className="me-3">Welcome, {user?.firstName || user?.email}</span>
            
            {user?.role === 'admin' && (
              <Link to="/admin" className="btn btn-outline-primary btn-sm me-2">
                Admin Panel
              </Link>
            )}
            
            <button 
              className="btn btn-outline-danger btn-sm" 
              onClick={logout}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
