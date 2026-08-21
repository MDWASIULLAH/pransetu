from fastapi import APIRouter, Depends, HTTPException, Query, Body, Request
from supabase import Client
import uuid
from datetime import datetime, timezone
from app.core.db import get_supabase_client
from app.core.security import require_permissions
from app.core.rbac import Permission, has_permission
from app.core.audit import log_audit_event, AuditAction
from typing import Optional, Dict, Any

router = APIRouter()

def mask_phone_number(phone: str) -> str:
    """Redacts the middle/last digits of a phone number for unauthorized observers."""
    if not phone or len(phone) < 6:
        return "****"
    return phone[:3] + "******" + phone[-2:]

@router.get("/stats")
def get_safeverify_stats(
    campaign_id: Optional[str] = None,
    district: Optional[str] = None,
    block: Optional[str] = None,
    supabase: Client = Depends(get_supabase_client),
    user_info: dict = Depends(require_permissions([Permission.CAMPAIGN_VIEW]))
):
    """Get aggregated SafeVerify stats using the Supabase Postgres RPC."""
    try:
        response = supabase.rpc(
            "get_safeverify_stats", 
            {"p_campaign_id": campaign_id, "p_district": district, "p_block": block}
        ).execute()
        
        if not response.data:
            return {
                "total_contacted": 0, "answered": 0, "no_answer": 0,
                "safe_count": 0, "assistance_count": 0, "trapped_count": 0,
                "medical_count": 0, "unaccounted_count": 0
            }
            
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/records")
def list_safeverify_records(
    campaign_id: Optional[str] = None,
    district: Optional[str] = None,
    state: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    supabase: Client = Depends(get_supabase_client),
    user_info: dict = Depends(require_permissions([Permission.CAMPAIGN_VIEW]))
):
    """Retrieve paginated verification history with RBAC citizen data masking."""
    try:
        query = supabase.table('safety_records').select("*")
        
        if campaign_id:
            query = query.eq("campaign_id", campaign_id)
        if district:
            query = query.eq("district", district)
        if state:
            query = query.eq("state", state)
            
        response = query.order("timestamp", desc=True).range(offset, offset + limit - 1).execute()
        
        # Apply Least-Privilege Data Masking for observers
        records = response.data or []
        if not has_permission(user_info["role"], Permission.SOS_MASK_PHONE):
            for record in records:
                if "citizen_phone" in record and record["citizen_phone"]:
                    record["citizen_phone"] = mask_phone_number(record["citizen_phone"])
                    
        return {"data": records}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/campaigns")
def create_voice_campaign(
    request: Request,
    payload: dict = Body(...),
    supabase: Client = Depends(get_supabase_client),
    user_info: dict = Depends(require_permissions([Permission.CAMPAIGN_CREATE]))
):
    """Creates a new automated IVR voice campaign and logs CAMPAIGN_CREATE."""
    try:
        campaign_id = payload.get("id") or f"CAMP-{uuid.uuid4().hex[:6].upper()}"
        title = payload.get("title", "Emergency SafeVerify IVR Broadcast")
        district = payload.get("district", "Puri")
        target_count = payload.get("target_reach", 12500)

        record = {
            "id": campaign_id,
            "title": title,
            "district": district,
            "status": "DRAFT",
            "target_reach": target_count,
            "created_by": user_info["uid"],
            "created_at": datetime.now(timezone.utc).isoformat()
        }

        log_audit_event(
            supabase=supabase,
            actor_id=user_info["uid"],
            actor_role=user_info["role"],
            action=AuditAction.CAMPAIGN_CREATE,
            entity_type="CAMPAIGN",
            entity_id=campaign_id,
            before_state=None,
            after_state=record,
            request=request
        )

        return {"status": "success", "data": record}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/campaigns/{campaign_id}/start")
def start_voice_campaign(
    campaign_id: str,
    request: Request,
    supabase: Client = Depends(get_supabase_client),
    user_info: dict = Depends(require_permissions([Permission.CAMPAIGN_CREATE]))
):
    """Starts an IVR campaign and logs CAMPAIGN_START."""
    log_audit_event(
        supabase=supabase,
        actor_id=user_info["uid"],
        actor_role=user_info["role"],
        action=AuditAction.CAMPAIGN_START,
        entity_type="CAMPAIGN",
        entity_id=campaign_id,
        before_state={"status": "DRAFT"},
        after_state={"status": "RUNNING"},
        request=request
    )
    return {"status": "success", "message": f"Campaign {campaign_id} started."}

@router.post("/campaigns/{campaign_id}/stop")
def stop_voice_campaign(
    campaign_id: str,
    request: Request,
    supabase: Client = Depends(get_supabase_client),
    user_info: dict = Depends(require_permissions([Permission.CAMPAIGN_CREATE]))
):
    """Stops an IVR campaign and logs CAMPAIGN_STOP."""
    log_audit_event(
        supabase=supabase,
        actor_id=user_info["uid"],
        actor_role=user_info["role"],
        action=AuditAction.CAMPAIGN_STOP,
        entity_type="CAMPAIGN",
        entity_id=campaign_id,
        before_state={"status": "RUNNING"},
        after_state={"status": "STOPPED"},
        request=request
    )
    return {"status": "success", "message": f"Campaign {campaign_id} stopped."}
