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
    return jwt.encode(payload, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

def test_authorized_alert_publishing_and_govt_source_validation():
    mock_supabase = MagicMock()
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    client = TestClient(app)
    
    dmo_token = create_test_token(Role.DISASTER_MANAGEMENT_OFFICER.value, "dmo-user-01")
    observer_token = create_test_token(Role.OBSERVER.value, "obs-user-02")
    
    # 1. Unauthorized OBSERVER attempts to publish alert (Should be FORBIDDEN 403)
    unauthorized_res = client.post(
        "/api/v1/alerts/publish",
        headers={"Authorization": f"Bearer {observer_token}"},
        json={
            "alert_type": "CYCLONE",
            "severity": "RED_CRITICAL",
            "title": "Unauthorized Storm Alert",
            "message": "Storm approaching",
            "affected_area": "Puri"
        }
    )
    assert unauthorized_res.status_code == 403
    
    # 2. Authorized DMO publishes Official Government Alert
    mock_insert_res = MagicMock()
    mock_insert_res.data = [{
        "alert_id": "ALT-CYC-20260821-001",
        "alert_type": "CYCLONE",
        "severity": "RED_CRITICAL",
        "title": "IMD Super Cyclone Landfall Warning",
        "message": "Mandatory 5km coastal evacuation ordered by Special Relief Commissioner",
        "affected_area": "Puri Coastal Belt",
        "created_by": "dmo-user-01",
        "status": "ACTIVE",
        "source": "IMD_OSDMA_OFFICIAL",
        "is_official_govt_source": True,
        "source_verification_ref": "SRC-ODISHA-DISASTER-BULLETIN-89"
    }]
    mock_supabase.table.return_value.insert.return_value.execute.return_value = mock_insert_res
    
    pub_response = client.post(
        "/api/v1/alerts/publish",
        headers={"Authorization": f"Bearer {dmo_token}"},
        json={
            "alert_type": "CYCLONE",
            "severity": "RED_CRITICAL",
            "title": "IMD Super Cyclone Landfall Warning",
            "message": "Mandatory 5km coastal evacuation ordered by Special Relief Commissioner",
            "affected_area": "Puri Coastal Belt",
            "is_official_govt_source": True,
            "source": "IMD_OSDMA_OFFICIAL",
            "source_verification_ref": "SRC-ODISHA-DISASTER-BULLETIN-89",
            "expires_in_hours": 36
        }
    )
    
    assert pub_response.status_code == 200
    data = pub_response.json()["data"]
    assert data["alert_type"] == "CYCLONE"
    assert data["severity"] == "RED_CRITICAL"
    assert data["is_official_govt_source"] is True
    assert "IMD_OSDMA_OFFICIAL" in data["source"]
    
    # 3. Authorized DMO de-escalates / cancels alert
    mock_select_res = MagicMock()
    mock_select_res.data = [{
        "alert_id": "ALT-CYC-20260821-001",
        "status": "ACTIVE"
    }]
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_select_res
    
    mock_update_res = MagicMock()
    mock_update_res.data = [{
        "alert_id": "ALT-CYC-20260821-001",
        "status": "CANCELLED"
    }]
    mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = mock_update_res
    
    cancel_res = client.post(
        "/api/v1/alerts/ALT-CYC-20260821-001/cancel",
        headers={"Authorization": f"Bearer {dmo_token}"},
        json={"reason": "Storm crossed without severe surge; threat subsided"}
    )
    
    assert cancel_res.status_code == 200
    assert cancel_res.json()["data"]["status"] == "CANCELLED"
    
    app.dependency_overrides.clear()
