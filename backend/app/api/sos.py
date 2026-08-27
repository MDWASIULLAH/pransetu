from fastapi import APIRouter, Depends, HTTPException, status, Request
from supabase import Client
from app.core.db import get_supabase_client
from app.schemas.sos import SOSRecordCreate
from app.core.security import require_permissions
from app.core.rbac import has_permission, Permission
from app.core.audit import log_audit_event, AuditAction, mask_citizen_privacy
from typing import Dict, Any
from datetime import datetime

router = APIRouter()

def mask_sos_data(record: dict, role: str) -> dict:
    """Apply least-privilege data minimization based on role permissions."""
    rec = dict(record)
    
    # Mask Citizen Phone Number
    if not has_permission(role, Permission.SOS_MASK_PHONE):
        if rec.get("citizen_phone"):
            phone = str(rec["citizen_phone"])
            if len(phone) >= 6:
                rec["citizen_phone"] = phone[:3] + "******" + phone[-2:]
            else:
                rec["citizen_phone"] = "****"
                
    # Fuzz Location (If exact clearance not granted)
    if not has_permission(role, Permission.SOS_EXACT_LOCATION):
        rec["location_redacted"] = True
        if "location" in rec:
            rec["location"] = "REDACTED_DUE_TO_CLEARANCE"
            
    return rec

@router.post("/android", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
def create_sos_android(
    sos_data: SOSRecordCreate, 
    supabase: Client = Depends(get_supabase_client)
):
    """Ingests an SOS event originating from the Android app with deduplication."""
    data = sos_data.model_dump()
    location_wkt = f"SRID=4326;POINT({data['longitude']} {data['latitude']})"
    
    payload = {
        "sos_id": data["sos_id"],
        "protocol_version": data["protocol_version"],
        "device_id": data["device_id"],
        "source": "ANDROID",
        "location": location_wkt,
        "accuracy_m": data["accuracy_m"],
        "location_timestamp": sos_data.location_timestamp.isoformat(),
        "people_count": data["people_count"],
        "medical_required": data["medical_required"],
        "severity": data["severity"],
        "hop_count": data["hop_count"],
        "ttl": data["ttl"],
        "relay_trail": data["relay_trail"],
        "message": data["message"],
        "user_id": data.get("user_id"),
        "phone_reference": data.get("phone_reference"),
    }
    
    try:
        response = supabase.table('sos_events').upsert(
            payload, 
            on_conflict="device_id,source,location_timestamp"
        ).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to ingest SOS")
            
        return {"status": "success", "sos_id": response.data[0]["sos_id"], "idempotent": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=Dict[str, Any])
def list_sos_events(
    supabase: Client = Depends(get_supabase_client),
    user_info: dict = Depends(require_permissions([Permission.SOS_VIEW]))
):
    """Retrieve SOS events with least-privilege citizen data masking."""
    response = supabase.table('sos_events').select("*").order("created_at", desc=True).limit(50).execute()
    masked_data = [mask_sos_data(record, user_info["role"]) for record in (response.data or [])]
    return {"data": masked_data}

@router.post("/{sos_id}/acknowledge", response_model=Dict[str, Any])
def acknowledge_sos(
    sos_id: str,
    request: Request,
    supabase: Client = Depends(get_supabase_client),
    user_info: dict = Depends(require_permissions([Permission.SOS_ACKNOWLEDGE]))
):
    """Acknowledge an SOS packet. Audits SOS_ACKNOWLEDGE event."""
    try:
        response = supabase.table('sos_events').update({
            "acknowledgedBy": user_info["uid"],
            "deliveryState": "ACKNOWLEDGED",
            "acknowledgedAt": int(datetime.now().timestamp() * 1000)
        }).eq("sosId", sos_id).execute()
    except Exception:
        response = supabase.table('sos_events').update({
            "acknowledged_by": user_info["uid"],
            "delivery_state": "ACKNOWLEDGED"
        }).eq("sos_id", sos_id).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="SOS not found")

    log_audit_event(
        supabase=supabase,
        actor_id=user_info["uid"],
        actor_role=user_info["role"],
        action=AuditAction.SOS_ACKNOWLEDGE,
        entity_type="SOS",
        entity_id=sos_id,
        before_state={"delivery_state": "OPEN"},
        after_state={"delivery_state": "ACKNOWLEDGED", "acknowledged_by": user_info["uid"]},
        request=request
    )
        
    return {"status": "success", "data": response.data[0]}

@router.post("/{sos_id}/escalate", response_model=Dict[str, Any])
def escalate_sos(
    sos_id: str,
    request: Request,
    supabase: Client = Depends(get_supabase_client),
    user_info: dict = Depends(require_permissions([Permission.SOS_ESCALATE]))
):
    """Escalate an SOS distress event. Audits SOS_ESCALATE event."""
    response = supabase.table('sos_events').update({
        "severity": "CRITICAL",
        "escalated_by": user_info["uid"]
    }).eq("sos_id", sos_id).execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="SOS not found")

    log_audit_event(
        supabase=supabase,
        actor_id=user_info["uid"],
        actor_role=user_info["role"],
        action=AuditAction.SOS_ESCALATE,
        entity_type="SOS",
        entity_id=sos_id,
        before_state={"severity": "HIGH"},
        after_state={"severity": "CRITICAL", "escalated_by": user_info["uid"]},
        request=request
    )

    return {"status": "success", "data": response.data[0]}
