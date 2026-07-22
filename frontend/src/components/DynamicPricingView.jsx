import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Clock, Loader2, Zap, AlertTriangle } from 'lucide-react';
import API_BASE from '../api';

export default function DynamicPricingView({ authData, moniteurs: initialMoniteurs = [] }) {
  const [moniteursList, setMoniteursList] = useState(initialMoniteurs);
  const [selectedMoniteurId, setSelectedMoniteurId] = useState(initialMoniteurs[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [basePrice, setBasePrice] = useState(200);
  const [pricing, setPricing] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Keep moniteursList in sync with props
  useEffect(() => {
    if (initialMoniteurs && initialMoniteurs.length > 0) {
      setMoniteursList(initialMoniteurs);
      if (!selectedMoniteurId) {
        setSelectedMoniteurId(initialMoniteurs[0].id);
      }
    } else {
      // Fallback: Fetch moniteurs if not passed in props
      fetchMoniteursFallback();
    }
  }, [initialMoniteurs]);

  const fetchMoniteursFallback = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${authData.token || authData.accessToken || authData.jwt}` }
      });
      if (res.ok) {
        const data = await res.json();
        const mons = data.filter(u => u.role === 'MONITEUR');
        setMoniteursList(mons);
        if (mons.length > 0 && !selectedMoniteurId) {
          setSelectedMoniteurId(mons[0].id);
        }
      }
    } catch (e) {
      console.log('Error fetching moniteurs fallback', e);
    }
  };

  useEffect(() => {
    if (selectedMoniteurId && selectedDate) {
      fetchPricing();
    }
  }, [selectedMoniteurId, selectedDate, basePrice]);

  const fetchPricing = async () => {
    if (!selectedMoniteurId) return;
    setLoading(true);
    setError('');
    try {
      const token = authData.token || authData.accessToken || authData.jwt;
      const res = await fetch(
        `${API_BASE}/api/pricing/daily?moniteurId=${selectedMoniteurId}&date=${selectedDate}&basePrice=${basePrice}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Erreur lors du calcul des prix dynamiques");
      const data = await res.json();
      setPricing(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getSurgeColor = (level) => {
    switch (level) {
      case 'SURGE': return '#ef4444';
      case 'HIGH_DEMAND': return '#f59e0b';
      case 'OFF_PEAK': return '#10b981';
      default: return '#6366f1';
    }
  };

  const getSurgeIcon = (level) => {
    switch (level) {
      case 'SURGE': return <Zap size={16} color="#ef4444" />;
      case 'HIGH_DEMAND': return <TrendingUp size={16} color="#f59e0b" />;
      case 'OFF_PEAK': return <TrendingDown size={16} color="#10b981" />;
      default: return <Clock size={16} color="#6366f1" />;
    }
  };

  const getSurgeLabel = (level) => {
    switch (level) {
      case 'SURGE': return 'Surge 🔥';
      case 'HIGH_DEMAND': return 'Demande forte';
      case 'OFF_PEAK': return 'Promo ✨';
      default: return 'Normal';
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <DollarSign size={28} color="#f59e0b" /> Tarification Dynamique (Type Uber)
          </h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
            L'IA ajuste les prix en temps réel selon la demande, l'heure et la popularité du moniteur.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="card" style={{ display: 'flex', gap: '16px', padding: '16px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: '220px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Moniteur</label>
          <select 
            className="input-field" 
            value={selectedMoniteurId} 
            onChange={e => setSelectedMoniteurId(e.target.value)}
            style={{ width: '100%', padding: '10px', backgroundColor: '#1e293b', color: 'white', border: '1px solid var(--border)', borderRadius: '8px' }}
          >
            {moniteursList.length === 0 && <option value="">Aucun moniteur disponible</option>}
            {moniteursList.map(m => (
              <option key={m.id} value={m.id}>
                {m.fullName || m.username || `Moniteur #${m.id}`}
              </option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: '180px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Date</label>
          <input 
            type="date" 
            className="input-field" 
            value={selectedDate} 
            onChange={e => setSelectedDate(e.target.value)} 
            style={{ width: '100%', padding: '10px', backgroundColor: '#1e293b', color: 'white', border: '1px solid var(--border)', borderRadius: '8px' }}
          />
        </div>
        <div style={{ flex: 1, minWidth: '140px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Prix de base (DH)</label>
          <input 
            type="number" 
            className="input-field" 
            value={basePrice} 
            onChange={e => setBasePrice(Number(e.target.value))} 
            min={50} 
            step={10} 
            style={{ width: '100%', padding: '10px', backgroundColor: '#1e293b', color: 'white', border: '1px solid var(--border)', borderRadius: '8px' }}
          />
        </div>
      </div>

      {error && (
        <div style={{ padding: '16px', background: 'rgba(239,68,68,0.1)', color: '#fca5a5', borderRadius: '8px', marginBottom: '24px', border: '1px solid var(--danger)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', gap: '12px' }}>
          <Loader2 size={40} color="var(--accent)" className="animate-spin" />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Calcul algorithmique des prix dynamiques en cours...</span>
        </div>
      ) : pricing.length > 0 ? (
        <>
          {/* Heatmap-style grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', marginBottom: '32px' }}>
            {pricing.map((slot, i) => {
              const hour = 8 + i;
              return (
                <div key={hour} className="card" style={{
                  padding: '16px', textAlign: 'center',
                  borderTop: `3px solid ${getSurgeColor(slot.demand_tier || slot.surge_level)}`,
                  background: (slot.demand_tier || slot.surge_level) === 'OFF_PEAK' ? 'rgba(16,185,129,0.05)' :
                    (slot.demand_tier || slot.surge_level) === 'SURGE' ? 'rgba(239,68,68,0.05)' : 'rgba(255,255,255,0.02)'
                }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    {hour}:00 — {hour + 1}:00
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'white', margin: '8px 0' }}>
                    {slot.final_price} DH
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '4px' }}>
                    {getSurgeIcon(slot.demand_tier || slot.surge_level)}
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: getSurgeColor(slot.demand_tier || slot.surge_level) }}>
                      {getSurgeLabel(slot.demand_tier || slot.surge_level)}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    x{slot.multiplier}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detail Table */}
          <h3 style={{ color: 'white', marginBottom: '16px' }}>Détail des Facteurs de Prix</h3>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Créneau</th>
                  <th>Prix Base</th>
                  <th>Multiplicateur</th>
                  <th>Prix Final</th>
                  <th>Niveau</th>
                  <th>Explication IA</th>
                </tr>
              </thead>
              <tbody>
                {pricing.map((slot, i) => {
                  const hour = 8 + i;
                  return (
                    <tr key={hour}>
                      <td>{hour}:00 — {hour + 1}:00</td>
                      <td>{slot.base_price} DH</td>
                      <td style={{ fontWeight: 'bold', color: getSurgeColor(slot.demand_tier || slot.surge_level) }}>x{slot.multiplier}</td>
                      <td style={{ fontWeight: 'bold', color: 'white' }}>{slot.final_price} DH</td>
                      <td>
                        <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', background: `${getSurgeColor(slot.demand_tier || slot.surge_level)}20`, color: getSurgeColor(slot.demand_tier || slot.surge_level) }}>
                          {getSurgeLabel(slot.demand_tier || slot.surge_level)}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{slot.explanation}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          Sélectionnez un moniteur et une date pour voir la grille tarifaire dynamique.
        </div>
      )}
    </div>
  );
}
