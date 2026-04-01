from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class Hive(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    location_name: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)


class Device(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    dev_eui: str = Field(index=True, unique=True)
    hive_id: Optional[int] = Field(default=None, foreign_key="hive.id", index=True)
    status: str = Field(default="unknown", index=True)
    last_seen_at: Optional[datetime] = Field(default=None, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)


class Measurement(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    device_id: int = Field(foreign_key="device.id", index=True)
    ts: datetime = Field(default_factory=datetime.utcnow, index=True)

    temperature_c: Optional[float] = None
    humidity_pct: Optional[float] = None
    sound_level: Optional[int] = None
    door_open: Optional[bool] = None

    gps_lat: Optional[float] = None
    gps_lng: Optional[float] = None
    battery_v: Optional[float] = None

    rssi: Optional[int] = None
    snr: Optional[float] = None
