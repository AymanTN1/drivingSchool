import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import { 
  UserPlus, Car, DollarSign, Calendar, AlertCircle, FileText, CheckCircle2, Star, 
  TrendingUp, Users, Shield, LogOut, CheckSquare, PlusCircle, Printer, X, ShieldAlert 
} from 'lucide-react';

export default function Dashboard({ authData, onLogout }) {
  const { token, role, fullName } = authData;
  const [activeTab, setActiveTab] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', msg: '' });

  // Common data states
  const [candidates, setCandidates] = useState([]);
  const [moniteurs, setMoniteurs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  
  // Role specific states
  const [analytics, setAnalytics] = useState(null);
  const [candidateData, setCandidateData] = useState(null);
  const [moniteurLessons, setMoniteurLessons] = useState([]);

  // Modal print view
  const [contractToPrint, setContractToPrint] = useState(null);

  // Fetching context data based on Role
  useEffect(() => {
    // Set initial tab based on role
    if (role === 'ADMIN') setActiveTab('analytics');
    else if (role === 'ASSISTANT') setActiveTab('candidates');
    else if (role === 'MONITEUR') setActiveTab('moniteur-lessons');
    else if (role === 'CANDIDATE') setActiveTab('candidate-progress');

    fetchDropdowns();
    refreshData();
  }, [role]);

  const fetchDropdowns = () => {
    // Fetch instructors list for assignments
    fetch('http://localhost:8080/api/admin/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        const mons = data.filter(u => u.role === 'MONITEUR');
        setMoniteurs(mons);
      })
      .catch(err => console.log('Error fetching moniteurs', err));

    fetch('http://localhost:8080/api/assistant/fleet', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setVehicles(data))
      .catch(err => console.log('Error fetching fleet', err));
  };

  const refreshData = () => {
    setLoading(true);
    const headers = { 'Authorization': `Bearer ${token}` };

    if (role === 'ADMIN') {
      fetch('http://localhost:8080/api/admin/analytics', { headers })
        .then(res => res.json())
        .then(data => setAnalytics(data))
        .catch(err => console.log('Error fetching analytics', err))
        .finally(() => setLoading(false));
    } else if (role === 'ASSISTANT') {
      // Fetch candidates list
      fetch('http://localhost:8080/api/assistant/candidates', { headers })
        .then(res => res.json())
        .then(data => setCandidates(data))
        .catch(err => console.log('Error fetching candidates', err));

      // Fetch transaction list
      fetch('http://localhost:8080/api/assistant/caisse', { headers })
        .then(res => res.json())
        .then(data => setTransactions(data))
        .catch(err => console.log('Error fetching caisse', err));

      // Fetch alerts list
      fetch('http://localhost:8080/api/assistant/alerts', { headers })
        .then(res => res.json())
        .then(data => setAlerts(data))
        .catch(err => console.log('Error fetching alerts', err))
        .finally(() => setLoading(false));
    } else if (role === 'MONITEUR') {
      fetch('http://localhost:8080/api/moniteur/lessons', { headers })
        .then(res => res.json())
        .then(data => setMoniteurLessons(data))
        .catch(err => console.log('Error fetching moniteur lessons', err))
        .finally(() => setLoading(false));
    } else if (role === 'CANDIDATE') {
      fetch('http://localhost:8080/api/candidate/lessons', { headers })
        .then(res => res.json())
        .then(data => setCandidateData(data))
        .catch(err => console.log('Error fetching candidate data', err))
        .finally(() => setLoading(false));
    }
  };

  const triggerFeedback = (type, msg) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback({ type: '', msg: '' }), 5000);
  };

  // --- ACTIONS ---

  // ADMIN Action: Create Staff User
  const handleCreateStaff = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    fetch('http://localhost:8080/api/admin/users', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
      .then(async (res) => {
        const resData = await res.json();
        if (!res.ok) throw new Error(resData.message || 'Erreur lors de la création');
        triggerFeedback('success', resData.message);
        e.target.reset();
        fetchDropdowns();
      })
      .catch(err => triggerFeedback('danger', err.message));
  };

  // ADMIN Action: Create Vehicle
  const handleCreateVehicle = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    fetch('http://localhost:8080/api/admin/vehicles', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
      .then(async (res) => {
        const resData = await res.json();
        if (!res.ok) throw new Error(resData.message || 'Erreur lors de la création');
        triggerFeedback('success', resData.message);
        e.target.reset();
        fetchDropdowns();
      })
      .catch(err => triggerFeedback('danger', err.message));
  };

  // ASSISTANT Action: Enroll Candidate
  const handleEnrollCandidate = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    // Parse numeric/date fields
    data.totalAmount = parseFloat(data.totalAmount);
    data.amountPaid = parseFloat(data.amountPaid);
    data.maxWeeklyLessons = parseInt(data.maxWeeklyLessons);
    if (data.assignedMoniteurId) {
      data.assignedMoniteurId = parseInt(data.assignedMoniteurId);
    } else {
      delete data.assignedMoniteurId;
    }

    fetch('http://localhost:8080/api/assistant/candidates', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
      .then(async (res) => {
        const resData = await res.json();
        if (!res.ok) throw new Error(resData.message || "Erreur lors de l'inscription");
        triggerFeedback('success', resData.message);
        e.target.reset();
        refreshData();
      })
      .catch(err => triggerFeedback('danger', err.message));
  };

  // ASSISTANT Action: Log Caisse Transaction
  const handleRecordTransaction = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    data.amount = parseFloat(data.amount);
    if (data.candidateId) {
      data.candidateId = parseInt(data.candidateId);
    } else {
      delete data.candidateId;
    }

    fetch('http://localhost:8080/api/assistant/caisse', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
      .then(async (res) => {
        const resData = await res.json();
        if (!res.ok) throw new Error(resData.message || 'Erreur lors du dépôt');
        triggerFeedback('success', resData.message);
        e.target.reset();
        refreshData();
      })
      .catch(err => triggerFeedback('danger', err.message));
  };

  // ASSISTANT Action: Book NARSA Exam (Quota + Balance block rule)
  const handleScheduleExam = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    const candId = data.candidateId;
    const examDate = data.examDate;

    fetch(`http://localhost:8080/api/assistant/candidates/${candId}/exam`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ examDate })
    })
      .then(async (res) => {
        const resData = await res.json();
        if (!res.ok) throw new Error(resData.message || 'Erreur lors de la planification');
        triggerFeedback('success', resData.message);
        e.target.reset();
        refreshData();
      })
      .catch(err => triggerFeedback('danger', err.message));
  };

  // MONITEUR Action: Log road practice completed
  const handleCompleteLesson = (lessonId, comments, rating) => {
    fetch(`http://localhost:8080/api/moniteur/lessons/${lessonId}/complete`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ comments, rating })
    })
      .then(async (res) => {
        const resData = await res.json();
        if (!res.ok) throw new Error(resData.message || 'Erreur');
        triggerFeedback('success', resData.message);
        refreshData();
      })
      .catch(err => triggerFeedback('danger', err.message));
  };

  // CANDIDATE Action: Book driving lesson (limited by weekly cap and vehicle checkups)
  const handleBookDriving = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    // Format date time to ISO
    const dateTime = `${data.date}T${data.time}:00`;

    fetch('http://localhost:8080/api/candidate/driving/reserve', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ slotDateTime: dateTime })
    })
      .then(async (res) => {
        const resData = await res.json();
        if (!res.ok) throw new Error(resData.message || 'Erreur lors de la réservation');
        triggerFeedback('success', resData.message);
        refreshData();
      })
      .catch(err => triggerFeedback('danger', err.message));
  };

  // CANDIDATE Action: Book learning post PC
  const handleBookPc = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    const dateTime = `${data.date}T${data.time}:00`;
    const postNumber = parseInt(data.postNumber);

    fetch('http://localhost:8080/api/candidate/pc-posts/reserve', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ slotDateTime: dateTime, postNumber })
    })
      .then(async (res) => {
        const resData = await res.json();
        if (!res.ok) throw new Error(resData.message || 'Erreur lors de la réservation');
        triggerFeedback('success', resData.message);
        refreshData();
      })
      .catch(err => triggerFeedback('danger', err.message));
  };

  // Render variables
  const COLORS = ['#d4af37', '#1e3b5a', '#10b981', '#ef4444'];

  return (
    <div className="dashboard-container">
      
      {/* Sidebar */}
      <aside className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a', fontWeight: 'bold' }}>
            AK
          </div>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'white' }}>ÉCOLE KARIMA</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>MDSMS Portails</span>
          </div>
        </div>

        {/* User Card */}
        <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '24px' }}>
          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Utilisateur</span>
          <span style={{ display: 'block', fontSize: '0.95rem', fontWeight: 600, color: 'white', marginTop: '2px' }}>{fullName}</span>
          <span className="badge badge-success" style={{ marginTop: '8px', fontSize: '0.65rem' }}>
            <Shield size={10} style={{ marginRight: '4px' }} /> {role}
          </span>
        </div>

        {/* Navigation Tabs based on Role */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          {role === 'ADMIN' && (
            <>
              <button 
                onClick={() => setActiveTab('analytics')} 
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '8px', color: activeTab === 'analytics' ? 'white' : 'var(--text-muted)', background: activeTab === 'analytics' ? 'rgba(255,255,255,0.08)' : 'none', textAlign: 'left', fontSize: '0.9rem' }}
              >
                <TrendingUp size={16} /> Dashboard Analytics
              </button>
              <button 
                onClick={() => setActiveTab('staff-register')} 
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '8px', color: activeTab === 'staff-register' ? 'white' : 'var(--text-muted)', background: activeTab === 'staff-register' ? 'rgba(255,255,255,0.08)' : 'none', textAlign: 'left', fontSize: '0.9rem' }}
              >
                <UserPlus size={16} /> Créer Employés
              </button>
              <button 
                onClick={() => setActiveTab('fleet-register')} 
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '8px', color: activeTab === 'fleet-register' ? 'white' : 'var(--text-muted)', background: activeTab === 'fleet-register' ? 'rgba(255,255,255,0.08)' : 'none', textAlign: 'left', fontSize: '0.9rem' }}
              >
                <Car size={16} /> Gérer Véhicules
              </button>
            </>
          )}

          {role === 'ASSISTANT' && (
            <>
              <button 
                onClick={() => setActiveTab('candidates')} 
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '8px', color: activeTab === 'candidates' ? 'white' : 'var(--text-muted)', background: activeTab === 'candidates' ? 'rgba(255,255,255,0.08)' : 'none', textAlign: 'left', fontSize: '0.9rem' }}
              >
                <Users size={16} /> Inscrire Candidats
              </button>
              <button 
                onClick={() => setActiveTab('exams-quota')} 
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '8px', color: activeTab === 'exams-quota' ? 'white' : 'var(--text-muted)', background: activeTab === 'exams-quota' ? 'rgba(255,255,255,0.08)' : 'none', textAlign: 'left', fontSize: '0.9rem' }}
              >
                <Calendar size={16} /> Inscrire Examens NARSA
              </button>
              <button 
                onClick={() => setActiveTab('caisse')} 
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '8px', color: activeTab === 'caisse' ? 'white' : 'var(--text-muted)', background: activeTab === 'caisse' ? 'rgba(255,255,255,0.08)' : 'none', textAlign: 'left', fontSize: '0.9rem' }}
              >
                <DollarSign size={16} /> Caisse Journalière
              </button>
              <button 
                onClick={() => setActiveTab('alerts')} 
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '8px', color: activeTab === 'alerts' ? 'white' : 'var(--text-muted)', background: activeTab === 'alerts' ? 'rgba(255,255,255,0.08)' : 'none', textAlign: 'left', fontSize: '0.9rem' }}
              >
                <ShieldAlert size={16} /> Alertes Échéances
              </button>
            </>
          )}

          {role === 'MONITEUR' && (
            <>
              <button 
                onClick={() => setActiveTab('moniteur-lessons')} 
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '8px', color: activeTab === 'moniteur-lessons' ? 'white' : 'var(--text-muted)', background: activeTab === 'moniteur-lessons' ? 'rgba(255,255,255,0.08)' : 'none', textAlign: 'left', fontSize: '0.9rem' }}
              >
                <Calendar size={16} /> Mes Heures Pratiques
              </button>
            </>
          )}

          {role === 'CANDIDATE' && (
            <>
              <button 
                onClick={() => setActiveTab('candidate-progress')} 
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '8px', color: activeTab === 'candidate-progress' ? 'white' : 'var(--text-muted)', background: activeTab === 'candidate-progress' ? 'rgba(255,255,255,0.08)' : 'none', textAlign: 'left', fontSize: '0.9rem' }}
              >
                <TrendingUp size={16} /> Ma Progression & Solde
              </button>
              <button 
                onClick={() => setActiveTab('candidate-book-pc')} 
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '8px', color: activeTab === 'candidate-book-pc' ? 'white' : 'var(--text-muted)', background: activeTab === 'candidate-book-pc' ? 'rgba(255,255,255,0.08)' : 'none', textAlign: 'left', fontSize: '0.9rem' }}
              >
                <Monitor size={16} /> Réserver Poste PC
              </button>
              <button 
                onClick={() => setActiveTab('candidate-book-driving')} 
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '8px', color: activeTab === 'candidate-book-driving' ? 'white' : 'var(--text-muted)', background: activeTab === 'candidate-book-driving' ? 'rgba(255,255,255,0.08)' : 'none', textAlign: 'left', fontSize: '0.9rem' }}
              >
                <Car size={16} /> Réserver Conduite
              </button>
            </>
          )}
        </nav>

        {/* Logout */}
        <button 
          onClick={onLogout}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '8px', color: '#fca5a5', marginTop: '20px', textAlign: 'left', fontSize: '0.9rem' }}
          className="post-hover"
        >
          <LogOut size={16} /> Se Déconnecter
        </button>
      </aside>

      {/* Main content body */}
      <main className="dashboard-content">
        
        {/* Feedback alert toast banner */}
        {feedback.msg && (
          <div style={{
            padding: '12px 24px',
            borderRadius: '12px',
            backgroundColor: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${feedback.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
            color: feedback.type === 'success' ? '#86efac' : '#fca5a5',
            marginBottom: '24px',
            fontWeight: 500
          }}>
            {feedback.msg}
          </div>
        )}

        {/* 1. ADMIN TAB: Analytics (étudier les périodes d'années et d'examens) */}
        {activeTab === 'analytics' && analytics && (
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '24px', color: 'white' }}>
              Tableau Analytique de la Demande
            </h2>

            {/* Quick stats figures */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
              <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(212,175,55,0.1)', color: 'var(--accent)' }}><Users /></div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Candidats Inscrits</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>{analytics.kpi.totalCandidates}</span>
                </div>
              </div>
              <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(16,185,129,0.1)', color: 'var(--success)' }}><Car /></div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Véhicules Actifs</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>{analytics.kpi.totalVehicles}</span>
                </div>
              </div>
              <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}><DollarSign /></div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Recettes Caisse</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>{analytics.financesOverview.recettes} DH</span>
                </div>
              </div>
              <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)' }}><AlertCircle /></div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Reliquats Restants</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>{analytics.financesOverview.reliquats} DH</span>
                </div>
              </div>
            </div>

            {/* Graphs grid */}
            <div className="grid-2">
              
              {/* Seasonality analysis of inscriptions */}
              <div className="card">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white', marginBottom: '20px' }}>
                  Évolution de la Demande (Inscriptions par Mois)
                </h3>
                <div style={{ height: '260px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.registrationsDemand}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" stroke="var(--text-muted)" />
                      <YAxis stroke="var(--text-muted)" />
                      <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: 'white' }} />
                      <Bar dataKey="inscriptions" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Monthly revenue graphs */}
              <div className="card">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white', marginBottom: '20px' }}>
                  Flux de Trésorerie Mensuelle (Revenus de caisse)
                </h3>
                <div style={{ height: '260px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.financeTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" stroke="var(--text-muted)" />
                      <YAxis stroke="var(--text-muted)" />
                      <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: 'white' }} />
                      <Line type="monotone" dataKey="recettes" stroke="var(--success)" strokeWidth={3} dot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Exam scheduling trends over the year */}
              <div className="card">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white', marginBottom: '20px' }}>
                  Planification des Examens NARSA
                </h3>
                <div style={{ height: '260px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.examSchedules}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" stroke="var(--text-muted)" />
                      <YAxis stroke="var(--text-muted)" />
                      <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: 'white' }} />
                      <Bar dataKey="examens" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Financial collections breakdown */}
              <div className="card">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white', marginBottom: '20px' }}>
                  Répartition des Finances Globale
                </h3>
                <div style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Revenus Encaissés', value: analytics.financesOverview.recettes },
                          { name: 'Reliquats à Recevoir', value: analytics.financesOverview.reliquats }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="var(--success)" />
                        <Cell fill="var(--danger)" />
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 2. ADMIN TAB: Staff registering form */}
        {activeTab === 'staff-register' && (
          <div className="card" style={{ maxWidth: '700px', margin: '0 auto' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserPlus className="text-accent" /> Créer un Compte pour le Personnel
            </h3>
            
            <form onSubmit={handleCreateStaff}>
              <div className="grid-2" style={{ marginBottom: 0 }}>
                <div className="form-group">
                  <label>Nom d'utilisateur login</label>
                  <input type="text" name="username" className="form-control" placeholder="Ex: fatima_accueil" required />
                </div>
                <div className="form-group">
                  <label>Mot de passe</label>
                  <input type="password" name="password" className="form-control" placeholder="••••••••" required />
                </div>
              </div>

              <div className="form-group">
                <label>Nom complet</label>
                <input type="text" name="fullName" className="form-control" placeholder="Ex: Fatima Zahra Alami" required />
              </div>

              <div className="grid-2" style={{ marginBottom: 0 }}>
                <div className="form-group">
                  <label>Adresse Email</label>
                  <input type="email" name="email" className="form-control" placeholder="staff@autoecole.ma" required />
                </div>
                <div className="form-group">
                  <label>Rôle Professionnel</label>
                  <select name="role" className="form-control" required>
                    <option value="ASSISTANT">Assistant d'Accueil</option>
                    <option value="MONITEUR">Moniteur de Conduite</option>
                  </select>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', marginTop: '10px' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--accent)', marginBottom: '16px' }}>Attributs supplémentaires pour Moniteur (Optionnel)</h4>
                
                <div className="grid-3">
                  <div className="form-group">
                    <label>Téléphone portable</label>
                    <input type="text" name="phone" className="form-control" placeholder="06XXXXXXXX" />
                  </div>
                  <div className="form-group">
                    <label>Numéro de CAP</label>
                    <input type="text" name="capNumber" className="form-control" placeholder="CAP-XXXX-XX" />
                  </div>
                  <div className="form-group">
                    <label>Date Expiration CAP</label>
                    <input type="date" name="capExpiryDate" className="form-control" />
                  </div>
                </div>

                <div className="form-group">
                  <label>Véhicule de conduite associé</label>
                  <select name="vehicleId" className="form-control">
                    <option value="">-- Aucun véhicule --</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.licensePlate})</option>
                    ))}
                  </select>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '20px' }}>
                Créer l'employé
              </button>
            </form>
          </div>
        )}

        {/* 3. ADMIN TAB: Vehicles fleet registry */}
        {activeTab === 'fleet-register' && (
          <div>
            <div className="grid-2">
              
              {/* Form to add vehicle */}
              <div className="card">
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <PlusCircle className="text-accent" /> Ajouter un Véhicule double-commande
                </h3>
                <form onSubmit={handleCreateVehicle}>
                  <div className="grid-2" style={{ marginBottom: 0 }}>
                    <div className="form-group">
                      <label>Marque</label>
                      <input type="text" name="brand" className="form-control" placeholder="Ex: Peugeot" required />
                    </div>
                    <div className="form-group">
                      <label>Modèle</label>
                      <input type="text" name="model" className="form-control" placeholder="Ex: 208" required />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Immatriculation (Plaque)</label>
                    <input type="text" name="licensePlate" className="form-control" placeholder="Ex: 12345-A-7" required />
                  </div>

                  <div className="grid-3">
                    <div className="form-group">
                      <label>Dernière Visite Technique</label>
                      <input type="date" name="lastTechnicalVisit" className="form-control" required />
                    </div>
                    <div className="form-group">
                      <label>Prochaine Visite Technique</label>
                      <input type="date" name="nextTechnicalVisit" className="form-control" required />
                    </div>
                    <div className="form-group">
                      <label>Expiration Assurance</label>
                      <input type="date" name="insuranceExpiryDate" className="form-control" required />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Expiration Vignette Taxe</label>
                    <input type="date" name="vignetteExpiryDate" className="form-control" required />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                    Enregistrer le Véhicule
                  </button>
                </form>
              </div>

              {/* Fleet List Display */}
              <div className="card">
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white', marginBottom: '20px' }}>
                  Flotte Auto École
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Marque/Modèle</th>
                        <th>Immatriculation</th>
                        <th>Prochaine VT</th>
                        <th>Vignette</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vehicles.map(v => {
                        const isVtExpired = new Date(v.nextTechnicalVisit) < new Date();
                        const isVigExpired = new Date(v.vignetteExpiryDate) < new Date();
                        return (
                          <tr key={v.id}>
                            <td>{v.brand} {v.model}</td>
                            <td><code style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>{v.licensePlate}</code></td>
                            <td>
                              <span style={{ color: isVtExpired ? 'var(--danger)' : 'var(--success)' }}>
                                {v.nextTechnicalVisit}
                              </span>
                            </td>
                            <td>
                              <span style={{ color: isVigExpired ? 'var(--danger)' : 'var(--success)' }}>
                                {v.vignetteExpiryDate}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {vehicles.length === 0 && (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Aucun véhicule dans la flotte.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 4. ASSISTANT TAB: Candidates Inscription & List */}
        {activeTab === 'candidates' && (
          <div>
            <div className="grid-2">
              
              {/* Inscription Form */}
              <div className="card">
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserPlus className="text-accent" /> Inscrire un Nouveau Candidat
                </h3>
                <form onSubmit={handleEnrollCandidate}>
                  <div className="grid-2" style={{ marginBottom: 0 }}>
                    <div className="form-group">
                      <label>Nom d'utilisateur (Login)</label>
                      <input type="text" name="username" className="form-control" placeholder="Ex: amine_tazi" required />
                    </div>
                    <div className="form-group">
                      <label>Mot de passe</label>
                      <input type="password" name="password" className="form-control" placeholder="••••••••" required />
                    </div>
                  </div>

                  <div className="grid-2" style={{ marginBottom: 0 }}>
                    <div className="form-group">
                      <label>Nom Complet</label>
                      <input type="text" name="fullName" className="form-control" placeholder="Ex: Amine Tazi" required />
                    </div>
                    <div className="form-group">
                      <label>N° de Téléphone</label>
                      <input type="text" name="phone" className="form-control" placeholder="06XXXXXXXX" required />
                    </div>
                  </div>

                  <div className="grid-2" style={{ marginBottom: 0 }}>
                    <div className="form-group">
                      <label>CIN</label>
                      <input type="text" name="cin" className="form-control" placeholder="Ex: G741234" required />
                    </div>
                    <div className="form-group">
                      <label>Date de Naissance</label>
                      <input type="date" name="birthDate" className="form-control" required />
                    </div>
                  </div>

                  <div className="grid-2" style={{ marginBottom: 0 }}>
                    <div className="form-group">
                      <label>N° Permis d'Apprendre</label>
                      <input type="text" name="permitNumber" className="form-control" placeholder="Ex: PERMIT-XXX" required />
                    </div>
                    <div className="form-group">
                      <label>Expiration Permis d'Apprendre</label>
                      <input type="date" name="permitExpiryDate" className="form-control" required />
                    </div>
                  </div>

                  <div className="grid-3">
                    <div className="form-group">
                      <label>Frais Total (DH)</label>
                      <input type="number" name="totalAmount" defaultValue="3550" className="form-control" required />
                    </div>
                    <div className="form-group">
                      <label>Avance Payée (DH)</label>
                      <input type="number" name="amountPaid" defaultValue="2000" className="form-control" required />
                    </div>
                    <div className="form-group">
                      <label>Max Conduites / Semaine</label>
                      <input type="number" name="maxWeeklyLessons" defaultValue="3" className="form-control" required />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Adresse Email</label>
                    <input type="email" name="email" className="form-control" placeholder="amine.tazi@gmail.com" required />
                  </div>

                  <div className="form-group">
                    <label>Affecter Moniteur</label>
                    <select name="assignedMoniteurId" className="form-control" required>
                      <option value="">-- Choisir un moniteur --</option>
                      {moniteurs.map(m => (
                        <option key={m.id} value={m.id}>{m.fullName}</option>
                      ))}
                    </select>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                    Inscrire et Générer Contrat
                  </button>
                </form>
              </div>

              {/* Candidates List display with contract print trigger */}
              <div className="card">
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white', marginBottom: '20px' }}>
                  Liste des Candidats
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Candidat</th>
                        <th>CIN / Tél</th>
                        <th>Moniteur</th>
                        <th>Payé / Total</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {candidates.map(c => (
                        <tr key={c.id}>
                          <td>
                            <strong style={{ color: 'white' }}>{c.user.fullName}</strong>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{c.user.email}</span>
                          </td>
                          <td>
                            <span>{c.cin}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{c.phone}</span>
                          </td>
                          <td>{c.assignedMoniteur ? c.assignedMoniteur.fullName : 'Non affecté'}</td>
                          <td>
                            <span style={{ color: c.totalAmount - c.amountPaid <= 0 ? 'var(--success)' : 'var(--warning)' }}>
                              {c.amountPaid} / {c.totalAmount} DH
                            </span>
                          </td>
                          <td>
                            <button 
                              onClick={() => setContractToPrint(c)} 
                              className="btn btn-secondary" 
                              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                              title="Générer Contrat Type PDF"
                            >
                              <Printer size={14} /> Imprimer
                            </button>
                          </td>
                        </tr>
                      ))}
                      {candidates.length === 0 && (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Aucun candidat enregistré.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 5. ASSISTANT TAB: Schedule Exams with Quotas & outstanding balance validation */}
        {activeTab === 'exams-quota' && (
          <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar className="text-accent" /> Planifier Examen Candidat (Quota NARSA)
            </h3>
            
            <div style={{ padding: '12px 16px', background: 'rgba(59,130,246,0.1)', border: '1px solid #3b82f6', borderRadius: '12px', color: '#93c5fd', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '24px' }}>
              <strong>Règles de validation NARSA :</strong>
              <ul style={{ marginLeft: '20px', marginTop: '6px' }}>
                <li>Le candidat doit avoir réglé la totalité de ses frais de formation (Reste = 0 DH).</li>
                <li>Le quota d'examens mensuel de l'auto-école (max 15 candidats par mois) ne doit pas être dépassé.</li>
              </ul>
            </div>

            <form onSubmit={handleScheduleExam}>
              <div className="form-group">
                <label>Sélectionner le candidat</label>
                <select name="candidateId" className="form-control" required>
                  <option value="">-- Choisir un candidat --</option>
                  {candidates.map(c => {
                    const remains = c.totalAmount - c.amountPaid;
                    return (
                      <option key={c.user.id} value={c.user.id}>
                        {c.user.fullName} (CIN: {c.cin}) — Reste à payer: {remains} DH
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="form-group">
                <label>Date de l'examen NARSA</label>
                <input type="date" name="examDate" className="form-control" required />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '20px' }}>
                Planifier et Réserver Examen
              </button>
            </form>
          </div>
        )}

        {/* 6. ASSISTANT TAB: Caisse transactions loggers */}
        {activeTab === 'caisse' && (
          <div>
            <div className="grid-2">
              
              {/* Log Transaction */}
              <div className="card">
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <DollarSign className="text-accent" /> Enregistrer une Recette de Caisse
                </h3>
                <form onSubmit={handleRecordTransaction}>
                  <div className="form-group">
                    <label>Montant (DH)</label>
                    <input type="number" name="amount" className="form-control" placeholder="Ex: 1500" required />
                  </div>

                  <div className="grid-2" style={{ marginBottom: 0 }}>
                    <div className="form-group">
                      <label>Mode de Paiement</label>
                      <select name="type" className="form-control" required>
                        <option value="CASH">Espèces</option>
                        <option value="CHECK">Chèque</option>
                        <option value="TRANSFER">Virement bancaire</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Lié au candidat (Optionnel)</label>
                      <select name="candidateId" className="form-control">
                        <option value="">-- Aucun --</option>
                        {candidates.map(c => (
                          <option key={c.user.id} value={c.user.id}>{c.user.fullName} (Reste: {c.totalAmount - c.amountPaid} DH)</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Description / Libellé</label>
                    <input type="text" name="description" className="form-control" placeholder="Avancement frais..." required />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                    Enregistrer dans la Caisse
                  </button>
                </form>
              </div>

              {/* Transactions grid */}
              <div className="card">
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white', marginBottom: '20px' }}>
                  Historique de la Caisse Journalière
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Date/Heure</th>
                        <th>Montant</th>
                        <th>Type</th>
                        <th>Libellé</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map(t => (
                        <tr key={t.id}>
                          <td>{new Date(t.date).toLocaleString()}</td>
                          <td><strong style={{ color: 'white' }}>{t.amount} DH</strong></td>
                          <td><span className="badge badge-success">{t.type}</span></td>
                          <td>{t.description}</td>
                        </tr>
                      ))}
                      {transactions.length === 0 && (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Aucune transaction enregistrée aujourd'hui.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 7. ASSISTANT TAB: Alerts list (VT, permit expiry warnings) */}
        {activeTab === 'alerts' && (
          <div className="card">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert className="text-danger" /> Alertes et Échéances Administratives
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {alerts.map((a, idx) => (
                <div 
                  key={idx}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    backgroundColor: a.status === 'RED' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    border: `1px solid ${a.status === 'RED' ? 'var(--danger)' : 'var(--warning)'}`,
                    color: a.status === 'RED' ? '#fca5a5' : '#fde047',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                  }}
                >
                  <AlertCircle size={24} style={{ flexShrink: 0 }} />
                  <div>
                    <strong style={{ color: 'white', display: 'block', fontSize: '0.95rem' }}>
                      [{a.type}] {a.target}
                    </strong>
                    <span style={{ fontSize: '0.85rem' }}>{a.details}</span>
                  </div>
                  <span 
                    className={`badge ${a.status === 'RED' ? 'badge-danger' : 'badge-warning'}`}
                    style={{ marginLeft: 'auto' }}
                  >
                    {a.status === 'RED' ? 'CRITIQUE' : 'AVERTISSEMENT'}
                  </span>
                </div>
              ))}
              {alerts.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <CheckCircle2 size={40} style={{ color: 'var(--success)', margin: '0 auto 12px auto' }} />
                  Toutes les échéances administratives, permis, visites techniques et CAP moniteurs sont en règle.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 8. MONITEUR TAB: Schedules list & grading checkoff */}
        {activeTab === 'moniteur-lessons' && (
          <div className="card">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white', marginBottom: '20px' }}>
              Mes Heures Pratiques Planifiées
            </h3>
            
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Date/Heure</th>
                    <th>Candidat / Tél</th>
                    <th>Véhicule</th>
                    <th>Statut</th>
                    <th>Commentaires</th>
                    <th>Note (1-5)</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {moniteurLessons.map(l => (
                    <tr key={l.id}>
                      <td>{new Date(l.slotDateTime).toLocaleString()}</td>
                      <td>
                        <strong style={{ color: 'white' }}>{l.candidate.fullName}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Ref: {l.candidate.username}</span>
                      </td>
                      <td>{l.vehicle ? `${l.vehicle.brand} ${l.vehicle.model} (${l.vehicle.licensePlate})` : 'Aucun'}</td>
                      <td>
                        <span className={`badge ${l.status === 'BOOKED' ? 'badge-warning' : l.status === 'COMPLETED' ? 'badge-success' : 'badge-danger'}`}>
                          {l.status}
                        </span>
                      </td>
                      <td>{l.comments || '—'}</td>
                      <td>
                        {l.rating ? (
                          <div style={{ display: 'flex', gap: '2px', color: 'var(--accent)' }}>
                            {Array.from({ length: l.rating }).map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
                          </div>
                        ) : '—'}
                      </td>
                      <td>
                        {l.status === 'BOOKED' && (
                          <button 
                            onClick={() => {
                              const comm = prompt("Entrez vos commentaires sur la séance :");
                              const rat = prompt("Attribuez une note d'apprentissage (1 à 5) :");
                              if (comm && rat) handleCompleteLesson(l.id, comm, rat);
                            }}
                            className="btn btn-primary"
                            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          >
                            Valider
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {moniteurLessons.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Aucune séance pratique planifiée.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 9. CANDIDATE TAB: Progress meters & Billing balances */}
        {activeTab === 'candidate-progress' && candidateData && (
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '24px', color: 'white' }}>
              Mon Espace Formation
            </h2>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
              <div className="card">
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', fontWeight: 'bold' }}>Moniteur Assigné</span>
                <span style={{ fontSize: '1.35rem', fontWeight: 'bold', color: 'white', marginTop: '6px', display: 'block' }}>
                  {candidateData.assignedMoniteur}
                </span>
              </div>
              <div className="card">
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', fontWeight: 'bold' }}>Séances Conduite Max / Semaine</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', marginTop: '6px', display: 'block' }}>
                  {candidateData.maxWeeklyLessons}
                </span>
              </div>
              <div className="card">
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', fontWeight: 'bold' }}>Solde Reste à Payer</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: candidateData.finances.balance > 0 ? 'var(--warning)' : 'var(--success)', marginTop: '6px', display: 'block' }}>
                  {candidateData.finances.balance} DH
                </span>
              </div>
            </div>

            {/* Invoices details & driving list */}
            <div className="grid-2">
              
              <div className="card">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white', marginBottom: '20px' }}>
                  Mon Relevé Financier
                </h3>
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span>Coût Total Formation :</span>
                    <strong style={{ color: 'white' }}>{candidateData.finances.totalAmount} DH</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span>Total Encaissé :</span>
                    <strong style={{ color: 'var(--success)' }}>{candidateData.finances.amountPaid} DH</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                    <span>Solde Débiteur :</span>
                    <strong style={{ color: candidateData.finances.balance > 0 ? 'var(--warning)' : 'var(--success)' }}>
                      {candidateData.finances.balance} DH
                    </strong>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white', marginBottom: '20px' }}>
                  Historique de mes Leçons Pratiques
                </h3>
                <div style={{ overflowY: 'auto', maxHeight: '180px' }}>
                  {candidateData.drivingLessons.map(l => (
                    <div key={l.id} style={{ padding: '10px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.85rem', color: 'white' }}>{new Date(l.slotDateTime).toLocaleDateString()} à {new Date(l.slotDateTime).getHours()}h</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{l.comments || 'Aucun commentaire'}</span>
                      </div>
                      <span className={`badge ${l.status === 'BOOKED' ? 'badge-warning' : 'badge-success'}`}>{l.status}</span>
                    </div>
                  ))}
                  {candidateData.drivingLessons.length === 0 && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Aucune séance conduite enregistrée.</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 10. CANDIDATE TAB: Book PC post slots */}
        {activeTab === 'candidate-book-pc' && (
          <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white', marginBottom: '20px' }}>
              Réserver ma Séance sur Poste Code Rousseau
            </h3>
            
            <form onSubmit={handleBookPc}>
              <div className="form-group">
                <label>Sélectionner le Poste (1 à 15)</label>
                <select name="postNumber" className="form-control" required>
                  {Array.from({ length: 15 }, (_, i) => (
                    <option key={i+1} value={i+1}>Poste d'apprentissage #{i+1}</option>
                  ))}
                </select>
              </div>

              <div className="grid-2" style={{ marginBottom: 0 }}>
                <div className="form-group">
                  <label>Choisir la Date</label>
                  <input type="date" name="date" className="form-control" min={new Date().toISOString().split('T')[0]} required />
                </div>
                <div className="form-group">
                  <label>Créneau Horaire (Durée 1 Heure)</label>
                  <select name="time" className="form-control" required>
                    <option value="09:00">09h00 - 10h00</option>
                    <option value="10:00">10h00 - 11h00</option>
                    <option value="11:00">11h00 - 12h00</option>
                    <option value="14:00">14h00 - 15h00</option>
                    <option value="15:00">15h00 - 16h00</option>
                    <option value="16:00">16h00 - 17h00</option>
                    <option value="17:00">17h00 - 18h00</option>
                    <option value="18:00">18h00 - 19h00</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '20px' }}>
                Confirmer la Réservation PC
              </button>
            </form>
          </div>
        )}

        {/* 11. CANDIDATE TAB: Book practical hours (weekly cap blocks) */}
        {activeTab === 'candidate-book-driving' && (
          <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white', marginBottom: '20px' }}>
              Planifier une Heure de Conduite
            </h3>
            
            <form onSubmit={handleBookDriving}>
              <div className="grid-2" style={{ marginBottom: 0 }}>
                <div className="form-group">
                  <label>Sélectionner la Date</label>
                  <input type="date" name="date" className="form-control" min={new Date().toISOString().split('T')[0]} required />
                </div>
                <div className="form-group">
                  <label>Créneau Horaire</label>
                  <select name="time" className="form-control" required>
                    <option value="08:00">08h00 - 09h00</option>
                    <option value="09:00">09h00 - 10h00</option>
                    <option value="10:00">10h00 - 11h00</option>
                    <option value="11:00">11h00 - 12h00</option>
                    <option value="14:00">14h00 - 15h00</option>
                    <option value="15:00">15h00 - 16h00</option>
                    <option value="16:00">16h00 - 17h00</option>
                    <option value="17:00">17h00 - 18h00</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '20px' }}>
                Réserver Séance Pratique
              </button>
            </form>
          </div>
        )}

      </main>

      {/* PRINT DIALOG VIEW: Fiche d'inscription / Contrat standardisé Marocain */}
      {contractToPrint && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, overflowY: 'auto', padding: '40px 0' }}>
          <div style={{ background: '#ffffff', color: '#1e293b', padding: '40px', width: '210mm', minHeight: '297mm', position: 'relative', border: '1px solid #ddd', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', fontFamily: 'sans-serif' }}>
            
            {/* Close action */}
            <button 
              onClick={() => setContractToPrint(null)} 
              style={{ position: 'absolute', top: '15px', right: '15px', width: '36px', height: '36px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}
              className="no-print"
            >
              <X size={18} />
            </button>

            {/* Header branding */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0f2a4a', paddingBottom: '20px', marginBottom: '20px' }}>
              <div>
                <h2 style={{ color: '#0f2a4a', fontWeight: 'bold', fontSize: '1.5rem', margin: 0 }}>AUTO ÉCOLE KARIMA</h2>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>NO 97, Hay Karima rue zardal, Salé</span>
                <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block' }}>Agrément NARSA - N° 9954/12</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h2 style={{ color: '#0f2a4a', fontWeight: 'bold', fontSize: '1.5rem', margin: 0 }}>سيارة التعليم كريمة</h2>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>عند شكيب (Chez Chakib)</span>
                <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block' }}>Tél: 0537353353 / 0652503842</span>
              </div>
            </div>

            <div style={{ textAlign: 'center', margin: '30px 0' }}>
              <h1 style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '1.6rem', borderBottom: '1px solid #ddd', display: 'inline-block', paddingBottom: '6px' }}>
                CONTRAT DE FORMATION DE CONDUITE
              </h1>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '6px' }}>Réglementation NARSA - Ministère du Transport Marocain</p>
            </div>

            {/* Candidate Info Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
              <div>
                <h4 style={{ borderBottom: '2px solid #d4af37', paddingBottom: '4px', marginBottom: '12px', color: '#0f2a4a' }}>L'Établissement</h4>
                <p style={{ fontSize: '0.9rem', marginBottom: '6px' }}><strong>Nom :</strong> Auto École Karima (Salé)</p>
                <p style={{ fontSize: '0.9rem', marginBottom: '6px' }}><strong>Représenté par :</strong> Chakib (Directeur)</p>
                <p style={{ fontSize: '0.9rem', marginBottom: '6px' }}><strong>Adresse :</strong> Hay Karima, Salé</p>
              </div>
              <div>
                <h4 style={{ borderBottom: '2px solid #d4af37', paddingBottom: '4px', marginBottom: '12px', color: '#0f2a4a' }}>Le Candidat</h4>
                <p style={{ fontSize: '0.9rem', marginBottom: '6px' }}><strong>Nom complet :</strong> {contractToPrint.user.fullName}</p>
                <p style={{ fontSize: '0.9rem', marginBottom: '6px' }}><strong>CIN :</strong> {contractToPrint.cin}</p>
                <p style={{ fontSize: '0.9rem', marginBottom: '6px' }}><strong>N° Téléphone :</strong> {contractToPrint.phone}</p>
                <p style={{ fontSize: '0.9rem', marginBottom: '6px' }}><strong>N° Permis provisoire :</strong> {contractToPrint.permitNumber}</p>
              </div>
            </div>

            {/* Financial Ledger Contract Clause */}
            <div style={{ marginBottom: '40px' }}>
              <h4 style={{ borderBottom: '2px solid #d4af37', paddingBottom: '4px', marginBottom: '12px', color: '#0f2a4a' }}>Modalités de Formation & Règlement</h4>
              <p style={{ fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '12px' }}>
                Le présent contrat engage l'établissement à fournir une formation théorique (code de la route) et pratique (conduite automobile) en vue de l'obtention du permis de conduire marocain. Le candidat s'engage à respecter le règlement et à honorer ses versements financiers.
              </p>
              
              <div style={{ padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', textAlign: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Frais de formation fixés</span>
                    <strong style={{ fontSize: '1.1rem', color: '#0f2a4a' }}>{contractToPrint.totalAmount} DH</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Montant encaissé (Avance)</span>
                    <strong style={{ fontSize: '1.1rem', color: '#10b981' }}>{contractToPrint.amountPaid} DH</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Reste à recouvrer (Reliquat)</span>
                    <strong style={{ fontSize: '1.1rem', color: '#ef4444' }}>{contractToPrint.totalAmount - contractToPrint.amountPaid} DH</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Signature Clause */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginTop: '60px', textAlign: 'center' }}>
              <div>
                <p style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '50px' }}>Signature du Candidat</p>
                <div style={{ borderBottom: '1px dashed #94a3b8', width: '150px', margin: '0 auto' }}></div>
              </div>
              <div>
                <p style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '50px' }}>Cachet et Signature de l'Établissement</p>
                <div style={{ borderBottom: '1px dashed #94a3b8', width: '150px', margin: '0 auto' }}></div>
              </div>
            </div>

            {/* Bottom Print Actions */}
            <div style={{ position: 'absolute', bottom: '-60px', left: 0, right: 0, display: 'flex', gap: '12px', justifyContent: 'center' }} className="no-print">
              <button 
                onClick={() => window.print()} 
                className="btn btn-primary"
                style={{ padding: '10px 20px' }}
              >
                Imprimer le Contrat
              </button>
              <button 
                onClick={() => setContractToPrint(null)} 
                className="btn btn-secondary"
                style={{ padding: '10px 20px' }}
              >
                Fermer l'aperçu
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
