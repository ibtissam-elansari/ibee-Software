from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel

from app.db.engine import get_session
from app.models.models import Device, Hive, Measurement
from app.core.dependencies import get_current_user

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class NotificationOut(BaseModel):
    id      : str
    type    : str    # 'security' | 'temperature' | 'humidity' | 'battery' | 'sound'
    title   : str
    message : str
    time    : str    # formatted for display
    ts      : datetime  # raw timestamp for sorting/filtering on the frontend
    hive_id : int
    hive_name: str


# ── Thresholds ────────────────────────────────────────────────────────────────

THRESHOLDS = {
    "temperature_c" : 38.0,   # °C  — adjust to your domain
    "humidity_pct"  : 75.0,   # %
    "battery_v"     : 3.5,    # V   (~20%)
    "sound_level"   : 70,     # 0-100 scale
}


def _fmt_time(ts: datetime) -> str:
    return ts.strftime("%H:%M")


def _build_notifications(
    m        : Measurement,
    hive_name: str,
    hive_id  : int,
) -> list[NotificationOut]:
    notifs = []

    if m.door_open:
        notifs.append(NotificationOut(
            id        = f"{m.id}-door",
            type      = "security",
            title     = "Alerte de sécurité",
            message   = f"Ruche {hive_name} : Ouverture suspecte détectée",
            time      = _fmt_time(m.ts),
            ts        = m.ts,
            hive_id   = hive_id,
            hive_name = hive_name,
        ))

    if m.temperature_c is not None and m.temperature_c >= THRESHOLDS["temperature_c"]:
        notifs.append(NotificationOut(
            id        = f"{m.id}-temp",
            type      = "temperature",
            title     = "Alerte Température",
            message   = f"Ruche {hive_name} : {round(m.temperature_c, 1)}°C détectés (Urgent)",
            time      = _fmt_time(m.ts),
            ts        = m.ts,
            hive_id   = hive_id,
            hive_name = hive_name,
        ))

    if m.humidity_pct is not None and m.humidity_pct >= THRESHOLDS["humidity_pct"]:
        notifs.append(NotificationOut(
            id        = f"{m.id}-hum",
            type      = "humidity",
            title     = "Humidité Élevée",
            message   = f"Ruche {hive_name} : Taux d'humidité supérieur à {round(m.humidity_pct)}%",
            time      = _fmt_time(m.ts),
            ts        = m.ts,
            hive_id   = hive_id,
            hive_name = hive_name,
        ))

    if m.battery_v is not None and m.battery_v <= THRESHOLDS["battery_v"]:
        notifs.append(NotificationOut(
            id        = f"{m.id}-batt",
            type      = "battery",
            title     = "Batterie Faible",
            message   = f"Ruche {hive_name} : Batterie à {round(m.battery_v, 2)}V",
            time      = _fmt_time(m.ts),
            ts        = m.ts,
            hive_id   = hive_id,
            hive_name = hive_name,
        ))

    if m.sound_level is not None and m.sound_level >= THRESHOLDS["sound_level"]:
        notifs.append(NotificationOut(
            id        = f"{m.id}-sound",
            type      = "sound",
            title     = "Activité Sonore",
            message   = f"Ruche {hive_name} : Niveau sonore élevé ({m.sound_level})",
            time      = _fmt_time(m.ts),
            ts        = m.ts,
            hive_id   = hive_id,
            hive_name = hive_name,
        ))

    return notifs


# ── Endpoint ──────────────────────────────────────────────────────────────────

@router.get("/notifications", response_model=list[NotificationOut])
async def get_notifications(
    session : AsyncSession = Depends(get_session),
    current : dict         = Depends(get_current_user),
):
    """
    Returns notifications derived from the latest measurement of every hive.
    Uses a single query with a subquery for latest-per-hive — no N+1.
    """

    # Subquery: latest measurement id per device
    latest_ids_subq = (
        select(func.max(Measurement.id).label("max_id"))
        .join(Device, Device.id == Measurement.device_id)
        .group_by(Device.hive_id)
        .scalar_subquery()
    )

    # Single query: join latest measurements with their hives
    result = await session.execute(
        select(Measurement, Hive)
        .join(Device, Device.id == Measurement.device_id)
        .join(Hive,   Hive.id   == Device.hive_id)
        .where(Measurement.id.in_(latest_ids_subq))
        .order_by(Measurement.ts.desc())
    )
    rows = result.all()

    all_notifications: list[NotificationOut] = []
    for measurement, hive in rows:
        all_notifications.extend(
            _build_notifications(measurement, hive.name, hive.id)
        )

    # Sort by actual timestamp descending — not by formatted string
    all_notifications.sort(key=lambda n: n.ts, reverse=True)
    return all_notifications