# backend/app/core/dependencies.py
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.security import decode_token

security = HTTPBearer()

ROLE_HIERARCHY = {
    "user":      0,
    "admin":     1,
    "superuser": 2,
}


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    try:
        payload = decode_token(credentials.credentials)
    except Exception:
        raise HTTPException(status_code=401, detail="Token invalide ou expiré")

    return {
        "user_id"      : payload["user_id"],
        "role"         : payload["role"],
        "email"        : payload["sub"],
        "apiculteur_id": payload.get("apiculteur_id"),
        "is_pending"   : payload.get("is_pending", False),   # ← NEW
    }


def require_min_role(min_role: str):
    min_level = ROLE_HIERARCHY.get(min_role, 99)

    def checker(user: dict = Depends(get_current_user)) -> dict:
        # Pending accounts have no meaningful role — block them everywhere
        if user.get("is_pending"):
            raise HTTPException(status_code=403, detail="Compte en attente d'approbation")
        if ROLE_HIERARCHY.get(user.get("role", ""), -1) < min_level:
            raise HTTPException(status_code=403, detail="Accès refusé")
        return user

    return checker


# Exact-role alias used by existing hive/device routes
require_role = require_min_role


# ── Access helpers ────────────────────────────────────────────────────────────

def can_access_user(current: dict, target_user) -> bool:
    if current["role"] == "superuser":
        return True
    if current["role"] == "admin":
        return current["apiculteur_id"] == target_user.apiculteur_id
    return current["user_id"] == target_user.id


def can_access_apiculteur_data(current: dict, apiculteur_id: int) -> bool:
    if current["role"] == "superuser":
        return True
    return current.get("apiculteur_id") == apiculteur_id


def can_access_hive(current: dict, hive) -> bool:
    if current["role"] == "superuser":
        return True
    return current.get("apiculteur_id") == hive.apiculteur_id


def require_hive_access(current: dict, hive) -> None:
    if not can_access_hive(current, hive):
        raise HTTPException(status_code=403, detail="Accès refusé à cette ruche")


def scope_to_apiculteur(current: dict, requested_apiculteur_id: int) -> None:
    if current["role"] != "superuser" and current.get("apiculteur_id") != requested_apiculteur_id:
        raise HTTPException(status_code=403, detail="Accès refusé")