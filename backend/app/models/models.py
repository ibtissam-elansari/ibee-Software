from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel
from enum import Enum


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class UserRole(str, Enum):
    USER      = "user"
    ADMIN     = "admin"
    SUPERUSER = "superuser"


class Apiculteur(SQLModel, table=True):
    """
    A client beekeeping cooperative managed by AGRI4.0.
    Users/admins belong to one cooperative.
    Superusers belong to none (they manage all).
    """
    __tablename__ = "apiculteur"

    id           : Optional[int]  = Field(default=None, primary_key=True)
    company_name : str
    email        : Optional[str]  = Field(default=None, index=True)
    phone        : Optional[str]  = Field(default=None)
    region       : Optional[str]  = Field(default=None)
    city         : Optional[str]  = Field(default=None)
    address      : Optional[str]  = Field(default=None)
    is_active    : bool           = Field(default=True)
    created_at   : datetime       = Field(default_factory=_utcnow, index=True)


class User(SQLModel, table=True):
    """
    A person who can log in.
    - superuser  : apiculteur_id = None  (manages all coops)
    - admin/user : apiculteur_id = <id>  (belongs to one coop)
    """
    __tablename__ = "user"

    id              : Optional[int]  = Field(default=None, primary_key=True)
    email           : str            = Field(unique=True, index=True)
    hashed_password : str
    role            : UserRole       = Field(default=UserRole.USER)
    apiculteur_id   : Optional[int]  = Field(default=None, foreign_key="apiculteur.id", index=True)
    created_at      : datetime       = Field(default_factory=_utcnow, index=True)


class Hive(SQLModel, table=True):
    __tablename__ = "hive"

    id            : Optional[int]      = Field(default=None, primary_key=True)
    name          : str                = Field(index=True)
    location_name : Optional[str]      = Field(default=None)
    apiculteur_id : Optional[int]      = Field(default=None, foreign_key="apiculteur.id", index=True)
    is_active     : bool               = Field(default=True)
    created_at    : datetime           = Field(default_factory=_utcnow, index=True)
    deleted_at    : Optional[datetime] = Field(default=None)


class Device(SQLModel, table=True):
    __tablename__ = "device"

    id           : Optional[int]      = Field(default=None, primary_key=True)
    dev_eui      : str                = Field(index=True, unique=True)
    hive_id      : Optional[int]      = Field(default=None, foreign_key="hive.id", index=True)
    status       : str                = Field(default="unknown", index=True)
    last_seen_at : Optional[datetime] = Field(default=None, index=True)
    created_at   : datetime           = Field(default_factory=_utcnow, index=True)


class Measurement(SQLModel, table=True):
    __tablename__ = "measurement"

    id        : Optional[int] = Field(default=None, primary_key=True)
    device_id : int           = Field(foreign_key="device.id", index=True)
    ts        : datetime      = Field(default_factory=_utcnow, index=True)

    temperature_c : Optional[float] = None
    humidity_pct  : Optional[float] = None
    sound_level   : Optional[int]   = None
    door_open     : Optional[bool]  = None

    gps_lat   : Optional[float] = None
    gps_lng   : Optional[float] = None
    battery_v : Optional[float] = None

    rssi : Optional[int]   = None
    snr  : Optional[float] = None