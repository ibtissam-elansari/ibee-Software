# /backend/app/core/dependencies.py
from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.security import decode_access_token
from app.db.engine import get_session
from app.models.models import User, UserRole

bearer = HTTPBearer()

# Role hierarchy for permission checks
ROLE_HIERARCHY = {
    UserRole.SUPERUSER: 3,
    UserRole.ADMIN    : 2,
    UserRole.USER     : 1,
}


async def get_current_user(
    credentials : HTTPAuthorizationCredentials = Depends(bearer),
    session     : AsyncSession                 = Depends(get_session),
) -> User:
    """
    Decode JWT, fetch the user from DB.
    JWT payload: { sub: str(user.id), role: str, apiculteur_id: int|null }
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token invalide ou expiré",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(credentials.credentials)
        user_id = int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        raise credentials_exception

    result = await session.execute(select(User).where(User.id == user_id))
    user   = result.scalars().first()
    if not user:
        raise credentials_exception
    return user


def require_roles(*roles: str):
    """
    FastAPI dependency — raises 403 if the current user's role is not in `roles`.
    Usage: Depends(require_roles("superuser")) or Depends(require_roles("superuser","admin"))
    """
    async def _check(current: User = Depends(get_current_user)) -> User:
        if current.role.value not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Accès refusé — permissions insuffisantes",
            )
        return current
    return _check


def require_superuser():
    return require_roles("superuser")


def require_admin_or_above():
    return require_roles("superuser", "admin")


def require_any():
    """Any authenticated user."""
    return get_current_user


def assert_coop_access(user: User, apiculteur_id: int) -> None:
    """
    Raise 403 if a non-superuser tries to access a different coop's data.
    Call this in route handlers where the coop ID comes from the URL.
    """
    if user.role == UserRole.SUPERUSER:
        return  # superuser can access any coop
    if user.apiculteur_id != apiculteur_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé — cette ressource n'appartient pas à votre coopérative",
        )


def assert_can_manage_user(actor: User, target_role: UserRole) -> None:
    """
    Superuser can manage any role.
    Admin can only manage USER role (not other admins, not superusers).
    User cannot manage anyone.
    """
    if actor.role == UserRole.SUPERUSER:
        return
    if actor.role == UserRole.ADMIN and target_role == UserRole.USER:
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=f"Un {actor.role.value} ne peut pas gérer un {target_role.value}",
    )