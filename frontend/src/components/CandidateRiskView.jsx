import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingDown, User, HeartPulse, Loader2, CheckCircle } from 'lucide-react';
import API_BASE from '../api';

export default function CandidateRiskView({ authData, candidates }) {
  const [risks, setRisks] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (candidates && candidates.length > 0) {
      fetchAllRisks();
    }
  }, [candidates]);

  const fetchAllRisks = async () => {
    setLoading(true);
    setError('');
    try {
      const risksData = {};
      // Fetch risk for each active candidate
      for (const candidate of candidates) {
        if (candidate.status !== 'GRADUATED' && candidate.status !== 'DROPPED') {
          const res = await fetch(`${API_BASE}/api/ai/candidates/${candidate.id}/risk`, {
            headers: { 'Authorization': `Bearer ${authData.token}` }
          });
          if (res.ok) {
            const data = await res.json();
            risksData[candidate.id] = data;
          }
        }
      }
      setRisks(risksData);
    } catch (err) {
      setError("Erreur lors de l'analyse IA des candidats.");
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level) => {
    switch(level) {
      case 'CRITICAL': return '#ef4444'; // Red
      case 'HIGH': return '#f59e0b'; // Yellow
      case 'MEDIUM': return '#3b82f6'; // Blue
      default: return '#10b981'; // Green
    }
  };

  const atRiskCandidates = candidates.filter(c => risks[c.id] && (risks[c.id].risk_level === 'CRITICAL' || risks[c.id].risk_level === 'HIGH'));

  return (
    <div className="candidate-risk-container" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <HeartPulse size={28} color="var(--danger)" /> IA : Détection de Risque d'Abandon
          </h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
            Analyse comportementale (assiduité, scores) pour prévenir l'échec des candidats.
          </p>
        </div>
        <button onClick={fetchAllRisks} className="btn-primary" disabled={loading}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : 'Rafraîchir Analyse IA'}
        </button>
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
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
            {atRiskCandidates.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                <CheckCircle size={48} color="#10b981" style={{ margin: '0 auto 16px' }} />
                <h3>Aucun candidat à haut risque détecté.</h3>
                <p>Vos candidats progressent bien !</p>
              </div>
            ) : (
              atRiskCandidates.map(candidate => {
                const risk = risks[candidate.id];
                return (
                  <div key={candidate.id} className="card" style={{ borderLeft: `4px solid ${getRiskColor(risk.risk_level)}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                          <User size={20} color="white" />
                        </div>
                        <div>
                          <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white' }}>{candidate.user.firstName} {candidate.user.lastName}</h3>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>CIN: {candidate.cin}</span>
                        </div>
                      </div>
                      <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', background: `${getRiskColor(risk.risk_level)}20`, color: getRiskColor(risk.risk_level) }}>
                        {risk.risk_level} ({(risk.risk_score * 100).toFixed(0)}%)
                      </span>
                    </div>

                    <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', marginBottom: '16px' }}>
                      <p style={{ fontSize: '0.85rem', color: getRiskColor(risk.risk_level), display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                        {risk.alert_message}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button className="btn-secondary" style={{ flex: 1, fontSize: '0.85rem' }}>Voir Dossier</button>
                      <button className="btn-primary" style={{ flex: 1, fontSize: '0.85rem', background: 'var(--danger)', color: 'white' }}>Proposer Soutien</button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <h3 style={{ marginTop: '40px', marginBottom: '16px', color: 'white' }}>Tous les Candidats (Analyse Complète)</h3>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Candidat</th>
                  <th>Score Code</th>
                  <th>Assiduité</th>
                  <th>Éval. Moniteur</th>
                  <th>Alerte IA</th>
                </tr>
              </thead>
              <tbody>
                {candidates.filter(c => risks[c.id]).map(candidate => {
                  const risk = risks[candidate.id];
                  return (
                    <tr key={candidate.id}>
                      <td>{candidate.user.firstName} {candidate.user.lastName}</td>
                      <td>{candidate.theoreticalTestScore}/40</td>
                      <td>{candidate.classesAttended} présences / {candidate.classesMissed} absences</td>
                      <td>{candidate.instructorEvaluationScore}/5</td>
                      <td>
                        <span style={{ color: getRiskColor(risk.risk_level), fontWeight: 'bold', fontSize: '0.85rem' }}>
                          {risk.risk_level} ({(risk.risk_score * 100).toFixed(0)}%)
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
