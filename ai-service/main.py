from fastapi import FastAPI
from pydantic import BaseModel
from typing import Dict, Optional
import math

app = FastAPI(title="Driving School AI Maintenance Predictor")

class VehicleData(BaseModel):
    vehicle_id: int
    current_mileage: int
    avg_daily_mileage: float
    last_maintenance_mileage: Dict[str, Optional[int]]

class PredictionResult(BaseModel):
    type: str
    risk_score: float # 0.0 to 1.0 (1.0 = immediate failure risk)
    estimated_days_remaining: int
    recommendation: str

class CandidateRiskRequest(BaseModel):
    candidate_id: int
    theoretical_test_score: int
    classes_attended: int
    classes_missed: int
    instructor_evaluation_score: int

class CandidateRiskResponse(BaseModel):
    candidate_id: int
    risk_score: float
    risk_level: str
    alert_message: str

# Simulated ML Model thresholds (in real life, this would be trained on historical breakdown data)
MAINTENANCE_THRESHOLDS = {
    "OIL_CHANGE": 10000,
    "TIRE_REPLACEMENT": 40000,
    "BRAKE_PADS": 30000,
    "WINDSHIELD_WIPERS": 20000,
    "ENGINE_REPAIR": 100000,
    "TECHNICAL_VISIT": 15000,
    "OTHER": 50000
}

@app.post("/predict/maintenance", response_model=Dict[str, PredictionResult])
async def predict_maintenance(data: VehicleData):
    predictions = {}
    
    # Calculate for each maintenance type
    for m_type, threshold in MAINTENANCE_THRESHOLDS.items():
        last_mileage = data.last_maintenance_mileage.get(m_type)
        
        if last_mileage is None:
            # If no record exists, assume it was done at 0
            last_mileage = 0
            
        distance_since_last = data.current_mileage - last_mileage
        
        # Calculate base risk (linear progression for simple simulation)
        # In a real model (like Random Forest), this would be `model.predict_proba([features])`
        risk = distance_since_last / threshold
        
        # Add some non-linear urgency when approaching the threshold
        if risk > 0.8:
            risk = risk + math.pow(risk - 0.8, 2) * 5
            
        risk = min(max(risk, 0.0), 1.0) # Clamp between 0 and 1
        
        # Estimate days remaining based on avg daily usage
        distance_remaining = threshold - distance_since_last
        days_remaining = int(distance_remaining / data.avg_daily_mileage) if data.avg_daily_mileage > 0 else 999
        
        if risk >= 0.9:
            rec = "CRITIQUE: Planifier immédiatement"
        elif risk >= 0.7:
            rec = "ATTENTION: À prévoir bientôt"
        else:
            rec = "OK: Usure normale"
            
        predictions[m_type] = PredictionResult(
            type=m_type,
            risk_score=round(risk, 2),
            estimated_days_remaining=days_remaining,
            recommendation=rec
        )
        
    return predictions

@app.post("/predict/candidate-risk", response_model=CandidateRiskResponse)
async def predict_candidate_risk(data: CandidateRiskRequest):
    # Base risk starts at 0.1
    risk = 0.1
    
    # 1. Theoretical Test Score (Max 40)
    # Below 30 is failing. The lower it is, the higher the risk.
    if data.theoretical_test_score < 30:
        risk += (30 - data.theoretical_test_score) * 0.03
    else:
        risk -= (data.theoretical_test_score - 30) * 0.01
        
    # 2. Absenteeism (Very critical indicator of dropping out)
    total_classes = data.classes_attended + data.classes_missed
    if total_classes > 0:
        absentee_rate = data.classes_missed / total_classes
        risk += absentee_rate * 0.5 # Up to +50% risk just for absenteeism
        
    # 3. Instructor Evaluation (1 to 5)
    # 3 is average, <3 increases risk, >3 decreases risk
    if data.instructor_evaluation_score > 0:
        if data.instructor_evaluation_score < 3:
            risk += (3 - data.instructor_evaluation_score) * 0.15
        elif data.instructor_evaluation_score > 3:
            risk -= (data.instructor_evaluation_score - 3) * 0.10
            
    risk = min(max(risk, 0.0), 1.0)
    
    if risk >= 0.75:
        level = "CRITICAL"
        msg = "Alerte Rouge : Très fort risque d'abandon ou d'échec. Contacter pour soutien immédiat."
    elif risk >= 0.50:
        level = "HIGH"
        msg = "Risque Élevé : Attention requise. Proposer des leçons supplémentaires."
    elif risk >= 0.25:
        level = "MEDIUM"
        msg = "Risque Modéré : Suivi normal."
    else:
        level = "LOW"
        msg = "Bonne progression. Aucun risque détecté."
        
    return CandidateRiskResponse(
        candidate_id=data.candidate_id,
        risk_score=round(risk, 2),
        risk_level=level,
        alert_message=msg
    )

@app.get("/health")
async def health_check():
    return {"status": "ok"}
