from __future__ import annotations

from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.db.engine import get_session
from app.models.models import Device, Hive, HiveThreshold, Measurement
from app.core.dependencies import get_current_user
from app.core.thresholds import GLOBAL_DEFAULTS, Thresholds, get_thresholds_sync
from app.api.routes_notifications import _build_notifications, NotificationOut

router = APIRouter()

DAY_LABELS = ['L', 'M', 'Mer', 'J', 'V', 'S', 'D']


class AlertLogItem(BaseModel):
    id         : str
    type       : str
    title      : str
    message    : str
    time       : str
    ts         : datetime
    hive_id    : int
    hive_name  : str
    importance : str   # 'urgente' | 'attention'


class DailyAlertCount(BaseModel):
    date  : str
    count : int


class WeeklyBarItem(BaseModel):
    day   : str
    count : int


def _importance(notif_type: str, m: Measurement, t: Thresholds) -> str:
    if notif_type == "temperature":
        return "urgente" if (m.temperature_c or 0) > t.temp_urgente else "attention"
    if notif_type == "humidity":
        return "urgente" if (m.humidity_pct or 0) > t.hum_urgente else "attention"
    return "urgente"


def _to_alert_log(
    notifs    : list[NotificationOut],
    m         : Measurement,
    thresholds: Thresholds,
) -> list[AlertLogItem]:
    return [
        AlertLogItem(
            id=n.id, type=n.type, title=n.title, message=n.message,
            time=n.time, ts=n.ts, hive_id=n.hive_id, hive_name=n.hive_name,
            importance=_importance(n.type, m, thresholds),
        )
        for n in notifs
    ]


async def _fetch_alert_rows(
    session       : AsyncSession,
    current       : dict,
    start         : datetime,
    end           : datetime,
    hive_id       : Optional[int] = None,
    apiculteur_id : Optional[int] = None,
):
    """
    Returns (Measurement, Hive, HiveThreshold|None) tuples for all
    threshold-crossing measurements in [start, end], scoped by role.

    Scoping rules:
      - non-superuser  → always filtered to their own apiculteur (backend enforced)
      - superuser      → filtered to apiculteur_id if provided, otherwise all hives
    """
    gd = GLOBAL_DEFAULTS
    q = (
        select(Measurement, Hive, HiveThreshold)
        .join(Device,         Device.id         == Measurement.device_id)
        .join(Hive,           Hive.id           == Device.hive_id)
        .outerjoin(HiveThreshold, HiveThreshold.hive_id == Hive.id)
        .where(Hive.deleted_at.is_(None))
        .where(Measurement.ts >= start)
        .where(Measurement.ts <= end)
        .where(
            (Measurement.door_open      == True)
            | (Measurement.temperature_c > gd.temp_attention)
            | (Measurement.humidity_pct  > gd.hum_attention)
            | (Measurement.battery_v    <= gd.battery_v)
            | (Measurement.sound_level   > gd.sound_level)
        )
        .order_by(Measurement.ts.desc())
    )

    if current["role"] != "superuser":
        # Non-superusers are always restricted to their own apiculteur
        q = q.where(Hive.apiculteur_id == current["apiculteur_id"])
    elif apiculteur_id:
        # Superuser drilling into a specific apiculteur's dashboard
        q = q.where(Hive.apiculteur_id == apiculteur_id)

    if hive_id:
        q = q.where(Device.hive_id == hive_id)

    return (await session.execute(q)).all()


@router.get("/alert-stats/log", response_model=list[AlertLogItem])
async def get_alert_log(
    start         : Optional[datetime] = Query(default=None),
    end           : Optional[datetime] = Query(default=None),
    hive_id       : Optional[int]      = Query(default=None),
    apiculteur_id : Optional[int]      = Query(default=None),
    type_         : Optional[str]      = Query(default=None, alias="type"),
    importance    : Optional[str]      = Query(default=None),
    limit         : int                = Query(default=200, ge=1, le=2000),
    session       : AsyncSession       = Depends(get_session),
    current       : dict               = Depends(get_current_user),
):
    now    = datetime.now(timezone.utc)
    start_ = start or (now - timedelta(days=1))
    end_   = end   or now

    rows = await _fetch_alert_rows(session, current, start_, end_, hive_id, apiculteur_id)

    alerts: list[AlertLogItem] = []
    for m, hive, threshold_row in rows:
        t      = get_thresholds_sync(threshold_row)
        notifs = _build_notifications(m, hive.name, hive.id, t)
        alerts.extend(_to_alert_log(notifs, m, t))
        if len(alerts) >= limit * 3:
            break

    if type_:
        alerts = [a for a in alerts if a.type == type_]
    if importance:
        alerts = [a for a in alerts if a.importance == importance]

    alerts.sort(key=lambda a: a.ts, reverse=True)
    return alerts[:limit]


@router.get("/alert-stats/daily", response_model=list[DailyAlertCount])
async def get_daily_alert_counts(
    start         : Optional[datetime] = Query(default=None),
    end           : Optional[datetime] = Query(default=None),
    hive_id       : Optional[int]      = Query(default=None),
    apiculteur_id : Optional[int]      = Query(default=None),
    session       : AsyncSession       = Depends(get_session),
    current       : dict               = Depends(get_current_user),
):
    now    = datetime.now(timezone.utc)
    start_ = start or (now - timedelta(days=30))
    end_   = end   or now

    rows   = await _fetch_alert_rows(session, current, start_, end_, hive_id, apiculteur_id)
    counts: dict[str, int] = {}

    for m, hive, threshold_row in rows:
        t      = get_thresholds_sync(threshold_row)
        notifs = _build_notifications(m, hive.name, hive.id, t)
        day    = m.ts.strftime("%Y-%m-%d")
        counts[day] = counts.get(day, 0) + len(notifs)

    result = []
    cursor = start_.date()
    while cursor <= end_.date():
        key = cursor.strftime("%Y-%m-%d")
        result.append(DailyAlertCount(date=key, count=counts.get(key, 0)))
        from datetime import timedelta as td
        cursor += td(days=1)
    return result


@router.get("/alert-stats/weekly", response_model=list[WeeklyBarItem])
async def get_weekly_urgent_counts(
    start         : Optional[datetime] = Query(default=None),
    end           : Optional[datetime] = Query(default=None),
    apiculteur_id : Optional[int]      = Query(default=None),
    session       : AsyncSession       = Depends(get_session),
    current       : dict               = Depends(get_current_user),
):
    now    = datetime.now(timezone.utc)
    start_ = start or (now - timedelta(days=7))
    end_   = end   or now

    rows   = await _fetch_alert_rows(session, current, start_, end_, apiculteur_id=apiculteur_id)
    counts = [0] * 7

    for m, hive, threshold_row in rows:
        t      = get_thresholds_sync(threshold_row)
        alerts = _to_alert_log(_build_notifications(m, hive.name, hive.id, t), m, t)
        urgent = sum(1 for a in alerts if a.importance == "urgente")
        if urgent:
            counts[m.ts.weekday()] += urgent

    return [WeeklyBarItem(day=DAY_LABELS[i], count=counts[i]) for i in range(7)]