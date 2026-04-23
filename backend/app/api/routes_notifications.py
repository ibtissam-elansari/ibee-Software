from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel

from app.db.engine import get_session
from app.models.models import Device, Hive, HiveThreshold, Measurement
from app.core.dependencies import get_current_user
from app.core.thresholds import Thresholds, get_thresholds_sync

router = APIRouter()


class NotificationOut(BaseModel):
    id        : str
    type      : str
    title     : str
    message   : str
    time      : str
    ts        : datetime
    hive_id   : int
    hive_name : str


def _fmt_time(ts: datetime) -> str:
    return ts.strftime("%H:%M")


def _build_notifications(
    m         : Measurement,
    hive_name : str,
    hive_id   : int,
    thresholds: Optional[Thresholds] = None,
) -> list[NotificationOut]:
    """
    Build notifications for a single measurement.
    Pass `thresholds` if already loaded to avoid redundant DB calls;
    falls back to global defaults when None.
    """
    from app.core.thresholds import GLOBAL_DEFAULTS
    t = thresholds or GLOBAL_DEFAULTS

    notifs = []

    if m.door_open:
        notifs.append(NotificationOut(
            id=f"{m.id}-door", type="security",
            title="Alerte de sécurité",
            message=f"Ruche {hive_name} : Ouverture suspecte détectée",
            time=_fmt_time(m.ts), ts=m.ts, hive_id=hive_id, hive_name=hive_name,
        ))

    if m.temperature_c is not None and m.temperature_c > t.temp_attention:
        urgent = m.temperature_c > t.temp_urgente
        notifs.append(NotificationOut(
            id=f"{m.id}-temp", type="temperature",
            title="Alerte Température" if urgent else "Température Élevée",
            message=f"Ruche {hive_name} : {round(m.temperature_c, 1)}°C {'(Urgent)' if urgent else ''}",
            time=_fmt_time(m.ts), ts=m.ts, hive_id=hive_id, hive_name=hive_name,
        ))

    if m.humidity_pct is not None and m.humidity_pct > t.hum_attention:
        urgent = m.humidity_pct > t.hum_urgente
        notifs.append(NotificationOut(
            id=f"{m.id}-hum", type="humidity",
            title="Humidité Élevée",
            message=f"Ruche {hive_name} : {round(m.humidity_pct)}% d'humidité",
            time=_fmt_time(m.ts), ts=m.ts, hive_id=hive_id, hive_name=hive_name,
        ))

    if m.sound_level is not None and m.sound_level > t.sound_level:
        notifs.append(NotificationOut(
            id=f"{m.id}-sound", type="sound",
            title="Activité Sonore",
            message=f"Ruche {hive_name} : Niveau sonore élevé ({m.sound_level})",
            time=_fmt_time(m.ts), ts=m.ts, hive_id=hive_id, hive_name=hive_name,
        ))

    if m.battery_v is not None and m.battery_v <= t.battery_v:
        notifs.append(NotificationOut(
            id=f"{m.id}-batt", type="battery",
            title="Batterie Faible",
            message=f"Ruche {hive_name} : Batterie à {round(m.battery_v, 2)}V",
            time=_fmt_time(m.ts), ts=m.ts, hive_id=hive_id, hive_name=hive_name,
        ))

    return notifs


@router.get("/notifications", response_model=list[NotificationOut])
async def get_notifications(
    session : AsyncSession = Depends(get_session),
    current : dict         = Depends(get_current_user),
):
    # Subquery: latest measurement id per device
    latest_ids_subq = (
        select(func.max(Measurement.id).label("max_id"))
        .join(Device, Device.id == Measurement.device_id)
        .join(Hive,   Hive.id   == Device.hive_id)
        .where(Hive.deleted_at.is_(None))
        .group_by(Device.hive_id)
        .scalar_subquery()
    )

    q = (
        select(Measurement, Hive, HiveThreshold)
        .join(Device,        Device.id        == Measurement.device_id)
        .join(Hive,          Hive.id          == Device.hive_id)
        .outerjoin(HiveThreshold, HiveThreshold.hive_id == Hive.id)
        .where(Measurement.id.in_(latest_ids_subq))
    )

    # Scope non-superusers to their apiculteur
    if current["role"] != "superuser":
        q = q.where(Hive.apiculteur_id == current["apiculteur_id"])

    rows = (await session.execute(q.order_by(Measurement.ts.desc()))).all()

    all_notifs: list[NotificationOut] = []
    for m, hive, threshold_row in rows:
        t = get_thresholds_sync(threshold_row)
        all_notifs.extend(_build_notifications(m, hive.name, hive.id, t))

    all_notifs.sort(key=lambda n: n.ts, reverse=True)
    return all_notifs