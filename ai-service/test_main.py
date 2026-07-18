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
    
    # Distance since tire = 15000. Threshold = 40000. Risk = 15000/40000 = 0.375 -> 0.38
    assert data["TIRE_REPLACEMENT"]["risk_score"] == 0.38
