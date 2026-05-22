# backend/app/api/routes_auth.py
from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.db.engine import get_session
from app.models.models import User, UserRole
from app.core.security import hash_password, verify_password, create_access_token
from app.core.dependencies import get_current_user, require_min_role, can_access_user

router = APIRouter()

CREATABLE_ROLES: dict[str, set[str]] = {
    "superuser": {"superuser", "admin", "user"},
    "admin":     {"user"},
}

# ── Schemas ───────────────────────────────────────────────────────────────────

class TokenOut(BaseModel):
    access_token  : str
    token_type    : str = "bearer"
    role          : str
    email         : str
    user_id       : int
    apiculteur_id : Optional[int]
    is_pending    : bool = False          # ← NEW: frontend redirects when True


class UserCreate(BaseModel):
    email         : str
    password      : str
    role          : str = "user"
    apiculteur_id : Optional[int] = None


class UserUpdate(BaseModel):
    email         : Optional[str]  = None
    password      : Optional[str]  = None
    role          : Optional[str]  = None
    apiculteur_id : Optional[int]  = None
    full_name     : Optional[str]  = None
    phone         : Optional[str]  = None
    location      : Optional[str]  = None
    is_pending    : Optional[bool] = None  # ← NEW: superuser sets False to approve


class UserOut(BaseModel):
    id            : int
    email         : str
    role          : str
    apiculteur_id : Optional[int]
    created_at    : datetime
    full_name     : Optional[str]
    phone         : Optional[str]
    location      : Optional[str]
    is_pending    : bool = False           # ← NEW

    class Config:
        from_attributes = True


class RegisterIn(BaseModel):
    """Public registration — creates a pending test account."""
    full_name    : str
    email        : str
    password     : str
    company_name : Optional[str] = None
    reason       : Optional[str] = None


class ForgotPasswordIn(BaseModel):
    email: str


class ResetPasswordIn(BaseModel):
    token        : str
    new_password : str


# ── Helpers ───────────────────────────────────────────────────────────────────

def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


# In-memory reset-token store — replace with a DB table in production.
# { token: { user_id, expires_at } }
_reset_tokens: dict[str, dict] = {}


# ── Login ─────────────────────────────────────────────────────────────────────

@router.post("/login", response_model=TokenOut)
async def login(
    form    : OAuth2PasswordRequestForm = Depends(),
    session : AsyncSession              = Depends(get_session),
):
    result = await session.execute(select(User).where(User.email == form.username))
    user   = result.scalars().first()

    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
        )

    token = create_access_token({
        "sub"          : user.email,
        "role"         : user.role.value,
        "user_id"      : user.id,
        "apiculteur_id": user.apiculteur_id,
        "is_pending"   : user.is_pending,
    })

    return TokenOut(
        access_token  = token,
        role          = user.role.value,
        email         = user.email,
        user_id       = user.id,
        apiculteur_id = user.apiculteur_id,
        is_pending    = user.is_pending,
    )


# ── Public registration (no auth required) ────────────────────────────────────

@router.post("/register", status_code=201)
async def register(
    payload : RegisterIn,
    session : AsyncSession = Depends(get_session),
):
    """
    Anyone can call this — creates a User with is_pending=True.
    The superuser sees it in the pending queue and approves it,
    optionally assigning an apiculteur_id.
    """
    # Duplicate check
    if (await session.execute(
        select(User).where(User.email == payload.email)
    )).scalars().first():
        raise HTTPException(status_code=400, detail="Email déjà utilisé")

    user = User(
        email           = payload.email,
        hashed_password = hash_password(payload.password),
        full_name       = payload.full_name,
        role            = UserRole.USER,
        apiculteur_id   = None,    # assigned when superuser approves
        is_pending      = True,
    )
    # Store optional metadata as a note in location field (or add dedicated columns)
    if payload.company_name or payload.reason:
        note_parts = []
        if payload.company_name:
            note_parts.append(f"Org: {payload.company_name}")
        if payload.reason:
            note_parts.append(f"Raison: {payload.reason}")
        user.location = " | ".join(note_parts)

    session.add(user)
    await session.commit()

    return {"message": "Compte créé. En attente d'approbation par un administrateur."}


# ── Forgot / reset password ───────────────────────────────────────────────────

@router.post("/forgot-password")
async def forgot_password(
    payload : ForgotPasswordIn,
    session : AsyncSession = Depends(get_session),
):
    """
    Generates a reset token and (in production) emails a link.
    Currently returns the token in the response for testing — remove in prod.
    """
    user = (await session.execute(
        select(User).where(User.email == payload.email)
    )).scalars().first()

    # Always return 200 — don't reveal whether the email exists
    if not user:
        return {"message": "Si ce compte existe, un e-mail a été envoyé."}

    token      = secrets.token_urlsafe(32)
    expires_at = _utcnow() + timedelta(hours=1)
    _reset_tokens[token] = {"user_id": user.id, "expires_at": expires_at}

    # TODO: replace with real email sending (e.g. SendGrid / Resend)
    reset_link = f"https://ibee.app/reset-password?token={token}"
    print(f"[DEV] Password reset link for {user.email}: {reset_link}")

    return {"message": "Si ce compte existe, un e-mail a été envoyé."}


@router.post("/reset-password")
async def reset_password(
    payload : ResetPasswordIn,
    session : AsyncSession = Depends(get_session),
):
    entry = _reset_tokens.get(payload.token)
    if not entry:
        raise HTTPException(status_code=400, detail="Token invalide ou expiré")
    if _utcnow() > entry["expires_at"]:
        del _reset_tokens[payload.token]
        raise HTTPException(status_code=400, detail="Token expiré")

    user = (await session.execute(
        select(User).where(User.id == entry["user_id"])
    )).scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    if len(payload.new_password) < 8:
        raise HTTPException(status_code=422, detail="Le mot de passe doit avoir au moins 8 caractères")

    user.hashed_password = hash_password(payload.new_password)
    session.add(user)
    await session.commit()
    del _reset_tokens[payload.token]

    return {"message": "Mot de passe réinitialisé avec succès."}


# ── /me ───────────────────────────────────────────────────────────────────────

@router.get("/me", response_model=UserOut)
async def get_me(
    session : AsyncSession = Depends(get_session),
    current : dict         = Depends(get_current_user),
):
    user = (await session.execute(
        select(User).where(User.id == current["user_id"])
    )).scalars().first()
    return user


# ── Users list ────────────────────────────────────────────────────────────────

@router.get("/users", response_model=List[UserOut])
async def list_users(
    is_pending : Optional[bool] = Query(default=None),   # ← NEW filter
    session    : AsyncSession   = Depends(get_session),
    current    : dict           = Depends(require_min_role("admin")),
):
    if current["role"] == "superuser":
        stmt = select(User)
        if is_pending is not None:
            stmt = stmt.where(User.is_pending == is_pending)
    else:
        stmt = select(User).where(
            User.apiculteur_id == current["apiculteur_id"],
            User.is_pending    == False,               # admins never see pending
        )

    return (await session.execute(stmt)).scalars().all()


# ── Create user (admin/superuser) ─────────────────────────────────────────────

@router.post("/users", response_model=UserOut, status_code=201)
async def create_user(
    payload : UserCreate,
    session : AsyncSession = Depends(get_session),
    current : dict         = Depends(require_min_role("admin")),
):
    allowed = CREATABLE_ROLES.get(current["role"], set())
    if payload.role not in allowed:
        raise HTTPException(
            status_code=403,
            detail=f"Votre rôle '{current['role']}' ne peut pas créer le rôle '{payload.role}'",
        )

    if current["role"] == "admin":
        payload.apiculteur_id = current["apiculteur_id"]
    elif current["role"] == "superuser" and payload.apiculteur_id is None:
        if payload.role != "superuser":
            raise HTTPException(
                status_code=422,
                detail="apiculteur_id requis pour créer un admin ou un utilisateur",
            )

    if (await session.execute(
        select(User).where(User.email == payload.email)
    )).scalars().first():
        raise HTTPException(status_code=400, detail="Email déjà utilisé")

    user = User(
        email           = payload.email,
        hashed_password = hash_password(payload.password),
        role            = UserRole(payload.role),
        apiculteur_id   = payload.apiculteur_id,
        is_pending      = False,    # admin-created accounts are always active
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


# ── Update user ───────────────────────────────────────────────────────────────

@router.patch("/users/{user_id}", response_model=UserOut)
async def update_user(
    user_id : int,
    payload : UserUpdate,
    session : AsyncSession = Depends(get_session),
    current : dict         = Depends(get_current_user),
):
    user = (await session.execute(
        select(User).where(User.id == user_id)
    )).scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    if not can_access_user(current, user):
        raise HTTPException(status_code=403, detail="Accès refusé")

    if current["user_id"] == user.id and payload.role is not None:
        raise HTTPException(status_code=403, detail="Vous ne pouvez pas changer votre propre rôle")

    if current["role"] == "admin":
        if payload.role is not None:
            raise HTTPException(status_code=403, detail="Un admin ne peut pas modifier les rôles")
        if payload.apiculteur_id is not None:
            raise HTTPException(status_code=403, detail="Un admin ne peut pas changer l'apiculteur")
        if payload.is_pending is not None:
            raise HTTPException(status_code=403, detail="Un admin ne peut pas approuver des comptes")

    if current["role"] == "user":
        if payload.role is not None or payload.apiculteur_id is not None or payload.is_pending is not None:
            raise HTTPException(status_code=403, detail="Accès refusé")

    # Apply changes
    if payload.email         is not None: user.email           = payload.email
    if payload.password      is not None: user.hashed_password = hash_password(payload.password)
    if payload.role          is not None: user.role            = UserRole(payload.role)
    if payload.apiculteur_id is not None: user.apiculteur_id   = payload.apiculteur_id
    if payload.full_name     is not None: user.full_name        = payload.full_name
    if payload.phone         is not None: user.phone            = payload.phone
    if payload.location      is not None: user.location         = payload.location

    # ── Approval: superuser sets is_pending=False + assigns apiculteur ────
    if payload.is_pending is False and current["role"] == "superuser":
        if payload.apiculteur_id is None and user.apiculteur_id is None:
            raise HTTPException(
                status_code=422,
                detail="Vous devez assigner une coopérative lors de l'approbation",
            )
        user.is_pending = False

    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


# ── Delete user ───────────────────────────────────────────────────────────────

@router.delete("/users/{user_id}", status_code=204)
async def delete_user(
    user_id : int,
    session : AsyncSession = Depends(get_session),
    current : dict         = Depends(require_min_role("admin")),
):
    user = (await session.execute(
        select(User).where(User.id == user_id)
    )).scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    if not can_access_user(current, user):
        raise HTTPException(status_code=403, detail="Accès refusé")

    if current["role"] == "admin" and user.role != UserRole.USER:
        raise HTTPException(
            status_code=403,
            detail="Un admin ne peut supprimer que des utilisateurs simples",
        )

    await session.delete(user)
    await session.commit()