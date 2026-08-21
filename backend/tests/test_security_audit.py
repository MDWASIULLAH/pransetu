import pytest
import jwt
from unittest.mock import MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.core.db import get_supabase_client
from app.core.config import settings
from app.core.rbac import Role, Permission
from app.core.audit import log_audit_event, AuditAction, mask_citizen_privacy

def create_test_token(role: str, user_id: str = "test-officer-id") -> str:
    payload = {
        "sub": user_id,
        "app_metadata": {"role": role}
    }
    return jwt.encode(payload, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

def test_unified_audit_record_structure_and_actions():
    mock_supabase = MagicMock()
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    
    # Test all 18 actions
    all_actions = list(AuditAction)
    assert len(all_actions) >= 18

    for act in all_actions:
        record = log_audit_event(
            supabase=mock_supabase,
            actor_id="usr-super-admin-01",
            actor_role="SUPER_ADMIN",
            action=act,
            entity_type="TEST_ENTITY",
            entity_id="ENT-12345",
            before_state={"status": "INITIAL"},
            after_state={"status": "UPDATED"},
            metadata={"test": True}
        )

        # Assert mandatory audit record fields
        assert "audit_id" in record
        assert record["actor_id"] == "usr-super-admin-01"
        assert record["actor_role"] == "SUPER_ADMIN"
        assert record["action"] == act.value
        assert record["entity_type"] == "TEST_ENTITY"
        assert record["entity_id"] == "ENT-12345"
        assert "timestamp" in record
        assert "ip_or_device_metadata" in record
        assert record["before_state"] == {"status": "INITIAL"}
        assert record["after_state"] == {"status": "UPDATED"}
        assert record["metadata"] == {"test": True}

    app.dependency_overrides.clear()

def test_citizen_privacy_masking_least_privilege():
    # 1. Unauthorized OBSERVER: phone number masked and location fuzzed
    masked_observer = mask_citizen_privacy(
        phone="+919437012345",
        lat=19.813456,
        lng=85.831278,
        role=Role.OBSERVER.value
    )
    assert "******" in masked_observer["citizen_phone"]
    assert not masked_observer["location"]["exact_clearance"]
    assert masked_observer["location"]["lat"] == 19.81 # Fuzzed to 2 decimals

    # 2. Authorized DISASTER_MANAGEMENT_OFFICER: phone number unmasked and exact coordinates preserved
    unmasked_dmo = mask_citizen_privacy(
        phone="+919437012345",
        lat=19.813456,
        lng=85.831278,
        role=Role.DISASTER_MANAGEMENT_OFFICER.value
    )
    assert unmasked_dmo["citizen_phone"] == "+919437012345"
    assert unmasked_dmo["location"]["exact_clearance"] is True
    assert unmasked_dmo["location"]["lat"] == 19.813456

def test_auth_login_logout_and_admin_audit_flow():
    mock_supabase = MagicMock()
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    client = TestClient(app)

    # 1. Login
    login_res = client.post(
        "/api/v1/auth/login",
        json={"username": "dmo_odisha", "password": "secure-pwd", "role": "DISASTER_MANAGEMENT_OFFICER"}
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    assert token is not None

    # 2. Logout
    logout_res = client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert logout_res.status_code == 200
    assert logout_res.json()["status"] == "success"

    # 3. Super Admin User Creation and Role Modification
    admin_token = create_test_token(Role.SUPER_ADMIN.value, "admin-01")
    
    create_user_res = client.post(
        "/api/v1/auth/users",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"username": "new_coordinator", "role": "RESCUE_COORDINATOR"}
    )
    assert create_user_res.status_code == 200
    user_id = create_user_res.json()["data"]["id"]

    role_change_res = client.patch(
        f"/api/v1/auth/users/{user_id}/role",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"old_role": "RESCUE_COORDINATOR", "new_role": "DISASTER_MANAGEMENT_OFFICER"}
    )
    assert role_change_res.status_code == 200

    # 4. System Config Change
    config_res = client.post(
        "/api/v1/auth/system/config",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"key": "EMERGENCY_BROADCAST_RATE_LIMIT", "old_value": "100/min", "new_value": "500/min"}
    )
    assert config_res.status_code == 200

    # 5. List Audit Logs (Requires AUDIT_VIEW)
    mock_audit_res = MagicMock()
    mock_audit_res.data = [
        {"audit_id": "AUD-1", "action": "LOGIN", "actor_id": "USR-1", "entity_type": "USER", "entity_id": "USR-1"}
    ]
    mock_supabase.table.return_value.select.return_value.order.return_value.limit.return_value.execute.return_value = mock_audit_res

    audit_list_res = client.get(
        "/api/v1/audit/logs?limit=10",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert audit_list_res.status_code == 200
    assert len(audit_list_res.json()["data"]) >= 1

    app.dependency_overrides.clear()
