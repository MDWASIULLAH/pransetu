from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client
from typing import Dict, Any, List
from app.core.db import get_supabase_client
from app.core.security import require_permissions
from app.core.rbac import Permission

router = APIRouter()

@router.get("/", response_model=Dict[str, Any])
def list_registered_citizens(
    supabase: Client = Depends(get_supabase_client),
    user_info: dict = Depends(require_permissions([Permission.SOS_VIEW]))
):
    """
    Retrieves the list of all citizens who have registered / logged in via the Android app.
    Only accessible by authorized dashboard users.
    """
    try:
        response = supabase.table('registered_citizens').select("*").order("registered_at", desc=True).execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
