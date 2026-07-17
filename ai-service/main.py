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

@app.get("/health")
async def health_check():
    return {"status": "ok"}
