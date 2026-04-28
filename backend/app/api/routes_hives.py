from __future__ import annotations

import asyncio
import json
from datetime import datetime, timezone
from typing import AsyncGenerator, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select

from app.api.schemas import (
    DeviceCreate, DeviceOut,
    HistoryPointOut,
    HiveCreate, HiveOut, HiveStatsOut, HiveUpdate,
    HiveThresholdOut, HiveThresholdUpdate,
    MeasurementOut,
)
from app.core.dependencies import (
    get_current_user,
    require_min_role,
    require_hive_access,
)
from app.core.settings import settings
from app.core.thresholds import get_thresholds_sync, GLOBAL_DEFAULTS
from app.db.engine import get_session
from app.models.models import Device, Hive, HiveThreshold, Measurement

router = APIRouter()

_sse_latest: dict[int, dict] = {}


def update_sse_cache(hive_id: int, data: dict) -> None:
    _sse_latest[hive_id] = data


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


async def _get_hive_or_404(hive_id: int, session: AsyncSession) -> Hive:
    hive = (await session.execute(
        select(Hive).where(Hive.id == hive_id, Hive.deleted_at.is_(None))
    )).scalars().first()
    if not hive:
        raise HTTPException(status_code=404, detail="Ruche introuvable")
    return hive


# ── HIVE CRUD (superuser only for writes) ────────────────────────────────────

@router.post("/hives", response_model=HiveOut, status_code=201)
async def create_hive(
    payload : HiveCreate,
    session : AsyncSession = Depends(get_session),
    current : dict         = Depends(require_min_role("superuser")),
):
    hive = Hive(**payload.model_dump())
    session.add(hive)
    await session.commit()
    await session.refresh(hive)
    return hive


@router.get("/hives", response_model=list[HiveOut])
async def list_hives(
    session : AsyncSession = Depends(get_session),
    current : dict         = Depends(get_current_user),
):
    q = select(Hive).where(Hive.deleted_at.is_(None)).order_by(Hive.created_at)

    if current["role"] != "superuser":
        q = q.where(Hive.apiculteur_id == current["apiculteur_id"])

    return (await session.execute(q)).scalars().all()


@router.get("/hives/{hive_id}", response_model=HiveOut)
async def get_hive(
    hive_id : int,
    session : AsyncSession = Depends(get_session),
    current : dict         = Depends(get_current_user),
):
    hive = await _get_hive_or_404(hive_id, session)
    require_hive_access(current, hive)
    return hive


@router.patch("/hives/{hive_id}", response_model=HiveOut)
async def update_hive(
    hive_id : int,
    payload : HiveUpdate,
    session : AsyncSession = Depends(get_session),
    current : dict         = Depends(require_min_role("superuser")),
):
    hive = await _get_hive_or_404(hive_id, session)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(hive, field, value)
    session.add(hive)
    await session.commit()
    await session.refresh(hive)
    return hive


@router.delete("/hives/{hive_id}", status_code=204)
async def delete_hive(
    hive_id : int,
    session : AsyncSession = Depends(get_session),
    current : dict         = Depends(require_min_role("superuser")),
):
    hive = await _get_hive_or_404(hive_id, session)
    hive.deleted_at = _utcnow()
    hive.is_active  = False
    session.add(hive)
    await session.commit()


# ── THRESHOLD MANAGEMENT ─────────────────────────────────────────────────────

@router.get("/hives/{hive_id}/thresholds", response_model=HiveThresholdOut)
async def get_hive_thresholds(
    hive_id : int,
    session : AsyncSession = Depends(get_session),
    current : dict         = Depends(require_min_role("admin")),
):
    hive = await _get_hive_or_404(hive_id, session)
    require_hive_access(current, hive)

    row = (await session.execute(
        select(HiveThreshold).where(HiveThreshold.hive_id == hive_id)
    )).scalars().first()

    if row is None:
        return HiveThresholdOut(
            hive_id        = hive_id,
            temp_attention = GLOBAL_DEFAULTS.temp_attention,
            temp_urgente   = GLOBAL_DEFAULTS.temp_urgente,
            hum_attention  = GLOBAL_DEFAULTS.hum_attention,
            hum_urgente    = GLOBAL_DEFAULTS.hum_urgente,
            battery_v      = GLOBAL_DEFAULTS.battery_v,
            sound_level    = GLOBAL_DEFAULTS.sound_level,
            weight_drop_kg = None,   # not set by default
            updated_at     = hive.created_at,
        )
    return row


@router.put("/hives/{hive_id}/thresholds", response_model=HiveThresholdOut)
async def upsert_hive_thresholds(
    hive_id : int,
    payload : HiveThresholdUpdate,
    session : AsyncSession = Depends(get_session),
    current : dict         = Depends(require_min_role("admin")),
):
    hive = await _get_hive_or_404(hive_id, session)
    require_hive_access(current, hive)

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

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(row, field, value)

    row.updated_at    = _utcnow()
    row.updated_by_id = current["user_id"]

    session.add(row)
    await session.commit()
    await session.refresh(row)
    return row


@router.delete("/hives/{hive_id}/thresholds", status_code=204)
async def reset_hive_thresholds(
    hive_id : int,
    session : AsyncSession = Depends(get_session),
    current : dict         = Depends(require_min_role("admin")),
):
    hive = await _get_hive_or_404(hive_id, session)
    require_hive_access(current, hive)

    row = (await session.execute(
        select(HiveThreshold).where(HiveThreshold.hive_id == hive_id)
    )).scalars().first()

    if row:
        await session.delete(row)
        await session.commit()


# ── MEASUREMENTS ──────────────────────────────────────────────────────────────

@router.get("/hives/{hive_id}/latest", response_model=MeasurementOut)
async def hive_latest(
    hive_id : int,
    session : AsyncSession = Depends(get_session),
    current : dict         = Depends(get_current_user),
):
    hive = await _get_hive_or_404(hive_id, session)
    require_hive_access(current, hive)

    result = await session.execute(
        select(Measurement, Device)
        .join(Device, Device.id == Measurement.device_id)
        .where(Device.hive_id == hive_id)
        .order_by(Measurement.ts.desc())
        .limit(1)
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Aucune mesure disponible")

    m, device = row
    return MeasurementOut(
        id             = m.id,
        ts             = m.ts,
        device_dev_eui = device.dev_eui,
        temperature_c  = m.temperature_c,
        humidity_pct   = m.humidity_pct,
        sound_level    = m.sound_level,
        door_open      = m.door_open,
        weight_kg      = m.weight_kg,       # NEW
        gps_lat        = m.gps_lat,
        gps_lng        = m.gps_lng,
        battery_v      = m.battery_v,
        rssi           = m.rssi,
        snr            = m.snr,
    )


@router.get("/hives/{hive_id}/history", response_model=list[HistoryPointOut])
async def hive_history(
    hive_id : int,
    limit   : int                = Query(default=200, ge=1, le=5000),
    start   : Optional[datetime] = Query(default=None),
    end     : Optional[datetime] = Query(default=None),
    session : AsyncSession       = Depends(get_session),
    current : dict               = Depends(get_current_user),
):
    hive = await _get_hive_or_404(hive_id, session)
    require_hive_access(current, hive)

    q = (
        select(Measurement)
        .join(Device, Device.id == Measurement.device_id)
        .where(Device.hive_id == hive_id)
    )
    if start:
        q = q.where(Measurement.ts >= start)
    if end:
        q = q.where(Measurement.ts <= end)

    rows = (await session.execute(
        q.order_by(Measurement.ts.desc()).limit(limit)
    )).scalars().all()
    return list(reversed(rows))


@router.get("/hives/{hive_id}/stats", response_model=HiveStatsOut)
async def hive_stats(
    hive_id : int,
    session : AsyncSession = Depends(get_session),
    current : dict         = Depends(get_current_user),
):
    hive = await _get_hive_or_404(hive_id, session)
    require_hive_access(current, hive)

    result = await session.execute(
        select(
            func.count(Measurement.id)               .label("total"),
            func.avg(Measurement.temperature_c)      .label("avg_temp"),
            func.avg(Measurement.humidity_pct)       .label("avg_hum"),
            func.min(Measurement.battery_v)          .label("min_batt"),
            func.max(Measurement.battery_v)          .label("max_batt"),
            func.sum(Measurement.sound_level)        .label("sound_sum"),
            func.sum(Measurement.door_open.cast(int)).label("door_sum"),
            # Weight aggregates (NEW)
            func.avg(Measurement.weight_kg)          .label("avg_weight"),
            func.min(Measurement.weight_kg)          .label("min_weight"),
            func.max(Measurement.weight_kg)          .label("max_weight"),
            func.min(Measurement.ts)                 .label("first_seen"),
            func.max(Measurement.ts)                 .label("last_seen"),
        )
        .join(Device, Device.id == Measurement.device_id)
        .where(Device.hive_id == hive_id)
    )
    row = result.one()

    return HiveStatsOut(
        hive_id            = hive_id,
        total_measurements = row.total or 0,
        avg_temperature_c  = round(row.avg_temp,   2) if row.avg_temp   else None,
        avg_humidity_pct   = round(row.avg_hum,    2) if row.avg_hum    else None,
        min_battery_v      = row.min_batt,
        max_battery_v      = row.max_batt,
        sound_events       = row.sound_sum  or 0,
        door_open_events   = row.door_sum   or 0,
        avg_weight_kg      = round(row.avg_weight, 3) if row.avg_weight else None,   # NEW
        min_weight_kg      = round(row.min_weight, 3) if row.min_weight else None,   # NEW
        max_weight_kg      = round(row.max_weight, 3) if row.max_weight else None,   # NEW
        first_seen         = row.first_seen,
        last_seen          = row.last_seen,
    )


# ── SSE LIVE STREAM ──────────────────────────────────────────────────────────

async def _sse_generator(hive_id: int) -> AsyncGenerator[str, None]:
    last_sent: Optional[dict] = None

    current = _sse_latest.get(hive_id)
    if current:
        last_sent = current
        yield f"data: {json.dumps(current, default=str)}\n\n"

    while True:
        await asyncio.sleep(settings.sse_poll_interval)
        current = _sse_latest.get(hive_id)
        if current and current is not last_sent:
            last_sent = current
            yield f"data: {json.dumps(current, default=str)}\n\n"
        else:
            yield ": keep-alive\n\n"


@router.get("/hives/{hive_id}/stream")
async def hive_stream(
    hive_id : int,
    session : AsyncSession = Depends(get_session),
    current : dict         = Depends(get_current_user),
):
    hive = await _get_hive_or_404(hive_id, session)
    require_hive_access(current, hive)

    return StreamingResponse(
        _sse_generator(hive_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control"    : "no-cache",
            "X-Accel-Buffering": "no",
            "Connection"       : "keep-alive",
        },
    )


# ── DEVICE ROUTES (superuser only) ───────────────────────────────────────────

@router.post("/devices", response_model=DeviceOut, status_code=201)
async def create_or_attach_device(
    payload : DeviceCreate,
    session : AsyncSession = Depends(get_session),
    current : dict         = Depends(require_min_role("superuser")),
):
    dev_eui = payload.dev_eui.lower()
    device  = (await session.execute(
        select(Device).where(Device.dev_eui == dev_eui)
    )).scalars().first()

    if device is None:
        device = Device(dev_eui=dev_eui, hive_id=payload.hive_id)
        session.add(device)
    else:
        device.hive_id = payload.hive_id
        session.add(device)

    await session.commit()
    await session.refresh(device)
    return device


@router.get("/devices", response_model=list[DeviceOut])
async def list_devices(
    hive_id : Optional[int] = Query(default=None),
    session : AsyncSession  = Depends(get_session),
    current : dict          = Depends(require_min_role("superuser")),
):
    q = select(Device).order_by(Device.created_at)
    if hive_id is not None:
        q = q.where(Device.hive_id == hive_id)
    return (await session.execute(q)).scalars().all()


@router.get("/devices/{dev_eui}", response_model=DeviceOut)
async def get_device(
    dev_eui : str,
    session : AsyncSession = Depends(get_session),
    current : dict         = Depends(require_min_role("superuser")),
):
    device = (await session.execute(
        select(Device).where(Device.dev_eui == dev_eui.lower())
    )).scalars().first()
    if not device:
        raise HTTPException(status_code=404, detail="Appareil introuvable")
    return device


@router.get("/devices/{dev_eui}/history", response_model=list[HistoryPointOut])
async def device_history(
    dev_eui : str,
    start   : Optional[datetime] = Query(default=None),
    end     : Optional[datetime] = Query(default=None),
    limit   : int                = Query(default=200, ge=1, le=5000),
    session : AsyncSession       = Depends(get_session),
    current : dict               = Depends(require_min_role("superuser")),
):
    device = (await session.execute(
        select(Device).where(Device.dev_eui == dev_eui.lower())
    )).scalars().first()
    if not device:
        raise HTTPException(status_code=404, detail="Appareil introuvable")

    q = select(Measurement).where(Measurement.device_id == device.id)
    if start:
        q = q.where(Measurement.ts >= start)
    if end:
        q = q.where(Measurement.ts <= end)

    rows = (await session.execute(
        q.order_by(Measurement.ts.desc()).limit(limit)
    )).scalars().all()
    return list(reversed(rows))