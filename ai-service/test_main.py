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

# ══════════════════════════════════════════════
# Dynamic Pricing Tests
# ══════════════════════════════════════════════

def test_dynamic_pricing_surge_peak_hour():
    """Peak hour (18h) + high demand = SURGE pricing"""
    payload = {
        "base_price": 200.0,
        "hour_of_day": 18,
        "day_of_week": 1,
        "bookings_at_this_hour": 8,
        "avg_bookings_per_hour": 3.0,
        "instructor_avg_rating": 4.8,
        "instructor_total_bookings": 20
    }
    response = client.post("/pricing/dynamic", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["multiplier"] > 1.0
    assert data["final_price"] > 200.0
    assert data["surge_level"] in ("HIGH_DEMAND", "SURGE")
    assert data["discount_percent"] > 0

def test_dynamic_pricing_off_peak_discount():
    """Off-peak hour (10h) + low demand = OFF_PEAK discount"""
    payload = {
        "base_price": 200.0,
        "hour_of_day": 10,
        "day_of_week": 2,
        "bookings_at_this_hour": 1,
        "avg_bookings_per_hour": 4.0,
        "instructor_avg_rating": 3.5,
        "instructor_total_bookings": 5
    }
    response = client.post("/pricing/dynamic", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["multiplier"] < 1.0
    assert data["final_price"] < 200.0
    assert data["surge_level"] == "OFF_PEAK"
    assert data["discount_percent"] < 0

def test_dynamic_pricing_normal():
    """Normal hour, average demand = NORMAL pricing"""
    payload = {
        "base_price": 200.0,
        "hour_of_day": 15,
        "day_of_week": 3,
        "bookings_at_this_hour": 3,
        "avg_bookings_per_hour": 3.0,
        "instructor_avg_rating": 4.0,
        "instructor_total_bookings": 5
    }
    response = client.post("/pricing/dynamic", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["multiplier"] == 1.0
    assert data["final_price"] == 200.0
    assert data["surge_level"] == "NORMAL"

