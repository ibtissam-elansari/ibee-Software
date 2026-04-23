from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.security import decode_token

security = HTTPBearer()

ROLE_HIERARCHY = {
    "user": 0,
    "admin": 1,
    "superuser": 2,
}


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    try:
        return decode_token(credentials.credentials)
    except Exception:
        raise HTTPException(status_code=401, detail="Token invalide ou expiré")


def require_min_role(min_role: str):
    min_level = ROLE_HIERARCHY.get(min_role, 99)

    def checker(user: dict = Depends(get_current_user)) -> dict:
        if ROLE_HIERARCHY.get(user.get("role", ""), -1) < min_level:
            raise HTTPException(status_code=403, detail="Accès refusé")
        return user

    return checker


# ── Access helpers ────────────────────────────────────────────────────────────

def can_access_user(current: dict, target_user) -> bool:
    """Superuser sees all. Admin sees own apiculteur. User sees only self."""
    if current["role"] == "superuser":
        return True
    if current["role"] == "admin":
        return current["apiculteur_id"] == target_user.apiculteur_id
    return current["user_id"] == target_user.id


def can_access_apiculteur_data(current: dict, apiculteur_id: int) -> bool:
    """Superuser sees all. Admin/user see only their own apiculteur."""
    if current["role"] == "superuser":
        return True
    return current.get("apiculteur_id") == apiculteur_id


def can_access_hive(current: dict, hive) -> bool:
    """
    Superuser: any hive.
    Admin/user: only hives whose apiculteur_id matches theirs.
    `hive` must expose a `.apiculteur_id` attribute (add it to the Hive model
    if it isn't there yet — see note below).
    """
    if current["role"] == "superuser":
        return True
    return current.get("apiculteur_id") == hive.apiculteur_id


def require_hive_access(current: dict, hive) -> None:
    """Raises 403 if current user cannot access this hive."""
    if not can_access_hive(current, hive):
        raise HTTPException(status_code=403, detail="Accès refusé à cette ruche")