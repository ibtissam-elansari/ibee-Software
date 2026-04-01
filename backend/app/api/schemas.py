from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


# ---------- INPUT SCHEMAS ----------

class HiveCreate(BaseModel):
    name: str
    location_name: Optional[str] = None


class DeviceCreate(BaseModel):
    dev_eui: str
    hive_id: Optional[int] = None


# ---------- OUTPUT SCHEMAS ----------

class HiveOut(BaseModel):
    id: int
    name: str
    location_name: Optional[str] = None


class LatestMeasurementOut(BaseModel):
    device_dev_eui: str
    ts: datetime
    temperature_c: Optional[float] = None
    humidity_pct: Optional[float] = None
    sound_level: Optional[int] = None
    door_open: Optional[bool] = None
    gps_lat: Optional[float] = None
    gps_lng: Optional[float] = None
    battery_v: Optional[float] = None
    rssi: Optional[int] = None
    snr: Optional[float] = None


class HistoryPointOut(BaseModel):
    ts: datetime
    temperature_c: Optional[float] = None
    humidity_pct: Optional[float] = None
    sound_level: Optional[int] = None
    door_open: Optional[bool] = None
    gps_lat: Optional[float] = None
    gps_lng: Optional[float] = None
    battery_v: Optional[float] = None
    rssi: Optional[int] = None
    snr: Optional[float] = None