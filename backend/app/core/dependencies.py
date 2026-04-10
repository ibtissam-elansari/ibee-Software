# /dependencies.py
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.security import decode_token

security = HTTPBearer()

# Role hierarchy — each level includes everything below it
ROLE_HIERARCHY = {
    "user"      : 0,
    "admin"     : 1,
    "superuser" : 2,
}


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    try:
        payload = decode_token(credentials.credentials)
        return payload
    except Exception:
        raise HTTPException(status_code=401, detail="Token invalide ou expiré")


def require_role(*allowed_roles: str):
    """
    Usage:
        @router.get("/endpoint", dependencies=[Depends(require_role("admin", "superuser"))])
    """
    def checker(user: dict = Depends(get_current_user)) -> dict:
        if user.get("role") not in allowed_roles:
            raise HTTPException(status_code=403, detail="Accès refusé")
        return user
    return checker


def require_min_role(min_role: str):
    """
    Usage:
        @router.get("/endpoint", dependencies=[Depends(require_min_role("admin"))])
    Allows the min_role AND everything above it in the hierarchy.
    """
    min_level = ROLE_HIERARCHY.get(min_role, 99)

    def checker(user: dict = Depends(get_current_user)) -> dict:
        user_level = ROLE_HIERARCHY.get(user.get("role", ""), -1)
        if user_level < min_level:
            raise HTTPException(status_code=403, detail="Accès refusé")
        return user
    return checker