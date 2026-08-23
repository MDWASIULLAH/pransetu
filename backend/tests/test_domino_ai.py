import pytest
import jwt
from unittest.mock import MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.core.db import get_supabase_client
from app.core.config import settings
from app.core.rbac import Role

def create_test_token(role: str, user_id: str = "test-officer-id") -> str:
    payload = {
        "sub": user_id,
        "app_metadata": {"role": role}
    }
    return jwt.encode(payload, settings.legacy_supabase_secret, algorithm="HS256")

def test_domino_ai_cascade_full_chain_and_metadata():
    mock_supabase = MagicMock()
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    client = TestClient(app)
    
    token = create_test_token(Role.DISASTER_MANAGEMENT_OFFICER.value, "dmo-01")
    
    response = client.get(
        "/api/v1/domino-ai/cascade?rainfall_mm=240&wind_kmh=140",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    
    # 1. Verify Mandatory AI Metadata
    metadata = data["metadata"]
    assert "timestamp" in metadata
    assert "model_version" in metadata
    assert "overall_confidence" in metadata
    assert metadata["decision_support_guard"]["autonomous_dispatch_permitted"] is False
    
    # 2. Verify Complete 8-Stage Cascading Risk Chain
    chain = data["risk_chain"]
    assert len(chain) == 8
    
    step_names = [step["name"] for step in chain]
    expected_steps = [
        "CYCLONE",
        "HEAVY RAIN",
        "RIVER RISE",
        "FLOODING",
        "ROAD BLOCKAGE",
        "ISOLATION",
        "RESCUE DIFFICULTY",
        "SHELTER PRESSURE"
    ]
    assert step_names == expected_steps
    
    # 3. Verify Every Node Fields
    for node in chain:
        assert "probability_pct" in node
        assert "confidence_pct" in node
        assert len(node["affected_areas"]) > 0
        assert len(node["potential_consequences"]) > 0
        assert "required_attention" in node
        assert len(node["suggested_resources"]) > 0
        assert "shelter_pressure_pct" in node
        assert "road_accessibility_pct" in node
        assert "explanation" in node

    app.dependency_overrides.clear()

def test_domino_ai_simulation_and_gemini_explanation():
    mock_supabase = MagicMock()
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    client = TestClient(app)
    
    token = create_test_token(Role.RESCUE_COORDINATOR.value, "coord-01")
    
    # 1. Test Custom Scenario Simulation
    sim_res = client.post(
        "/api/v1/domino-ai/simulate",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "scenario": "EXTREME_CYCLONE_LANDFALL",
            "rainfall_mm": 320.0,
            "wind_kmh": 165.0,
            "river_discharge_cusecs": 1200000
        }
    )
    assert sim_res.status_code == 200
    sim_data = sim_res.json()
    assert sim_data["metadata"]["active_scenario"] == "EXTREME_CYCLONE_LANDFALL"
    
    # Check that road accessibility drops severely under extreme rain
    flood_node = next(n for n in sim_data["risk_chain"] if n["name"] == "FLOODING")
    assert flood_node["road_accessibility_pct"] <= 35.0
    
    # 2. Test Gemini AI Explanation Breakdown
    exp_res = client.post(
        "/api/v1/domino-ai/explain",
        headers={"Authorization": f"Bearer {token}"},
        json={"step_id": "STEP-05-ROAD-BLOCKAGE"}
    )
    assert exp_res.status_code == 200
    exp_data = exp_res.json()["data"]
    assert exp_data["step_name"] == "ROAD BLOCKAGE"
    assert "gemini_xai_summary" in exp_data
    assert "Human-In-The-Loop" in exp_data["authorized_decision_mandate"]
    
    app.dependency_overrides.clear()
