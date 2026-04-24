# /backend/app/api/routes_apiculteurs.py
from __future__ import annotations
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, Integer
from pydantic import BaseModel

from app.db.engine import get_session
from app.models.models import Apiculteur, Hive, Device, Measurement, HiveThreshold
from app.core.dependencies import get_current_user, require_role
from app.api.schemas import HiveOut

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class ApiculteurCreate(BaseModel):
    company_name : str
    email        : Optional[str] = None
    phone        : Optional[str] = None
    region       : Optional[str] = None
    city         : Optional[str] = None
    address      : Optional[str] = None

class ApiculteurUpdate(BaseModel):
    company_name : Optional[str]  = None
    email        : Optional[str]  = None
    phone        : Optional[str]  = None
    region       : Optional[str]  = None
    city         : Optional[str]  = None
    address      : Optional[str]  = None
    is_active    : Optional[bool] = None

class ApiculteurOut(BaseModel):
    id            : int
    company_name  : str
    email         : Optional[str]
    phone         : Optional[str]
    region        : Optional[str]
    city          : Optional[str]
    address       : Optional[str]
    is_active     : bool
    created_at    : datetime
    active_hives  : int = 0
    inactive_hives: int = 0
    total_hives   : int = 0
    class Config:
        from_attributes = True


# ── Hive count helper ─────────────────────────────────────────────────────────

async def _hive_counts(session: AsyncSession, apiculteur_id: int) -> dict:
    r = await session.execute(
        select(
            func.count(Hive.id).label("total"),
            func.sum(Hive.is_active.cast(Integer)).label("active"),
        )
        .where(Hive.apiculteur_id == apiculteur_id)
        .where(Hive.deleted_at.is_(None))
    )
    row = r.one()
    total  = row.total  or 0
    active = int(row.active or 0)
    return {"total_hives": total, "active_hives": active, "inactive_hives": total - active}


# ── CRUD ──────────────────────────────────────────────────────────────────────

@router.get("/apiculteurs", response_model=list[ApiculteurOut])
async def list_apiculteurs(
    session: AsyncSession = Depends(get_session),
    current: dict         = Depends(get_current_user),
):
    # Non-superusers only see their own apiculteur
    if current["role"] != "superuser":
        apiculteur_id = current.get("apiculteur_id")
        if not apiculteur_id:
            return []
        a = (await session.execute(
            select(Apiculteur).where(Apiculteur.id == apiculteur_id)
        )).scalars().first()
        if not a:
            return []
        counts = await _hive_counts(session, a.id)
        return [ApiculteurOut(
            id=a.id, company_name=a.company_name, email=a.email,
            phone=a.phone, region=a.region, city=a.city,
            address=a.address, is_active=a.is_active, created_at=a.created_at,
            **counts,
        )]

    rows = (await session.execute(
        select(Apiculteur).order_by(Apiculteur.created_at.desc())
    )).scalars().all()
    out = []
    for a in rows:
        counts = await _hive_counts(session, a.id)
        out.append(ApiculteurOut(
            id=a.id, company_name=a.company_name, email=a.email,
            phone=a.phone, region=a.region, city=a.city,
            address=a.address, is_active=a.is_active, created_at=a.created_at,
            **counts,
        ))
    return out


@router.get("/apiculteurs/{apiculteur_id}", response_model=ApiculteurOut)
async def get_apiculteur(
    apiculteur_id: int,
    session: AsyncSession = Depends(get_session),
    current: dict         = Depends(get_current_user),
):
    if current["role"] != "superuser" and current.get("apiculteur_id") != apiculteur_id:
        raise HTTPException(status_code=403, detail="Accès refusé")

    a = (await session.execute(
        select(Apiculteur).where(Apiculteur.id == apiculteur_id)
    )).scalars().first()
    if not a:
        raise HTTPException(status_code=404, detail="Apiculteur introuvable")
    counts = await _hive_counts(session, a.id)
    return ApiculteurOut(
        id=a.id, company_name=a.company_name, email=a.email,
        phone=a.phone, region=a.region, city=a.city,
        address=a.address, is_active=a.is_active, created_at=a.created_at, **counts,
    )



@router.post("/apiculteurs", response_model=ApiculteurOut, status_code=201)
async def create_apiculteur(
    payload: ApiculteurCreate,
    session: AsyncSession = Depends(get_session),
    current: dict         = Depends(require_role("superuser")),
):
    a = Apiculteur(**payload.model_dump())
    session.add(a)
    await session.commit()
    await session.refresh(a)
    return ApiculteurOut(
        id=a.id, company_name=a.company_name, email=a.email,
        phone=a.phone, region=a.region, city=a.city,
        address=a.address, is_active=a.is_active, created_at=a.created_at,
        active_hives=0, inactive_hives=0, total_hives=0,
    )


@router.patch("/apiculteurs/{apiculteur_id}", response_model=ApiculteurOut)
async def update_apiculteur(
    apiculteur_id: int,
    payload: ApiculteurUpdate,
    session: AsyncSession = Depends(get_session),
    current: dict         = Depends(require_role("superuser")),
):
    a = (await session.execute(
        select(Apiculteur).where(Apiculteur.id == apiculteur_id)
    )).scalars().first()
    if not a:
        raise HTTPException(status_code=404, detail="Apiculteur introuvable")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(a, field, value)
    session.add(a)
    await session.commit()
    await session.refresh(a)
    counts = await _hive_counts(session, a.id)
    return ApiculteurOut(
        id=a.id, company_name=a.company_name, email=a.email,
        phone=a.phone, region=a.region, city=a.city,
        address=a.address, is_active=a.is_active, created_at=a.created_at, **counts,
    )


@router.delete("/apiculteurs/{apiculteur_id}", status_code=204)
async def delete_apiculteur(
    apiculteur_id: int,
    session: AsyncSession = Depends(get_session),
    current: dict         = Depends(require_role("superuser")),
):
    a = (await session.execute(
        select(Apiculteur).where(Apiculteur.id == apiculteur_id)
    )).scalars().first()
    if not a:
        raise HTTPException(status_code=404, detail="Apiculteur introuvable")
    await session.delete(a)
    await session.commit()


# ── Scoped hives ──────────────────────────────────────────────────────────────

@router.get("/apiculteurs/{apiculteur_id}/hives", response_model=list[HiveOut])
async def get_apiculteur_hives(
    apiculteur_id: int,
    session: AsyncSession = Depends(get_session),
    current: dict         = Depends(get_current_user),
):
    if current["role"] != "superuser" and current.get("apiculteur_id") != apiculteur_id:
        raise HTTPException(status_code=403, detail="Accès refusé")

    rows = (await session.execute(
        select(Hive)
        .where(Hive.apiculteur_id == apiculteur_id)
        .where(Hive.deleted_at.is_(None))
        .order_by(Hive.created_at)
    )).scalars().all()
    return rows


# ── Scoped notifications ──────────────────────────────────────────────────────

@router.get("/apiculteurs/{apiculteur_id}/notifications")
async def get_apiculteur_notifications(
    apiculteur_id: int,
    session: AsyncSession = Depends(get_session),
    current: dict         = Depends(get_current_user),
):
    if current["role"] != "superuser" and current.get("apiculteur_id") != apiculteur_id:
        raise HTTPException(status_code=403, detail="Accès refusé")

    from app.api.routes_notifications import _build_notifications

    latest_ids_subq = (
        select(func.max(Measurement.id).label("max_id"))
        .join(Device, Device.id == Measurement.device_id)
        .join(Hive,   Hive.id   == Device.hive_id)
        .where(Hive.apiculteur_id == apiculteur_id)
        .where(Hive.deleted_at.is_(None))
        .group_by(Device.hive_id)
        .scalar_subquery()
    )

    rows = (await session.execute(
        select(Measurement, Hive, HiveThreshold)
        .join(Device,         Device.id         == Measurement.device_id)
        .join(Hive,           Hive.id           == Device.hive_id)
        .outerjoin(HiveThreshold, HiveThreshold.hive_id == Hive.id)
        .where(Measurement.id.in_(latest_ids_subq))
        .order_by(Measurement.ts.desc())
    )).all()

    from app.core.thresholds import get_thresholds_sync
    notifications = []
    for m, hive, threshold_row in rows:
        t = get_thresholds_sync(threshold_row)
        notifications.extend(_build_notifications(m, hive.name, hive.id, t))
    notifications.sort(key=lambda n: n.ts, reverse=True)
    return notifications