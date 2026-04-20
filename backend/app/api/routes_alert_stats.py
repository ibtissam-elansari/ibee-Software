from __future__ import annotations

from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from pydantic import BaseModel

from app.db.engine import get_session
from app.models.models import Device, Hive, Measurement
from app.core.dependencies import get_current_user
from app.api.routes_notifications import THRESHOLDS, _build_notifications

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class AlertLogItem(BaseModel):
    id        : str
    type      : str
    title     : str
    message   : str
    time      : str
    ts        : datetime
    hive_id   : int
    hive_name : str
    importance: str   # 'urgente' | 'attention'


class DailyAlertCount(BaseModel):
    date  : str   # 'YYYY-MM-DD'
    count : int


class WeeklyBarItem(BaseModel):
    day   : str   # 'L' | 'M' | 'Mer' | 'J' | 'V' | 'S' | 'D'
    count : int


# ── Helpers ───────────────────────────────────────────────────────────────────

DAY_LABELS = ['L', 'M', 'Mer', 'J', 'V', 'S', 'D']  # Monday=0

def _importance_from_type(notif_type: str, m: Measurement) -> str:
    if notif_type == 'temperature':
        return 'urgente' if (m.temperature_c or 0) > THRESHOLDS["temperature_c"]["urgente"] else 'attention'
    if notif_type == 'humidity':
        return 'urgente' if (m.humidity_pct or 0) > THRESHOLDS["humidity_pct"]["urgente"] else 'attention'
    return 'urgente'  # door, battery, sound are always urgent


def _build_alert_log(m: Measurement, hive_name: str, hive_id: int) -> list[AlertLogItem]:
    base = _build_notifications(m, hive_name, hive_id)
    return [
        AlertLogItem(
            id         = n.id,
            type       = n.type,
            title      = n.title,
            message    = n.message,
            time       = n.time,
            ts         = n.ts,
            hive_id    = n.hive_id,
            hive_name  = n.hive_name,
            importance = _importance_from_type(n.type, m),
        )
        for n in base
    ]


async def _fetch_alert_measurements(
    session  : AsyncSession,
    start    : datetime,
    end      : datetime,
    hive_id  : Optional[int] = None,
):
    """
    Fetch all measurements within [start, end] that crossed at least one threshold.
    Returns (Measurement, Hive) pairs.
    """
    temp_thresh = THRESHOLDS["temperature_c"]["attention"]
    hum_thresh  = THRESHOLDS["humidity_pct"]["attention"]
    batt_thresh = THRESHOLDS["battery_v"]
    sound_thresh= THRESHOLDS["sound_level"]

    q = (
        select(Measurement, Hive)
        .join(Device, Device.id == Measurement.device_id)
        .join(Hive,   Hive.id   == Device.hive_id)
        .where(Measurement.ts >= start)
        .where(Measurement.ts <= end)
        .where(
            # At least one threshold crossed
            (Measurement.door_open == True)
            | (Measurement.temperature_c > temp_thresh)
            | (Measurement.humidity_pct  > hum_thresh)
            | (Measurement.battery_v     <= batt_thresh)
            | (Measurement.sound_level   > sound_thresh)
        )
        .order_by(Measurement.ts.desc())
    )

    if hive_id:
        q = q.where(Device.hive_id == hive_id)

    result = await session.execute(q)
    return result.all()


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/alert-stats/log", response_model=list[AlertLogItem])
async def get_alert_log(
    start    : Optional[datetime] = Query(default=None),
    end      : Optional[datetime] = Query(default=None),
    hive_id  : Optional[int]      = Query(default=None),
    type_    : Optional[str]      = Query(default=None, alias="type"),
    importance: Optional[str]     = Query(default=None),
    limit    : int                = Query(default=200, ge=1, le=2000),
    session  : AsyncSession       = Depends(get_session),
    current  : dict               = Depends(get_current_user),
):
    """
    Historical alert log — all threshold crossings in a time range.
    Supports filtering by hive, type, and importance.
    """
    now  = datetime.now(timezone.utc)
    end_ = end   or now
    start_ = start or (now - timedelta(days=1))

    rows = await _fetch_alert_measurements(session, start_, end_, hive_id)

    alerts: list[AlertLogItem] = []
    for measurement, hive in rows:
        alerts.extend(_build_alert_log(measurement, hive.name, hive.id))
        if len(alerts) >= limit * 3:   # early exit — we'll filter + trim below
            break

    # Apply frontend filters
    if type_:
        alerts = [a for a in alerts if a.type == type_]
    if importance:
        alerts = [a for a in alerts if a.importance == importance]

    alerts.sort(key=lambda a: a.ts, reverse=True)
    return alerts[:limit]


@router.get("/alert-stats/daily", response_model=list[DailyAlertCount])
async def get_daily_alert_counts(
    start   : Optional[datetime] = Query(default=None),
    end     : Optional[datetime] = Query(default=None),
    hive_id : Optional[int]      = Query(default=None),
    session : AsyncSession       = Depends(get_session),
    current : dict               = Depends(get_current_user),
):
    """
    Count of alert-threshold crossings per day — for the timeline chart.
    """
    now    = datetime.now(timezone.utc)
    end_   = end   or now
    start_ = start or (now - timedelta(days=30))

    rows = await _fetch_alert_measurements(session, start_, end_, hive_id)

    # Count per calendar day
    counts: dict[str, int] = {}
    for measurement, hive in rows:
        notifs = _build_notifications(measurement, hive.name, hive.id)
        day = measurement.ts.strftime('%Y-%m-%d')
        counts[day] = counts.get(day, 0) + len(notifs)

    # Fill in zero days
    result = []
    cursor = start_.date()
    while cursor <= end_.date():
        key = cursor.strftime('%Y-%m-%d')
        result.append(DailyAlertCount(date=key, count=counts.get(key, 0)))
        cursor += timedelta(days=1)

    return result


@router.get("/alert-stats/weekly", response_model=list[WeeklyBarItem])
async def get_weekly_urgent_counts(
    start   : Optional[datetime] = Query(default=None),
    end     : Optional[datetime] = Query(default=None),
    session : AsyncSession = Depends(get_session),
    current : dict         = Depends(get_current_user),
):
    now    = datetime.now(timezone.utc)
    end_   = end   or now
    start_ = start or (now - timedelta(days=7))

    rows = await _fetch_alert_measurements(session, start_, end_)

    counts = [0] * 7
    for measurement, hive in rows:
        alerts = _build_alert_log(measurement, hive.name, hive.id)
        urgent = [a for a in alerts if a.importance == 'urgente']
        if urgent:
            counts[measurement.ts.weekday()] += len(urgent)

    return [WeeklyBarItem(day=DAY_LABELS[i], count=counts[i]) for i in range(7)]