import pytest
import jwt
from unittest.mock import MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.core.db import get_supabase_client
from app.core.config import settings
from app.core.rbac import Role, has_permission, Permission

def create_test_token(role: str, user_id: str = "test-user-id") -> str:
    payload = {
        "sub": user_id,
        "app_metadata": {"role": role}
    }
    return jwt.encode(payload, settings.legacy_supabase_secret, algorithm="HS256")

def test_shelter_permissions_matrix():
    assert has_permission(Role.SUPER_ADMIN, Permission.SHELTER_MANAGE) is True
    assert has_permission(Role.SUPER_ADMIN, Permission.SHELTER_STATUS_UPDATE) is True
    assert has_permission(Role.SUPER_ADMIN, Permission.SHELTER_INTAKE) is True
    
    assert has_permission(Role.DISASTER_MANAGEMENT_OFFICER, Permission.SHELTER_MANAGE) is True
    assert has_permission(Role.DISASTER_MANAGEMENT_OFFICER, Permission.SHELTER_STATUS_UPDATE) is True
    assert has_permission(Role.DISASTER_MANAGEMENT_OFFICER, Permission.SHELTER_INTAKE) is True
    
    assert has_permission(Role.EOC_OPERATOR, Permission.SHELTER_STATUS_UPDATE) is True
    assert has_permission(Role.EOC_OPERATOR, Permission.SHELTER_INTAKE) is True
    assert has_permission(Role.EOC_OPERATOR, Permission.SHELTER_MANAGE) is False
    
    assert has_permission(Role.RESCUE_COORDINATOR, Permission.SHELTER_INTAKE) is True
    assert has_permission(Role.RESCUE_COORDINATOR, Permission.SHELTER_STATUS_UPDATE) is False
    
    assert has_permission(Role.OBSERVER, Permission.SHELTER_VIEW) is True
    assert has_permission(Role.OBSERVER, Permission.SHELTER_INTAKE) is False

def test_shelter_creation_and_listing():
    mock_supabase = MagicMock()
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    client = TestClient(app)
    
    dmo_token = create_test_token(Role.DISASTER_MANAGEMENT_OFFICER.value, "user-dmo-01")
    
    # 1. Create Shelter
    mock_insert_res = MagicMock()
    mock_insert_res.data = [{
        "id": "SH-TEST-01",
        "name": "Puri Multipurpose Cyclone Shelter",
        "organization": "OSDMA",
        "district": "Puri",
        "capacity": 1000,
        "current_occupancy": 0,
        "status": "OPEN",
        "medical_capability": True,
        "food_available": True,
        "water_available": True,
        "toilets": 20,
        "power": "SOLAR_BACKUP",
        "accessibility": "WHEELCHAIR_RAMP"
    }]
    mock_supabase.table.return_value.insert.return_value.execute.return_value = mock_insert_res
    
    create_res = client.post(
        "/api/v1/shelters/",
        headers={"Authorization": f"Bearer {dmo_token}"},
        json={
            "id": "SH-TEST-01",
            "name": "Puri Multipurpose Cyclone Shelter",
            "district": "Puri",
            "capacity": 1000,
            "medical_capability": True
        }
    )
    
    assert create_res.status_code == 200
    data = create_res.json()["data"]
    assert data["available_capacity"] == 1000
    assert data["occupancy_percentage"] == 0.0
    assert data["pressure_indicator"] == "NORMAL_OPTIMAL"
    
    app.dependency_overrides.clear()

def test_shelter_intake_safety_and_overbooking_rejection():
    mock_supabase = MagicMock()
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    client = TestClient(app)
    
    coord_token = create_test_token(Role.RESCUE_COORDINATOR.value, "user-coord-01")
    
    # Mock shelter with 100 capacity and 80 currently occupied
    mock_select_res = MagicMock()
    mock_select_res.data = [{
        "id": "SH-TEST-02",
        "name": "Balasore High School Shelter",
        "capacity": 100,
        "current_occupancy": 80,
        "status": "PARTIALLY_OCCUPIED"
    }]
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_select_res
    
    # Intaking 15 people (80 + 15 = 95 <= 100: Should SUCCEED)
    mock_update_res = MagicMock()
    mock_update_res.data = [{
        "id": "SH-TEST-02",
        "name": "Balasore High School Shelter",
        "capacity": 100,
        "current_occupancy": 95,
        "status": "PARTIALLY_OCCUPIED"
    }]
    mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = mock_update_res
    # Mock RPC failing to force endpoint fallback logic
    mock_supabase.rpc.return_value.execute.side_effect = Exception("No RPC")
    
    valid_intake = client.post(
        "/api/v1/shelters/SH-TEST-02/intake",
        headers={"Authorization": f"Bearer {coord_token}"},
        json={"displaced_count": 15}
    )
    assert valid_intake.status_code == 200
    assert valid_intake.json()["data"]["current_occupancy"] == 95
    assert valid_intake.json()["data"]["available_capacity"] == 5
    assert valid_intake.json()["data"]["pressure_indicator"] == "CRITICAL_PRESSURE"
    
    # Intaking 30 people (80 + 30 = 110 > 100: MUST FAIL with 409 Conflict)
    overbook_intake = client.post(
        "/api/v1/shelters/SH-TEST-02/intake",
        headers={"Authorization": f"Bearer {coord_token}"},
        json={"displaced_count": 30}
    )
    assert overbook_intake.status_code == 409
    assert "Capacity Exceeded" in overbook_intake.json()["detail"]
    
    app.dependency_overrides.clear()

def test_shelter_status_update_rbac():
    mock_supabase = MagicMock()
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    client = TestClient(app)
    
    eoc_token = create_test_token(Role.EOC_OPERATOR.value, "user-eoc-01")
    obs_token = create_test_token(Role.OBSERVER.value, "user-obs-01")
    
    # Observer cannot update status (403 Forbidden)
    obs_res = client.patch(
        "/api/v1/shelters/SH-TEST-01/status",
        headers={"Authorization": f"Bearer {obs_token}"},
        json={"status": "DAMAGED"}
    )
    assert obs_res.status_code == 403
    
    # EOC Operator CAN update status
    mock_upd_res = MagicMock()
    mock_upd_res.data = [{
        "id": "SH-TEST-01",
        "name": "Puri Multipurpose Cyclone Shelter",
        "capacity": 1000,
        "current_occupancy": 0,
        "status": "DAMAGED"
    }]
    mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = mock_upd_res
    
    eoc_res = client.patch(
        "/api/v1/shelters/SH-TEST-01/status",
        headers={"Authorization": f"Bearer {eoc_token}"},
        json={"status": "DAMAGED"}
    )
    assert eoc_res.status_code == 200
    assert eoc_res.json()["data"]["status"] == "DAMAGED"
    assert eoc_res.json()["data"]["pressure_indicator"] == "UNAVAILABLE"
    
    app.dependency_overrides.clear()
