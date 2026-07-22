import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import {
  UserPlus, Car, DollarSign, Calendar, AlertCircle, FileText, CheckCircle2, Star,
  TrendingUp, Users, Shield, LogOut, CheckSquare, PlusCircle, Printer, X, ShieldAlert,
  Fuel, Gauge, AlertTriangle, Activity, Banknote, Clock, Award, Phone, ArrowRight,
  ClipboardList, Scan, QrCode, Monitor, CalendarDays, Edit2, BookOpen, XCircle, MessageSquare, Loader2
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import PredictiveMaintenanceView from './PredictiveMaintenanceView';
import CandidateRiskView from './CandidateRiskView';
import DynamicPricingView from './DynamicPricingView';

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

  // Cours de Soutien states
  const [supportLessons, setSupportLessons] = useState([]);
  const [supportStats, setSupportStats] = useState(null);
  const [moniteurAvailability, setMoniteurAvailability] = useState([]); // Live availability check
  const [availabilityChecking, setAvailabilityChecking] = useState(false);
  // Form field states for availability check
  const [slotDatetime, setSlotDatetime] = useState('');
  const [slotDuration, setSlotDuration] = useState(60);

  // Moniteur Feedback modal states
  const [feedbackModalLesson, setFeedbackModalLesson] = useState(null); // lesson being rated
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackHover, setFeedbackHover] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');

  // Candidate rating of moniteur modal states
  const [candRatingModalLesson, setCandRatingModalLesson] = useState(null);
  const [candRating, setCandRating] = useState(0);
  const [candRatingHover, setCandRatingHover] = useState(0);
  const [candComment, setCandComment] = useState('');

  // Admin: moniteur ratings report
  const [moniteurRatingsReport, setMoniteurRatingsReport] = useState(null);

  // Candidate: progression report (lazy-loaded)
  const [progression, setProgression] = useState(null);
  const [progressionLoading, setProgressionLoading] = useState(false);

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
      .then(res => { if(!res.ok) throw new Error("API Error"); return res.json(); })
      .then(data => {
        const mons = data.filter(u => u.role === 'MONITEUR');
        setMoniteurs(mons);
      })
      .catch(err => console.log('Error fetching moniteurs', err));

    fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/assistant/fleet`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => { if(!res.ok) throw new Error("API Error"); return res.json(); })
      .then(data => setVehicles(data))
      .catch(err => console.log('Error fetching fleet', err));
  };

  const refreshData = () => {
    setLoading(true);
    const headers = { 'Authorization': `Bearer ${token}` };

    if (role === 'ADMIN') {
      fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/admin/analytics`, { headers })
        .then(res => { if(!res.ok) throw new Error("API Error"); return res.json(); })
        .then(data => setAnalytics(data))
        .catch(err => console.log('Error fetching analytics', err))
        .finally(() => setLoading(false));

      fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/fleet/analytics`, { headers })
        .then(res => { if(!res.ok) throw new Error("API Error"); return res.json(); })
        .then(data => setFleetAnalytics(data))
        .catch(err => console.log('Error fetching fleet analytics', err));

      fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/payroll/moniteurs`, { headers })
        .then(res => { if(!res.ok) throw new Error("API Error"); return res.json(); })
        .then(data => setPayrollData(data))
        .catch(err => console.log('Error fetching payroll', err));

      fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/payroll/slips`, { headers })
        .then(res => { if(!res.ok) throw new Error("API Error"); return res.json(); })
        .then(data => setPaySlips(data))
        .catch(err => console.log('Error fetching pay slips', err));

      // ADMIN: fetch moniteur ratings report (confidential)
      fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/admin/moniteurs/ratings-report`, { headers })
        .then(res => { if(!res.ok) throw new Error("API Error"); return res.json(); })
        .then(data => setMoniteurRatingsReport(data))
        .catch(err => console.log('Error fetching ratings report', err));
    } else if (role === 'ASSISTANT') {
      // Fetch candidates list
      fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/assistant/candidates`, { headers })
        .then(res => { if(!res.ok) throw new Error("API Error"); return res.json(); })
        .then(data => setCandidates(data))
        .catch(err => console.log('Error fetching candidates', err));

      // Fetch transaction list
      fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/assistant/caisse`, { headers })
        .then(res => { if(!res.ok) throw new Error("API Error"); return res.json(); })
        .then(data => setTransactions(data))
        .catch(err => console.log('Error fetching caisse', err));

      // Fetch alerts list
      fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/assistant/alerts`, { headers })
        .then(res => { if(!res.ok) throw new Error("API Error"); return res.json(); })
        .then(data => setAlerts(data))
        .catch(err => console.log('Error fetching alerts', err))
        .finally(() => setLoading(false));

      // Fetch support lessons & stats
      fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/assistant/support-lessons`, { headers })
        .then(res => { if(!res.ok) throw new Error("API Error"); return res.json(); })
        .then(data => setSupportLessons(data))
        .catch(err => console.log('Error fetching support lessons', err));

      fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/assistant/support-lessons/stats`, { headers })
        .then(res => { if(!res.ok) throw new Error("API Error"); return res.json(); })
        .then(data => setSupportStats(data))
        .catch(err => console.log('Error fetching support stats', err));
    }

    // Fetch CRM prospects and Calendar for ADMIN and ASSISTANT
    if (role === 'ADMIN' || role === 'ASSISTANT') {
      fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/assistant/prospects`, { headers })
        .then(res => { if(!res.ok) throw new Error("API Error"); return res.json(); })
        .then(data => setCrmProspects(data))
        .catch(err => console.log('Error fetching prospects', err));
        
      fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/assistant/lessons`, { headers })
        .then(res => { if(!res.ok) throw new Error("API Error"); return res.json(); })
        .then(data => setAllLessons(data))
        .catch(err => console.log('Error fetching all lessons', err));
    } else if (role === 'MONITEUR') {
      fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/moniteur/lessons`, { headers })
        .then(res => { if(!res.ok) throw new Error("API Error"); return res.json(); })
        .then(data => setMoniteurLessons(data))
        .catch(err => console.log('Error fetching moniteur lessons', err))
        .finally(() => setLoading(false));

      // Moniteur: also fetch their support lessons
      fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/moniteur/support-lessons`, { headers })
        .then(res => { if(!res.ok) throw new Error("API Error"); return res.json(); })
        .then(data => setSupportLessons(data))
        .catch(err => console.log('Error fetching moniteur support lessons', err));
    } else if (role === 'CANDIDATE') {
      fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/candidate/lessons`, { headers })
        .then(res => { if(!res.ok) throw new Error("API Error"); return res.json(); })
        .then(data => setCandidateData(data))
        .catch(err => console.log('Error fetching candidate data', err))
        .finally(() => setLoading(false));

      // Candidate: also fetch their support lessons
      fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/candidate/support-lessons`, { headers })
        .then(res => { if(!res.ok) throw new Error("API Error"); return res.json(); })
        .then(data => setSupportLessons(data))
        .catch(err => console.log('Error fetching candidate support lessons', err));
    }
  };

  const triggerFeedback = (type, msg) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback({ type: '', msg: '' }), 5000);
  };

  // --- ACTIONS ---

  // ASSISTANT Action: Create Support Lesson
  const handleCreateSupportLesson = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    data.candidateId = parseInt(data.candidateId);
    data.moniteurId = parseInt(data.moniteurId);
    data.durationMinutes = parseInt(data.durationMinutes);
    data.pricePerSession = parseFloat(data.pricePerSession);
    if (data.vehicleId) data.vehicleId = parseInt(data.vehicleId); else delete data.vehicleId;

    fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/assistant/support-lessons`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(async (res) => {
        const resData = await res.json();
        if (!res.ok) throw new Error(resData.message || 'Erreur');
        triggerFeedback('success', resData.message);
        e.target.reset();
        setSlotDatetime('');
        setMoniteurAvailability([]);
        refreshData();
      })
      .catch(err => triggerFeedback('danger', err.message));
  };

  // Check moniteur availability for a given slot
  const checkMoniteurAvailability = (datetime, duration) => {
    if (!datetime || !duration) return;
    setAvailabilityChecking(true);
    fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/assistant/support-lessons/availability?sessionDate=${encodeURIComponent(datetime)}&durationMinutes=${duration}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => { if(!res.ok) throw new Error("API Error"); return res.json(); })
      .then(data => setMoniteurAvailability(data))
      .catch(err => console.log('Availability check error', err))
      .finally(() => setAvailabilityChecking(false));
  };

  // Candidate: fetch progression report (lazy)
  const fetchProgression = () => {
    setProgressionLoading(true);
    fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/candidate/progression`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => { if(!res.ok) throw new Error("API Error"); return res.json(); })
      .then(data => setProgression(data))
      .catch(err => console.log('Progression error', err))
      .finally(() => setProgressionLoading(false));
  };

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
                onClick={() => setActiveTab('avis-moniteurs')}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '8px', color: activeTab === 'avis-moniteurs' ? 'white' : 'var(--text-muted)', background: activeTab === 'avis-moniteurs' ? 'rgba(255,255,255,0.08)' : 'none', textAlign: 'left', fontSize: '0.9rem' }}
              >
                <Star size={16} /> Avis Clients (Confidentiel)
              </button>
              <button
                onClick={() => setActiveTab('maintenance-ai')}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '8px', color: activeTab === 'maintenance-ai' ? 'white' : 'var(--text-muted)', background: activeTab === 'maintenance-ai' ? 'rgba(255,255,255,0.08)' : 'none', textAlign: 'left', fontSize: '0.9rem' }}
              >
                <Settings size={16} /> Maintenance IA
              </button>
              <button
                onClick={() => setActiveTab('candidate-risk-ai')}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '8px', color: activeTab === 'candidate-risk-ai' ? 'white' : 'var(--text-muted)', background: activeTab === 'candidate-risk-ai' ? 'rgba(255,255,255,0.08)' : 'none', textAlign: 'left', fontSize: '0.9rem' }}
              >
                <AlertTriangle size={16} /> Alertes Candidats IA
              </button>
              <button
                onClick={() => setActiveTab('dynamic-pricing')}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '8px', color: activeTab === 'dynamic-pricing' ? 'white' : 'var(--text-muted)', background: activeTab === 'dynamic-pricing' ? 'rgba(255,255,255,0.08)' : 'none', textAlign: 'left', fontSize: '0.9rem' }}
              >
                <DollarSign size={16} /> Tarification IA
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
                onClick={() => setActiveTab('support-lessons')}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '8px', color: activeTab === 'support-lessons' ? 'white' : 'var(--text-muted)', background: activeTab === 'support-lessons' ? 'rgba(255,255,255,0.08)' : 'none', textAlign: 'left', fontSize: '0.9rem' }}
              >
                <BookOpen size={16} /> Cours de Soutien
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
              <button
                onClick={() => setActiveTab('moniteur-support')}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '8px', color: activeTab === 'moniteur-support' ? 'white' : 'var(--text-muted)', background: activeTab === 'moniteur-support' ? 'rgba(255,255,255,0.08)' : 'none', textAlign: 'left', fontSize: '0.9rem' }}
              >
                <BookOpen size={16} /> Mes Cours de Soutien
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
              <button
                onClick={() => setActiveTab('candidate-support')}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '8px', color: activeTab === 'candidate-support' ? 'white' : 'var(--text-muted)', background: activeTab === 'candidate-support' ? 'rgba(255,255,255,0.08)' : 'none', textAlign: 'left', fontSize: '0.9rem' }}
              >
                <BookOpen size={16} /> Mes Cours de Soutien
              </button>
              <button
                onClick={() => { setActiveTab('carnet-progression'); if (!progression) fetchProgression(); }}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '8px', color: activeTab === 'carnet-progression' ? 'white' : 'var(--text-muted)', background: activeTab === 'carnet-progression' ? 'rgba(255,255,255,0.08)' : 'none', textAlign: 'left', fontSize: '0.9rem' }}
              >
                <TrendingUp size={16} /> Carnet de Progression
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

        {/* Loading State for Analytics */}
        {activeTab === 'analytics' && loading && !analytics && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px', color: 'var(--text-muted)' }}>
            <Loader2 size={48} className="animate-spin" style={{ color: 'var(--accent)' }} />
            <h3 style={{ fontSize: '1.2rem', color: 'white' }}>Connexion au serveur & chargement des données...</h3>
            <p style={{ fontSize: '0.85rem' }}>Si le serveur était en veille, le démarrage peut prendre quelques secondes.</p>
          </div>
        )}

        {/* Fallback Error State for Analytics */}
        {activeTab === 'analytics' && !loading && !analytics && (
          <div className="card" style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center', padding: '32px' }}>
            <AlertTriangle size={48} color="var(--warning)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '1.25rem', color: 'white', marginBottom: '8px' }}>Impossible de charger les données d'analyse</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.9rem' }}>
              Le serveur backend est en cours de démarrage ou la connexion a rencontré un problème.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={refreshData} className="btn btn-primary" style={{ padding: '10px 20px', cursor: 'pointer' }}>
                🔄 Réessayer
              </button>
              <button onClick={onLogout} className="btn" style={{ padding: '10px 20px', background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)', cursor: 'pointer' }}>
                🚪 Se déconnecter
              </button>
            </div>
          </div>
        )}

        {/* 1. ADMIN TAB: Analytics (étudier les périodes d'années et d'examens) */}
        {activeTab === 'analytics' && analytics && (
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '24px', color: 'white' }}>
              Tableau Analytique de la Demande
            </h2>


            {/* ── KPI Grid (responsive, 8 cards) ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
              {[
                { label: 'Candidats Inscrits', value: analytics.kpi.totalCandidates, icon: <Users size={20} />, color: '#d4af37', bg: 'rgba(212,175,55,0.1)' },
                { label: 'Véhicules Actifs', value: analytics.kpi.totalVehicles, icon: <Car size={20} />, color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
                { label: 'Recettes Caisse', value: `${analytics.financesOverview.recettes} DH`, icon: <DollarSign size={20} />, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
                { label: 'Reliquats Restants', value: `${analytics.financesOverview.reliquats} DH`, icon: <AlertCircle size={20} />, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
                { label: 'Rev. Soutien Encaissé', value: `${analytics.supportFinance?.paidRevenue ?? analytics.financesOverview.supportRevenue ?? 0} DH`, icon: <BookOpen size={20} />, color: '#a78bfa', bg: 'rgba(139,92,246,0.1)' },
                { label: 'Séances Terminées', value: analytics.kpi.completedSessions ?? analytics.kpi.totalSupportLessons ?? 0, icon: <CheckCircle2 size={20} />, color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
                { label: 'Heures Livrées', value: `${analytics.kpi.totalHoursDelivered ?? 0}h`, icon: <Clock size={20} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
                { label: 'Revenus Non Encaissés', value: `${analytics.supportFinance?.unpaidPotential ?? 0} DH`, icon: <AlertTriangle size={20} />, color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
                { label: 'Séances Réservées', value: analytics.kpi.bookedSessions ?? 0, icon: <Calendar size={20} />, color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
                { label: 'Taux Annulation', value: `${analytics.kpi.cancellationRate ?? 0}%`, icon: <XCircle size={20} />, color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
                { label: 'Durée Moy. Séance', value: `${analytics.kpi.avgSessionDuration ?? 0} min`, icon: <Activity size={20} />, color: '#818cf8', bg: 'rgba(129,140,248,0.1)' },
                { label: 'Revenus Projetés', value: `${analytics.supportFinance?.projectedFromBooked ?? 0} DH`, icon: <TrendingUp size={20} />, color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
              ].map((kpi, i) => (
                <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px' }}>
                  <div style={{ padding: '10px', borderRadius: '10px', background: kpi.bg, color: kpi.color, flexShrink: 0 }}>{kpi.icon}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{kpi.label}</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white' }}>{kpi.value}</div>
                  </div>
                </div>
              ))}
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

        {/* ── Module Soutien Analytics (inside analytics tab) ── */}
        {activeTab === 'analytics' && analytics && analytics.supportFinance && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
            {/* Finance summary mini-cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              {[
                { label: 'Revenus Soutien Encaissés', value: `${analytics.supportFinance.paidRevenue} DH`, color: '#22c55e', icon: '✅', count: `${analytics.supportFinance.paidCount} séances payées` },
                { label: 'Restant à Encaisser', value: `${analytics.supportFinance.unpaidPotential} DH`, color: '#f97316', icon: '⏳', count: `${analytics.supportFinance.unpaidCount} séances non payées` },
                { label: 'Revenus Futurs Projetés', value: `${analytics.supportFinance.projectedFromBooked} DH`, color: '#60a5fa', icon: '📅', count: `des séances réservées` },
                { label: 'Prix Moyen par Séance', value: `${analytics.supportFinance.avgPricePerSession} DH`, color: '#a78bfa', icon: '📊', count: `sur séances terminées` },
              ].map((c, i) => (
                <div key={i} className="card" style={{ padding: '16px', borderLeft: `3px solid ${c.color}` }}>
                  <div style={{ fontSize: '1.4rem', marginBottom: '6px' }}>{c.icon}</div>
                  <div style={{ color: 'white', fontWeight: '700', fontSize: '1.3rem' }}>{c.value}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>{c.label}</div>
                  <div style={{ color: c.color, fontSize: '0.7rem', marginTop: '2px' }}>{c.count}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
              {/* Monthly Revenue Trend */}
              {analytics.supportRevenueTrend && (
                <div className="card">
                  <h3 style={{ color: 'white', fontWeight: 'bold', fontSize: '1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp size={16} style={{ color: '#a78bfa' }} /> Tendance Revenus & Séances Soutien (6 mois)
                  </h3>
                  <div style={{ height: '220px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics.supportRevenueTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                        <YAxis yAxisId="left" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                        <YAxis yAxisId="right" orientation="right" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} labelStyle={{ color: 'white' }} />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="revenus" name="Revenus (DH)" stroke="#a78bfa" strokeWidth={2} dot={{ fill: '#a78bfa', r: 4 }} />
                        <Line yAxisId="right" type="monotone" dataKey="seances" name="Séances" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Status Donut */}
              {analytics.supportByStatus && (
                <div className="card">
                  <h3 style={{ color: 'white', fontWeight: 'bold', fontSize: '1rem', marginBottom: '16px' }}>Répartition des Séances</h3>
                  <div style={{ height: '180px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={analytics.supportByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={45} label={({ name, value }) => `${value}`}>
                          {analytics.supportByStatus.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>

            {/* Moniteur Performance Table */}
            {analytics.moniteurPerformance?.length > 0 && (
              <div className="card">
                <h3 style={{ color: 'white', fontWeight: 'bold', fontSize: '1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={16} style={{ color: '#f59e0b' }} /> Performance des Moniteurs — Cours de Soutien
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Moniteur</th>
                        <th>Séances</th>
                        <th>Heures</th>
                        <th>CA Généré</th>
                        <th>Note Clients</th>
                        <th>Avis</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.moniteurPerformance.map((m, i) => (
                        <tr key={i}>
                          <td>
                            <span style={{ fontWeight: 'bold', color: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7f32' : 'var(--text-muted)' }}>
                              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                            </span>
                          </td>
                          <td><strong style={{ color: 'white' }}>{m.name}</strong></td>
                          <td><span className="badge badge-success">{m.sessions}</span></td>
                          <td style={{ color: '#60a5fa' }}>{m.heures}h</td>
                          <td><strong style={{ color: '#22c55e' }}>{m.revenus} DH</strong></td>
                          <td>
                            {m.avgRating ? (
                              <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                                {[1,2,3,4,5].map(s => (
                                  <Star key={s} size={12} style={{ color: s <= Math.round(m.avgRating) ? '#f59e0b' : '#334155', fill: s <= Math.round(m.avgRating) ? '#f59e0b' : 'none' }} />
                                ))}
                                <span style={{ color: '#f59e0b', fontSize: '0.8rem', marginLeft: '4px', fontWeight: '600' }}>{m.avgRating}</span>
                              </div>
                            ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>}
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{m.ratingCount} avis</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ADMIN TAB: AI Predictive Maintenance */}
        {activeTab === 'maintenance-ai' && (
          <PredictiveMaintenanceView authData={authData} vehicles={vehicles} />
        )}

        {/* ADMIN TAB: AI Candidate Risk */}
        {activeTab === 'candidate-risk-ai' && (
          <CandidateRiskView authData={authData} candidates={candidates} />
        )}

        {/* ADMIN TAB: Dynamic Pricing */}
        {activeTab === 'dynamic-pricing' && (
          <DynamicPricingView authData={authData} moniteurs={moniteurs} />
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
                              {c.totalAmount - c.amountPaid <= 0 ? (
                                <>Payé intégralement <br /><small>({c.totalAmount} DH)</small></>
                              ) : (
                                <>{c.amountPaid} / {c.totalAmount} DH</>
                              )}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => {
                                  const newTotal = prompt(`Nouveau montant total négocié pour ${c.user.fullName} (DH) :`, c.totalAmount);
                                  if (newTotal !== null) {
                                    const parsed = parseFloat(newTotal);
                                    if (!isNaN(parsed)) {
                                      fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/assistant/candidates/${c.user.id}/price`, {
                                        method: 'PUT',
                                        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ totalAmount: parsed })
                                      }).then(async res => {
                                        const resData = await res.json();
                                        if(!res.ok) throw new Error(resData.message);
                                        triggerFeedback('success', resData.message);
                                        refreshData();
                                      }).catch(err => triggerFeedback('danger', err.message));
                                    }
                                  }
                                }}
                                className="btn btn-secondary"
                                style={{ padding: '6px 12px', fontSize: '0.8rem', backgroundColor: '#334155' }}
                                title="Modifier le prix négocié"
                              >
                                <Edit2 size={14} /> Prix
                              </button>
                              <button
                                onClick={() => setContractToPrint(c)}
                                className="btn btn-secondary"
                                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                title="Générer Contrat Type PDF"
                              >
                                <Printer size={14} /> Imprimer
                              </button>
                            </div>
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
                        {c.user.fullName} (CIN: {c.cin}) — {remains <= 0 ? 'Payé intégralement' : `Reste à payer: ${remains} DH`}
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
                          <option key={c.user.id} value={c.user.id}>
                            {c.user.fullName} — {c.totalAmount - c.amountPaid <= 0 ? 'Payé intégralement' : `Reste: ${c.totalAmount - c.amountPaid} DH`}
                          </option>
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
        
        {/* 8. ASSISTANT TAB: Cours de Soutien */}
        {activeTab === 'support-lessons' && (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Stats Cards */}
            {supportStats && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
                  <BookOpen size={28} style={{ color: 'var(--accent)', margin: '0 auto 8px auto' }} />
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white' }}>{supportStats.totalLessons}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Total Séances</div>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
                  <CheckCircle2 size={28} style={{ color: 'var(--success)', margin: '0 auto 8px auto' }} />
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#22c55e' }}>{supportStats.totalCompleted}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Terminées</div>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
                  <DollarSign size={28} style={{ color: '#f59e0b', margin: '0 auto 8px auto' }} />
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>{supportStats.totalRevenue} DH</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Revenus Soutien</div>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
                  <Clock size={28} style={{ color: '#8b5cf6', margin: '0 auto 8px auto' }} />
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6' }}>{supportStats.totalHoursDelivered}h</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Heures Dispensées</div>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px' }}>
              {/* Booking Form */}
              <div className="card">
                <h3 style={{ fontSize: '1.15rem', fontWeight: 'bold', color: 'white', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <PlusCircle className="text-accent" size={18} /> Planifier une Séance
                </h3>
                <form onSubmit={handleCreateSupportLesson}>
                  <div className="form-group">
                    <label>Candidat</label>
                    <select name="candidateId" className="form-control" required>
                      <option value="">-- Sélectionner --</option>
                      {candidates.map(c => (
                        <option key={c.user.id} value={c.user.id}>{c.user.fullName} (CIN: {c.cin})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Moniteur Assigné
                      {availabilityChecking && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px' }}>⏳ Vérification...</span>}
                      {!availabilityChecking && moniteurAvailability.length > 0 && !slotDatetime && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px' }}>— Choisissez une date d'abord</span>}
                    </label>
                    <select name="moniteurId" className="form-control" required>
                      <option value="">-- Sélectionner --</option>
                      {moniteurAvailability.length > 0
                        ? moniteurAvailability.map(m => (
                          <option
                            key={m.id}
                            value={m.id}
                            disabled={!m.available}
                            style={{ color: m.available ? 'white' : '#6b7280', backgroundColor: m.available ? '#1e293b' : '#0f172a' }}
                          >
                            {m.available ? '✅' : '🚫'} {m.fullName}
                            {!m.available && m.conflictReason ? ` — Occupé (${m.conflictReason})` : ''}
                          </option>
                        ))
                        : moniteurs.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.fullName} {slotDatetime ? '' : '— (sélectionner une date pour vérifier disponibilité)'}
                          </option>
                        ))
                      }
                    </select>
                    {moniteurAvailability.length > 0 && (
                      <div style={{ marginTop: '6px', display: 'flex', gap: '12px', fontSize: '0.75rem' }}>
                        <span style={{ color: '#22c55e' }}>✅ {moniteurAvailability.filter(m => m.available).length} disponible(s)</span>
                        <span style={{ color: '#ef4444' }}>🚫 {moniteurAvailability.filter(m => !m.available).length} occupé(s)</span>
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Véhicule (Optionnel)</label>
                    <select name="vehicleId" className="form-control">
                      <option value="">-- Aucun --</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.licensePlate})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Type de Cours</label>
                    <select name="lessonType" className="form-control" required>
                      <option value="PERFECTIONNEMENT">Perfectionnement Général</option>
                      <option value="PREPARATION_EXAMEN">Préparation Examen</option>
                      <option value="POST_ECHEC">Remise à Niveau Post-Échec</option>
                      <option value="CRENEAU_PARKING">Créneau &amp; Stationnement</option>
                      <option value="CONDUITE_AUTOROUTE">Conduite Autoroute</option>
                      <option value="CONDUITE_NUIT">Conduite de Nuit</option>
                    </select>
                  </div>
                  <div className="grid-2">
                    <div className="form-group">
                      <label>Date &amp; Heure</label>
                      <input
                        type="datetime-local"
                        name="sessionDate"
                        className="form-control"
                        required
                        value={slotDatetime}
                        onChange={e => {
                          setSlotDatetime(e.target.value);
                          setMoniteurAvailability([]);
                          if (e.target.value) checkMoniteurAvailability(e.target.value, slotDuration);
                        }}
                      />
                    </div>
                    <div className="form-group">
                      <label>Durée</label>
                      <select
                        name="durationMinutes"
                        className="form-control"
                        required
                        value={slotDuration}
                        onChange={e => {
                          setSlotDuration(parseInt(e.target.value));
                          if (slotDatetime) checkMoniteurAvailability(slotDatetime, parseInt(e.target.value));
                        }}
                      >
                        <option value="60">1 heure (60 min)</option>
                        <option value="90">1h30 (90 min)</option>
                        <option value="120">2 heures (120 min)</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Prix de la Séance (DH)</label>
                    <input type="number" name="pricePerSession" className="form-control" placeholder="Ex: 150" step="10" min="0" required />
                  </div>
                  <div className="form-group">
                    <label>Commentaires (Optionnel)</label>
                    <textarea name="comments" className="form-control" rows="2" placeholder="Notes spéciales pour le moniteur..."></textarea>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                    <BookOpen size={16} style={{ marginRight: '8px' }} /> Réserver & Encaisser
                  </button>
                </form>
              </div>

              {/* History Table */}
              <div className="card" style={{ overflow: 'hidden' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 'bold', color: 'white', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar className="text-accent" size={18} /> Historique des Séances
                </h3>
                <div style={{ overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Candidat</th>
                        <th>Moniteur</th>
                        <th>Type</th>
                        <th>Durée</th>
                        <th>Prix</th>
                        <th>Statut</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supportLessons.map(sl => (
                        <tr key={sl.id}>
                          <td>{new Date(sl.sessionDate).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                          <td><strong style={{ color: 'white' }}>{sl.candidate?.fullName}</strong></td>
                          <td>{sl.moniteur?.fullName}</td>
                          <td>
                            <span className="badge" style={{ backgroundColor: 'rgba(139,92,246,0.2)', color: '#a78bfa', fontSize: '0.7rem' }}>
                              {sl.lessonType?.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td>{sl.durationMinutes} min</td>
                          <td><strong style={{ color: '#22c55e' }}>{sl.pricePerSession} DH</strong></td>
                          <td>
                            <span className={`badge ${sl.status === 'COMPLETED' ? 'badge-success' : sl.status === 'CANCELLED' ? 'badge-danger' : 'badge-warning'}`}>
                              {sl.status === 'COMPLETED' ? 'Terminée' : sl.status === 'CANCELLED' ? 'Annulée' : 'Réservée'}
                            </span>
                          </td>
                          <td>
                            {sl.status === 'BOOKED' && (
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  onClick={() => {
                                    fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/assistant/support-lessons/${sl.id}/complete`, {
                                      method: 'PUT',
                                      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                                      body: JSON.stringify({})
                                    }).then(async res => {
                                      const d = await res.json();
                                      if (!res.ok) throw new Error(d.message);
                                      triggerFeedback('success', d.message);
                                      refreshData();
                                    }).catch(err => triggerFeedback('danger', err.message));
                                  }}
                                  className="btn btn-secondary"
                                  style={{ padding: '4px 10px', fontSize: '0.75rem', backgroundColor: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}
                                  title="Marquer comme terminée"
                                >
                                  <CheckCircle2 size={13} /> Terminer
                                </button>
                                <button
                                  onClick={() => {
                                    if (!confirm('Annuler cette séance de soutien ?')) return;
                                    fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/assistant/support-lessons/${sl.id}/cancel`, {
                                      method: 'PUT',
                                      headers: { 'Authorization': `Bearer ${token}` }
                                    }).then(async res => {
                                      const d = await res.json();
                                      if (!res.ok) throw new Error(d.message);
                                      triggerFeedback('success', d.message);
                                      refreshData();
                                    }).catch(err => triggerFeedback('danger', err.message));
                                  }}
                                  className="btn btn-secondary"
                                  style={{ padding: '4px 10px', fontSize: '0.75rem', backgroundColor: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
                                  title="Annuler"
                                >
                                  <XCircle size={13} /> Annuler
                                </button>
                              </div>
                            )}
                            {sl.status === 'COMPLETED' && sl.performanceRating && (
                              <div style={{ display: 'flex', gap: '2px' }}>
                                {[1,2,3,4,5].map(s => (
                                  <Star key={s} size={14} style={{ color: s <= sl.performanceRating ? '#f59e0b' : '#334155', fill: s <= sl.performanceRating ? '#f59e0b' : 'none' }} />
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                      {supportLessons.length === 0 && (
                        <tr><td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px' }}>Aucune séance de soutien enregistrée.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 9. MONITEUR TAB: Mes Cours de Soutien */}
        {activeTab === 'moniteur-support' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Feedback Modal Overlay */}
            {feedbackModalLesson && (
              <div style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                backgroundColor: 'rgba(0,0,0,0.7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(4px)'
              }}>
                <div style={{
                  backgroundColor: '#1e293b', borderRadius: '16px', padding: '32px',
                  width: '100%', maxWidth: '520px', border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
                }}>
                  {/* Modal Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div>
                      <h3 style={{ color: 'white', fontWeight: 'bold', fontSize: '1.15rem', margin: 0 }}>
                        📝 Évaluation du Candidat
                      </h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                        {feedbackModalLesson.candidate?.fullName} — {new Date(feedbackModalLesson.sessionDate).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <button
                      onClick={() => { setFeedbackModalLesson(null); setFeedbackRating(0); setFeedbackHover(0); setFeedbackText(''); }}
                      style={{ color: 'var(--text-muted)', background: 'none', fontSize: '1.4rem', lineHeight: 1, padding: '4px 8px', borderRadius: '8px' }}
                    >×</button>
                  </div>

                  {/* Star Rating */}
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginBottom: '12px' }}>
                      Note de performance du candidat
                    </label>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFeedbackRating(star)}
                          onMouseEnter={() => setFeedbackHover(star)}
                          onMouseLeave={() => setFeedbackHover(0)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            padding: '4px', borderRadius: '8px',
                            transform: (feedbackHover || feedbackRating) >= star ? 'scale(1.25)' : 'scale(1)',
                            transition: 'transform 0.15s ease',
                          }}
                          title={`${star} étoile${star > 1 ? 's' : ''}`}
                        >
                          <Star
                            size={40}
                            style={{
                              color: (feedbackHover || feedbackRating) >= star ? '#f59e0b' : '#334155',
                              fill: (feedbackHover || feedbackRating) >= star ? '#f59e0b' : 'none',
                              transition: 'color 0.15s, fill 0.15s'
                            }}
                          />
                        </button>
                      ))}
                    </div>
                    {feedbackRating > 0 && (
                      <p style={{ textAlign: 'center', marginTop: '10px', fontSize: '0.9rem', color: '#f59e0b' }}>
                        {feedbackRating === 1 ? '⚠️ Très insuffisant' :
                         feedbackRating === 2 ? '📉 À améliorer' :
                         feedbackRating === 3 ? '👍 Acceptable' :
                         feedbackRating === 4 ? '✅ Bon niveau' :
                         '🏆 Excellent — Prêt pour l\'examen !'}
                      </p>
                    )}
                  </div>

                  {/* Comment */}
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginBottom: '8px' }}>
                      Commentaire pédagogique
                    </label>
                    <textarea
                      value={feedbackText}
                      onChange={e => setFeedbackText(e.target.value)}
                      rows={4}
                      placeholder="Ex: Bonne maîtrise des virages, difficultés en créneau arrière — retravailler l'angle d'attaque..."
                      style={{
                        width: '100%', borderRadius: '10px', padding: '12px',
                        backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.08)',
                        color: 'white', fontSize: '0.9rem', resize: 'vertical', fontFamily: 'inherit'
                      }}
                    />
                    <div style={{ textAlign: 'right', fontSize: '0.75rem', color: feedbackText.length > 400 ? '#f59e0b' : 'var(--text-muted)', marginTop: '4px' }}>
                      {feedbackText.length}/500 caractères
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={() => {
                        if (!feedbackRating) { triggerFeedback('danger', 'Veuillez sélectionner une note (1 à 5 étoiles).'); return; }
                        if (!feedbackText.trim()) { triggerFeedback('danger', 'Le commentaire pédagogique est obligatoire.'); return; }
                        if (feedbackText.length > 500) { triggerFeedback('danger', 'Le commentaire ne peut pas dépasser 500 caractères.'); return; }

                        fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/moniteur/support-lessons/${feedbackModalLesson.id}/feedback`, {
                          method: 'PUT',
                          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                          body: JSON.stringify({ performanceRating: feedbackRating, moniteurFeedback: feedbackText })
                        })
                          .then(async res => {
                            const data = await res.json();
                            if (!res.ok) throw new Error(data.message);
                            triggerFeedback('success', data.message);
                            setFeedbackModalLesson(null);
                            setFeedbackRating(0);
                            setFeedbackHover(0);
                            setFeedbackText('');
                            refreshData();
                          })
                          .catch(err => triggerFeedback('danger', err.message));
                      }}
                      className="btn btn-primary"
                      style={{ flex: 1 }}
                      disabled={!feedbackRating || !feedbackText.trim()}
                    >
                      <CheckCircle2 size={16} style={{ marginRight: '8px' }} />
                      Enregistrer l'Évaluation
                    </button>
                    <button
                      onClick={() => { setFeedbackModalLesson(null); setFeedbackRating(0); setFeedbackHover(0); setFeedbackText(''); }}
                      className="btn btn-secondary"
                      style={{ flex: 0 }}
                    >Annuler</button>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
              {[
                { label: 'À venir', count: supportLessons.filter(s => s.status === 'BOOKED').length, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
                { label: 'Terminées', count: supportLessons.filter(s => s.status === 'COMPLETED').length, color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
                { label: 'En attente de feedback', count: supportLessons.filter(s => s.status === 'COMPLETED' && !s.performanceRating).length, color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
                { label: 'Note moy.', count: supportLessons.filter(s => s.performanceRating).length > 0
                    ? (supportLessons.filter(s => s.performanceRating).reduce((sum, s) => sum + s.performanceRating, 0) / supportLessons.filter(s => s.performanceRating).length).toFixed(1) + ' ⭐'
                    : '—', color: '#a78bfa', bg: 'rgba(139,92,246,0.1)' },
              ].map((stat, i) => (
                <div key={i} style={{ padding: '14px 16px', borderRadius: '10px', background: stat.bg, border: `1px solid ${stat.color}30`, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: stat.color }}>{stat.count}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Main Table */}
            <div className="card" style={{ overflow: 'hidden' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 'bold', color: 'white', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen className="text-accent" size={18} /> Mes Séances de Soutien Assignées
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Date & Heure</th>
                      <th>Candidat</th>
                      <th>Type</th>
                      <th>Durée</th>
                      <th>Statut</th>
                      <th>Évaluation</th>
                      <th>Action Feedback</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supportLessons.map(sl => (
                      <tr key={sl.id} style={{ borderLeft: sl.status === 'COMPLETED' && !sl.performanceRating ? '3px solid #f97316' : 'none' }}>
                        <td>{new Date(sl.sessionDate).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                        <td><strong style={{ color: 'white' }}>{sl.candidate?.fullName}</strong></td>
                        <td>
                          <span className="badge" style={{ backgroundColor: 'rgba(139,92,246,0.2)', color: '#a78bfa', fontSize: '0.7rem' }}>
                            {sl.lessonType?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td>{sl.durationMinutes} min</td>
                        <td>
                          <span className={`badge ${sl.status === 'COMPLETED' ? 'badge-success' : sl.status === 'CANCELLED' ? 'badge-danger' : 'badge-warning'}`}>
                            {sl.status === 'COMPLETED' ? 'Terminée' : sl.status === 'CANCELLED' ? 'Annulée' : 'Réservée'}
                          </span>
                        </td>
                        <td>
                          {sl.performanceRating ? (
                            <div>
                              <div style={{ display: 'flex', gap: '2px', marginBottom: '4px' }}>
                                {[1,2,3,4,5].map(s => (
                                  <Star key={s} size={14} style={{ color: s <= sl.performanceRating ? '#f59e0b' : '#334155', fill: s <= sl.performanceRating ? '#f59e0b' : 'none' }} />
                                ))}
                                <span style={{ fontSize: '0.75rem', color: '#f59e0b', marginLeft: '4px' }}>{sl.performanceRating}/5</span>
                              </div>
                              {sl.moniteurFeedback && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={sl.moniteurFeedback}>
                                  {sl.moniteurFeedback}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: sl.status === 'COMPLETED' ? '#f97316' : 'var(--text-muted)', fontSize: '0.8rem' }}>
                              {sl.status === 'COMPLETED' ? '⚠️ En attente' : '—'}
                            </span>
                          )}
                        </td>
                        <td>
                          {sl.status === 'COMPLETED' && (
                            <button
                              onClick={() => {
                                setFeedbackModalLesson(sl);
                                setFeedbackRating(sl.performanceRating || 0);
                                setFeedbackText(sl.moniteurFeedback || '');
                              }}
                              className="btn btn-secondary"
                              style={{
                                padding: '6px 14px', fontSize: '0.8rem',
                                backgroundColor: sl.performanceRating ? 'rgba(139,92,246,0.15)' : 'rgba(249,115,22,0.15)',
                                color: sl.performanceRating ? '#a78bfa' : '#f97316',
                                border: `1px solid ${sl.performanceRating ? 'rgba(139,92,246,0.3)' : 'rgba(249,115,22,0.3)'}`,
                                display: 'flex', alignItems: 'center', gap: '6px'
                              }}
                              title={sl.performanceRating ? 'Modifier l\'évaluation' : 'Soumettre une évaluation'}
                            >
                              <Star size={13} />
                              {sl.performanceRating ? 'Modifier' : 'Évaluer'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {supportLessons.length === 0 && (
                      <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                        <BookOpen size={32} style={{ color: 'var(--text-muted)', display: 'block', margin: '0 auto 12px auto' }} />
                        Aucune séance de soutien assignée pour le moment.
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}


        {/* 10. CANDIDATE TAB: Mes Cours de Soutien */}
        {activeTab === 'candidate-support' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Candidate Rating Modal */}
            {candRatingModalLesson && (
              <div style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                backgroundColor: 'rgba(0,0,0,0.75)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(6px)'
              }}>
                <div style={{
                  backgroundColor: '#1e293b', borderRadius: '20px', padding: '36px',
                  width: '100%', maxWidth: '500px', border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 30px 60px rgba(0,0,0,0.6)'
                }}>
                  <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>⭐</div>
                    <h3 style={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem', margin: 0 }}>
                      Évaluez votre Moniteur
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '6px' }}>
                      <strong style={{ color: 'white' }}>{candRatingModalLesson.moniteur?.fullName}</strong>
                      {' '}— {candRatingModalLesson.lessonType?.replace(/_/g, ' ')}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {new Date(candRatingModalLesson.sessionDate).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </div>

                  {/* Stars */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '16px' }}>
                    {[1,2,3,4,5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setCandRating(star)}
                        onMouseEnter={() => setCandRatingHover(star)}
                        onMouseLeave={() => setCandRatingHover(0)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                          transform: (candRatingHover || candRating) >= star ? 'scale(1.3)' : 'scale(1)',
                          transition: 'transform 0.15s ease'
                        }}
                      >
                        <Star size={44} style={{
                          color: (candRatingHover || candRating) >= star ? '#f59e0b' : '#334155',
                          fill: (candRatingHover || candRating) >= star ? '#f59e0b' : 'none',
                          transition: 'color 0.15s, fill 0.15s'
                        }} />
                      </button>
                    ))}
                  </div>

                  {candRating > 0 && (
                    <p style={{ textAlign: 'center', fontSize: '1rem', marginBottom: '20px', color: '#f59e0b' }}>
                      {candRating === 1 ? '😞 Très décevant' :
                       candRating === 2 ? '😐 Passable' :
                       candRating === 3 ? '🙂 Bien' :
                       candRating === 4 ? '😊 Très bien !' :
                       '🌟 Excellent moniteur !'}
                    </p>
                  )}

                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginBottom: '8px' }}>
                      Commentaire (optionnel)
                    </label>
                    <textarea
                      value={candComment}
                      onChange={e => setCandComment(e.target.value)}
                      rows={3}
                      maxLength={300}
                      placeholder="Ex: Très patient, explications claires, j'ai beaucoup progressé..."
                      style={{
                        width: '100%', borderRadius: '10px', padding: '12px',
                        backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.08)',
                        color: 'white', fontSize: '0.9rem', resize: 'vertical', fontFamily: 'inherit'
                      }}
                    />
                    <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {candComment.length}/300
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={() => {
                        if (!candRating) { triggerFeedback('danger', 'Veuillez sélectionner une note.'); return; }
                        fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/candidate/support-lessons/${candRatingModalLesson.id}/rate`, {
                          method: 'PUT',
                          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                          body: JSON.stringify({ candidateRating: candRating, candidateComment: candComment })
                        })
                          .then(async res => {
                            const d = await res.json();
                            if (!res.ok) throw new Error(d.message);
                            triggerFeedback('success', d.message);
                            setCandRatingModalLesson(null); setCandRating(0); setCandRatingHover(0); setCandComment('');
                            refreshData();
                          })
                          .catch(err => triggerFeedback('danger', err.message));
                      }}
                      className="btn btn-primary"
                      style={{ flex: 1 }}
                      disabled={!candRating}
                    >
                      <Star size={16} style={{ marginRight: '8px' }} />
                      Envoyer mon Avis
                    </button>
                    <button
                      onClick={() => { setCandRatingModalLesson(null); setCandRating(0); setCandRatingHover(0); setCandComment(''); }}
                      className="btn btn-secondary"
                    >Fermer</button>
                  </div>
                </div>
              </div>
            )}

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px' }}>
              {[
                { label: 'Séances Terminées', count: supportLessons.filter(s => s.status === 'COMPLETED').length, color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
                { label: 'À Venir', count: supportLessons.filter(s => s.status === 'BOOKED').length, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
                { label: 'Heures Cumulées', count: (supportLessons.filter(s => s.status === 'COMPLETED').reduce((sum, s) => sum + (s.durationMinutes || 0), 0) / 60).toFixed(1) + 'h', color: '#a78bfa', bg: 'rgba(139,92,246,0.1)' },
                { label: 'Avis En Attente', count: supportLessons.filter(s => s.status === 'COMPLETED' && !s.candidateRating).length, color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
              ].map((stat, i) => (
                <div key={i} style={{ padding: '14px 16px', borderRadius: '10px', background: stat.bg, border: `1px solid ${stat.color}30`, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: stat.color }}>{stat.count}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="card">
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Moniteur</th>
                      <th>Type</th>
                      <th>Durée</th>
                      <th>Statut</th>
                      <th>Note du Moniteur</th>
                      <th>Mon Avis</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supportLessons.map(sl => (
                      <tr key={sl.id} style={{ borderLeft: sl.status === 'COMPLETED' && !sl.candidateRating ? '3px solid #f97316' : 'none' }}>
                        <td>{new Date(sl.sessionDate).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                        <td><strong style={{ color: 'white' }}>{sl.moniteur?.fullName}</strong></td>
                        <td>
                          <span className="badge" style={{ backgroundColor: 'rgba(139,92,246,0.2)', color: '#a78bfa', fontSize: '0.7rem' }}>
                            {sl.lessonType?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td>{sl.durationMinutes} min</td>
                        <td>
                          <span className={`badge ${sl.status === 'COMPLETED' ? 'badge-success' : sl.status === 'CANCELLED' ? 'badge-danger' : 'badge-warning'}`}>
                            {sl.status === 'COMPLETED' ? 'Terminée' : sl.status === 'CANCELLED' ? 'Annulée' : 'Réservée'}
                          </span>
                        </td>
                        <td>
                          {sl.performanceRating ? (
                            <div>
                              <div style={{ display: 'flex', gap: '2px', marginBottom: '2px' }}>
                                {[1,2,3,4,5].map(s => (
                                  <Star key={s} size={12} style={{ color: s <= sl.performanceRating ? '#f59e0b' : '#334155', fill: s <= sl.performanceRating ? '#f59e0b' : 'none' }} />
                                ))}
                              </div>
                              {sl.moniteurFeedback && (
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={sl.moniteurFeedback}>
                                  {sl.moniteurFeedback}
                                </div>
                              )}
                            </div>
                          ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>}
                        </td>
                        <td>
                          {sl.candidateRating ? (
                            <div style={{ display: 'flex', gap: '2px' }}>
                              {[1,2,3,4,5].map(s => (
                                <Star key={s} size={12} style={{ color: s <= sl.candidateRating ? '#f59e0b' : '#334155', fill: s <= sl.candidateRating ? '#f59e0b' : 'none' }} />
                              ))}
                            </div>
                          ) : <span style={{ color: sl.status === 'COMPLETED' ? '#f97316' : 'var(--text-muted)', fontSize: '0.75rem' }}>
                            {sl.status === 'COMPLETED' ? '⚠️ Non noté' : '—'}
                          </span>}
                        </td>
                        <td>
                          {sl.status === 'COMPLETED' && (
                            <button
                              onClick={() => { setCandRatingModalLesson(sl); setCandRating(sl.candidateRating || 0); setCandComment(sl.candidateComment || ''); }}
                              className="btn btn-secondary"
                              style={{
                                padding: '5px 12px', fontSize: '0.78rem',
                                backgroundColor: sl.candidateRating ? 'rgba(139,92,246,0.15)' : 'rgba(249,115,22,0.15)',
                                color: sl.candidateRating ? '#a78bfa' : '#f97316',
                                border: `1px solid ${sl.candidateRating ? 'rgba(139,92,246,0.3)' : 'rgba(249,115,22,0.3)'}`,
                                display: 'flex', alignItems: 'center', gap: '5px'
                              }}
                            >
                              <Star size={12} />
                              {sl.candidateRating ? 'Modifier' : 'Évaluer'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {supportLessons.length === 0 && (
                      <tr><td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                        Vous n'avez aucun cours de soutien enregistré.
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* CARNET DE PROGRESSION — CANDIDATE */}
        {activeTab === 'carnet-progression' && role === 'CANDIDATE' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {progressionLoading && (
              <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
                <div style={{ width: '40px', height: '40px', border: '4px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px auto' }} />
                <p style={{ color: 'var(--text-muted)' }}>Calcul de votre progression...</p>
              </div>
            )}
            {!progressionLoading && !progression && (
              <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
                <TrendingUp size={48} style={{ color: 'var(--text-muted)', display: 'block', margin: '0 auto 16px auto' }} />
                <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>Chargez votre carnet de progression.</p>
                <button className="btn btn-primary" onClick={fetchProgression}>
                  <TrendingUp size={16} style={{ marginRight: '8px' }} /> Charger mon Carnet
                </button>
              </div>
            )}
            {!progressionLoading && progression && (
              <>
                {/* Next session banner */}
                {progression.nextSession && Object.keys(progression.nextSession).length > 0 && (
                  <div style={{ padding: '16px 20px', borderRadius: '12px', background: 'linear-gradient(90deg, rgba(99,102,241,0.15), rgba(139,92,246,0.08))', border: '1px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <Calendar size={22} style={{ color: '#818cf8', flexShrink: 0 }} />
                    <div>
                      <div style={{ color: 'white', fontWeight: '600', fontSize: '0.9rem' }}>Prochaine séance avec {progression.nextSession.moniteurName}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '2px' }}>
                        {new Date(progression.nextSession.sessionDate).toLocaleString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })} — {progression.nextSession.durationMinutes} min · {progression.nextSession.lessonType?.replace(/_/g, ' ')}
                      </div>
                    </div>
                  </div>
                )}
                {/* Readiness gauge */}
                {(() => {
                  const r = progression.readiness;
                  const color = r.score >= 85 ? '#22c55e' : r.score >= 65 ? '#3b82f6' : r.score >= 40 ? '#f59e0b' : '#ef4444';
                  const emoji = r.score >= 85 ? '🏆' : r.score >= 65 ? '📈' : r.score >= 40 ? '🔄' : '🚀';
                  return (
                    <div className="card" style={{ background: 'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,41,59,0.9))' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: 'white', fontWeight: '700', fontSize: '1.1rem' }}>{emoji} Score de Préparation à l'Examen</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '4px' }}>{r.advice}</div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '16px' }}>
                          <div style={{ fontSize: '2.5rem', fontWeight: '800', color, lineHeight: 1 }}>{r.score}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>/ 100</div>
                        </div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '999px', height: '12px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${r.score}%`, background: `linear-gradient(90deg, ${color}88, ${color})`, borderRadius: '999px', boxShadow: `0 0 12px ${color}66`, transition: 'width 1s ease' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        <span>🚀 Débutant</span><span>🔄 En cours</span><span>📈 Bon niveau</span><span>🏆 Prêt !</span>
                      </div>
                    </div>
                  );
                })()}
                {/* KPI cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: '12px' }}>
                  {[
                    { label: 'Séances Terminées', value: progression.globalStats.completedSessions, icon: '✅', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
                    { label: 'Heures de Soutien', value: `${progression.globalStats.totalHours}h`, icon: '⏱️', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
                    { label: 'Note Moy. Moniteur', value: progression.globalStats.ratedSessions > 0 ? `${progression.globalStats.averagePerformance}/5` : '—', icon: '⭐', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
                    { label: 'Leçons Conduite', value: progression.globalStats.totalDrivingSlots, icon: '🚗', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
                    { label: 'À Venir', value: progression.globalStats.upcomingSessions, icon: '📅', color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
                  ].map((kpi, i) => (
                    <div key={i} style={{ padding: '14px', borderRadius: '12px', background: kpi.bg, border: `1px solid ${kpi.color}30`, textAlign: 'center' }}>
                      <div style={{ fontSize: '1.4rem', marginBottom: '4px' }}>{kpi.icon}</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '800', color: kpi.color }}>{kpi.value}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '4px' }}>{kpi.label}</div>
                    </div>
                  ))}
                </div>
                {/* Per-type skill breakdown */}
                {progression.byType?.length > 0 && (
                  <div className="card">
                    <h3 style={{ color: 'white', fontWeight: 'bold', fontSize: '1.05rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ClipboardList size={16} className="text-accent" /> Analyse par Type de Cours
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
                      {progression.byType.map((t, i) => {
                        const emo = { PERFECTIONNEMENT: '🔧', PREPARATION_EXAMEN: '📝', POST_ECHEC: '💪', CRENEAU_PARKING: '🅿️', CONDUITE_AUTOROUTE: '🛣️', CONDUITE_NUIT: '🌙' };
                        const avg = t.avgRating;
                        const barColor = avg >= 4 ? '#22c55e' : avg >= 3 ? '#f59e0b' : avg ? '#ef4444' : '#64748b';
                        return (
                          <div key={i} style={{ padding: '14px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                              <span style={{ fontSize: '1.2rem' }}>{emo[t.type] || '📋'}</span>
                              <div style={{ flex: 1 }}>
                                <div style={{ color: 'white', fontSize: '0.85rem', fontWeight: '600' }}>{t.type?.replace(/_/g, ' ')}</div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{t.sessions} séance(s) · {Math.round(t.totalMinutes / 60 * 10) / 10}h</div>
                              </div>
                              {avg && <div style={{ color: barColor, fontWeight: 'bold', fontSize: '0.9rem', flexShrink: 0 }}>{avg}★</div>}
                            </div>
                            {avg && (
                              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '999px', height: '6px', overflow: 'hidden', marginBottom: '8px' }}>
                                <div style={{ height: '100%', width: `${(avg / 5) * 100}%`, background: barColor, borderRadius: '999px', transition: 'width 0.8s ease' }} />
                              </div>
                            )}
                            {t.feedbacks?.length > 0 && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '6px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', borderLeft: '2px solid var(--accent)' }}>
                                "{t.feedbacks[t.feedbacks.length - 1]}"
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {/* Timeline */}
                {progression.timeline?.length > 0 && (
                  <div className="card">
                    <h3 style={{ color: 'white', fontWeight: 'bold', fontSize: '1.05rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Activity size={16} className="text-accent" /> Historique Détaillé des Séances
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                      {progression.timeline.map((sl, idx) => {
                        const emo = { PERFECTIONNEMENT: '🔧', PREPARATION_EXAMEN: '📝', POST_ECHEC: '💪', CRENEAU_PARKING: '🅿️', CONDUITE_AUTOROUTE: '🛣️', CONDUITE_NUIT: '🌙' };
                        const rc = [null, '#ef4444', '#f97316', '#f59e0b', '#3b82f6', '#22c55e'];
                        const rl = ['', 'Très insuffisant', 'À améliorer', 'Acceptable', 'Bon niveau', 'Excellent !'];
                        return (
                          <div key={sl.id} style={{ display: 'flex', gap: '16px', paddingBottom: '24px', position: 'relative' }}>
                            {idx < progression.timeline.length - 1 && (
                              <div style={{ position: 'absolute', left: '19px', top: '40px', bottom: 0, width: '2px', background: 'rgba(255,255,255,0.05)' }} />
                            )}
                            <div style={{ flexShrink: 0, width: '40px', height: '40px', borderRadius: '50%', background: sl.performanceRating ? `${rc[sl.performanceRating]}22` : 'rgba(255,255,255,0.05)', border: `2px solid ${sl.performanceRating ? rc[sl.performanceRating] : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                              {emo[sl.lessonType] || '📋'}
                            </div>
                            <div style={{ flex: 1, paddingTop: '4px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px', flexWrap: 'wrap', gap: '4px' }}>
                                <div>
                                  <span style={{ color: 'white', fontWeight: '600', fontSize: '0.9rem' }}>{sl.lessonType?.replace(/_/g, ' ')}</span>
                                  <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginLeft: '8px' }}>
                                    avec {sl.moniteurName} · {sl.durationMinutes} min{sl.vehicleName ? ` · ${sl.vehicleName}` : ''}
                                  </span>
                                </div>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', flexShrink: 0 }}>
                                  {new Date(sl.sessionDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                              </div>
                              {sl.performanceRating && (
                                <div style={{ display: 'flex', gap: '2px', marginBottom: '8px', alignItems: 'center' }}>
                                  {[1,2,3,4,5].map(s => (
                                    <Star key={s} size={13} style={{ color: s <= sl.performanceRating ? rc[sl.performanceRating] : '#334155', fill: s <= sl.performanceRating ? rc[sl.performanceRating] : 'none' }} />
                                  ))}
                                  <span style={{ fontSize: '0.75rem', color: rc[sl.performanceRating], marginLeft: '4px', fontWeight: '600' }}>{rl[sl.performanceRating]}</span>
                                </div>
                              )}
                              {sl.moniteurFeedback && (
                                <div style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.6, padding: '10px 14px', background: 'rgba(0,0,0,0.25)', borderRadius: '10px', borderLeft: '3px solid var(--accent)', fontStyle: 'italic' }}>
                                  <span style={{ color: 'var(--accent)', fontSize: '0.72rem', fontWeight: '600', display: 'block', marginBottom: '4px', fontStyle: 'normal' }}>💬 Retour de {sl.moniteurName}</span>
                                  "{sl.moniteurFeedback}"
                                </div>
                              )}
                              {!sl.performanceRating && !sl.moniteurFeedback && (
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontStyle: 'italic' }}>Aucun retour du moniteur pour cette séance.</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {progression.timeline?.length === 0 && (
                  <div className="card" style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
                    <BookOpen size={36} style={{ margin: '0 auto 12px auto', display: 'block' }} />
                    <p>Aucune séance terminée pour le moment. Votre carnet se remplira après vos premières séances.</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ADMIN ONLY: Avis Clients sur les Moniteurs */}
        {activeTab === 'avis-moniteurs' && role === 'ADMIN' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Moniteur Rankings */}
            {moniteurRatingsReport && (
              <>
                <div className="card">
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Award style={{ color: '#f59e0b' }} /> Classement des Moniteurs par Satisfaction Client
                    <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-muted)', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', padding: '3px 10px', borderRadius: '999px' }}>
                      🔒 Confidentiel — Directeur uniquement
                    </span>
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {moniteurRatingsReport.moniteurRankings?.map((m, idx) => (
                      <div key={m.moniteurId} style={{
                        display: 'flex', alignItems: 'center', gap: '16px', padding: '16px',
                        borderRadius: '12px', background: idx === 0 ? 'rgba(245,158,11,0.06)' : 'rgba(255,255,255,0.02)',
                        border: idx === 0 ? '1px solid rgba(245,158,11,0.2)' : '1px solid rgba(255,255,255,0.05)'
                      }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                          background: idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : idx === 2 ? '#cd7f32' : 'rgba(255,255,255,0.1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 'bold', fontSize: '0.9rem', color: idx < 3 ? '#0f172a' : 'white'
                        }}>
                          {idx + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: 'white', fontWeight: 'bold', fontSize: '0.95rem' }}>{m.moniteurName}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                            {m.totalSupportSessions} séance(s) • {m.totalRatings} avis client(s)
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          {m.averageRating ? (
                            <>
                              <div style={{ display: 'flex', gap: '3px', justifyContent: 'flex-end', marginBottom: '4px' }}>
                                {[1,2,3,4,5].map(s => (
                                  <Star key={s} size={16} style={{
                                    color: s <= Math.round(m.averageRating) ? '#f59e0b' : '#334155',
                                    fill: s <= Math.round(m.averageRating) ? '#f59e0b' : 'none'
                                  }} />
                                ))}
                              </div>
                              <div style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '1.1rem' }}>
                                {m.averageRating.toFixed(1)}<span style={{ color: 'var(--text-muted)', fontWeight: 'normal', fontSize: '0.75rem' }}>/5</span>
                              </div>
                            </>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Pas encore noté</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Reviews */}
                <div className="card">
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MessageSquare size={18} style={{ color: 'var(--accent)' }} /> Derniers Avis Clients
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {moniteurRatingsReport.recentReviews?.length > 0 ? moniteurRatingsReport.recentReviews.map((r, i) => (
                      <div key={i} style={{ padding: '14px 16px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <div>
                            <span style={{ color: 'white', fontWeight: '600', fontSize: '0.9rem' }}>{r.candidateName}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginLeft: '8px' }}>→ {r.moniteurName}</span>
                            <span className="badge" style={{ marginLeft: '8px', backgroundColor: 'rgba(139,92,246,0.2)', color: '#a78bfa', fontSize: '0.65rem' }}>
                              {String(r.lessonType)?.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} size={14} style={{ color: s <= r.candidateRating ? '#f59e0b' : '#334155', fill: s <= r.candidateRating ? '#f59e0b' : 'none' }} />
                            ))}
                          </div>
                        </div>
                        {r.candidateComment && (
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem', fontStyle: 'italic', margin: 0, padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', borderLeft: '3px solid var(--accent)' }}>
                            "{r.candidateComment}"
                          </p>
                        )}
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '8px' }}>
                          {new Date(r.sessionDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </div>
                      </div>
                    )) : (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                        Aucun avis client reçu pour l'instant.
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
            {!moniteurRatingsReport && (
              <div className="card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                <Star size={40} style={{ margin: '0 auto 16px auto', color: 'var(--text-muted)' }} />
                Chargement du rapport...
              </div>
            )}
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
                        .then(res => { if(!res.ok) throw new Error("API Error"); return res.json(); })
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
                    .then(res => { if(!res.ok) throw new Error("API Error"); return res.json(); })
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
