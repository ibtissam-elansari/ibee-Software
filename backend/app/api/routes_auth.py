# /backend/app/api/routes_auth.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.db.engine import get_session
from app.models.models import User, UserRole
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
)

router = APIRouter()


# ── SCHEMAS ───────────────────────────────────────────────────

class RegisterInput(BaseModel):
    email: str
    password: str
    role: UserRole = UserRole.USER


class LoginInput(BaseModel):
    email: str
    password: str


# ── REGISTER ──────────────────────────────────────────────────

@router.post("/register")
async def register(
    payload: RegisterInput,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(User).where(User.email == payload.email))
    existing = result.scalars().first()

    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email           = payload.email,
        hashed_password = hash_password(payload.password),
        role            = UserRole.USER,   # hardcoded, ignore payload.role
    )

    session.add(user)
    await session.commit()
    await session.refresh(user)

    return {
        "id": user.id,
        "email": user.email,
        "role": user.role,
    }


# ── LOGIN ─────────────────────────────────────────────────────

@router.post("/login")
async def login(
    payload: LoginInput,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(User).where(User.email == payload.email))
    user = result.scalars().first()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({
        "sub": user.email,
        "role": user.role,
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
    }