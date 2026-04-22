# /backend/app/models/models.py
from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


# ── Enums ─────────────────────────────────────────────────────────────────────

class UserRole(str, Enum):
    SUPERUSER = "superuser"   # AGRI4.0 employee — manages all coops
    ADMIN     = "admin"       # Coop employee — manages users of their coop
    USER      = "user"        # Coop employee — read-only + support


class ConversationStatus(str, Enum):
    OPEN   = "open"
    CLOSED = "closed"


# ── Apiculteur (beekeeping cooperative / client of AGRI4.0) ───────────────────

class Apiculteur(SQLModel, table=True):
    """
    A client beekeeping cooperative.
    NOT a user — a legal entity / enterprise.
    Superusers create and manage these.
    """
    __tablename__ = "apiculteur"

    id           : Optional[int]  = Field(default=None, primary_key=True)
    company_name : str            = Field(index=True)
    email        : Optional[str]  = Field(default=None, index=True)
    phone        : Optional[str]  = Field(default=None)
    region       : Optional[str]  = Field(default=None)
    city         : Optional[str]  = Field(default=None)
    address      : Optional[str]  = Field(default=None)
    is_active    : bool           = Field(default=True)
    created_at   : datetime       = Field(default_factory=_utcnow, index=True)


# ── User (anyone who can log in) ──────────────────────────────────────────────

class User(SQLModel, table=True):
    """
    A person who can log in to the platform.

    - superuser  : apiculteur_id = None  — AGRI4.0 employee, manages all coops
    - admin      : apiculteur_id = X     — Coop employee, manages users of coop X
    - user       : apiculteur_id = X     — Coop employee, read-only in coop X
    """
    __tablename__ = "user"

    id              : Optional[int]  = Field(default=None, primary_key=True)
    email           : str            = Field(unique=True, index=True)
    hashed_password : str
    full_name       : Optional[str]  = Field(default=None)
    phone           : Optional[str]  = Field(default=None)
    location        : Optional[str]  = Field(default=None)  # "Agadir, Souss-Massa"
    role            : UserRole       = Field(default=UserRole.USER, index=True)
    apiculteur_id   : Optional[int]  = Field(
        default=None, foreign_key="apiculteur.id", index=True
    )  # NULL for superusers

    # Login tracking (for "Connexion" + "Engagement" columns in Figma)
    last_login_at   : Optional[datetime] = Field(default=None)
    login_count     : int                = Field(default=0)

    # Notification preferences (Image 4)
    notif_urgent_only : bool = Field(default=True)
    notif_all         : bool = Field(default=True)
    dark_mode         : bool = Field(default=False)

    created_at      : datetime = Field(default_factory=_utcnow, index=True)


# ── Hive ──────────────────────────────────────────────────────────────────────

class Hive(SQLModel, table=True):
    """
    A physical beehive belonging to a cooperative.
    Only superusers can create/edit/delete hives.
    """
    __tablename__ = "hive"

    id            : Optional[int]      = Field(default=None, primary_key=True)
    name          : str                = Field(index=True)
    location_name : Optional[str]      = Field(default=None)
    apiculteur_id : Optional[int]      = Field(
        default=None, foreign_key="apiculteur.id", index=True
    )
    is_active     : bool               = Field(default=True)
    created_at    : datetime           = Field(default_factory=_utcnow, index=True)
    deleted_at    : Optional[datetime] = Field(default=None)


# ── Device ────────────────────────────────────────────────────────────────────

class Device(SQLModel, table=True):
    """One ESP32+LoRa node per hive (1-1 for now)."""
    __tablename__ = "device"

    id           : Optional[int]      = Field(default=None, primary_key=True)
    dev_eui      : str                = Field(index=True, unique=True)
    hive_id      : Optional[int]      = Field(
        default=None, foreign_key="hive.id", index=True
    )
    status       : str                = Field(default="unknown", index=True)
    last_seen_at : Optional[datetime] = Field(default=None)
    created_at   : datetime           = Field(default_factory=_utcnow, index=True)


# ── Measurement ───────────────────────────────────────────────────────────────

class Measurement(SQLModel, table=True):
    __tablename__ = "measurement"

    id            : Optional[int]  = Field(default=None, primary_key=True)
    device_id     : int            = Field(foreign_key="device.id", index=True)
    ts            : datetime       = Field(default_factory=_utcnow, index=True)
    temperature_c : Optional[float] = None
    humidity_pct  : Optional[float] = None
    sound_level   : Optional[int]   = None
    door_open     : Optional[bool]  = None
    gps_lat       : Optional[float] = None
    gps_lng       : Optional[float] = None
    battery_v     : Optional[float] = None
    rssi          : Optional[int]   = None
    snr           : Optional[float] = None


# ── Support ───────────────────────────────────────────────────────────────────

class SupportConversation(SQLModel, table=True):
    """
    One conversation thread between a coop member and AGRI4.0 support.
    - Admin/User opens it.
    - All superusers + admins of that coop can reply.
    - Status: open → closed (via "Clôture de la discussion").
    """
    __tablename__ = "support_conversation"

    id             : Optional[int]       = Field(default=None, primary_key=True)
    created_by_id  : int                 = Field(foreign_key="user.id", index=True)
    apiculteur_id  : int                 = Field(foreign_key="apiculteur.id", index=True)
    status         : ConversationStatus  = Field(
        default=ConversationStatus.OPEN, index=True
    )
    created_at     : datetime            = Field(default_factory=_utcnow, index=True)
    closed_at      : Optional[datetime]  = Field(default=None)
    # Unread counts — incremented on new message, reset on read
    unread_superuser : int = Field(default=0)   # unread by superusers
    unread_user      : int = Field(default=0)   # unread by the opener


class SupportMessage(SQLModel, table=True):
    __tablename__ = "support_message"

    id              : Optional[int] = Field(default=None, primary_key=True)
    conversation_id : int           = Field(
        foreign_key="support_conversation.id", index=True
    )
    sender_id       : int           = Field(foreign_key="user.id", index=True)
    content         : str
    is_read         : bool          = Field(default=False)
    created_at      : datetime      = Field(default_factory=_utcnow, index=True)