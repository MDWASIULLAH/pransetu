from fastapi import APIRouter, Depends, HTTPException, Query
from supabase import Client
from typing import Optional, Dict, Any, List
from app.core.db import get_supabase_client
from app.core.security import require_permissions
from app.core.rbac import Permission

router = APIRouter()

@router.get("/logs")
def list_audit_logs(
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    actor_id: Optional[str] = None,
    limit: Optional[int] = Query(50, ge=1, le=500),
    supabase: Client = Depends(get_supabase_client),
    user_info: dict = Depends(require_permissions([Permission.AUDIT_VIEW]))
) -> Dict[str, Any]:
    """
    Retrieves chronological unified security audit trail.
    Restricted to authorized roles with AUDIT_VIEW permission (SUPER_ADMIN / DISASTER_MANAGEMENT_OFFICER).
    """
    try:
        query = supabase.table('unified_audit_logs').select("*")
        if action:
            query = query.eq("action", action)
        if entity_type:
            query = query.eq("entity_type", entity_type)
        if actor_id:
            query = query.eq("actor_id", actor_id)

        response = query.order("timestamp", desc=True).limit(limit).execute()
        return {
            "status": "success",
            "count": len(response.data or []),
            "data": response.data or []
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
