# schemas.py:

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


# ── Input schemas ────────────────────────────────────────────────────────────

class HiveCreate(BaseModel):
    name          : str
    location_name : Optional[str] = None


class HiveUpdate(BaseModel):
    name          : Optional[str] = None
    location_name : Optional[str] = None


class DeviceCreate(BaseModel):
    dev_eui : str
    hive_id : Optional[int] = None


# ── Output schemas ───────────────────────────────────────────────────────────

class HiveOut(BaseModel):
    id            : int
    name          : str
    location_name : Optional[str] = None
    created_at    : datetime
    is_active     : bool
    deleted_at    : Optional[datetime]

    class Config:
        from_attributes = True


class DeviceOut(BaseModel):
    id           : int
    dev_eui      : str
    hive_id      : Optional[int] = None
    status       : str
    last_seen_at : Optional[datetime] = None
    created_at   : datetime

    class Config:
        from_attributes = True


class MeasurementOut(BaseModel):
    """Full measurement — used for latest + history."""
    id            : int
    ts            : datetime
    device_dev_eui: str                 # denormalised for convenience
    temperature_c : Optional[float] = None
    humidity_pct  : Optional[float] = None
    sound_level   : Optional[int]   = None
    door_open     : Optional[bool]  = None
    gps_lat       : Optional[float] = None
    gps_lng       : Optional[float] = None
    battery_v     : Optional[float] = None
    rssi          : Optional[int]   = None
    snr           : Optional[float] = None

    class Config:
        from_attributes = True


class HistoryPointOut(BaseModel):
    """Slim measurement for history/chart endpoints — no id, no dev_eui."""
    ts            : datetime
    temperature_c : Optional[float] = None
    humidity_pct  : Optional[float] = None
    sound_level   : Optional[int]   = None
    door_open     : Optional[bool]  = None
    gps_lat       : Optional[float] = None
    gps_lng       : Optional[float] = None
    battery_v     : Optional[float] = None
    rssi          : Optional[int]   = None
    snr           : Optional[float] = None


class HiveStatsOut(BaseModel):
    hive_id           : int
    total_measurements: int
    avg_temperature_c : Optional[float] = None
    avg_humidity_pct  : Optional[float] = None
    min_battery_v     : Optional[float] = None
    max_battery_v     : Optional[float] = None
    sound_events      : int
    door_open_events  : int
    first_seen        : Optional[datetime] = None
    last_seen         : Optional[datetime] = None


# kept for backwards compatibility with routes_webhooks.py
LatestMeasurementOut = MeasurementOut