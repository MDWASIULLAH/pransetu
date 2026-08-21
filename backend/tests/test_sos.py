import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock
from app.main import app
from app.core.db import get_supabase_client

@pytest.fixture(autouse=True)
def setup_supabase_mock():
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.data = [{"id": "TEST-ID"}]
    
    mock_table = MagicMock()
    mock_table.upsert.return_value.execute.return_value = mock_response
    mock_table.select.return_value.order.return_value.limit.return_value.execute.return_value = mock_response
    mock_table.select.return_value.eq.return_value.execute.return_value = mock_response
    mock_table.insert.return_value.execute.return_value = mock_response
    mock_table.update.return_value.eq.return_value.execute.return_value = mock_response
    mock_client.table.return_value = mock_table

    app.dependency_overrides[get_supabase_client] = lambda: mock_client
    yield mock_client
    app.dependency_overrides.pop(get_supabase_client, None)

def test_create_sos_android_valid():
    client = TestClient(app)
    payload = {
        "id": "TEST-ID",
        "device_id": "DEVICE-A",
        "source": "ANDROID",
        "lat": 20.2961,
        "lng": 85.8245,
        "accuracy_m": 15.0,
        "location_timestamp": "2026-08-21T10:00:00Z",
        "people_count": 2,
        "medical_required": True,
        "severity": "CRITICAL"
    }
    response = client.post("/api/v1/sos/android", json=payload)
    assert response.status_code == 201
    assert response.json()["status"] == "success"
    assert response.json()["id"] == "TEST-ID"

def test_create_sos_invalid_payload():
    client = TestClient(app)
    payload = {
        "id": "TEST-ID",
        "lat": 20.2961,
        "lng": 85.8245
    }
    response = client.post("/api/v1/sos/android", json=payload)
    assert response.status_code == 422

def test_ivr_webhook_critical():
    client = TestClient(app)
    response = client.post("/api/v1/webhooks/ivr?campaign_id=CAMP-1", data={
        "From": "+919876543210",
        "Digits": "3",
        "CallSid": "CALL-123"
    })
    assert response.status_code == 200
    assert "<Response>" in response.content.decode()

def test_ivr_webhook_safe():
    client = TestClient(app)
    response = client.post("/api/v1/webhooks/ivr?campaign_id=CAMP-1", data={
        "From": "+919876543210",
        "Digits": "1",
        "CallSid": "CALL-1234"
    })
    assert response.status_code == 200
    assert "<Response>" in response.content.decode()

def test_duplicate_sos_idempotency():
    client = TestClient(app)
    payload = {
        "id": "OD-DUP",
        "device_id": "DEVICE-B",
        "source": "ANDROID",
        "lat": 20.0,
        "lng": 85.0,
        "accuracy_m": 5.0,
        "location_timestamp": "2026-08-21T10:00:00Z"
    }
    resp1 = client.post("/api/v1/sos/android", json=payload)
    assert resp1.status_code == 201
    resp2 = client.post("/api/v1/sos/android", json=payload)
    assert resp2.status_code == 201
