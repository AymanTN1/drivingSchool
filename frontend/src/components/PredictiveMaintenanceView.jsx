import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock, Tool, Settings, Loader2 } from 'lucide-react';
import API_BASE from '../api';

export default function PredictiveMaintenanceView({ authData, vehicles }) {
  const [selectedVehicleId, setSelectedVehicleId] = useState(vehicles[0]?.id || '');
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (selectedVehicleId) {
      fetchPredictions(selectedVehicleId);
    }
  }, [selectedVehicleId]);

  const fetchPredictions = async (vehicleId) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/api/fleet/maintenance/${vehicleId}/predict`, {
        headers: { 'Authorization': `Bearer ${authData.token}` }
      });
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des prédictions IA');
      }
      const data = await response.json();
      setPredictions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score) => {
    if (score >= 0.8) return '#ef4444'; // Red
    if (score >= 0.5) return '#f59e0b'; // Yellow
    return '#10b981'; // Green
  };

  const getRiskIcon = (score) => {
    if (score >= 0.8) return <AlertTriangle size={24} color="#ef4444" />;
    if (score >= 0.5) return <Clock size={24} color="#f59e0b" />;
    return <CheckCircle size={24} color="#10b981" />;
  };

  const formatType = (type) => {
    const map = {
      OIL_CHANGE: 'Vidange Moteur',
      TIRE_REPLACEMENT: 'Remplacement Pneus',
      BRAKE_PADS: 'Plaquettes de Frein',
      WINDSHIELD_WIPERS: 'Essuie-glaces',
      ENGINE_REPAIR: 'Révision Moteur',
      TECHNICAL_VISIT: 'Visite Technique',
      OTHER: 'Autre Maintenance'
    };
    return map[type] || type;
  };

  return (
    <div className="maintenance-ai-container" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Settings size={28} color="var(--accent)" /> Intelligence Artificielle : Maintenance Prédictive
          </h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
            Analyse algorithmique de l'usure des composants de la flotte pour prévenir les pannes.
          </p>
        </div>
        
        <div style={{ minWidth: '250px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Sélectionner un Véhicule</label>
          <select 
            className="input-field"
            value={selectedVehicleId}
            onChange={(e) => setSelectedVehicleId(e.target.value)}
          >
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.licensePlate})</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div style={{ padding: '16px', background: 'rgba(239,68,68,0.1)', color: '#fca5a5', borderRadius: '8px', marginBottom: '24px', border: '1px solid var(--danger)' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <Loader2 size={40} color="var(--accent)" className="animate-spin" />
        </div>
      ) : predictions ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {Object.entries(predictions).map(([key, pred]) => (
            <div key={key} className="card" style={{ padding: '20px', borderTop: `4px solid ${getRiskColor(pred.risk_score)}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                    <Tool size={20} color="white" />
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white' }}>{formatType(pred.type)}</h3>
                </div>
                {getRiskIcon(pred.risk_score)}
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <span>Risque d'usure</span>
                  <span style={{ fontWeight: 'bold', color: getRiskColor(pred.risk_score) }}>{(pred.risk_score * 100).toFixed(0)}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${pred.risk_score * 100}%`, height: '100%', background: getRiskColor(pred.risk_score), transition: 'width 1s ease-in-out' }}></div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Jours restants estimés</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white' }}>{pred.estimated_days_remaining > 500 ? '> 1 an' : `${pred.estimated_days_remaining} j`}</span>
                </div>
                <div style={{ textAlign: 'right', maxWidth: '50%' }}>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Recommandation IA</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: getRiskColor(pred.risk_score) }}>{pred.recommendation}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          Sélectionnez un véhicule pour afficher les prédictions.
        </div>
      )}
    </div>
  );
}
