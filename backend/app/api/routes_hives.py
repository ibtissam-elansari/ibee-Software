# routes_hives.py:

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
    DeviceCreate,
    DeviceOut,
    HistoryPointOut,
    HiveCreate,
    HiveOut,
    HiveStatsOut,
    HiveUpdate,
    MeasurementOut,
)
from app.core.settings import settings
from app.db.engine import get_session
from app.models.models import Device, Hive, Measurement

router = APIRouter()

_sse_latest: dict[int, dict] = {}


def update_sse_cache(hive_id: int, data: dict) -> None:
    _sse_latest[hive_id] = data


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


async def _get_hive_or_404(hive_id: int, session: AsyncSession) -> Hive:
    hive = await session.get(Hive, hive_id)
    if not hive:
        raise HTTPException(status_code=404, detail="hive not found")
    return hive


# ── HIVE CRUD ────────────────────────────────────────────────────────────────

@router.post("/hives", response_model=HiveOut, status_code=201)
async def create_hive(
    payload: HiveCreate,
    session: AsyncSession = Depends(get_session),
):
    hive = Hive(**payload.model_dump())
    session.add(hive)
    await session.commit()
    await session.refresh(hive)
    return hive


@router.get("/hives", response_model=list[HiveOut])
async def list_hives(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Hive).order_by(Hive.created_at))
    return result.scalars().all()


@router.get("/hives/{hive_id}", response_model=HiveOut)
async def get_hive(hive_id: int, session: AsyncSession = Depends(get_session)):
    return await _get_hive_or_404(hive_id, session)


# @router.patch("/hives/{hive_id}", response_model=HiveOut)
# async def update_hive(
#     hive_id: int,
#     payload: HiveUpdate,
#     session: AsyncSession = Depends(get_session),
# ):
#     hive = await _get_hive_or_404(hive_id, session)
#     for field, value in payload.model_dump(exclude_unset=True).items():
#         setattr(hive, field, value)
#     session.add(hive)
#     await session.commit()
#     await session.refresh(hive)
#     return hive


# @router.delete("/hives/{hive_id}", status_code=204)
# async def delete_hive(hive_id: int, session: AsyncSession = Depends(get_session)):
#     hive = await _get_hive_or_404(hive_id, session)
#     await session.delete(hive)
#     await session.commit()


# ── HIVE MEASUREMENTS ────────────────────────────────────────────────────────

@router.get("/hives/{hive_id}/latest", response_model=MeasurementOut)
async def hive_latest(hive_id: int, session: AsyncSession = Depends(get_session)):
    await _get_hive_or_404(hive_id, session)

    result = await session.execute(
        select(Measurement, Device)
        .join(Device, Device.id == Measurement.device_id)
        .where(Device.hive_id == hive_id)
        .order_by(Measurement.ts.desc())
        .limit(1)
    )
    row = result.first()

    if not row:
        raise HTTPException(status_code=404, detail="no measurements yet")

    measurement, device = row
    return MeasurementOut(
        id             = measurement.id,
        ts             = measurement.ts,
        device_dev_eui = device.dev_eui,
        temperature_c  = measurement.temperature_c,
        humidity_pct   = measurement.humidity_pct,
        sound_level    = measurement.sound_level,
        door_open      = measurement.door_open,
        gps_lat        = measurement.gps_lat,
        gps_lng        = measurement.gps_lng,
        battery_v      = measurement.battery_v,
        rssi           = measurement.rssi,
        snr            = measurement.snr,
    )


@router.get("/hives/{hive_id}/history", response_model=list[HistoryPointOut])
async def hive_history(
    hive_id : int,
    limit   : int                = Query(default=200, ge=1, le=5000),
    start   : Optional[datetime] = Query(default=None),
    end     : Optional[datetime] = Query(default=None),
    session : AsyncSession       = Depends(get_session),
):
    await _get_hive_or_404(hive_id, session)

    q = (
        select(Measurement)
        .join(Device, Device.id == Measurement.device_id)
        .where(Device.hive_id == hive_id)
    )
    if start:
        q = q.where(Measurement.ts >= start)
    if end:
        q = q.where(Measurement.ts <= end)

    result = await session.execute(q.order_by(Measurement.ts.desc()).limit(limit))
    rows   = result.scalars().all()
    return list(reversed(rows))


@router.get("/hives/{hive_id}/stats", response_model=HiveStatsOut)
async def hive_stats(hive_id: int, session: AsyncSession = Depends(get_session)):
    await _get_hive_or_404(hive_id, session)

    result = await session.execute(
        select(
            func.count(Measurement.id)               .label("total"),
            func.avg(Measurement.temperature_c)      .label("avg_temp"),
            func.avg(Measurement.humidity_pct)       .label("avg_hum"),
            func.min(Measurement.battery_v)          .label("min_batt"),
            func.max(Measurement.battery_v)          .label("max_batt"),
            func.sum(Measurement.sound_level)        .label("sound_sum"),
            func.sum(Measurement.door_open.cast(int)).label("door_sum"),
            func.min(Measurement.ts)                 .label("first_seen"),
            func.max(Measurement.ts)                 .label("last_seen"),
        )
        .join(Device, Device.id == Measurement.device_id)
        .where(Device.hive_id == hive_id)
    )
    row = result.one()

    return HiveStatsOut(
        hive_id            = hive_id,
        total_measurements = row.total        or 0,
        avg_temperature_c  = round(row.avg_temp, 2) if row.avg_temp else None,
        avg_humidity_pct   = round(row.avg_hum,  2) if row.avg_hum  else None,
        min_battery_v      = row.min_batt,
        max_battery_v      = row.max_batt,
        sound_events       = row.sound_sum    or 0,
        door_open_events   = row.door_sum     or 0,
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
async def hive_stream(hive_id: int):
    return StreamingResponse(
        _sse_generator(hive_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control"    : "no-cache",
            "X-Accel-Buffering": "no",
            "Connection"       : "keep-alive",
        },
    )


# ── DEVICE ROUTES ────────────────────────────────────────────────────────────

@router.post("/devices", response_model=DeviceOut, status_code=201)
async def create_or_attach_device(
    payload : DeviceCreate,
    session : AsyncSession = Depends(get_session),
):
    dev_eui = payload.dev_eui.lower()
    result  = await session.execute(select(Device).where(Device.dev_eui == dev_eui))
    device  = result.scalars().first()

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
):
    q = select(Device).order_by(Device.created_at)
    if hive_id is not None:
        q = q.where(Device.hive_id == hive_id)
    result = await session.execute(q)
    return result.scalars().all()


@router.get("/devices/{dev_eui}", response_model=DeviceOut)
async def get_device(dev_eui: str, session: AsyncSession = Depends(get_session)):
    result = await session.execute(
        select(Device).where(Device.dev_eui == dev_eui.lower())
    )
    device = result.scalars().first()
    if not device:
        raise HTTPException(status_code=404, detail="device not found")
    return device


@router.get("/devices/{dev_eui}/history", response_model=list[HistoryPointOut])
async def device_history(
    dev_eui : str,
    start   : Optional[datetime] = Query(default=None),
    end     : Optional[datetime] = Query(default=None),
    limit   : int                = Query(default=200, ge=1, le=5000),
    session : AsyncSession       = Depends(get_session),
):
    result = await session.execute(
        select(Device).where(Device.dev_eui == dev_eui.lower())
    )
    device = result.scalars().first()
    if not device:
        raise HTTPException(status_code=404, detail="device not found")

    q = select(Measurement).where(Measurement.device_id == device.id)
    if start:
        q = q.where(Measurement.ts >= start)
    if end:
        q = q.where(Measurement.ts <= end)

    result = await session.execute(q.order_by(Measurement.ts.desc()).limit(limit))
    rows   = result.scalars().all()
    return list(reversed(rows))