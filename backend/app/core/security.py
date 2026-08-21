from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Callable, Dict, Any
import jwt
from app.core.config import settings
from app.core.rbac import has_permission

security = HTTPBearer()

def require_permissions(required_permissions: List[str]) -> Callable:
    def dependency(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
        token = credentials.credentials
        
        try:
            # Verify the JWT using the Supabase project JWT secret
            payload = jwt.decode(
                token, 
                settings.SUPABASE_JWT_SECRET, 
                algorithms=["HS256"],
                options={"verify_aud": False} # Supabase aud is usually "authenticated"
            )
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")
            
        # Supabase stores our custom trigger data in app_metadata
        app_metadata = payload.get("app_metadata", {})
        user_role = app_metadata.get("role", "OBSERVER") # Safe default
        
        # Check against RBAC matrix
        for perm in required_permissions:
            if not has_permission(user_role, perm):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN, 
                    detail=f"Role '{user_role}' lacks required permission '{perm}'"
                )
                
        return {
            "uid": payload.get("sub"),
            "role": user_role
        }
        
    return dependency
