import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock
from app.main import app
from app.core.db import get_supabase_client

@pytest.fixture(autouse=True)
def setup_supabase_mock():
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.data = []
    
    mock_table = MagicMock()
    mock_table.select.return_value.eq.return_value.execute.return_value = mock_response
    mock_table.insert.return_value.execute.return_value = mock_response
    mock_table.upsert.return_value.execute.return_value = mock_response
    mock_client.table.return_value = mock_table

    app.dependency_overrides[get_supabase_client] = lambda: mock_client
    yield mock_client
    app.dependency_overrides.pop(get_supabase_client, None)

def test_ivr_safe_response():
    client = TestClient(app)
    data = {
        "From": "+919876543210",
        "Digits": "1",
        "CallSid": "CA12345"
    }
    response = client.post("/api/v1/webhooks/ivr?campaign_id=CMP-1", data=data)
    assert response.status_code == 200
    xml = response.content.decode()
    assert "<Response>" in xml
    assert "Thank you" in xml

def test_ivr_medical_response():
    client = TestClient(app)
    data = {
        "From": "+919876543210",
        "Digits": "4",
        "CallSid": "CA12346"
    }
    response = client.post("/api/v1/webhooks/ivr?campaign_id=CMP-1", data=data)
    assert response.status_code == 200
    xml = response.content.decode()
    assert "<Response>" in xml
    assert "Thank you" in xml

def test_ivr_invalid_response():
    client = TestClient(app)
    data = {
        "From": "+919876543210",
        "Digits": "5",
        "CallSid": "CA12347"
    }
    response = client.post("/api/v1/webhooks/ivr?campaign_id=CMP-1", data=data)
    assert response.status_code == 200
    xml = response.content.decode()
    assert "Invalid selection" in xml
