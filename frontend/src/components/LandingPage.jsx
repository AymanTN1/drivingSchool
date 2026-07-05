import React, { useState, useEffect } from 'react';
import { Monitor, Phone, MapPin, CheckCircle, Clock, AlertTriangle, ArrowRight, User, Star, Award, ThumbsUp, ChevronLeft, ChevronRight } from 'lucide-react';

export default function LandingPage({ onLoginClick, user }) {
  const [pcStatus, setPcStatus] = useState({
    totalPosts: 15,
    occupiedCount: 6,
    freeCount: 9,
    posts: Array.from({ length: 15 }, (_, i) => ({
      postNumber: i + 1,
      occupied: [2, 4, 7, 9, 12, 14].includes(i + 1)
    }))
  });

  const [bookingModal, setBookingModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [ratingsData, setRatingsData] = useState(null);
  const [reviewSlide, setReviewSlide] = useState(0);

  // Auto-advance carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setReviewSlide(prev => {
        if (!ratingsData?.recentReviews?.length) return 0;
        return (prev + 1) % ratingsData.recentReviews.length;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [ratingsData]);

  useEffect(() => {
    // Fetch real-time status from backend
    fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/public/pc-posts`)
      .then(res => res.json())
      .then(data => { if (data.posts) setPcStatus(data); })
      .catch(() => {});

    // Fetch public moniteur ratings
    fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/public/moniteurs-ratings`)
      .then(res => res.json())
      .then(data => setRatingsData(data))
      .catch(() => {});
  }, []);

  const handlePostClick = (postNumber, occupied) => {
    if (occupied) return;
    setSelectedPost(postNumber);
    setBookingModal(true);
  };

  return (
    <div className="landing-body" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header className="landing-header" style={{ position: 'sticky', top: 0, zIndex: 100, padding: '15px 5%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '45px', height: '45px', borderRadius: '50%', backgroundColor: '#0f2a4a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d4af37', fontWeight: 'bold', border: '2px solid #d4af37' }}>
              AK
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', color: '#0f2a4a', fontWeight: 'bold' }}>AUTO ÉCOLE KARIMA</h2>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Chez Chakib (عند شكيب)</span>
            </div>
          </div>

          <nav style={{ display: 'flex', alignItems: 'center', gap: '24px', fontWeight: 500 }}>
            <a href="#accueil" style={{ color: '#0f2a4a' }}>Accueil</a>
            <a href="#formations" style={{ color: '#64748b' }}>Nos Formations</a>
            <a href="#tarifs" style={{ color: '#64748b' }}>Tarifs</a>
            <a href="#equipe" style={{ color: '#64748b' }}>Notre Équipe</a>
            <a href="#avis" style={{ color: '#d4af37', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
              ⭐ Avis Élèves
              {ratingsData?.globalStats?.overallAverage > 0 && (
                <span style={{ background: '#d4af37', color: '#0f2a4a', fontSize: '0.7rem', padding: '1px 6px', borderRadius: '999px', fontWeight: 'bold' }}>
                  {ratingsData.globalStats.overallAverage}/5
                </span>
              )}
            </a>
            {user ? (
              <button
                onClick={onLoginClick}
                className="btn btn-primary"
                style={{ padding: '8px 20px', fontSize: '0.9rem' }}
              >
                Mon Espace ({user.fullName})
              </button>
            ) : (
              <button
                onClick={onLoginClick}
                className="btn btn-primary"
                style={{ padding: '8px 20px', fontSize: '0.9rem' }}
              >
                Se Connecter
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section id="accueil" className="landing-hero" style={{ padding: '80px 5% 100px 5%', flex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '50px', alignItems: 'center' }}>

          {/* Left Text */}
          <div>
            <h1 style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '24px' }}>
              Votre Permis de Conduire au Maroc avec l'Excellence
            </h1>
            <p style={{ fontSize: '1.2rem', opacity: 0.9, marginBottom: '32px', lineHeight: 1.6 }}>
              Formation théorique et pratique personnalisée. Suivi de dossier NARSA en temps réel et réservation de vos heures en un clic.
            </p>

            <div style={{ display: 'flex', gap: '16px' }}>
              <a href="#inscription" className="btn btn-primary pulse-button" style={{ padding: '14px 28px', fontSize: '1rem' }}>
                Réserver ma séance d'apprentissage <ArrowRight size={18} />
              </a>
            </div>

            {/* Custom CSS animated track display */}
            <div style={{ marginTop: '50px', position: 'relative', height: '120px', width: '100%', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ position: 'absolute', bottom: '15px', width: '100%', height: '4px', borderBottom: '2px dashed rgba(255,255,255,0.3)' }}></div>
              <div className="animated-car" style={{ position: 'absolute', bottom: '20px', left: '15%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {/* Clean inline SVG Car (representing the Peugeot 208) */}
                <svg width="80" height="40" viewBox="0 0 80 40">
                  <path d="M10,25 Q10,15 25,12 L50,12 Q65,15 70,25 L75,25 Q77,25 77,28 L74,33 Q72,35 68,35 L12,35 Q8,35 6,33 L3,28 Q3,25 5,25 Z" fill="#ffffff" />
                  <path d="M25,15 L48,15 L48,22 L17,22 Z" fill="#0f2a4a" />
                  <path d="M52,15 L62,18 L60,22 L52,22 Z" fill="#0f2a4a" />
                  <circle cx="20" cy="34" r="7" fill="#1e293b" stroke="#fff" strokeWidth="2" />
                  <circle cx="60" cy="34" r="7" fill="#1e293b" stroke="#fff" strokeWidth="2" />
                  <rect x="30" y="27" width="22" height="4" fill="#d4af37" rx="1" />
                </svg>
                <span style={{ fontSize: '0.65rem', color: '#d4af37', fontWeight: 'bold', marginTop: '2px', background: '#0f2a4a', padding: '1px 6px', borderRadius: '4px' }}>CHEZ CHAKIB</span>
              </div>
              <div style={{ position: 'absolute', top: '15px', right: '15%', padding: '6px 12px', background: 'rgba(212, 175, 55, 0.2)', border: '1px solid #d4af37', borderRadius: '8px', color: '#f4d068', fontSize: '0.75rem', fontWeight: 600 }}>
                Hay Karima, Salé
              </div>
            </div>
          </div>

          {/* Right Live PC Booking Matrix Panel */}
          <div id="postes" className="glass" style={{ padding: '30px', background: 'rgba(255,255,255,0.95)', color: '#0f2a4a', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Monitor size={22} className="text-primary" /> Postes d'Apprentissage en Temps Réel
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>
                  Évitez les heures d'affluence. Réservez votre ordinateur de code Rousseau à l'avance.
                </p>
              </div>
            </div>

            {/* Counts metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px', textAlign: 'center' }}>
              <div style={{ padding: '10px', background: '#f1f5f9', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', fontWeight: 600 }}>Postes Totaux</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{pcStatus.totalPosts}</span>
              </div>
              <div style={{ padding: '10px', background: '#fef2f2', borderRadius: '8px', borderLeft: '3px solid #ef4444' }}>
                <span style={{ fontSize: '0.75rem', color: '#ef4444', display: 'block', fontWeight: 600 }}>Occupés</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#ef4444' }}>{pcStatus.occupiedCount}</span>
              </div>
              <div style={{ padding: '10px', background: '#ecfdf5', borderRadius: '8px', borderLeft: '3px solid #10b981' }}>
                <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'block', fontWeight: 600 }}>Libres</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#10b981' }}>{pcStatus.freeCount}</span>
              </div>
            </div>

            {/* PCs Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '24px' }}>
              {pcStatus.posts.map(post => (
                <div
                  key={post.postNumber}
                  onClick={() => handlePostClick(post.postNumber, post.occupied)}
                  style={{
                    padding: '12px 6px',
                    borderRadius: '10px',
                    border: '1px solid',
                    borderColor: post.occupied ? '#fca5a5' : '#86efac',
                    backgroundColor: post.occupied ? '#fee2e2' : '#hnf',
                    background: post.occupied ? '#fee2e2' : '#f0fdf4',
                    cursor: post.occupied ? 'not-allowed' : 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                  className="post-hover"
                >
                  <Monitor size={18} style={{ color: post.occupied ? '#ef4444' : '#10b981', display: 'block', margin: '0 auto 4px auto' }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: post.occupied ? '#b91c1c' : '#15803d' }}>
                    Poste {post.postNumber}
                  </span>
                  <div style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: post.occupied ? '#ef4444' : '#10b981'
                  }}></div>
                </div>
              ))}
            </div>

            <button onClick={onLoginClick} className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
              Réserver un Poste
            </button>
          </div>

        </div>
      </section>

      {/* Info Sections */}
      <section id="formations" style={{ padding: '80px 5%', background: '#ffffff', color: '#1e293b' }}>
        <h2 style={{ textAlign: 'center', color: '#0f2a4a', fontSize: '2.25rem', fontWeight: 'bold', marginBottom: '16px' }}>
          Nos Formations de Conduite au Maroc
        </h2>
        <p style={{ textAlign: 'center', color: '#64748b', maxWidth: '600px', margin: '0 auto 50px auto' }}>
          Un parcours structuré pour acquérir les compétences théoriques et pratiques nécessaires dans le respect du code de la route marocain.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px' }}>
          <div style={{ padding: '30px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ color: '#0f2a4a', fontWeight: 'bold', marginBottom: '12px' }}>Code de la Route (Théorie)</h3>
            <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '20px' }}>
              Accès illimité à nos 15 postes d'apprentissage équipés des séries de simulation officielles. Apprentissage encadré par notre assistante.
            </p>
            <span style={{ color: '#d4af37', fontWeight: 'bold' }}>Option incluse par défaut</span>
          </div>

          <div style={{ padding: '30px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ color: '#0f2a4a', fontWeight: 'bold', marginBottom: '12px' }}>Pratique (Conduite)</h3>
            <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '20px' }}>
              Séances de conduite individuelle avec moniteur breveté à bord de nos Peugeot 208 double-commande. Planification régulée par semaine.
            </p>
            <span style={{ color: '#d4af37', fontWeight: 'bold' }}>20 heures réglementaires</span>
          </div>

          <div style={{ padding: '30px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ color: '#0f2a4a', fontWeight: 'bold', marginBottom: '12px' }}>Dossier Admin & NARSA</h3>
            <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '20px' }}>
              Gestion complète de l'enregistrement NARSA, dépôt du dossier d'inscription physique et planification des dates d'examens officiels.
            </p>
            <span style={{ color: '#d4af37', fontWeight: 'bold' }}>Zéro tracas pour l'élève</span>
          </div>
        </div>
      </section>

      {/* CRM Prospect Form Section */}
      <section id="inscription" style={{ padding: '80px 5%', background: '#0f2a4a', color: 'white' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', background: 'rgba(255,255,255,0.05)', borderRadius: '24px', padding: '40px', border: '1px solid rgba(212,175,55,0.2)', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white', marginBottom: '10px' }}>
              Commencez votre apprentissage
            </h2>
            <p style={{ color: '#cbd5e1' }}>
              Laissez-nous vos coordonnées, notre assistante Karima vous contactera très rapidement pour finaliser votre inscription.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const data = Object.fromEntries(formData.entries());

              fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/public/prospects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
              })
                .then(res => res.json())
                .then(resData => {
                  alert(resData.message || 'Demande envoyée !');
                  e.target.reset();
                })
                .catch(err => alert("Erreur lors de l'envoi."));
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#cbd5e1' }}>Nom Complet</label>
                <input required type="text" name="fullName" placeholder="Ex: Yassine El Amrani" style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '1rem' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#cbd5e1' }}>Téléphone</label>
                <input required type="text" name="phone" placeholder="Ex: 06 12 34 56 78" style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '1rem' }} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#cbd5e1' }}>Permis Souhaité</label>
              <select name="licenseType" style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: '#1e293b', color: 'white', fontSize: '1rem' }}>
                <option value="B">Permis B (Voiture)</option>
                <option value="C">Permis C (Camion)</option>
                <option value="D">Permis D (Autocar)</option>
                <option value="A">Permis A (Moto)</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" style={{ padding: '14px', fontSize: '1.1rem', fontWeight: 'bold', marginTop: '10px' }}>
              Demander mon inscription
            </button>
          </form>
        </div>
      </section>

      {/* Team Section */}
      <section id="equipe" style={{ padding: '80px 5%', background: '#f8fafc', color: '#1e293b' }}>
        <h2 style={{ textAlign: 'center', color: '#0f2a4a', fontSize: '2.25rem', fontWeight: 'bold', marginBottom: '40px' }}>
          Notre Équipe Auto École Karima
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px', maxWidth: '1000px', margin: '0 auto' }}>
          {/* Director Chakib */}
          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', textAlign: 'center', padding: '24px' }}>
            <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#0f2a4a', margin: '0 auto 16px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <User size={45} />
            </div>
            <h3 style={{ color: '#0f2a4a', fontWeight: 'bold' }}>Chakib</h3>
            <span style={{ color: '#d4af37', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', display: 'block', margin: '4px 0 12px 0' }}>
              Directeur Propriétaire
            </span>
            <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.5 }}>
              Directeur de l'établissement assurant le management général, la flotte automobile et les agréments NARSA.
            </p>
          </div>

          {/* Moniteur Youssef */}
          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', textAlign: 'center', padding: '24px' }}>
            <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#e2e8f0', margin: '0 auto 16px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f2a4a' }}>
              <User size={45} />
            </div>
            <h3 style={{ color: '#0f2a4a', fontWeight: 'bold' }}>Youssef El Alami</h3>
            <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', display: 'block', margin: '4px 0 12px 0' }}>
              Moniteur Principal (Pratique)
            </span>
            <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.5 }}>
              Moniteur agréé d'enseignement de conduite théorique et pratique à Salé. À l'écoute et pédagogue.
            </p>
          </div>

          {/* Assistant Karima */}
          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', textAlign: 'center', padding: '24px' }}>
            <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#e2e8f0', margin: '0 auto 16px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f2a4a' }}>
              <User size={45} />
            </div>
            <h3 style={{ color: '#0f2a4a', fontWeight: 'bold' }}>Karima</h3>
            <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', display: 'block', margin: '4px 0 12px 0' }}>
              Assistante d'Accueil
            </span>
            <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.5 }}>
              Responsable administrative, inscriptions, caisse, et gestion du planning de conduite et postes PC.
            </p>
          </div>
        </div>
      </section>

      {/* ===== AVIS DE NOS ÉLÈVES ===== */}
      <section id="avis" style={{
        padding: '90px 5%',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f2a4a 100%)',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background decoration */}
        <div style={{
          position: 'absolute', top: '-60px', right: '-60px',
          width: '300px', height: '300px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        {/* Section header */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '999px', padding: '6px 18px', marginBottom: '16px' }}>
            <Star size={14} style={{ color: '#d4af37', fill: '#d4af37' }} />
            <span style={{ color: '#d4af37', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Vérifié par nos élèves</span>
          </div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: '800', color: 'white', marginBottom: '12px', lineHeight: 1.2 }}>
            Ce que disent <span style={{ color: '#d4af37' }}>nos élèves</span>
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '1rem', maxWidth: '500px', margin: '0 auto' }}>
            Des évaluations réelles, soumises directement depuis l'espace élève après chaque séance de conduite.
          </p>
        </div>

        {/* Global Stats Bar */}
        {ratingsData?.globalStats && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '20px', maxWidth: '800px', margin: '0 auto 60px auto'
          }}>
            {[
              {
                value: ratingsData.globalStats.overallAverage > 0 ? `${ratingsData.globalStats.overallAverage}/5` : '—',
                label: 'Note Moyenne',
                icon: '⭐',
                color: '#d4af37'
              },
              {
                value: ratingsData.globalStats.totalRatings > 0 ? `${ratingsData.globalStats.totalRatings}` : '0',
                label: 'Avis Déposés',
                icon: '💬',
                color: '#60a5fa'
              },
              {
                value: ratingsData.globalStats.satisfactionPct > 0 ? `${ratingsData.globalStats.satisfactionPct}%` : '—',
                label: 'Élèves Satisfaits',
                icon: '👍',
                color: '#4ade80'
              },
            ].map((stat, i) => (
              <div key={i} style={{
                textAlign: 'center', padding: '28px 20px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '16px',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '6px' }}>{stat.icon}</div>
                <div style={{ fontSize: '2.2rem', fontWeight: '800', color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Moniteur cards */}
        {ratingsData?.moniteurs?.length > 0 && (
          <div style={{ marginBottom: '60px' }}>
            <h3 style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '28px' }}>
              🏆 Nos Moniteurs — Classement par Satisfaction
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center' }}>
              {ratingsData.moniteurs.map((m, idx) => (
                <div key={idx} style={{
                  background: idx === 0
                    ? 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))'
                    : 'rgba(255,255,255,0.03)',
                  border: idx === 0 ? '1px solid rgba(212,175,55,0.4)' : '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '16px', padding: '24px 28px',
                  minWidth: '220px', textAlign: 'center',
                  position: 'relative'
                }}>
                  {idx === 0 && (
                    <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#d4af37', color: '#0f172a', fontSize: '0.7rem', fontWeight: 'bold', padding: '3px 12px', borderRadius: '999px' }}>
                      🥇 Meilleur Moniteur
                    </div>
                  )}
                  <div style={{
                    width: '60px', height: '60px', borderRadius: '50%',
                    background: idx === 0 ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.06)',
                    border: idx === 0 ? '2px solid rgba(212,175,55,0.5)' : '1px solid rgba(255,255,255,0.1)',
                    margin: '0 auto 12px auto',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.4rem'
                  }}>
                    👨‍🏫
                  </div>
                  <div style={{ color: 'white', fontWeight: '700', fontSize: '1rem', marginBottom: '8px' }}>{m.name}</div>
                  <div style={{ display: 'flex', gap: '3px', justifyContent: 'center', marginBottom: '8px' }}>
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={16} style={{
                        color: s <= Math.round(m.averageRating) ? '#d4af37' : '#1e293b',
                        fill: s <= Math.round(m.averageRating) ? '#d4af37' : 'none'
                      }} />
                    ))}
                  </div>
                  <div style={{ color: '#d4af37', fontWeight: '700', fontSize: '1.3rem' }}>
                    {m.averageRating.toFixed(1)}
                    <span style={{ color: '#64748b', fontWeight: 'normal', fontSize: '0.8rem' }}>/5</span>
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '4px' }}>
                    {m.totalRatings} avis · {m.totalSessions} séances
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Testimonials Carousel */}
        {ratingsData?.recentReviews?.length > 0 && (
          <div style={{ maxWidth: '750px', margin: '0 auto', position: 'relative' }}>
            <h3 style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '28px' }}>
              💬 Derniers Témoignages
            </h3>

            {/* Active review */}
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(212,175,55,0.15)',
              borderRadius: '20px', padding: '36px',
              textAlign: 'center',
              minHeight: '180px',
              transition: 'all 0.4s ease'
            }}>
              <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginBottom: '16px' }}>
                {[1,2,3,4,5].map(s => (
                  <Star key={s} size={20} style={{
                    color: s <= (ratingsData.recentReviews[reviewSlide]?.rating || 0) ? '#d4af37' : '#1e293b',
                    fill: s <= (ratingsData.recentReviews[reviewSlide]?.rating || 0) ? '#d4af37' : 'none'
                  }} />
                ))}
              </div>
              <p style={{ color: '#e2e8f0', fontSize: '1.05rem', fontStyle: 'italic', lineHeight: 1.7, marginBottom: '20px' }}>
                "{ratingsData.recentReviews[reviewSlide]?.comment}"
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{ color: '#d4af37', fontWeight: '600', fontSize: '0.95rem' }}>
                  {ratingsData.recentReviews[reviewSlide]?.candidateFirstName}
                </div>
                <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
                  Élève de {ratingsData.recentReviews[reviewSlide]?.moniteurName} · {ratingsData.recentReviews[reviewSlide]?.lessonType}
                </div>
              </div>
            </div>

            {/* Carousel controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '20px' }}>
              <button
                onClick={() => setReviewSlide(prev => prev === 0 ? ratingsData.recentReviews.length - 1 : prev - 1)}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
              >
                <ChevronLeft size={18} />
              </button>
              {/* Dots */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {ratingsData.recentReviews.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setReviewSlide(i)}
                    style={{
                      width: i === reviewSlide ? '20px' : '8px', height: '8px',
                      borderRadius: '999px',
                      background: i === reviewSlide ? '#d4af37' : 'rgba(255,255,255,0.2)',
                      border: 'none', cursor: 'pointer',
                      transition: 'all 0.3s ease', padding: 0
                    }}
                  />
                ))}
              </div>
              <button
                onClick={() => setReviewSlide(prev => (prev + 1) % ratingsData.recentReviews.length)}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Fallback when no data */}
        {(!ratingsData || (ratingsData.moniteurs?.length === 0 && ratingsData.recentReviews?.length === 0)) && (
          <div style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>
            <Star size={32} style={{ margin: '0 auto 12px auto', display: 'block' }} />
            <p>Les avis seront affichés ici après les premières séances.</p>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer style={{ padding: '60px 5% 30px 5%', background: '#0a0f18', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '40px' }}>

          {/* Contact Details */}
          <div>
            <h3 style={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '20px' }}>AUTO ÉCOLE KARIMA</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MapPin size={18} style={{ color: '#d4af37' }} />
                NO 97, HAY KARIMA RUE ZARDAL, SALÉ 11000, MAROC
              </p>
              <p style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Phone size={18} style={{ color: '#d4af37' }} />
                +212 537 35 33 53 / +212 652 50 38 42
              </p>
              <p style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Clock size={18} style={{ color: '#d4af37' }} />
                Lundi - Samedi : 08:30 - 19:30
              </p>
            </div>
          </div>

          {/* Embedded Google Maps locator */}
          <div>
            <h3 style={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '20px' }}>Localisation Google Maps</h3>
            <div style={{ borderRadius: '12px', overflow: 'hidden', height: '180px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <iframe
                src="https://maps.google.com/maps?q=NO%2097,%20HAY%20KARIMA%20RUE%20ZARDAL,%20SAL%C3%89%2011000,%20MAROC&t=&z=16&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Google Maps Location - Auto Ecole Karima"
              ></iframe>
            </div>
          </div>

        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px', textAlign: 'center', fontSize: '0.8rem' }}>
          &copy; {new Date().getFullYear()} Auto École Karima. Tous droits réservés.
        </div>
      </footer>

      {/* Booking Dialog alert */}
      {bookingModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass" style={{ background: '#1e293b', padding: '30px', maxWidth: '450px', width: '90%', borderRadius: '16px', color: 'white', textAlign: 'center' }}>
            <AlertTriangle size={48} style={{ color: '#d4af37', margin: '0 auto 16px auto' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '10px' }}>Authentification Requise</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '24px' }}>
              Pour réserver le **Poste d'apprentissage #{selectedPost}**, vous devez être inscrit à l'auto-école et connecté à votre espace candidat.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => { setBookingModal(false); onLoginClick(); }}
                className="btn btn-primary"
                style={{ padding: '10px 20px' }}
              >
                Se Connecter
              </button>
              <button
                onClick={() => setBookingModal(false)}
                className="btn btn-secondary"
                style={{ padding: '10px 20px' }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
