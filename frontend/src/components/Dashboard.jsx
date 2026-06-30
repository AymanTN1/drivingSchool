import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import {
  UserPlus, Car, DollarSign, Calendar, AlertCircle, FileText, CheckCircle2, Star,
  TrendingUp, Users, Shield, LogOut, CheckSquare, PlusCircle, Printer, X, ShieldAlert,
  Fuel, Gauge, AlertTriangle, Activity, Banknote, Clock, Award, Phone, ArrowRight,
  ClipboardList, Scan, QrCode, Monitor, CalendarDays
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

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
  const [fleetAnalytics, setFleetAnalytics] = useState(null);
  const [payrollData, setPayrollData] = useState([]);
  const [paySlips, setPaySlips] = useState([]);
  const [crmProspects, setCrmProspects] = useState([]);
  const [allLessons, setAllLessons] = useState([]);

  // Modal print view
  const [contractToPrint, setContractToPrint] = useState(null);

  // QR Code / Uberization states
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedLessonQr, setSelectedLessonQr] = useState(null);
  const [pinInput, setPinInput] = useState('');

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
    fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/admin/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        const mons = data.filter(u => u.role === 'MONITEUR');
        setMoniteurs(mons);
      })
      .catch(err => console.log('Error fetching moniteurs', err));

    fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/assistant/fleet`, {
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
      fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/admin/analytics`, { headers })
        .then(res => res.json())
        .then(data => setAnalytics(data))
        .catch(err => console.log('Error fetching analytics', err))
        .finally(() => setLoading(false));

      fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/fleet/analytics`, { headers })
        .then(res => res.json())
        .then(data => setFleetAnalytics(data))
        .catch(err => console.log('Error fetching fleet analytics', err));

      fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/payroll/moniteurs`, { headers })
        .then(res => res.json())
        .then(data => setPayrollData(data))
        .catch(err => console.log('Error fetching payroll', err));

      fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/payroll/slips`, { headers })
        .then(res => res.json())
        .then(data => setPaySlips(data))
        .catch(err => console.log('Error fetching pay slips', err));
    } else if (role === 'ASSISTANT') {
      // Fetch candidates list
      fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/assistant/candidates`, { headers })
        .then(res => res.json())
        .then(data => setCandidates(data))
        .catch(err => console.log('Error fetching candidates', err));

      // Fetch transaction list
      fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/assistant/caisse`, { headers })
        .then(res => res.json())
        .then(data => setTransactions(data))
        .catch(err => console.log('Error fetching caisse', err));

      // Fetch alerts list
      fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/assistant/alerts`, { headers })
        .then(res => res.json())
        .then(data => setAlerts(data))
        .catch(err => console.log('Error fetching alerts', err))
        .finally(() => setLoading(false));
    }

    // Fetch CRM prospects and Calendar for ADMIN and ASSISTANT
    if (role === 'ADMIN' || role === 'ASSISTANT') {
      fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/assistant/prospects`, { headers })
        .then(res => res.json())
        .then(data => setCrmProspects(data))
        .catch(err => console.log('Error fetching prospects', err));
        
      fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/assistant/lessons`, { headers })
        .then(res => res.json())
        .then(data => setAllLessons(data))
        .catch(err => console.log('Error fetching all lessons', err));
    } else if (role === 'MONITEUR') {
      fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/moniteur/lessons`, { headers })
        .then(res => res.json())
        .then(data => setMoniteurLessons(data))
        .catch(err => console.log('Error fetching moniteur lessons', err))
        .finally(() => setLoading(false));
    } else if (role === 'CANDIDATE') {
      fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/candidate/lessons`, { headers })
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

    fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/admin/users`, {
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

    fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/admin/vehicles`, {
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

    fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/assistant/candidates`, {
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

    fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/assistant/caisse`, {
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

    fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/assistant/candidates/${candId}/exam`, {
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
    fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/moniteur/lessons/${lessonId}/complete`, {
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

  // ADMIN/ASSISTANT Action: Reschedule driving lesson via Calendar Drag and Drop
  const handleEventDrop = (info) => {
    const lessonId = info.event.id;
    const newDate = info.event.start;
    // Format to match localdatetime expected by backend (YYYY-MM-DDTHH:mm:ss)
    // Avoid timezone shift by getting local parts
    const offset = newDate.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(newDate - offset)).toISOString().slice(0, -1);
    
    fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/assistant/lessons/${lessonId}/reschedule`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ newSlotDateTime: localISOTime })
    })
      .then(async (res) => {
        const resData = await res.json();
        if (!res.ok) {
          info.revert(); // Revert calendar visual if failed
          throw new Error(resData.message || 'Erreur lors de la reprogrammation');
        }
        triggerFeedback('success', resData.message);
        refreshData();
      })
      .catch(err => {
        info.revert();
        triggerFeedback('danger', err.message);
      });
  };

  // CANDIDATE Action: Book driving lesson (limited by weekly cap and vehicle checkups)
  const handleBookDriving = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    // Format date time to ISO
    const dateTime = `${data.date}T${data.time}:00`;

    fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/candidate/driving/reserve`, {
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

    fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/candidate/pc-posts/reserve`, {
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
              <button
                onClick={() => setActiveTab('fleet-fuel')}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '8px', color: activeTab === 'fleet-fuel' ? 'white' : 'var(--text-muted)', background: activeTab === 'fleet-fuel' ? 'rgba(255,255,255,0.08)' : 'none', textAlign: 'left', fontSize: '0.9rem' }}
              >
                <Fuel size={16} /> Carburant & Rentabilité
              </button>
              <button
                onClick={() => setActiveTab('payroll')}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '8px', color: activeTab === 'payroll' ? 'white' : 'var(--text-muted)', background: activeTab === 'payroll' ? 'rgba(255,255,255,0.08)' : 'none', textAlign: 'left', fontSize: '0.9rem' }}
              >
                <Banknote size={16} /> Paie & RH
              </button>
              <button
                className="sidebar-btn"
                onClick={() => setActiveTab('calendar-planning')}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '8px', color: activeTab === 'calendar-planning' ? 'white' : 'var(--text-muted)', background: activeTab === 'calendar-planning' ? 'rgba(255,255,255,0.08)' : 'none', textAlign: 'left', fontSize: '0.9rem' }}
              >
                <CalendarDays size={20} /> Calendrier Planning
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
                onClick={() => setActiveTab('crm')}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '8px', color: activeTab === 'crm' ? 'white' : 'var(--text-muted)', background: activeTab === 'crm' ? 'rgba(255,255,255,0.08)' : 'none', textAlign: 'left', fontSize: '0.9rem' }}
              >
                <ClipboardList size={16} /> CRM Prospects
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
              <button
                onClick={() => setActiveTab('scan-lesson')}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '8px', color: activeTab === 'scan-lesson' ? 'white' : 'var(--text-muted)', background: activeTab === 'scan-lesson' ? 'rgba(255,255,255,0.08)' : 'none', textAlign: 'left', fontSize: '0.9rem' }}
              >
                <Scan size={16} /> Scanner & Démarrer
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

        {/* 1b. ADMIN TAB: Fleet Fuel Analytics */}
        {activeTab === 'fleet-fuel' && (
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '24px', color: 'white', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Fuel size={28} style={{ color: 'var(--accent)' }} /> Gestion Carburant & Rentabilité
            </h2>

            {/* Global KPI cards */}
            {fleetAnalytics && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
                  <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)' }}><Fuel size={24} /></div>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Coût Total Carburant</span>
                      <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>{fleetAnalytics.totalFuelCost} DH</span>
                    </div>
                  </div>
                  <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}><Gauge size={24} /></div>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Litres Consommés</span>
                      <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>{fleetAnalytics.totalLiters} L</span>
                    </div>
                  </div>
                  <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(16,185,129,0.1)', color: 'var(--success)' }}><Car size={24} /></div>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Véhicules Suivis</span>
                      <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>{fleetAnalytics.vehicles.length}</span>
                    </div>
                  </div>
                  <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(212,175,55,0.1)', color: 'var(--accent)' }}><AlertTriangle size={24} /></div>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Alertes Consommation</span>
                      <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: fleetAnalytics.vehicles.filter(v => v.consumptionAlert).length > 0 ? 'var(--danger)' : 'var(--success)' }}>
                        {fleetAnalytics.vehicles.filter(v => v.consumptionAlert).length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Per-vehicle detailed cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '32px' }}>
                  {fleetAnalytics.vehicles.map(v => (
                    <div key={v.vehicleId} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
                      {v.consumptionAlert && (
                        <div style={{ position: 'absolute', top: '0', right: '0', background: 'var(--danger)', color: 'white', padding: '4px 12px', borderRadius: '0 0 0 12px', fontSize: '0.7rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <AlertTriangle size={12} /> ALERTE CONSOMMATION
                        </div>
                      )}
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Car size={18} className="text-accent" /> {v.label}
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', textAlign: 'center' }}>
                          <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Conso. Moyenne</span>
                          <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: v.avgConsumption > 7 ? 'var(--danger)' : 'var(--success)' }}>
                            {v.avgConsumption} L/100km
                          </span>
                        </div>
                        <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', textAlign: 'center' }}>
                          <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Dernier Plein</span>
                          <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: v.lastConsumption > v.avgConsumption * 1.3 ? 'var(--danger)' : 'white' }}>
                            {v.lastConsumption} L/100km
                          </span>
                        </div>
                        <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', textAlign: 'center' }}>
                          <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Coût/Heure</span>
                          <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent)' }}>
                            {v.costPerHour} DH
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                        <div style={{ textAlign: 'center' }}>
                          <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)' }}>Coût Total</span>
                          <span style={{ fontWeight: 'bold', color: 'white', fontSize: '0.9rem' }}>{v.totalFuelCost} DH</span>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)' }}>Total Litres</span>
                          <span style={{ fontWeight: 'bold', color: 'white', fontSize: '0.9rem' }}>{v.totalLiters} L</span>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)' }}>Km Parcourus</span>
                          <span style={{ fontWeight: 'bold', color: 'white', fontSize: '0.9rem' }}>{v.totalKmDriven} km</span>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)' }}>Heures Conduite</span>
                          <span style={{ fontWeight: 'bold', color: 'white', fontSize: '0.9rem' }}>{v.totalDrivingHours} h</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Monthly Fuel Cost Trend Chart */}
                <div className="card" style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white', marginBottom: '20px' }}>
                    Évolution Mensuelle des Dépenses Carburant
                  </h3>
                  <div style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={fleetAnalytics.monthlyFuelTrends}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="name" stroke="var(--text-muted)" />
                        <YAxis stroke="var(--text-muted)" />
                        <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: 'white' }} />
                        <Legend />
                        <Bar dataKey="cout" name="Coût (DH)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="litres" name="Litres" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Fuel Record Form */}
                <div className="card">
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <PlusCircle className="text-accent" /> Enregistrer un Plein de Carburant
                  </h3>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const data = Object.fromEntries(formData.entries());
                    data.vehicleId = parseInt(data.vehicleId);
                    data.liters = parseFloat(data.liters);
                    data.pricePerLiter = parseFloat(data.pricePerLiter);
                    data.totalCost = parseFloat(data.totalCost);
                    data.odometerKm = parseInt(data.odometerKm);

                    fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/fleet/fuel`, {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify(data)
                    })
                      .then(async (res) => {
                        const resData = await res.json();
                        if (!res.ok) throw new Error(resData.message || 'Erreur');
                        triggerFeedback('success', resData.message);
                        e.target.reset();
                        refreshData();
                      })
                      .catch(err => triggerFeedback('danger', err.message));
                  }}>
                    <div className="grid-3">
                      <div className="form-group">
                        <label>Véhicule</label>
                        <select name="vehicleId" className="form-control" required>
                          <option value="">-- Choisir --</option>
                          {vehicles.map(v => (
                            <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.licensePlate})</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Litres</label>
                        <input type="number" step="0.01" name="liters" className="form-control" placeholder="Ex: 35.5" required />
                      </div>
                      <div className="form-group">
                        <label>Prix/Litre (DH)</label>
                        <input type="number" step="0.01" name="pricePerLiter" className="form-control" placeholder="Ex: 13.50" required />
                      </div>
                    </div>
                    <div className="grid-3">
                      <div className="form-group">
                        <label>Coût Total (DH)</label>
                        <input type="number" step="0.01" name="totalCost" className="form-control" placeholder="Ex: 479.25" required />
                      </div>
                      <div className="form-group">
                        <label>Kilométrage Compteur</label>
                        <input type="number" name="odometerKm" className="form-control" placeholder="Ex: 48500" required />
                      </div>
                      <div className="form-group">
                        <label>Station</label>
                        <select name="station" className="form-control">
                          <option value="Afriquia">Afriquia</option>
                          <option value="Total">Total</option>
                          <option value="Shell">Shell</option>
                          <option value="Petromin">Petromin</option>
                          <option value="Winxo">Winxo</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Notes (optionnel)</label>
                      <input type="text" name="notes" className="form-control" placeholder="Ex: Plein avant longue route" />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                      Enregistrer le Plein
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        )}

        {/* 1c. ADMIN TAB: Payroll & HR */}
        {activeTab === 'payroll' && (
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '24px', color: 'white', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Banknote size={28} style={{ color: 'var(--accent)' }} /> Paie & Ressources Humaines
            </h2>

            {/* Moniteur Payroll Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '32px' }}>
              {payrollData.map(m => (
                <div key={m.userId} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Users size={18} className="text-accent" /> {m.fullName}
                      </h3>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.phone}</span>
                    </div>
                    <span className={`badge ${m.payFrequency === 'WEEKLY' ? 'badge-info' : m.payFrequency === 'BIWEEKLY' ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '0.65rem' }}>
                      {m.payFrequency === 'WEEKLY' ? 'Hebdomadaire' : m.payFrequency === 'BIWEEKLY' ? 'Quinzaine' : 'Mensuel'}
                    </span>
                  </div>

                  {/* Config summary */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', textAlign: 'center' }}>
                      <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Taux/Heure</span>
                      <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--accent)' }}>{m.hourlyRate} DH</span>
                    </div>
                    <div style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', textAlign: 'center' }}>
                      <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Salaire Fixe</span>
                      <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white' }}>{m.fixedSalary} DH</span>
                    </div>
                    <div style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', textAlign: 'center' }}>
                      <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Prime/Examen</span>
                      <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--success)' }}>{m.bonusPerExamSuccess} DH</span>
                    </div>
                  </div>

                  {/* Current period stats */}
                  <div style={{ padding: '12px', background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: '8px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 'bold', marginBottom: '8px' }}>
                      P\u00e9riode en cours : {m.currentPeriodStart} \u2192 {m.currentPeriodEnd}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ display: 'block', fontSize: '0.6rem', color: 'var(--text-muted)' }}>H. Effectu\u00e9es</span>
                        <span style={{ fontWeight: 'bold', color: 'white' }}>{m.currentCompletedHours}h</span>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ display: 'block', fontSize: '0.6rem', color: 'var(--text-muted)' }}>H. R\u00e9serv\u00e9es</span>
                        <span style={{ fontWeight: 'bold', color: '#3b82f6' }}>{m.currentBookedHours}h</span>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ display: 'block', fontSize: '0.6rem', color: 'var(--text-muted)' }}>Examens R\u00e9ussis</span>
                        <span style={{ fontWeight: 'bold', color: 'var(--success)' }}>{m.examSuccessCount}</span>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ display: 'block', fontSize: '0.6rem', color: 'var(--text-muted)' }}>Estim\u00e9</span>
                        <span style={{ fontWeight: 'bold', color: 'var(--accent)' }}>{m.estimatedPay + m.totalBonus} DH</span>
                      </div>
                    </div>
                  </div>

                  {/* Generate pay slip button */}
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', fontSize: '0.85rem' }}
                    onClick={() => {
                      fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/payroll/generate/${m.userId}`, {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                          periodStart: m.currentPeriodStart,
                          periodEnd: m.currentPeriodEnd
                        })
                      })
                        .then(async (res) => {
                          const resData = await res.json();
                          if (!res.ok) throw new Error(resData.message || 'Erreur');
                          triggerFeedback('success', resData.message);
                          refreshData();
                        })
                        .catch(err => triggerFeedback('danger', err.message));
                    }}
                  >
                    <FileText size={14} style={{ marginRight: '6px' }} /> G\u00e9n\u00e9rer Fiche de Paie
                  </button>
                </div>
              ))}
            </div>

            {/* Pay Slips History Table */}
            <div className="card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText className="text-accent" /> Historique des Fiches de Paie
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Moniteur</th>
                      <th>P\u00e9riode</th>
                      <th>Heures</th>
                      <th>Salaire Heures</th>
                      <th>Fixe</th>
                      <th>Primes</th>
                      <th>Total</th>
                      <th>Statut</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paySlips.map(s => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 600 }}>{s.moniteur?.fullName}</td>
                        <td style={{ fontSize: '0.8rem' }}>{s.periodStart} \u2192 {s.periodEnd}</td>
                        <td>{s.totalHours}h</td>
                        <td>{s.hoursPayment} DH</td>
                        <td>{s.fixedSalary} DH</td>
                        <td>
                          {s.totalBonus > 0 ? (
                            <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Award size={12} /> +{s.totalBonus} DH ({s.examSuccessCount} exam{s.examSuccessCount > 1 ? 's' : ''})
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>0 DH</span>
                          )}
                        </td>
                        <td style={{ fontWeight: 'bold', color: 'var(--accent)', fontSize: '1rem' }}>{s.totalPay} DH</td>
                        <td>
                          <span className={`badge ${s.status === 'PAID' ? 'badge-success' : s.status === 'CANCELLED' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '0.65rem' }}>
                            {s.status === 'PAID' ? 'Pay\u00e9' : s.status === 'CANCELLED' ? 'Annul\u00e9' : 'En attente'}
                          </span>
                        </td>
                        <td>
                          {s.status === 'GENERATED' && (
                            <button
                              onClick={() => {
                                fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/payroll/slips/${s.id}/pay`, {
                                  method: 'PUT',
                                  headers: { 'Authorization': `Bearer ${token}` }
                                })
                                  .then(async (res) => {
                                    const resData = await res.json();
                                    if (!res.ok) throw new Error(resData.message || 'Erreur');
                                    triggerFeedback('success', resData.message);
                                    refreshData();
                                  })
                                  .catch(err => triggerFeedback('danger', err.message));
                              }}
                              className="btn btn-primary"
                              style={{ padding: '4px 12px', fontSize: '0.75rem' }}
                            >
                              Marquer Pay\u00e9
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {paySlips.length === 0 && (
                      <tr>
                        <td colSpan="9" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Aucune fiche de paie g\u00e9n\u00e9r\u00e9e.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
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
        {/* 6b. ASSISTANT TAB: CRM Prospects (Kanban) */}
        {activeTab === 'crm' && (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ClipboardList size={26} className="text-accent" /> Pipeline de Vente & Prospects
              </h2>
            </div>

            {/* Kanban Board Layout */}
            <div style={{ display: 'flex', gap: '16px', flex: 1, overflowX: 'auto', paddingBottom: '20px' }}>
              {/* Kanban Column Builder */}
              {[
                { id: 'NEW', title: 'Nouveaux Prospects', color: '#3b82f6' },
                { id: 'CALLED', title: 'Appelé - En réflexion', color: '#f59e0b' },
                { id: 'WAITING_DOCS', title: 'Dossier en attente', color: '#8b5cf6' },
                { id: 'ENROLLED', title: 'Inscrit / Converti', color: '#10b981' },
                { id: 'LOST', title: 'Perdu / Annulé', color: '#ef4444' }
              ].map(col => {
                const colProspects = crmProspects.filter(p => p.status === col.id);
                return (
                  <div key={col.id} style={{ minWidth: '300px', maxWidth: '300px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: col.color }}></div>
                        {col.title}
                      </h3>
                      <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '10px', color: 'white' }}>{colProspects.length}</span>
                    </div>

                    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
                      {colProspects.map(p => {
                        // Alert Logic: 7 days without contact
                        const daysSinceContact = Math.floor((new Date() - new Date(p.lastContactDate)) / (1000 * 60 * 60 * 24));
                        const needsAlert = ['NEW', 'CALLED', 'WAITING_DOCS'].includes(p.status) && daysSinceContact >= 7;

                        return (
                          <div key={p.id} className="card" style={{ padding: '14px', margin: 0, border: needsAlert ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
                            {needsAlert && (
                              <div style={{ position: 'absolute', top: '-10px', right: '-10px', background: '#ef4444', color: 'white', fontSize: '0.65rem', fontWeight: 'bold', padding: '4px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 4px 10px rgba(239, 68, 68, 0.4)', zIndex: 10 }}>
                                <AlertCircle size={10} /> {daysSinceContact}j sans contact
                              </div>
                            )}
                            <h4 style={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', marginBottom: '6px' }}>{p.fullName}</h4>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                              <Phone size={12} /> {p.phone}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                              <Car size={12} /> Permis {p.licenseType}
                            </div>
                            
                            {p.notes && (
                              <div style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '4px', marginBottom: '12px', fontStyle: 'italic', color: '#cbd5e1' }}>
                                "{p.notes}"
                              </div>
                            )}

                            {/* Status controls */}
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '10px' }}>
                              {col.id !== 'NEW' && (
                                <button 
                                  onClick={() => {
                                    fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/assistant/prospects/${p.id}/status`, {
                                      method: 'PUT',
                                      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ status: 'NEW' })
                                    }).then(() => refreshData());
                                  }}
                                  style={{ padding: '4px 6px', fontSize: '0.65rem', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}
                                >
                                  Nouveau
                                </button>
                              )}
                              {col.id !== 'CALLED' && (
                                <button 
                                  onClick={() => {
                                    fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/assistant/prospects/${p.id}/status`, {
                                      method: 'PUT',
                                      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ status: 'CALLED' })
                                    }).then(() => refreshData());
                                  }}
                                  style={{ padding: '4px 6px', fontSize: '0.65rem', background: 'rgba(245, 158, 11, 0.2)', color: '#fcd34d', border: '1px solid rgba(245, 158, 11, 0.4)', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                  Appelé
                                </button>
                              )}
                              {col.id !== 'WAITING_DOCS' && (
                                <button 
                                  onClick={() => {
                                    fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/assistant/prospects/${p.id}/status`, {
                                      method: 'PUT',
                                      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ status: 'WAITING_DOCS' })
                                    }).then(() => refreshData());
                                  }}
                                  style={{ padding: '4px 6px', fontSize: '0.65rem', background: 'rgba(139, 92, 246, 0.2)', color: '#c4b5fd', border: '1px solid rgba(139, 92, 246, 0.4)', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                  Dossier Att.
                                </button>
                              )}
                              {col.id !== 'ENROLLED' && (
                                <button 
                                  onClick={() => {
                                    fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/assistant/prospects/${p.id}/status`, {
                                      method: 'PUT',
                                      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ status: 'ENROLLED' })
                                    }).then(() => refreshData());
                                  }}
                                  style={{ padding: '4px 6px', fontSize: '0.65rem', background: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                  Convertir
                                </button>
                              )}
                              {col.id !== 'LOST' && (
                                <button 
                                  onClick={() => {
                                    fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/assistant/prospects/${p.id}/status`, {
                                      method: 'PUT',
                                      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ status: 'LOST' })
                                    }).then(() => refreshData());
                                  }}
                                  style={{ padding: '4px 6px', fontSize: '0.65rem', background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                  Perdu
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {colProspects.length === 0 && (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '20px', fontStyle: 'italic' }}>
                          Vide
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
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
        
        {/* NEW TAB: Interactive Calendar for ADMIN & ASSISTANT */}
        {activeTab === 'calendar-planning' && (
          <div className="card" style={{ height: 'calc(100vh - 150px)', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CalendarDays className="text-primary" /> Planning Global des Leçons de Conduite
            </h3>
            
            <div style={{ flex: 1, backgroundColor: 'white', padding: '16px', borderRadius: '12px', color: 'black' }}>
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="timeGridWeek"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay'
                }}
                locale="fr"
                slotMinTime="08:00:00"
                slotMaxTime="20:00:00"
                allDaySlot={false}
                events={allLessons.map(l => ({
                  id: l.id,
                  title: `${l.candidate.fullName} (par ${l.moniteur.fullName})`,
                  start: l.slotDateTime,
                  end: new Date(new Date(l.slotDateTime).getTime() + l.durationMinutes * 60000),
                  backgroundColor: l.status === 'COMPLETED' ? '#10b981' : (l.status === 'IN_PROGRESS' ? '#f59e0b' : '#3b82f6'),
                  borderColor: 'transparent'
                }))}
                editable={true} // ENABLES DRAG AND DROP
                eventDrop={handleEventDrop}
                height="100%"
              />
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

        {/* 8b. MONITEUR TAB: Scan & Start Lesson */}
        {activeTab === 'scan-lesson' && (
          <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Scan className="text-accent" /> Valider Présence (QR Code / PIN)
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.9rem' }}>
              Validez la présence de l'élève pour démarrer la séance. Demandez à l'élève d'ouvrir son espace et de vous montrer son QR Code, ou demandez son code PIN à 4 chiffres.
            </p>

            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', color: 'white', marginBottom: '8px', fontSize: '0.95rem' }}>Sélectionner la séance à démarrer</label>
              <select id="scanLessonSelect" className="form-control" style={{ marginBottom: '16px' }}>
                <option value="">-- Choisissez une séance --</option>
                {moniteurLessons.filter(l => l.status === 'BOOKED').map(l => (
                  <option key={l.id} value={l.id}>
                    {new Date(l.slotDateTime).toLocaleString()} - Candidat: {l.candidate.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid-2">
              <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
                <QrCode size={40} style={{ color: 'var(--accent)', margin: '0 auto 12px auto' }} />
                <h4 style={{ color: 'white', fontWeight: 'bold', marginBottom: '8px' }}>Scanner QR</h4>
                <button 
                  className="btn" 
                  style={{ background: 'var(--accent)', color: 'white', width: '100%' }}
                  onClick={() => {
                    const lessonId = document.getElementById('scanLessonSelect').value;
                    if (!lessonId) return alert('Veuillez sélectionner la séance d\'abord.');
                    
                    const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: {width: 250, height: 250} });
                    scanner.render((decodedText) => {
                      try {
                        const data = JSON.parse(decodedText);
                        if (data.slotId != lessonId) {
                          alert("Le QR Code ne correspond pas à la séance sélectionnée !");
                          return;
                        }
                        scanner.clear();
                        
                        fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/moniteur/lessons/${lessonId}/start`, {
                          method: 'POST',
                          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                          body: JSON.stringify({ pin: data.pin })
                        })
                        .then(res => res.json())
                        .then(resData => {
                          if (resData.message.includes('succès')) {
                            triggerFeedback('success', resData.message);
                            refreshData();
                          } else {
                            triggerFeedback('danger', resData.message);
                          }
                        });
                      } catch(e) {
                        alert("QR Code invalide");
                      }
                    }, (err) => { /* ignore scans */ });
                  }}
                >
                  Ouvrir Caméra
                </button>
                <div id="reader" style={{ marginTop: '16px', borderRadius: '8px', overflow: 'hidden' }}></div>
              </div>

              <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
                <CheckSquare size={40} style={{ color: 'var(--warning)', margin: '0 auto 12px auto' }} />
                <h4 style={{ color: 'white', fontWeight: 'bold', marginBottom: '8px' }}>Saisir Code PIN</h4>
                <input 
                  type="text" 
                  placeholder="Ex: 1234" 
                  maxLength="4"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="form-control" 
                  style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '4px', marginBottom: '12px' }} 
                />
                <button 
                  className="btn" 
                  style={{ background: 'var(--warning)', color: 'white', width: '100%' }}
                  onClick={() => {
                    const lessonId = document.getElementById('scanLessonSelect').value;
                    if (!lessonId) return alert('Veuillez sélectionner la séance d\'abord.');
                    if (pinInput.length !== 4) return alert('Le PIN doit faire 4 chiffres.');

                    fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/moniteur/lessons/${lessonId}/start`, {
                      method: 'POST',
                      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                      body: JSON.stringify({ pin: pinInput })
                    })
                    .then(res => res.json())
                    .then(resData => {
                      if (resData.message.includes('succès')) {
                        triggerFeedback('success', resData.message);
                        refreshData();
                        setPinInput('');
                      } else {
                        triggerFeedback('danger', resData.message);
                      }
                    });
                  }}
                >
                  Valider PIN
                </button>
              </div>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {l.status === 'BOOKED' && (
                          <button 
                            className="btn" 
                            style={{ padding: '4px 8px', fontSize: '0.7rem', background: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd', border: '1px solid rgba(59, 130, 246, 0.4)' }}
                            onClick={() => {
                              setSelectedLessonQr(l);
                              setQrModalOpen(true);
                            }}
                          >
                            <QrCode size={12} style={{ marginRight: '4px' }}/> Voir QR
                          </button>
                        )}
                        <span className={`badge ${l.status === 'BOOKED' ? 'badge-warning' : l.status === 'IN_PROGRESS' ? 'badge-primary' : 'badge-success'}`}>
                          {l.status === 'IN_PROGRESS' ? 'EN COURS' : l.status}
                        </span>
                      </div>
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
                    <option key={i + 1} value={i + 1}>Poste d'apprentissage #{i + 1}</option>
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

      {/* QR CODE MODAL FOR CANDIDATE */}
      {qrModalOpen && selectedLessonQr && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#1e293b', padding: '40px', borderRadius: '24px', width: '400px', maxWidth: '90%', textAlign: 'center', position: 'relative', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <button 
              onClick={() => setQrModalOpen(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
            
            <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '8px' }}>
              Présentez ce code à {selectedLessonQr.moniteur.fullName}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '30px' }}>
              Date: {new Date(selectedLessonQr.slotDateTime).toLocaleString()}
            </p>

            <div style={{ background: 'white', padding: '20px', borderRadius: '16px', display: 'inline-block', marginBottom: '20px' }}>
              <QRCodeSVG 
                value={JSON.stringify({ 
                  slotId: selectedLessonQr.id, 
                  candidateId: selectedLessonQr.candidate.id,
                  pin: selectedLessonQr.verificationPin 
                })} 
                size={200} 
                level="H"
              />
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
              <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '8px' }}>Ou communiquez le code PIN :</span>
              <span style={{ fontSize: '2rem', fontWeight: 'bold', letterSpacing: '8px', color: 'var(--warning)', background: 'rgba(245, 158, 11, 0.1)', padding: '10px 20px', borderRadius: '12px', display: 'inline-block' }}>
                {selectedLessonQr.verificationPin}
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
