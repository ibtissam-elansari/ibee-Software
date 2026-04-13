from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.db.engine import get_session
from app.models.models import Device, Hive, Measurement
from app.core.dependencies import get_current_user

router = APIRouter()


class NotificationOut(BaseModel):
    id:      str
    type:    str   # 'security' | 'temperature' | 'humidity' | 'battery' | 'geofencing'
    title:   str
    message: str
    time:    str
    hive_id: int


THRESHOLDS = {
    "temperature_c" : 40.0,
    "humidity_pct"  : 75.0,
    "battery_v"     : 3.3,   # ~20% depending on your voltsToPct curve
}


def _fmt_time(ts: datetime) -> str:
    return ts.strftime("%H.%M %p")


def _notifications_from_measurement(
    m: Measurement,
    hive_name: str,
    hive_id: int,
) -> list[NotificationOut]:
    notifs = []

    if m.door_open:
        notifs.append(NotificationOut(
            id      = f"{m.id}-door",
            type    = "security",
            title   = "Alerte de sécurité",
            message = f"Ruche {hive_name} : Ouverture suspecte détectée",
            time    = _fmt_time(m.ts),
            hive_id = hive_id,
        ))

    if m.temperature_c and m.temperature_c >= THRESHOLDS["temperature_c"]:
        notifs.append(NotificationOut(
            id      = f"{m.id}-temp",
            type    = "temperature",
            title   = "Alerte Température",
            message = f"Ruche {hive_name} : {round(m.temperature_c)}°C détectés (Urgent)",
            time    = _fmt_time(m.ts),
            hive_id = hive_id,
        ))

    if m.humidity_pct and m.humidity_pct >= THRESHOLDS["humidity_pct"]:
        notifs.append(NotificationOut(
            id      = f"{m.id}-hum",
            type    = "humidity",
            title   = "Humidité Élevée",
            message = f"Ruche {hive_name} : Taux d'humidité supérieur à {round(m.humidity_pct)}%.",
            time    = _fmt_time(m.ts),
            hive_id = hive_id,
        ))

    if m.battery_v and m.battery_v <= THRESHOLDS["battery_v"]:
        notifs.append(NotificationOut(
            id      = f"{m.id}-batt",
            type    = "battery",
            title   = "Batterie Faible",
            message = f"Ruche {hive_name} : Batterie à {round(m.battery_v, 1)}V",
            time    = _fmt_time(m.ts),
            hive_id = hive_id,
        ))

    return notifs


@router.get("/notifications", response_model=list[NotificationOut])
async def get_notifications(
    session : AsyncSession = Depends(get_session),
    current : dict         = Depends(get_current_user),
):
    """
    Derives notifications from the latest measurement of every hive.
    Returns only hives whose latest reading crosses a threshold.
    """
    # Fetch all hives with their latest measurement in one query
    hives_result = await session.execute(select(Hive).order_by(Hive.created_at))
    hives = hives_result.scalars().all()

    all_notifications: list[NotificationOut] = []

    for hive in hives:
        # Get the latest measurement for this hive
        result = await session.execute(
            select(Measurement)
            .join(Device, Device.id == Measurement.device_id)
            .where(Device.hive_id == hive.id)
            .order_by(Measurement.ts.desc())
            .limit(1)
        )
        row = result.scalars().first()
        if row:
            all_notifications.extend(
                _notifications_from_measurement(row, hive.name, hive.id)
            )

    # Sort newest first
    all_notifications.sort(key=lambda n: n.time, reverse=True)
    return all_notifications