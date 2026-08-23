import pytest
import jwt
from fastapi.testclient import TestClient
from unittest.mock import MagicMock
from app.main import app
from app.core.config import settings
from app.core.db import get_supabase_client

@pytest.fixture(autouse=True)
def setup_supabase_mock():
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.data = [{
        "id": "OD-1",
        "location": "0101000020E61000002242197A13755540D34D6210582F3440",
        "citizen_phone": "+919876543210"
    }]
    
    mock_table = MagicMock()
    mock_table.select.return_value.order.return_value.limit.return_value.execute.return_value = mock_response
    mock_table.update.return_value.eq.return_value.execute.return_value = mock_response
    mock_client.table.return_value = mock_table

    app.dependency_overrides[get_supabase_client] = lambda: mock_client
    yield mock_client
    app.dependency_overrides.pop(get_supabase_client, None)

def create_mock_token(role: str) -> str:
    payload = {
        "sub": "user-123",
        "app_metadata": {"role": role}
    }
    return jwt.encode(payload, settings.legacy_supabase_secret, algorithm="HS256")

def test_observer_data_masking():
    client = TestClient(app)
    token = create_mock_token("OBSERVER")
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.get("/api/v1/sos/", headers=headers)
    assert response.status_code == 200
    data = response.json()["data"][0]
    
    # Observer should see masked phone and fuzzed location
    assert data["location"] == "REDACTED_DUE_TO_CLEARANCE"
    assert "******" in data["citizen_phone"]

def test_admin_no_masking():
    client = TestClient(app)
    token = create_mock_token("SUPER_ADMIN")
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.get("/api/v1/sos/", headers=headers)
    assert response.status_code == 200
    data = response.json()["data"][0]
    
    # Admin sees raw data
    assert data["location"] == "0101000020E61000002242197A13755540D34D6210582F3440"
    assert data["citizen_phone"] == "+919876543210"

def test_eoc_operator_acknowledge_allowed():
    client = TestClient(app)
    token = create_mock_token("EOC_OPERATOR")
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.post("/api/v1/sos/OD-1/acknowledge", headers=headers)
    assert response.status_code == 200
    assert response.json()["status"] == "success"

def test_observer_acknowledge_forbidden():
    client = TestClient(app)
    token = create_mock_token("OBSERVER")
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.post("/api/v1/sos/OD-1/acknowledge", headers=headers)
    assert response.status_code == 403
