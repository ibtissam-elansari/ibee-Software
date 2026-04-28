"""
Threshold resolution: per-hive DB row > global defaults.
Import `get_thresholds` (async) or `get_thresholds_sync` (row already loaded)
wherever alert logic runs.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import HiveThreshold


def _pick(value, default):
    """Return `value` when it is explicitly set (not None), else `default`.

    Using `value or default` is wrong: it would replace a legitimate 0.0
    threshold with the global default because 0.0 is falsy in Python.
    """
    return value if value is not None else default


@dataclass(frozen=True)
class Thresholds:
    temp_attention : float
    temp_urgente   : float
    hum_attention  : float
    hum_urgente    : float
    battery_v      : float
    sound_level    : int
    weight_drop_kg : Optional[float] = None   # None = weight alerting disabled


GLOBAL_DEFAULTS = Thresholds(
    temp_attention = 35.0,
    temp_urgente   = 40.0,
    hum_attention  = 70.0,
    hum_urgente    = 80.0,
    battery_v      = 3.5,
    sound_level    = 80,
    weight_drop_kg = None,   # off by default — admin must opt in per hive
)


def _from_row(row: HiveThreshold) -> Thresholds:
    """Build a Thresholds from a DB row, falling back field-by-field to globals."""
    return Thresholds(
        temp_attention = _pick(row.temp_attention, GLOBAL_DEFAULTS.temp_attention),
        temp_urgente   = _pick(row.temp_urgente,   GLOBAL_DEFAULTS.temp_urgente),
        hum_attention  = _pick(row.hum_attention,  GLOBAL_DEFAULTS.hum_attention),
        hum_urgente    = _pick(row.hum_urgente,     GLOBAL_DEFAULTS.hum_urgente),
        battery_v      = _pick(row.battery_v,       GLOBAL_DEFAULTS.battery_v),
        sound_level    = _pick(row.sound_level,     GLOBAL_DEFAULTS.sound_level),
        weight_drop_kg = _pick(row.weight_drop_kg,  GLOBAL_DEFAULTS.weight_drop_kg),
    )


async def get_thresholds(session: AsyncSession, hive_id: int) -> Thresholds:
    """Return per-hive thresholds, falling back to globals for any NULL field."""
    row = (await session.execute(
        select(HiveThreshold).where(HiveThreshold.hive_id == hive_id)
    )).scalars().first()

    return GLOBAL_DEFAULTS if row is None else _from_row(row)


def get_thresholds_sync(row: Optional[HiveThreshold]) -> Thresholds:
    """
    Synchronous variant for contexts where the HiveThreshold row is
    already loaded (avoids an extra await in tight loops).
    """
    return GLOBAL_DEFAULTS if row is None else _from_row(row)