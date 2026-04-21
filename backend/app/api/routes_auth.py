from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.db.engine import get_session
from app.models.models import User, UserRole
from app.core.security import hash_password, verify_password, create_access_token
from app.core.dependencies import get_current_user, require_role

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class TokenOut(BaseModel):
    access_token  : str
    token_type    : str = "bearer"
    role          : str
    email         : str
    user_id       : int
    apiculteur_id : Optional[int]   # None for superuser


class UserCreate(BaseModel):
    email         : str
    password      : str
    role          : str = "user"
    apiculteur_id : Optional[int] = None


class UserUpdate(BaseModel):
    email         : Optional[str] = None
    password      : Optional[str] = None
    role          : Optional[str] = None
    apiculteur_id : Optional[int] = None


class UserOut(BaseModel):
    id            : int
    email         : str
    role          : str
    apiculteur_id : Optional[int]
    created_at    : datetime

    class Config:
        from_attributes = True


# ── Login ─────────────────────────────────────────────────────────────────────

@router.post("/login", response_model=TokenOut)
async def login(
    form   : OAuth2PasswordRequestForm = Depends(),
    session: AsyncSession              = Depends(get_session),
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
        "apiculteur_id": user.apiculteur_id,   # ← key addition
    })

    return TokenOut(
        access_token  = token,
        role          = user.role.value,
        email         = user.email,
        user_id       = user.id,
        apiculteur_id = user.apiculteur_id,
    )


# ── User CRUD (admin/superuser) ───────────────────────────────────────────────

@router.get("/users", response_model=list[UserOut])
async def list_users(
    session: AsyncSession = Depends(get_session),
    current: dict         = Depends(require_role("admin")),
):
    rows = (await session.execute(select(User).order_by(User.created_at.desc()))).scalars().all()
    return rows


@router.post("/users", response_model=UserOut, status_code=201)
async def create_user(
    payload: UserCreate,
    session: AsyncSession = Depends(get_session),
    current: dict         = Depends(require_role("admin")),
):
    existing = (await session.execute(select(User).where(User.email == payload.email))).scalars().first()
    if existing:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")

    user = User(
        email           = payload.email,
        hashed_password = hash_password(payload.password),
        role            = UserRole(payload.role),
        apiculteur_id   = payload.apiculteur_id,
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
    current: dict         = Depends(get_current_user),
):
    user = (await session.execute(select(User).where(User.id == user_id))).scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    if payload.email:         user.email           = payload.email
    if payload.password:      user.hashed_password = hash_password(payload.password)
    if payload.role:          user.role            = UserRole(payload.role)
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
    current: dict         = Depends(require_role("admin")),
):
    user = (await session.execute(select(User).where(User.id == user_id))).scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    await session.delete(user)
    await session.commit()