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

def test_dispatch_recommendation_deterministic_rules():
    mock_supabase = MagicMock()
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    client = TestClient(app)
    
    token = create_test_token(Role.RESCUE_COORDINATOR.value, "coord-01")
    
    # 1. Mock Incident with Trauma and Flood Surge
    mock_inc_res = MagicMock()
    mock_inc_res.data = [{
        "id": "INC-PURI-01",
        "district": "Puri",
        "center_lat": 19.8135,
        "center_lng": 85.8312,
        "priority_score": 96,
        "affected_people": 12,
        "critical_count": 3,
        "medical_required": True,
        "hazard_severity": "COASTAL_FLOOD_SURGE",
        "location_accuracy_m": 10,
        "trapped_count": 5
    }]
    
    # 2. Mock Available Resources
    mock_res_res = MagicMock()
    mock_res_res.data = [
        {"id": "RES-AMB-01", "name": "ALS Ambulance #1", "type": "AMBULANCE", "status": "AVAILABLE", "verification_status": "VERIFIED", "attributes": {"lat": 19.820, "lng": 85.835}},
        {"id": "RES-NDRF-01", "name": "NDRF Battalion 03", "type": "RESCUE_TEAM", "status": "AVAILABLE", "verification_status": "VERIFIED", "attributes": {"lat": 19.818, "lng": 85.833}},
        {"id": "RES-BOAT-01", "name": "Zodiac IRB #1", "type": "BOAT", "status": "AVAILABLE", "verification_status": "VERIFIED", "attributes": {"lat": 19.810, "lng": 85.828}},
        {"id": "RES-MED-01", "name": "AIIMS Trauma Team", "type": "MEDICAL_TEAM", "status": "AVAILABLE", "verification_status": "VERIFIED", "attributes": {"lat": 19.822, "lng": 85.838}},
    ]
    
    def mock_table(table_name):
        table_mock = MagicMock()
        if table_name == 'incidents':
            table_mock.select.return_value.eq.return_value.execute.return_value = mock_inc_res
        elif table_name == 'resources':
            table_mock.select.return_value.eq.return_value.eq.return_value.execute.return_value = mock_res_res
        return table_mock

    mock_supabase.table.side_effect = mock_table
    
    response = client.get(
        "/api/v1/resources/dispatch-recommendations/INC-PURI-01",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()["data"]
    
    # Verify Pre-Dispatch Metadata
    assert data["incident_info"]["priority_score"] == 96
    assert data["incident_info"]["people_affected"] == 12
    assert data["incident_info"]["medical_required"] is True
    assert data["incident_info"]["location_accuracy"] == "±10m"
    
    # Verify Deterministic AI Rules
    rec_types = [r["resource_type"] for r in data["deterministic_recommendations"]]
    assert "AMBULANCE" in rec_types # Rule 1: Medical trauma
    assert "BOAT" in rec_types # Rule 2: Coastal surge
    assert "RESCUE_TEAM" in rec_types # Rule 3: Affected pax >= 6
    
    app.dependency_overrides.clear()

def test_batch_dispatch_and_lifecycle_transitions():
    mock_supabase = MagicMock()
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    client = TestClient(app)
    
    token = create_test_token(Role.RESCUE_COORDINATOR.value, "coord-01")
    
    # 1. Mock Resource verification
    mock_amb_res = MagicMock()
    mock_amb_res.data = [{
        "id": "RES-AMB-01",
        "name": "ALS Ambulance #1",
        "type": "AMBULANCE",
        "status": "AVAILABLE",
        "verification_status": "VERIFIED",
        "is_multi_capacity": False
    }]
    
    # Mock Assignment Record
    mock_assign_res = MagicMock()
    mock_assign_res.data = [{
        "id": "ASSIGN-1234",
        "incident_id": "INC-PURI-01",
        "resource_id": "RES-AMB-01",
        "status": "EN_ROUTE",
        "dispatch_time": "2026-08-21T10:00:00Z"
    }]
    
    def mock_table(table_name):
        table_mock = MagicMock()
        if table_name == 'resources':
            table_mock.select.return_value.eq.return_value.execute.return_value = mock_amb_res
            table_mock.update.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(data=[{"id": "RES-AMB-01", "status": "EN_ROUTE"}])
            table_mock.update.return_value.eq.return_value.execute.return_value = MagicMock(data=[{"id": "RES-AMB-01", "status": "AVAILABLE"}])
        elif table_name == 'rescue_assignments':
            table_mock.insert.return_value.execute.return_value = mock_assign_res
            table_mock.select.return_value.eq.return_value.execute.return_value = mock_assign_res
            table_mock.update.return_value.eq.return_value.execute.return_value = MagicMock(data=[{"id": "ASSIGN-1234", "status": "ON_SCENE"}])
        elif table_name == 'resource_audit_logs':
            table_mock.insert.return_value.execute.return_value = MagicMock(data=[{"id": "audit-1"}])
        elif table_name == 'incidents':
            table_mock.update.return_value.eq.return_value.execute.return_value = MagicMock(data=[])
        return table_mock

    mock_supabase.table.side_effect = mock_table
    
    # Test 1: Batch Dispatch
    dispatch_res = client.post(
        "/api/v1/resources/dispatch-batch",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "incident_id": "INC-PURI-01",
            "resource_ids": ["RES-AMB-01"],
            "notes": "Coordinator authorized immediate deployment"
        }
    )
    assert dispatch_res.status_code == 200
    assert dispatch_res.json()["status"] == "success"
    
    # Test 2: Lifecycle EN_ROUTE ➔ ON_SCENE
    on_scene_res = client.patch(
        "/api/v1/resources/assignments/ASSIGN-1234/lifecycle",
        headers={"Authorization": f"Bearer {token}"},
        json={"status": "ON_SCENE", "notes": "Ambulance arrived at flood sector"}
    )
    assert on_scene_res.status_code == 200
    assert on_scene_res.json()["data"]["new_status"] == "ON_SCENE"
    
    # Test 3: Lifecycle RESCUING ➔ COMPLETED (Automatic Resource Release)
    completed_res = client.patch(
        "/api/v1/resources/assignments/ASSIGN-1234/lifecycle",
        headers={"Authorization": f"Bearer {token}"},
        json={"status": "COMPLETED", "notes": "Victims admitted to Puri District Hospital"}
    )
    assert completed_res.status_code == 200
    assert completed_res.json()["data"]["new_status"] == "COMPLETED"
    
    app.dependency_overrides.clear()
