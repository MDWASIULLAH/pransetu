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

def test_resource_permissions_matrix():
    assert has_permission(Role.SUPER_ADMIN, Permission.RESOURCE_VERIFY) is True
    assert has_permission(Role.SUPER_ADMIN, Permission.RESOURCE_REGISTER) is True
    assert has_permission(Role.SUPER_ADMIN, Permission.RESOURCE_DISPATCH) is True
    
    assert has_permission(Role.DISASTER_MANAGEMENT_OFFICER, Permission.RESOURCE_REGISTER) is True
    assert has_permission(Role.DISASTER_MANAGEMENT_OFFICER, Permission.RESOURCE_VERIFY) is False
    assert has_permission(Role.DISASTER_MANAGEMENT_OFFICER, Permission.RESOURCE_DISPATCH) is True
    
    assert has_permission(Role.RESCUE_COORDINATOR, Permission.RESOURCE_DISPATCH) is True
    assert has_permission(Role.RESCUE_COORDINATOR, Permission.RESOURCE_VERIFY) is False
    assert has_permission(Role.RESCUE_COORDINATOR, Permission.RESOURCE_REGISTER) is False

    assert has_permission(Role.OBSERVER, Permission.RESOURCE_VIEW) is True
    assert has_permission(Role.OBSERVER, Permission.RESOURCE_DISPATCH) is False
    assert has_permission(Role.OBSERVER, Permission.RESOURCE_VERIFY) is False

def test_resource_registration_and_verification_flow():
    mock_supabase = MagicMock()
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    
    client = TestClient(app)
    
    dmo_token = create_test_token(Role.DISASTER_MANAGEMENT_OFFICER.value, "user-dmo-01")
    super_admin_token = create_test_token(Role.SUPER_ADMIN.value, "admin-super-01")
    coord_token = create_test_token(Role.RESCUE_COORDINATOR.value, "user-coord-01")
    
    # 1. Government / NGO registers resource
    mock_insert_res = MagicMock()
    mock_insert_res.data = [{
        "id": "RES-AMB-TEST01",
        "name": "Red Cross Emergency Ambulance",
        "type": "AMBULANCE",
        "agency_type": "NGO",
        "organization": "Indian Red Cross Society",
        "status": "UNAVAILABLE",
        "verification_status": "PENDING"
    }]
    mock_supabase.table.return_value.insert.return_value.execute.return_value = mock_insert_res
    
    reg_response = client.post(
        "/api/v1/resources/register",
        headers={"Authorization": f"Bearer {dmo_token}"},
        json={
            "name": "Red Cross Emergency Ambulance",
            "type": "AMBULANCE",
            "agency_type": "NGO",
            "organization": "Indian Red Cross Society",
            "district": "Puri",
            "contact_person": "Dr. S. Mohapatra",
            "contact_phone": "+919876543210",
            "attributes": {"oxygen_available": True, "ventilator_available": True}
        }
    )
    
    assert reg_response.status_code == 200
    assert reg_response.json()["status"] == "success"
    assert "Awaiting Super Admin verification" in reg_response.json()["message"]
    
    # 2. Rescue Coordinator attempts to verify (Should be FORBIDDEN 403)
    forbidden_verify = client.post(
        "/api/v1/resources/RES-AMB-TEST01/verify",
        headers={"Authorization": f"Bearer {coord_token}"}
    )
    assert forbidden_verify.status_code == 403
    
    # 3. Super Admin lists pending verifications
    mock_pending_res = MagicMock()
    mock_pending_res.data = [{
        "id": "RES-AMB-TEST01",
        "name": "Red Cross Emergency Ambulance",
        "verification_status": "PENDING"
    }]
    mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value = mock_pending_res
    
    pending_res = client.get(
        "/api/v1/resources/pending",
        headers={"Authorization": f"Bearer {super_admin_token}"}
    )
    assert pending_res.status_code == 200
    assert len(pending_res.json()["data"]) == 1
    
    # 4. Super Admin verifies resource
    mock_select_res = MagicMock()
    mock_select_res.data = [{
        "id": "RES-AMB-TEST01",
        "status": "UNAVAILABLE",
        "verification_status": "PENDING"
    }]
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_select_res
    
    mock_update_res = MagicMock()
    mock_update_res.data = [{
        "id": "RES-AMB-TEST01",
        "status": "AVAILABLE",
        "verification_status": "VERIFIED",
        "verified_by": "admin-super-01"
    }]
    mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = mock_update_res
    
    verify_response = client.post(
        "/api/v1/resources/RES-AMB-TEST01/verify",
        headers={"Authorization": f"Bearer {super_admin_token}"}
    )
    assert verify_response.status_code == 200
    assert verify_response.json()["status"] == "success"
    assert "verified and added to real-time available pool" in verify_response.json()["message"]
    
    # 5. Super Admin Rejects a bogus registration
    mock_reject_res = MagicMock()
    mock_reject_res.data = [{
        "id": "RES-BOGUS-99",
        "status": "OFFLINE",
        "verification_status": "REJECTED"
    }]
    mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = mock_reject_res
    
    reject_response = client.post(
        "/api/v1/resources/RES-BOGUS-99/reject",
        headers={"Authorization": f"Bearer {super_admin_token}"},
        json={"reason": "Invalid registration certificate"}
    )
    assert reject_response.status_code == 200
    assert reject_response.json()["status"] == "success"
    
    # Clean up dependency overrides
    app.dependency_overrides.clear()
