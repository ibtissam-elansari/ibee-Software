from __future__ import annotations

from datetime import datetime
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.db.engine import get_session
from app.models.models import User, UserRole
from app.core.security import hash_password, verify_password, create_access_token
from app.core.dependencies import (
    get_current_user,
    require_min_role,
    can_access_user,
)

router = APIRouter()

# Who can create whom
# superuser → can create superuser, admin, user (for any apiculteur)
# admin     → can create user only (forced into own apiculteur)
CREATABLE_ROLES: dict[str, set[str]] = {
    "superuser": {"superuser", "admin", "user"},
    "admin":     {"user"},
}

# ── Schemas ───────────────────────────────────────────────────────────────────

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    email: str
    user_id: int
    apiculteur_id: Optional[int]


class UserCreate(BaseModel):
    email: str
    password: str
    role: str = "user"
    apiculteur_id: Optional[int] = None


class UserUpdate(BaseModel):
    email: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None
    apiculteur_id: Optional[int] = None
    full_name : Optional[str] 
    phone     : Optional[str]
    location  : Optional[str]


class UserOut(BaseModel):
    id: int
    email: str
    role: str
    apiculteur_id: Optional[int]
    created_at: datetime
    full_name : Optional[str] 
    phone     : Optional[str]
    location  : Optional[str]

    class Config:
        from_attributes = True


# ── Auth ──────────────────────────────────────────────────────────────────────

@router.post("/login", response_model=TokenOut)
async def login(
    form: OAuth2PasswordRequestForm = Depends(),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(User).where(User.email == form.username))
    user = result.scalars().first()

    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
        )

    token = create_access_token({
        "sub": user.email,
        "role": user.role.value,
        "user_id": user.id,
        "apiculteur_id": user.apiculteur_id,
    })
    return TokenOut(
        access_token=token,
        role=user.role.value,
        email=user.email,
        user_id=user.id,
        apiculteur_id=user.apiculteur_id,
    )


@router.get("/me", response_model=UserOut)
async def get_me(
    session: AsyncSession = Depends(get_session),
    current: dict = Depends(get_current_user),
):
    user = (await session.execute(
        select(User).where(User.id == current["user_id"])
    )).scalars().first()
    return user


# ── Users ─────────────────────────────────────────────────────────────────────

@router.get("/users", response_model=List[UserOut])
async def list_users(
    session: AsyncSession = Depends(get_session),
    current: dict = Depends(require_min_role("admin")),
):
    if current["role"] == "superuser":
        stmt = select(User)
    else:
        stmt = select(User).where(User.apiculteur_id == current["apiculteur_id"])

    return (await session.execute(stmt)).scalars().all()


@router.post("/users", response_model=UserOut, status_code=201)
async def create_user(
    payload: UserCreate,
    session: AsyncSession = Depends(get_session),
    current: dict = Depends(require_min_role("admin")),
):
    # ── Role gate ──────────────────────────────────────────────────────────
    allowed = CREATABLE_ROLES.get(current["role"], set())
    if payload.role not in allowed:
        raise HTTPException(
            status_code=403,
            detail=f"Votre rôle '{current['role']}' ne peut pas créer le rôle '{payload.role}'",
        )

    # ── Apiculteur scope ───────────────────────────────────────────────────
    if current["role"] == "admin":
        # Admin can only create users inside their own apiculteur
        payload.apiculteur_id = current["apiculteur_id"]
    elif current["role"] == "superuser" and payload.apiculteur_id is None:
        # Superuser must supply apiculteur_id when creating admin/user
        if payload.role != "superuser":
            raise HTTPException(
                status_code=422,
                detail="apiculteur_id requis pour créer un admin ou un utilisateur",
            )

    # ── Duplicate check ────────────────────────────────────────────────────
    if (await session.execute(
        select(User).where(User.email == payload.email)
    )).scalars().first():
        raise HTTPException(status_code=400, detail="Email déjà utilisé")

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=UserRole(payload.role),
        apiculteur_id=payload.apiculteur_id,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


@router.patch("/users/{user_id}", response_model=UserOut)
async def update_user(
    user_id: int,
    payload: UserUpdate,
    session: AsyncSession = Depends(get_session),
    current: dict = Depends(get_current_user),
):
    user = (await session.execute(
        select(User).where(User.id == user_id)
    )).scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    if not can_access_user(current, user):
        raise HTTPException(status_code=403, detail="Accès refusé")

    # Nobody changes their own role
    if current["user_id"] == user.id and payload.role is not None:
        raise HTTPException(status_code=403, detail="Vous ne pouvez pas changer votre propre rôle")

    # Admin cannot change roles at all, and is locked to their apiculteur
    if current["role"] == "admin":
        if payload.role is not None:
            raise HTTPException(status_code=403, detail="Un admin ne peut pas modifier les rôles")
        if payload.apiculteur_id is not None:
            raise HTTPException(status_code=403, detail="Un admin ne peut pas changer l'apiculteur")

    # Regular user can only touch their own record (already checked via can_access_user)
    # and cannot touch role or apiculteur_id
    if current["role"] == "user":
        if payload.role is not None or payload.apiculteur_id is not None:
            raise HTTPException(status_code=403, detail="Accès refusé")

    if payload.email:
        user.email = payload.email
    if payload.password:
        user.hashed_password = hash_password(payload.password)
    if payload.role:
        user.role = UserRole(payload.role)
    if payload.apiculteur_id is not None:
        user.apiculteur_id = payload.apiculteur_id

    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


@router.delete("/users/{user_id}", status_code=204)
async def delete_user(
    user_id: int,
    session: AsyncSession = Depends(get_session),
    current: dict = Depends(require_min_role("admin")),
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


# Add this to backend/app/api/routes_auth.py temporarily
# Remove it after creating your first superuser

@router.post("/seed-superuser", include_in_schema=False)
async def seed_superuser(session: AsyncSession = Depends(get_session)):
    """
    One-time endpoint to create the first superuser.
    DELETE THIS ROUTE after first use.
    """
    # Check if any superuser already exists
    existing = (await session.execute(
        select(User).where(User.role == UserRole.SUPERUSER)
    )).scalars().first()

    if existing:
        return {"message": "superuser already exists", "email": existing.email}

    user = User(
        email           = "super@ibee.com",
        hashed_password = hash_password("iBee@2026!"),
        role            = UserRole.SUPERUSER,
        apiculteur_id   = None,
        full_name       = "Super Admin",
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)

    return {
        "message"  : "superuser created successfully",
        "email"    : user.email,
        "password" : "iBee@2026!",
        "reminder" : "Change your password after first login and DELETE this endpoint",
    }