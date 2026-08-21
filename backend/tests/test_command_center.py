import pytest
import jwt
from unittest.mock import MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.core.db import get_supabase_client
from app.core.config import settings
from app.core.rbac import Role

def create_test_token(role: str, user_id: str = "test-user-id") -> str:
    payload = {
        "sub": user_id,
        "app_metadata": {"role": role}
    }
    return jwt.encode(payload, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

def test_command_center_17_kpis_calculation():
    mock_supabase = MagicMock()
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    client = TestClient(app)
    
    token = create_test_token(Role.SUPER_ADMIN.value, "admin-01")
    
    # 1. Mock SOS Events
    mock_sos_res = MagicMock()
    mock_sos_res.data = [
        {"id": "OD-01", "severity": "CRITICAL", "delivery_state": "SERVER_DELIVERED", "people_count": 5, "medical_required": True, "location_timestamp": "2026-08-21T10:00:00Z", "created_at": "2026-08-21T10:00:15Z"},
        {"id": "OD-02", "severity": "HIGH", "delivery_state": "RELAYING", "people_count": 3, "medical_required": False, "location_timestamp": "2026-08-21T10:01:00Z", "created_at": "2026-08-21T10:01:25Z"},
        {"id": "OD-03", "severity": "MEDIUM", "delivery_state": "STORED", "people_count": 2, "medical_required": False, "location_timestamp": "2026-08-21T10:02:00Z", "created_at": "2026-08-21T10:02:10Z"},
    ]
    
    # 2. Mock Safety Records
    mock_safety_res = MagicMock()
    mock_safety_res.data = [
        {"state": "SAFE", "call_status": "COMPLETED"},
        {"state": "SAFE", "call_status": "COMPLETED"},
        {"state": "UNACCOUNTED", "call_status": "NO_ANSWER"},
    ]
    
    # 3. Mock Incidents
    mock_inc_res = MagicMock()
    mock_inc_res.data = [
        {"status": "ACTIVE"},
        {"status": "ACTIVE"},
        {"status": "RESOLVED"}
    ]
    
    # 4. Mock Shelters
    mock_shelters_res = MagicMock()
    mock_shelters_res.data = [
        {"status": "OPEN", "capacity": 1000, "current_occupancy": 600},
        {"status": "PARTIALLY_OCCUPIED", "capacity": 500, "current_occupancy": 300},
    ]
    
    # 5. Mock Resources
    mock_res_res = MagicMock()
    mock_res_res.data = [
        {"type": "AMBULANCE", "status": "AVAILABLE", "verification_status": "VERIFIED"},
        {"type": "AMBULANCE", "status": "AVAILABLE", "verification_status": "VERIFIED"},
        {"type": "AMBULANCE", "status": "DISPATCHED", "verification_status": "VERIFIED"},
        {"type": "RESCUE_TEAM", "status": "AVAILABLE", "verification_status": "VERIFIED"},
        {"type": "RESCUE_TEAM", "status": "ON_SCENE", "verification_status": "VERIFIED"},
        {"type": "BOAT", "status": "AVAILABLE", "verification_status": "VERIFIED"},
        {"type": "MEDICAL_TEAM", "status": "AVAILABLE", "verification_status": "VERIFIED"}
    ]
    
    def mock_table_handler(table_name):
        table_mock = MagicMock()
        if table_name == 'sos_events':
            table_mock.select.return_value.execute.return_value = mock_sos_res
        elif table_name == 'safety_records':
            table_mock.select.return_value.execute.return_value = mock_safety_res
        elif table_name == 'incidents':
            table_mock.select.return_value.execute.return_value = mock_inc_res
        elif table_name == 'shelters':
            table_mock.select.return_value.execute.return_value = mock_shelters_res
        elif table_name == 'resources':
            table_mock.select.return_value.execute.return_value = mock_res_res
        return table_mock
        
    mock_supabase.table.side_effect = mock_table_handler
    
    response = client.get(
        "/api/v1/command-center/kpis",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    kpis = response.json()["data"]
    
    # Verify All 17 Required KPIs
    assert kpis["active_sos"] == 3
    assert kpis["critical_sos"] == 1
    assert kpis["assistance_required"] == 3 # Critical with medical, High, Medium
    assert kpis["safe_confirmed"] == 2
    assert kpis["unaccounted"] == 1
    assert kpis["total_affected_people"] == 10 # 5 + 3 + 2
    assert kpis["active_incidents"] == 2
    assert kpis["open_shelters"] == 1
    assert kpis["shelter_occupancy_percent"] == 60.0 # 900 / 1500 * 100
    assert kpis["available_ambulances"] == 2
    assert kpis["dispatched_ambulances"] == 1
    assert kpis["available_rescue_teams"] == 1
    assert kpis["active_rescue_teams"] == 1
    assert kpis["available_boats"] == 1
    assert kpis["available_medical_teams"] == 1
    assert kpis["pending_synchronization"] == 2 # RELAYING and STORED
    assert "s" in kpis["average_sos_delivery_time"]
    
    app.dependency_overrides.clear()
