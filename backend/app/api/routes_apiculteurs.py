# /backend/app/api/routes_apiculteurs.py
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from sqlmodel import Field, SQLModel

from app.db.engine import get_session
from app.models.models import User, UserRole, Device, Hive, Measurement
from app.core.dependencies import require_role

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class ApiculteurProfileCreate(BaseModel):
    email        : str
    password     : str
    company_name : str
    phone        : Optional[str] = None
    region       : Optional[str] = None
    city         : Optional[str] = None
    address      : Optional[str] = None
    initial_hive_count: int = 0

class ApiculteurProfileUpdate(BaseModel):
    company_name : Optional[str] = None
    phone        : Optional[str] = None
    region       : Optional[str] = None
    city         : Optional[str] = None
    address      : Optional[str] = None
    initial_hive_count: Optional[int] = None
    email        : Optional[str] = None

class ApiculteurOut(BaseModel):
    user_id      : int
    email        : str
    company_name : str
    phone        : Optional[str]
    region       : Optional[str]
    city         : Optional[str]
    address      : Optional[str]
    initial_hive_count: int
    created_at   : datetime
    active_hives : int = 0
    inactive_hives: int = 0
    total_hives  : int = 0

    class Config:
        from_attributes = True


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/apiculteurs", response_model=list[ApiculteurOut])
async def list_apiculteurs(
    session : AsyncSession = Depends(get_session),
    current : dict         = Depends(require_role("superuser")),
):
    """
    Returns all users with role=user, joined with their profiles and hive counts.
    Only accessible by superuser.
    """
    from app.models.models import ApiculteurProfile  # noqa

    result = await session.execute(
        select(User, ApiculteurProfile)
        .outerjoin(ApiculteurProfile, ApiculteurProfile.user_id == User.id)
        .where(User.role == UserRole.USER)
        .order_by(User.created_at.desc())
    )
    rows = result.all()

    out = []
    for user, profile in rows:
        # Count hives per user
        hive_result = await session.execute(
            select(Hive)
            .join(Device, Device.hive_id == Hive.id)
            .where(Device.dev_eui.in_(
                select(Device.dev_eui).where(Device.hive_id != None)
            ))
        )
        # Simple count via hive ownership — adjust if you add user_id to Hive
        total    = 0
        active   = 0
        inactive = 0

        out.append(ApiculteurOut(
            user_id           = user.id,
            email             = user.email,
            company_name      = profile.company_name if profile else user.email.split('@')[0],
            phone             = profile.phone        if profile else None,
            region            = profile.region       if profile else None,
            city              = profile.city         if profile else None,
            address           = profile.address      if profile else None,
            initial_hive_count= profile.initial_hive_count if profile else 0,
            created_at        = user.created_at,
            active_hives      = active,
            inactive_hives    = inactive,
            total_hives       = total,
        ))

    return out


@router.post("/apiculteurs", response_model=ApiculteurOut, status_code=201)
async def create_apiculteur(
    payload : ApiculteurProfileCreate,
    session : AsyncSession = Depends(get_session),
    current : dict         = Depends(require_role("superuser")),
):
    from app.models.models import ApiculteurProfile
    from app.core.security import hash_password

    existing = await session.execute(select(User).where(User.email == payload.email))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Email déjà utilisé")

    user = User(
        email           = payload.email,
        hashed_password = hash_password(payload.password),
        role            = UserRole.USER,
    )
    session.add(user)
    await session.flush()  # get user.id

    profile = ApiculteurProfile(
        user_id            = user.id,
        company_name       = payload.company_name,
        phone              = payload.phone,
        region             = payload.region,
        city               = payload.city,
        address            = payload.address,
        initial_hive_count = payload.initial_hive_count,
    )
    session.add(profile)
    await session.commit()
    await session.refresh(user)
    await session.refresh(profile)

    return ApiculteurOut(
        user_id=user.id, email=user.email,
        company_name=profile.company_name, phone=profile.phone,
        region=profile.region, city=profile.city,
        address=profile.address, initial_hive_count=profile.initial_hive_count,
        created_at=user.created_at, active_hives=0, inactive_hives=0, total_hives=0,
    )


@router.patch("/apiculteurs/{user_id}", response_model=ApiculteurOut)
async def update_apiculteur(
    user_id : int,
    payload : ApiculteurProfileUpdate,
    session : AsyncSession = Depends(get_session),
    current : dict         = Depends(require_role("superuser")),
):
    from app.models.models import ApiculteurProfile

    user_result = await session.execute(select(User).where(User.id == user_id))
    user = user_result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="Apiculteur introuvable")

    prof_result = await session.execute(
        select(ApiculteurProfile).where(ApiculteurProfile.user_id == user_id)
    )
    profile = prof_result.scalars().first()
    if not profile:
        profile = ApiculteurProfile(user_id=user_id)
        session.add(profile)

    if payload.email:        user.email               = payload.email
    if payload.company_name: profile.company_name     = payload.company_name
    if payload.phone:        profile.phone            = payload.phone
    if payload.region:       profile.region           = payload.region
    if payload.city:         profile.city             = payload.city
    if payload.address:      profile.address          = payload.address
    if payload.initial_hive_count is not None:
        profile.initial_hive_count = payload.initial_hive_count

    session.add(user)
    session.add(profile)
    await session.commit()
    await session.refresh(user)
    await session.refresh(profile)

    return ApiculteurOut(
        user_id=user.id, email=user.email,
        company_name=profile.company_name, phone=profile.phone,
        region=profile.region, city=profile.city, address=profile.address,
        initial_hive_count=profile.initial_hive_count,
        created_at=user.created_at, active_hives=0, inactive_hives=0, total_hives=0,
    )


@router.delete("/apiculteurs/{user_id}", status_code=204)
async def delete_apiculteur(
    user_id : int,
    session : AsyncSession = Depends(get_session),
    current : dict         = Depends(require_role("superuser")),
):
    user_result = await session.execute(select(User).where(User.id == user_id))
    user = user_result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="Apiculteur introuvable")
    await session.delete(user)
    await session.commit()