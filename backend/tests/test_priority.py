import pytest
from app.core.priority_engine import evaluate_incident_priority
from unittest.mock import MagicMock

def test_priority_engine_high_severity():
    mock_supabase = MagicMock()
    
    # Mock PostGIS RPC response for a critical cluster
    mock_res = MagicMock()
    mock_res.data = [{
        "medical_count": 5,
        "critical_count": 8,
        "sos_count": 20,
        "affected_people": 100,
        "latest_activity": "2026-08-21T10:00:00+00:00", # Old timestamp to trigger wait time rules
        "nearest_resource_km": 4.5,
        "nearest_shelter_km": 2.0
    }]
    mock_supabase.rpc.return_value.execute.return_value = mock_res
    
    result = evaluate_incident_priority(mock_supabase, "INC-TEST-123")
    
    assert "priority_score" in result
    assert "priority_factors" in result
    score = result["priority_score"]
    factors = result["priority_factors"]["factors"]
    
    # Should be a very high score (Medical 25 + Critical 15 + People 20 + Wait 15 + Rescue 5.5 + Shelter 3.0) > 80
    assert score > 80.0
    assert score <= 100.0
    
    # Check Explainable AI outputs
    assert any("Medical emergency (5 cases)" in f for f in factors)
    assert any("100 people affected" in f for f in factors)
    assert any("Rescue Team 4.5km away" in f for f in factors)
    assert any("Shelter 2.0km away" in f for f in factors)
    
    # Verify it updated the database
    mock_supabase.table.return_value.update.return_value.eq.return_value.execute.assert_called_once()

def test_priority_engine_low_severity():
    mock_supabase = MagicMock()
    
    # Mock PostGIS RPC response for a minor cluster
    mock_res = MagicMock()
    mock_res.data = [{
        "medical_count": 0,
        "critical_count": 0,
        "sos_count": 1,
        "affected_people": 1,
        "latest_activity": "2026-08-21T20:30:00+00:00", # Recent
        "nearest_resource_km": 50.0, # Very far
        "nearest_shelter_km": 20.0
    }]
    mock_supabase.rpc.return_value.execute.return_value = mock_res
    
    result = evaluate_incident_priority(mock_supabase, "INC-TEST-456")
    
    score = result["priority_score"]
    factors = result["priority_factors"]["factors"]
    
    # Should be a low score
    assert score < 20.0
    
    # Verify penalties
    assert any("- Nearest team is 50.0km away" in f for f in factors)
