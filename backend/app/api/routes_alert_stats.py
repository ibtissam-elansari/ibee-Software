from __future__ import annotations

from datetime import datetime, timezone, timedelta, date as date_type
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

DAY_LABELS = ["L", "M", "Mer", "J", "V", "S", "D"]

SENSOR_UNITS: dict[str, str] = {
    "temperature": "°C",
    "humidity": "%",
    "battery": "V",
    "sound": "dB",
    "security": "",
}


# ── Pydantic models ────────────────────────────────────────────────────────────

class AlertLogItem(BaseModel):
    id             : str
    type           : str
    title          : str
    message        : str
    time           : str
    ts             : datetime
    hive_id        : int
    hive_name      : str
    importance     : str          # 'urgente' | 'attention'
    measured_value : Optional[float] = None   # raw sensor value that triggered the alert
    measured_unit  : Optional[str]  = None    # '°C' | '%' | 'V' | 'dB' | ''


class DailyAlertCount(BaseModel):
    date  : str
    count : int


class WeeklyBarItem(BaseModel):
    day   : str
    count : int


class SensorDayStats(BaseModel):
    """Daily min/max/avg for a continuous sensor, or event count for discrete ones."""
    date  : str
    min   : Optional[float] = None
    max   : Optional[float] = None
    avg   : Optional[float] = None
    count : int = 0   # alert-crossing events that day


# ── Helpers ────────────────────────────────────────────────────────────────────

def _measured_value(notif_type: str, m: Measurement) -> tuple[Optional[float], Optional[str]]:
    """Return (value, unit) for the measurement that triggered this notification."""
    if notif_type == "temperature":
        return (round(m.temperature_c, 1) if m.temperature_c is not None else None, "°C")
    if notif_type == "humidity":
        return (round(m.humidity_pct, 1) if m.humidity_pct is not None else None, "%")
    if notif_type == "battery":
        return (round(m.battery_v, 2) if m.battery_v is not None else None, "V")
    if notif_type == "sound":
        return (round(m.sound_level, 0) if m.sound_level is not None else None, "dB")
    if notif_type == "security":
        return (None, "")   # boolean — frontend renders "Porte ouverte"
    return (None, None)


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
    items = []
    for n in notifs:
        val, unit = _measured_value(n.type, m)
        items.append(AlertLogItem(
            id=n.id, type=n.type, title=n.title, message=n.message,
            time=n.time, ts=n.ts, hive_id=n.hive_id, hive_name=n.hive_name,
            importance=_importance(n.type, m, thresholds),
            measured_value=val,
            measured_unit=unit,
        ))
    return items


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
    """
    gd = GLOBAL_DEFAULTS
    q = (
        select(Measurement, Hive, HiveThreshold)
        .join(Device,            Device.id           == Measurement.device_id)
        .join(Hive,              Hive.id             == Device.hive_id)
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
        q = q.where(Hive.apiculteur_id == current["apiculteur_id"])
    elif apiculteur_id:
        q = q.where(Hive.apiculteur_id == apiculteur_id)

    if hive_id:
        q = q.where(Device.hive_id == hive_id)

    return (await session.execute(q)).all()


def _iter_days(start: datetime, end: datetime):
    cursor = start.date()
    while cursor <= end.date():
        yield cursor.strftime("%Y-%m-%d")
        cursor += timedelta(days=1)


# ── Routes ─────────────────────────────────────────────────────────────────────

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

    return [
        DailyAlertCount(date=key, count=counts.get(key, 0))
        for key in _iter_days(start_, end_)
    ]


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


@router.get("/alert-stats/sensor-timeline", response_model=list[SensorDayStats])
async def get_sensor_timeline(
    sensor_type   : str                = Query(..., description="temperature|humidity|battery|sound|security"),
    start         : Optional[datetime] = Query(default=None),
    end           : Optional[datetime] = Query(default=None),
    hive_id       : Optional[int]      = Query(default=None),
    apiculteur_id : Optional[int]      = Query(default=None),
    session       : AsyncSession       = Depends(get_session),
    current       : dict               = Depends(get_current_user),
):
    """
    Per-sensor daily timeline.

    For continuous sensors (temperature, humidity, battery, sound):
      returns daily min / max / avg of the RAW measurement values — not just
      alert-crossing ones — so the chart always shows the full trend line.

    For discrete sensors (security / door):
      returns event count per day (min/max/avg are None).
    """
    now    = datetime.now(timezone.utc)
    start_ = start or (now - timedelta(days=30))
    end_   = end   or now

    # For continuous sensors we need ALL measurements in range, not just alerts.
    # Query raw measurements without the threshold filter.
    q = (
        select(Measurement, Hive)
        .join(Device, Device.id   == Measurement.device_id)
        .join(Hive,   Hive.id     == Device.hive_id)
        .where(Hive.deleted_at.is_(None))
        .where(Measurement.ts >= start_)
        .where(Measurement.ts <= end_)
        .order_by(Measurement.ts.asc())
    )

    if current["role"] != "superuser":
        q = q.where(Hive.apiculteur_id == current["apiculteur_id"])
    elif apiculteur_id:
        q = q.where(Hive.apiculteur_id == apiculteur_id)

    if hive_id:
        q = q.where(Device.hive_id == hive_id)

    rows = (await session.execute(q)).all()

    # Bucket by date
    FIELD_MAP = {
        "temperature": lambda m: m.temperature_c,
        "humidity"   : lambda m: m.humidity_pct,
        "battery"    : lambda m: m.battery_v,
        "sound"      : lambda m: m.sound_level,
    }
    gd = GLOBAL_DEFAULTS

    def _is_alert_event(sensor: str, m: Measurement) -> bool:
        if sensor == "security":
            return bool(m.door_open)
        if sensor == "temperature":
            return (m.temperature_c or 0) > gd.temp_attention
        if sensor == "humidity":
            return (m.humidity_pct or 0) > gd.hum_attention
        if sensor == "battery":
            return (m.battery_v or 9) <= gd.battery_v
        if sensor == "sound":
            return (m.sound_level or 0) > gd.sound_level
        return False

    by_day: dict[str, list[float]] = {}
    events: dict[str, int]         = {}

    for m, hive in rows:
        day = m.ts.strftime("%Y-%m-%d")
        if sensor_type == "security":
            if m.door_open:
                events[day] = events.get(day, 0) + 1
        else:
            getter = FIELD_MAP.get(sensor_type)
            if getter is None:
                continue
            val = getter(m)
            if val is None:
                continue
            by_day.setdefault(day, []).append(val)
            if _is_alert_event(sensor_type, m):
                events[day] = events.get(day, 0) + 1

    result = []
    for key in _iter_days(start_, end_):
        vals = by_day.get(key, [])
        if vals:
            result.append(SensorDayStats(
                date  = key,
                min   = round(min(vals), 2),
                max   = round(max(vals), 2),
                avg   = round(sum(vals) / len(vals), 2),
                count = events.get(key, 0),
            ))
        else:
            result.append(SensorDayStats(
                date  = key,
                min   = None,
                max   = None,
                avg   = None,
                count = events.get(key, 0),
            ))

    return result