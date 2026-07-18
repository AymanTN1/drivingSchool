from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_predict_maintenance():
    payload = {
        "vehicle_id": 1,
        "current_mileage": 15000,
        "avg_daily_mileage": 50.0,
        "last_maintenance_mileage": {
            "OIL_CHANGE": 10000,
            "TIRE_REPLACEMENT": 0
        }
    }
    response = client.post("/predict/maintenance", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert "OIL_CHANGE" in data
    assert "TIRE_REPLACEMENT" in data
    
    # Distance since oil change = 5000. Threshold = 10000. Risk = 0.5.
    assert data["OIL_CHANGE"]["risk_score"] == 0.5
    
    assert data["TIRE_REPLACEMENT"]["risk_score"] == 0.38

def test_predict_candidate_risk_critical():
    payload = {
        "candidate_id": 99,
        "theoretical_test_score": 15,
        "classes_attended": 2,
        "classes_missed": 8,
        "instructor_evaluation_score": 1
    }
    response = client.post("/predict/candidate-risk", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert data["candidate_id"] == 99
    assert data["risk_level"] == "CRITICAL"
    assert data["risk_score"] > 0.8
    
def test_predict_candidate_risk_low():
    payload = {
        "candidate_id": 100,
        "theoretical_test_score": 38,
        "classes_attended": 10,
        "classes_missed": 0,
        "instructor_evaluation_score": 5
    }
    response = client.post("/predict/candidate-risk", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert data["risk_level"] == "LOW"
    assert data["risk_score"] < 0.2
