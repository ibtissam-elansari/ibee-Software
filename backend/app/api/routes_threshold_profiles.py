from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.engine         import get_session
from app.models.models     import HiveThreshold, Hive, ThresholdProfile
from app.core.dependencies import get_current_user, require_min_role
from app.core.thresholds   import GLOBAL_DEFAULTS

router = APIRouter()


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


# ── Schemas ───────────────────────────────────────────────────────────────────

class ThresholdProfileIn(BaseModel):
    name           : str
    temp_attention : Optional[float] = None
    temp_urgente   : Optional[float] = None
    hum_attention  : Optional[float] = None
    hum_urgente    : Optional[float] = None
    battery_v      : Optional[float] = None
    sound_level    : Optional[int]   = None
    weight_drop_kg : Optional[float] = None


class ThresholdProfileOut(BaseModel):
    id             : int
    apiculteur_id  : int
    name           : str
    temp_attention : Optional[float]
    temp_urgente   : Optional[float]
    hum_attention  : Optional[float]
    hum_urgente    : Optional[float]
    battery_v      : Optional[float]
    sound_level    : Optional[int]
    weight_drop_kg : Optional[float]
    created_at     : datetime
    updated_at     : datetime

    model_config = {"from_attributes": True}


class AssignBody(BaseModel):
    hive_ids : list[int]


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _get_profile_or_404(profile_id: int, session: AsyncSession) -> ThresholdProfile:
    p = await session.get(ThresholdProfile, profile_id)
    if not p:
        raise HTTPException(404, "Profil introuvable")
    return p


async def _get_hive_or_404(hive_id: int, session: AsyncSession) -> Hive:
    hive = (await session.execute(
        select(Hive).where(Hive.id == hive_id, Hive.deleted_at.is_(None))
    )).scalars().first()
    if not hive:
        raise HTTPException(404, f"Ruche {hive_id} introuvable")
    return hive


def _check_apiculteur_access(current: dict, apiculteur_id: int) -> None:
    """Admin can only touch profiles of their own apiculteur."""
    if current["role"] == "superuser":
        return
    if current.get("apiculteur_id") != apiculteur_id:
        raise HTTPException(403, "Accès refusé")


# ── CRUD ──────────────────────────────────────────────────────────────────────

@router.get(
    "/apiculteurs/{apiculteur_id}/threshold-profiles",
    response_model=list[ThresholdProfileOut],
)
async def list_profiles(
    apiculteur_id : int,
    session       : AsyncSession = Depends(get_session),
    current       : dict         = Depends(get_current_user),
):
    _check_apiculteur_access(current, apiculteur_id)
    rows = (await session.execute(
        select(ThresholdProfile)
        .where(ThresholdProfile.apiculteur_id == apiculteur_id)
        .order_by(ThresholdProfile.created_at)
    )).scalars().all()
    return rows


@router.post(
    "/apiculteurs/{apiculteur_id}/threshold-profiles",
    response_model=ThresholdProfileOut,
    status_code=201,
)
async def create_profile(
    apiculteur_id : int,
    body          : ThresholdProfileIn,
    session       : AsyncSession = Depends(get_session),
    current       : dict         = Depends(require_min_role("admin")),
):
    _check_apiculteur_access(current, apiculteur_id)
    profile = ThresholdProfile(apiculteur_id=apiculteur_id, **body.model_dump())
    session.add(profile)
    await session.commit()
    await session.refresh(profile)
    return profile


@router.put(
    "/threshold-profiles/{profile_id}",
    response_model=ThresholdProfileOut,
)
async def update_profile(
    profile_id : int,
    body       : ThresholdProfileIn,
    session    : AsyncSession = Depends(get_session),
    current    : dict         = Depends(require_min_role("admin")),
):
    profile = await _get_profile_or_404(profile_id, session)
    _check_apiculteur_access(current, profile.apiculteur_id)

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    profile.updated_at = _utcnow()
    session.add(profile)
    await session.commit()
    await session.refresh(profile)
    return profile


@router.delete("/threshold-profiles/{profile_id}", status_code=204)
async def delete_profile(
    profile_id : int,
    session    : AsyncSession = Depends(get_session),
    current    : dict         = Depends(require_min_role("admin")),
):
    profile = await _get_profile_or_404(profile_id, session)
    _check_apiculteur_access(current, profile.apiculteur_id)

    # Clear the FK on hives that referenced this profile
    # (HiveThreshold rows stay intact — thresholds survive profile deletion)
    hives = (await session.execute(
        select(Hive).where(Hive.threshold_profile_id == profile_id)
    )).scalars().all()
    for h in hives:
        h.threshold_profile_id = None
        session.add(h)

    await session.delete(profile)
    await session.commit()


# ── Assignment ────────────────────────────────────────────────────────────────

@router.post("/threshold-profiles/{profile_id}/assign")
async def assign_profile(
    profile_id : int,
    body       : AssignBody,
    session    : AsyncSession = Depends(get_session),
    current    : dict         = Depends(require_min_role("admin")),
):
    profile = await _get_profile_or_404(profile_id, session)
    _check_apiculteur_access(current, profile.apiculteur_id)

    profile_values = {
        k: v for k, v in {
            "temp_attention": profile.temp_attention,
            "temp_urgente"  : profile.temp_urgente,
            "hum_attention" : profile.hum_attention,
            "hum_urgente"   : profile.hum_urgente,
            "battery_v"     : profile.battery_v,
            "sound_level"   : profile.sound_level,
            "weight_drop_kg": profile.weight_drop_kg,
        }.items() if v is not None
    }

    assigned = 0
    for hive_id in body.hive_ids:
        hive = await _get_hive_or_404(hive_id, session)

        # Upsert HiveThreshold — start from global defaults if no row yet
        row = (await session.execute(
            select(HiveThreshold).where(HiveThreshold.hive_id == hive_id)
        )).scalars().first()

        if row is None:
            row = HiveThreshold(
                hive_id        = hive_id,
                temp_attention = GLOBAL_DEFAULTS.temp_attention,
                temp_urgente   = GLOBAL_DEFAULTS.temp_urgente,
                hum_attention  = GLOBAL_DEFAULTS.hum_attention,
                hum_urgente    = GLOBAL_DEFAULTS.hum_urgente,
                battery_v      = GLOBAL_DEFAULTS.battery_v,
                sound_level    = GLOBAL_DEFAULTS.sound_level,
                weight_drop_kg = None,
            )

        for field, value in profile_values.items():
            setattr(row, field, value)

        row.updated_at    = _utcnow()
        row.updated_by_id = current["user_id"]
        session.add(row)

        hive.threshold_profile_id = profile_id
        session.add(hive)
        assigned += 1

    await session.commit()
    return {"assigned": assigned}


@router.delete("/threshold-profiles/{profile_id}/assign")
async def unassign_profile(
    profile_id : int,
    body       : AssignBody,
    session    : AsyncSession = Depends(get_session),
    current    : dict         = Depends(require_min_role("admin")),
):
    profile = await _get_profile_or_404(profile_id, session)
    _check_apiculteur_access(current, profile.apiculteur_id)

    removed = 0
    for hive_id in body.hive_ids:
        hive = await _get_hive_or_404(hive_id, session)
        if hive.threshold_profile_id != profile_id:
            continue  # a different profile owns this hive — skip

        row = (await session.execute(
            select(HiveThreshold).where(HiveThreshold.hive_id == hive_id)
        )).scalars().first()
        if row:
            await session.delete(row)

        hive.threshold_profile_id = None
        session.add(hive)
        removed += 1

    await session.commit()
    return {"removed": removed}