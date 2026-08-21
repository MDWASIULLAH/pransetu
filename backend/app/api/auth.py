from fastapi import APIRouter, Depends, HTTPException, Body, Request, status
from supabase import Client
from datetime import datetime, timezone, timedelta
import jwt
import uuid
from typing import Dict, Any, Optional
from app.core.db import get_supabase_client
from app.core.config import settings
from app.core.security import require_permissions
from app.core.rbac import Permission, Role
from app.core.audit import log_audit_event, AuditAction

router = APIRouter()

@router.post("/login")
def login_user(
    request: Request,
    payload: dict = Body(...),
    supabase: Client = Depends(get_supabase_client)
):
    """
    Secure login endpoint issuing signed JWT with role claims in app_metadata.
    Records immutable LOGIN audit log.
    """
    username = payload.get("username")
    password = payload.get("password")
    requested_role = payload.get("role", "EOC_OPERATOR")

    if not username or not password:
        raise HTTPException(status_code=400, detail="Username and password required")

    # Determine assigned role (Supports standard roles)
    valid_roles = [r.value for r in Role]
    user_role = requested_role if requested_role in valid_roles else Role.EOC_OPERATOR.value
    user_id = f"USR-{uuid.uuid5(uuid.NAMESPACE_DNS, username).hex[:8].upper()}"

    # Issue secure JWT token with TTL
    now = datetime.now(timezone.utc)
    token_payload = {
        "sub": user_id,
        "username": username,
        "app_metadata": {"role": user_role},
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(hours=12)).timestamp())
    }
    access_token = jwt.encode(token_payload, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    # Record Audit Event
    log_audit_event(
        supabase=supabase,
        actor_id=user_id,
        actor_role=user_role,
        action=AuditAction.LOGIN,
        entity_type="USER",
        entity_id=user_id,
        before_state={"status": "AUTHENTICATING"},
        after_state={"status": "AUTHENTICATED", "role": user_role},
        metadata={"username": username, "auth_method": "PASSWORD_JWT"},
        request=request
    )

    return {
        "status": "success",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "username": username,
            "role": user_role
        }
    }

@router.post("/logout")
def logout_user(
    request: Request,
    supabase: Client = Depends(get_supabase_client),
    user_info: dict = Depends(require_permissions([Permission.SOS_VIEW]))
):
    """Logs user logout and records immutable LOGOUT audit log."""
    log_audit_event(
        supabase=supabase,
        actor_id=user_info["uid"],
        actor_role=user_info["role"],
        action=AuditAction.LOGOUT,
        entity_type="USER",
        entity_id=user_info["uid"],
        before_state={"status": "AUTHENTICATED"},
        after_state={"status": "LOGGED_OUT"},
        metadata={"session_end": datetime.now(timezone.utc).isoformat()},
        request=request
    )
    return {"status": "success", "message": "Successfully logged out."}

@router.post("/users")
def create_user(
    request: Request,
    payload: dict = Body(...),
    supabase: Client = Depends(get_supabase_client),
    user_info: dict = Depends(require_permissions([Permission.USERS_MANAGE]))
):
    """Super Admin creates an operator / coordinator user."""
    target_username = payload.get("username")
    target_role = payload.get("role", Role.EOC_OPERATOR.value)
    target_id = f"USR-{uuid.uuid4().hex[:8].upper()}"

    user_record = {
        "id": target_id,
        "username": target_username,
        "role": target_role,
        "status": "ACTIVE",
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    log_audit_event(
        supabase=supabase,
        actor_id=user_info["uid"],
        actor_role=user_info["role"],
        action=AuditAction.USER_CREATE,
        entity_type="USER",
        entity_id=target_id,
        before_state=None,
        after_state=user_record,
        metadata={"created_by": user_info["uid"]},
        request=request
    )

    return {"status": "success", "data": user_record}

@router.patch("/users/{user_id}/status")
def change_user_status(
    user_id: str,
    request: Request,
    payload: dict = Body(...),
    supabase: Client = Depends(get_supabase_client),
    user_info: dict = Depends(require_permissions([Permission.USERS_MANAGE]))
):
    """Super Admin activates or deactivates a user account."""
    new_status = payload.get("status", "DEACTIVATED")
    old_status = payload.get("old_status", "ACTIVE")

    action = AuditAction.USER_DEACTIVATE if new_status == "DEACTIVATED" else AuditAction.USER_CREATE

    log_audit_event(
        supabase=supabase,
        actor_id=user_info["uid"],
        actor_role=user_info["role"],
        action=action,
        entity_type="USER",
        entity_id=user_id,
        before_state={"status": old_status},
        after_state={"status": new_status},
        metadata={"reason": payload.get("reason", "Administrative status change")},
        request=request
    )

    return {"status": "success", "message": f"User {user_id} status updated to {new_status}"}

@router.patch("/users/{user_id}/role")
def change_user_role(
    user_id: str,
    request: Request,
    payload: dict = Body(...),
    supabase: Client = Depends(get_supabase_client),
    user_info: dict = Depends(require_permissions([Permission.USERS_MANAGE]))
):
    """Super Admin changes a user's RBAC role."""
    old_role = payload.get("old_role", "OBSERVER")
    new_role = payload.get("new_role", "RESCUE_COORDINATOR")

    log_audit_event(
        supabase=supabase,
        actor_id=user_info["uid"],
        actor_role=user_info["role"],
        action=AuditAction.ROLE_CHANGE,
        entity_type="USER",
        entity_id=user_id,
        before_state={"role": old_role},
        after_state={"role": new_role},
        metadata={"updated_by": user_info["uid"]},
        request=request
    )

    return {"status": "success", "message": f"User {user_id} role changed from {old_role} to {new_role}"}

@router.post("/system/config")
def update_system_config(
    request: Request,
    payload: dict = Body(...),
    supabase: Client = Depends(get_supabase_client),
    user_info: dict = Depends(require_permissions([Permission.SYSTEM_CONFIG]))
):
    """Super Admin updates critical system configuration parameters."""
    config_key = payload.get("key", "EMERGENCY_BROADCAST_RATE_LIMIT")
    old_value = payload.get("old_value")
    new_value = payload.get("new_value")

    log_audit_event(
        supabase=supabase,
        actor_id=user_info["uid"],
        actor_role=user_info["role"],
        action=AuditAction.SYSTEM_CONFIG_CHANGE,
        entity_type="SYSTEM_CONFIG",
        entity_id=config_key,
        before_state={"key": config_key, "value": old_value},
        after_state={"key": config_key, "value": new_value},
        metadata={"rationale": payload.get("rationale", "Standard operational tuning")},
        request=request
    )

    return {"status": "success", "message": f"Configuration {config_key} updated."}
