import React, { useState } from 'react';
import { LogIn, ArrowLeft, Lock, User, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function Login({ onLoginSuccess, onBackClick }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    setLoading(true);
    setError('');

    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8080"}/api/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Identifiants invalides');
        }
        return data;
      })
      .then(data => {
        onLoginSuccess(data);
      })
      .catch(err => {
        setError(err.message || 'Impossible de se connecter au serveur backend.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleDemoLogin = (demoUser, demoPass) => {
    setUsername(demoUser);
    setPassword(demoPass);
    setLoading(true);
    setError('');

    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8080"}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: demoUser, password: demoPass })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Identifiants invalides');
        return data;
      })
      .then(data => onLoginSuccess(data))
      .catch(err => setError(err.message || 'Impossible de se connecter au serveur backend.'))
      .finally(() => setLoading(false));
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at center, #1b3d64 0%, #0b0f19 100%)',
      padding: '20px'
    }}>
      <div className="glass" style={{
        padding: '40px',
        maxWidth: '450px',
        width: '100%',
        borderRadius: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        
        {/* Back Button */}
        <button 
          onClick={onBackClick}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
            marginBottom: '24px',
            transition: 'color 0.2s',
            background: 'none',
            border: 'none',
            cursor: 'pointer'
          }}
          className="post-hover"
        >
          <ArrowLeft size={16} /> Retour à l'accueil
        </button>

        {/* Branding header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: 'rgba(212, 175, 55, 0.1)',
            border: '2px solid var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent)',
            margin: '0 auto 16px auto'
          }}>
            <LogIn size={26} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', margin: 0 }}>Connexion Espace</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Auto École Karima (Salé)</span>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid var(--danger)',
            borderRadius: '12px',
            padding: '12px 16px',
            color: '#fca5a5',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '24px'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          
          <div className="form-group">
            <label htmlFor="username" style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nom d'utilisateur</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                id="username"
                className="form-control" 
                placeholder="Ex: admin / karima"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ paddingLeft: '44px', width: '100%', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '32px', marginTop: '16px' }}>
            <label htmlFor="password" style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Mot de passe</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
              <input 
                type="password" 
                id="password"
                className="form-control" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '44px', width: '100%', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '14px', fontSize: '1rem', cursor: 'pointer' }}
            disabled={loading}
          >
            {loading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>

        {/* DEMO ACCESS FOR PORTFOLIO */}
        <div style={{ marginTop: '32px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '24px' }}>
          <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--accent)', marginBottom: '16px', fontWeight: 'bold' }}>
            Accès rapide (Mode Portfolio) :
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button 
              type="button" 
              onClick={() => handleDemoLogin('admin', 'admin123')}
              className="btn" 
              style={{ padding: '8px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
              disabled={loading}
            >
              👑 Admin
            </button>
            <button 
              type="button" 
              onClick={() => handleDemoLogin('karima', 'karima123')}
              className="btn" 
              style={{ padding: '8px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
              disabled={loading}
            >
              👩‍💼 Assistant
            </button>
            <button 
              type="button" 
              onClick={() => handleDemoLogin('youssef', 'youssef123')}
              className="btn" 
              style={{ padding: '8px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
              disabled={loading}
            >
              🚗 Moniteur
            </button>
            <button 
              type="button" 
              onClick={() => handleDemoLogin('student1', 'student123')}
              className="btn" 
              style={{ padding: '8px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
              disabled={loading}
            >
              🎓 Candidat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
