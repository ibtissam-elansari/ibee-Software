"""
Threshold resolution: per-hive DB row > global defaults.
Import `get_thresholds` wherever alert logic runs.
"""
from __future__ import annotations

from typing import Optional
from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.models import HiveThreshold


@dataclass(frozen=True)
class Thresholds:
    temp_attention : float
    temp_urgente   : float
    hum_attention  : float
    hum_urgente    : float
    battery_v      : float
    sound_level    : int


GLOBAL_DEFAULTS = Thresholds(
    temp_attention = 35.0,
    temp_urgente   = 40.0,
    hum_attention  = 70.0,
    hum_urgente    = 80.0,
    battery_v      = 3.5,
    sound_level    = 80,
)


async def get_thresholds(session: AsyncSession, hive_id: int) -> Thresholds:
    """Return per-hive thresholds, falling back to globals for any NULL field."""
    row = (await session.execute(
        select(HiveThreshold).where(HiveThreshold.hive_id == hive_id)
    )).scalars().first()

    if row is None:
        return GLOBAL_DEFAULTS

    return Thresholds(
        temp_attention = row.temp_attention or GLOBAL_DEFAULTS.temp_attention,
        temp_urgente   = row.temp_urgente   or GLOBAL_DEFAULTS.temp_urgente,
        hum_attention  = row.hum_attention  or GLOBAL_DEFAULTS.hum_attention,
        hum_urgente    = row.hum_urgente    or GLOBAL_DEFAULTS.hum_urgente,
        battery_v      = row.battery_v      or GLOBAL_DEFAULTS.battery_v,
        sound_level    = row.sound_level    or GLOBAL_DEFAULTS.sound_level,
    )


def get_thresholds_sync(row: Optional[HiveThreshold]) -> Thresholds:
    """
    Synchronous variant for contexts where the HiveThreshold row is
    already loaded (avoids an extra await in tight loops).
    """
    if row is None:
        return GLOBAL_DEFAULTS
    return Thresholds(
        temp_attention = row.temp_attention or GLOBAL_DEFAULTS.temp_attention,
        temp_urgente   = row.temp_urgente   or GLOBAL_DEFAULTS.temp_urgente,
        hum_attention  = row.hum_attention  or GLOBAL_DEFAULTS.hum_attention,
        hum_urgente    = row.hum_urgente    or GLOBAL_DEFAULTS.hum_urgente,
        battery_v      = row.battery_v      or GLOBAL_DEFAULTS.battery_v,
        sound_level    = row.sound_level    or GLOBAL_DEFAULTS.sound_level,
    )