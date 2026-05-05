from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.models import TicketType, TicketStatus, TicketPriority

# ── Hive ─────────────────────────────────────────────────────────────────────

class HiveCreate(BaseModel):
    name          : str
    location_name : Optional[str] = None
    apiculteur_id : int                    # required — superuser must assign


class HiveUpdate(BaseModel):
    name          : Optional[str]  = None
    location_name : Optional[str]  = None
    is_active     : Optional[bool] = None
    apiculteur_id : Optional[int]  = None  # superuser can reassign


class HiveOut(BaseModel):
    id            : int
    name          : str
    location_name : Optional[str]     = None
    apiculteur_id : Optional[int]
    is_active     : bool
    created_at    : datetime
    deleted_at    : Optional[datetime] = None
    threshold_profile_id : Optional[int]

    class Config:
        from_attributes = True


class HiveStatsOut(BaseModel):
    hive_id            : int
    total_measurements : int
    avg_temperature_c  : Optional[float] = None
    avg_humidity_pct   : Optional[float] = None
    min_battery_v      : Optional[float] = None
    max_battery_v      : Optional[float] = None
    sound_events       : int
    door_open_events   : int
    # Weight stats (NEW)
    avg_weight_kg      : Optional[float] = None
    min_weight_kg      : Optional[float] = None
    max_weight_kg      : Optional[float] = None
    first_seen         : Optional[datetime] = None
    last_seen          : Optional[datetime] = None


# ── Thresholds ────────────────────────────────────────────────────────────────

class HiveThresholdOut(BaseModel):
    hive_id        : int
    temp_attention : Optional[float]
    temp_urgente   : Optional[float]
    hum_attention  : Optional[float]
    hum_urgente    : Optional[float]
    battery_v      : Optional[float]
    sound_level    : Optional[int]
    weight_drop_kg : Optional[float] = None   # NEW
    updated_at     : datetime

    class Config:
        from_attributes = True


class HiveThresholdUpdate(BaseModel):
    temp_attention : Optional[float] = Field(default=None, ge=0,   le=60)
    temp_urgente   : Optional[float] = Field(default=None, ge=0,   le=60)
    hum_attention  : Optional[float] = Field(default=None, ge=0,   le=100)
    hum_urgente    : Optional[float] = Field(default=None, ge=0,   le=100)
    battery_v      : Optional[float] = Field(default=None, ge=0,   le=5)
    sound_level    : Optional[int]   = Field(default=None, ge=0,   le=120)
    weight_drop_kg : Optional[float] = Field(default=None, ge=0.1, le=30)   # NEW


# ── Device ────────────────────────────────────────────────────────────────────

class DeviceCreate(BaseModel):
    dev_eui : str
    hive_id : Optional[int] = None


class DeviceOut(BaseModel):
    id           : int
    dev_eui      : str
    hive_id      : Optional[int]      = None
    status       : str
    last_seen_at : Optional[datetime] = None
    created_at   : datetime

    class Config:
        from_attributes = True


# ── Measurements ──────────────────────────────────────────────────────────────

class MeasurementOut(BaseModel):
    id             : int
    ts             : datetime
    device_dev_eui : str
    temperature_c  : Optional[float] = None
    humidity_pct   : Optional[float] = None
    sound_level    : Optional[int]   = None
    door_open      : Optional[bool]  = None
    weight_kg      : Optional[float] = None   # NEW
    gps_lat        : Optional[float] = None
    gps_lng        : Optional[float] = None
    battery_v      : Optional[float] = None
    rssi           : Optional[int]   = None
    snr            : Optional[float] = None

    class Config:
        from_attributes = True


class HistoryPointOut(BaseModel):
    ts            : datetime
    temperature_c : Optional[float] = None
    humidity_pct  : Optional[float] = None
    sound_level   : Optional[int]   = None
    door_open     : Optional[bool]  = None
    weight_kg     : Optional[float] = None   # NEW
    gps_lat       : Optional[float] = None
    gps_lng       : Optional[float] = None
    battery_v     : Optional[float] = None
    rssi          : Optional[int]   = None
    snr           : Optional[float] = None


# Backwards compat alias
LatestMeasurementOut = MeasurementOut

# ── Support ──────────────────────────────────────────────────────────────

class SupportTicketCreate(BaseModel):
    title       : str         = Field(..., min_length=5, max_length=200)
    description : str         = Field(..., min_length=10)
    type        : TicketType  = TicketType.assistance
    priority    : TicketPriority = TicketPriority.normale
 
 
class SupportTicketUpdate(BaseModel):
    """Admin/user can update title, description while ticket is still open."""
    title       : Optional[str] = Field(None, min_length=5, max_length=200)
    description : Optional[str] = Field(None, min_length=10)
 
 
class SupportTicketRespond(BaseModel):
    """Superuser only — respond + change status."""
    response    : str           = Field(..., min_length=1)
    status      : TicketStatus  = TicketStatus.en_cours
    priority    : Optional[TicketPriority] = None
 
 
class SupportTicketStatusPatch(BaseModel):
    """Superuser only — change status without a response."""
    status      : TicketStatus
 
 
class TicketUserOut(BaseModel):
    id       : int
    email    : str
    nom      : Optional[str] = None
    prenom   : Optional[str] = None
 
    class Config:
        from_attributes = True
 
 
class SupportTicketOut(BaseModel):
    id             : int
    title          : str
    description    : str
    type           : TicketType
    status         : TicketStatus
    priority       : TicketPriority
    created_by_id  : int
    apiculteur_id  : Optional[int]
    assigned_to_id : Optional[int]
    response       : Optional[str]
    responded_at   : Optional[datetime]
    created_at     : datetime
    updated_at     : datetime
    closed_at      : Optional[datetime]
 
    # Nested
    created_by     : Optional[TicketUserOut] = None
    assigned_to    : Optional[TicketUserOut] = None
 
    class Config:
        from_attributes = True
 