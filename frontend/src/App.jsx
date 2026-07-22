import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

// Error Boundary Component to prevent solid blue blank screens on React errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("React Error Boundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    localStorage.removeItem('mdsms_user');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(circle at center, #1b3d64 0%, #0b0f19 100%)',
          color: 'white',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div className="glass" style={{ padding: '40px', maxWidth: '520px', width: '100%', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', marginBottom: '12px' }}>
              Une erreur inattendue est survenue
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: 1.5 }}>
              L'affichage de l'application a rencontré un problème. Vous pouvez réinitialiser la session pour revenir proprement à la page d'accueil ou de connexion.
            </p>
            <button
              onClick={this.handleReset}
              className="btn btn-primary"
              style={{ padding: '12px 24px', fontSize: '0.95rem', width: '100%', cursor: 'pointer' }}
            >
              🔄 Réinitialiser la session & Connexion
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

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

    // Global fetch interceptor to handle 401/403 gracefully and prevent crashes
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('mdsms_user');
          setUser(null);
          setView('landing');
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
    <ErrorBoundary>
      <div>
        {view === 'landing' && (
          <LandingPage 
            onLoginClick={handleGoToLogin} 
            onLogout={handleLogout}
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
    </ErrorBoundary>
  );
}
