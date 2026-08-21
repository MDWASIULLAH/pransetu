from fastapi import APIRouter, Depends, HTTPException, Body, Request
from supabase import Client
from app.core.db import get_supabase_client
from app.core.security import require_permissions
from app.core.rbac import Permission
from app.core.priority_engine import evaluate_incident_priority
from app.core.audit import log_audit_event, AuditAction

router = APIRouter()

@router.post("/{incident_id}/evaluate")
def evaluate_priority(
    incident_id: str,
    request: Request,
    supabase: Client = Depends(get_supabase_client),
    user_info: dict = Depends(require_permissions([Permission.INCIDENT_MANAGE]))
):
    """
    Manually triggers the Domino-AI priority engine for a specific incident.
    """
    try:
        result = evaluate_incident_priority(supabase, incident_id)
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{incident_id}")
def update_incident(
    incident_id: str,
    request: Request,
    payload: dict = Body(...),
    supabase: Client = Depends(get_supabase_client),
    user_info: dict = Depends(require_permissions([Permission.INCIDENT_MANAGE]))
):
    """Updates incident metadata and logs INCIDENT_MODIFY audit event."""
    try:
        old_res = supabase.table('incidents').select("*").eq("id", incident_id).execute()
        old_data = old_res.data[0] if old_res.data else {}

        upd = supabase.table('incidents').update(payload).eq("id", incident_id).execute()
        new_data = upd.data[0] if upd.data else payload

        log_audit_event(
            supabase=supabase,
            actor_id=user_info["uid"],
            actor_role=user_info["role"],
            action=AuditAction.INCIDENT_MODIFY,
            entity_type="INCIDENT",
            entity_id=incident_id,
            before_state=old_data,
            after_state=new_data,
            request=request
        )

        return {"status": "success", "data": new_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{incident_id}/priority")
def change_incident_priority(
    incident_id: str,
    request: Request,
    payload: dict = Body(...),
    supabase: Client = Depends(get_supabase_client),
    user_info: dict = Depends(require_permissions([Permission.INCIDENT_PRIORITY_CHANGE]))
):
    """Manually modifies incident priority score and logs PRIORITY_CHANGE audit event."""
    try:
        new_score = payload.get("priority_score", 95)
        reason = payload.get("reason", "Coordinator priority override")

        old_res = supabase.table('incidents').select("priority_score").eq("id", incident_id).execute()
        old_score = old_res.data[0].get("priority_score", 0) if old_res.data else 0

        upd = supabase.table('incidents').update({"priority_score": new_score}).eq("id", incident_id).execute()

        log_audit_event(
            supabase=supabase,
            actor_id=user_info["uid"],
            actor_role=user_info["role"],
            action=AuditAction.PRIORITY_CHANGE,
            entity_type="INCIDENT",
            entity_id=incident_id,
            before_state={"priority_score": old_score},
            after_state={"priority_score": new_score},
            metadata={"reason": reason},
            request=request
        )

        return {"status": "success", "data": {"incident_id": incident_id, "priority_score": new_score}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
