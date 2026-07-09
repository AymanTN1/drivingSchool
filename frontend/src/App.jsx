import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

export default function App() {
  const [view, setView] = useState('landing'); // landing, login, dashboard
  const [user, setUser] = useState(null);

  // Restore session from localStorage on startup
  useEffect(() => {
    const storedUser = localStorage.getItem('mdsms_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
      } catch (e) {
        localStorage.removeItem('mdsms_user');
      }
    }

    // Global fetch interceptor to handle 401/403 gracefully and prevent JSON parse crashes on errors
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('mdsms_user');
          setUser(null);
          setView('landing');
          throw new Error("Session expired");
        }
      }
      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  const handleLoginSuccess = (userData) => {
    localStorage.setItem('mdsms_user', JSON.stringify(userData));
    setUser(userData);
    setView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('mdsms_user');
    setUser(null);
    setView('landing');
  };

  const handleBackToLanding = () => {
    setView('landing');
  };

  const handleGoToLogin = () => {
    if (user) {
      setView('dashboard');
    } else {
      setView('login');
    }
  };

  return (
    <div>
      {view === 'landing' && (
        <LandingPage 
          onLoginClick={handleGoToLogin} 
          user={user} 
        />
      )}
      
      {view === 'login' && (
        <Login 
          onLoginSuccess={handleLoginSuccess} 
          onBackClick={handleBackToLanding} 
        />
      )}

      {view === 'dashboard' && user && (
        <Dashboard 
          authData={user} 
          onLogout={handleLogout} 
        />
      )}
    </div>
  );
}
