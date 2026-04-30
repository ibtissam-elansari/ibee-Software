from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import validates, relationship
from sqlmodel import Field, SQLModel
from enum import Enum
from sqlalchemy import (
    BigInteger, Boolean, Column, DateTime, Enum as SAEnum,
    ForeignKey, Integer, String, Text, CheckConstraint, Index
)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class UserRole(str, Enum):
    USER      = "user"
    ADMIN     = "admin"
    SUPERUSER = "superuser"


class Apiculteur(SQLModel, table=True):
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
    superuser  → apiculteur_id must be NULL
    admin/user → apiculteur_id must NOT be NULL
    Enforced at DB level via CHECK constraint.
    """
    __tablename__ = "user"

    id              : Optional[int]  = Field(default=None, primary_key=True)
    email           : str            = Field(unique=True, index=True)
    hashed_password : str
    role            : UserRole       = Field(default=UserRole.USER)
    apiculteur_id   : Optional[int]  = Field(
        default=None,
        foreign_key="apiculteur.id",
        index=True,
    )
    created_at      : datetime       = Field(default_factory=_utcnow, index=True)

    __table_args__ = (
        CheckConstraint(
            "(role = 'superuser' AND apiculteur_id IS NULL) OR "
            "(role != 'superuser' AND apiculteur_id IS NOT NULL)",
            name="ck_user_role_apiculteur",
        ),
    )

    @validates("role", "apiculteur_id")
    def validate_role_apiculteur(self, key, value):
        role          = value if key == "role"          else getattr(self, "role", None)
        apiculteur_id = value if key == "apiculteur_id" else getattr(self, "apiculteur_id", None)

        if role is None:
            return value

        role_val = role.value if isinstance(role, UserRole) else role

        if role_val == "superuser" and apiculteur_id is not None:
            raise ValueError("Un superuser ne peut pas appartenir à un apiculteur")
        if role_val != "superuser" and apiculteur_id is None:
            if key == "apiculteur_id":
                raise ValueError("Un admin/user doit appartenir à un apiculteur")

        return value


class Hive(SQLModel, table=True):
    """
    Every active hive must belong to an apiculteur.
    Soft-deleted hives (deleted_at IS NOT NULL) are excluded from normal queries.
    """
    __tablename__ = "hive"

    id            : Optional[int]      = Field(default=None, primary_key=True)
    name          : str                = Field(index=True)
    location_name : Optional[str]      = Field(default=None)
    apiculteur_id : Optional[int]      = Field(
        default=None,
        foreign_key="apiculteur.id",
        index=True,
    )
    is_active     : bool               = Field(default=True)
    created_at    : datetime           = Field(default_factory=_utcnow, index=True)
    deleted_at    : Optional[datetime] = Field(default=None)

    __table_args__ = (
        CheckConstraint(
            "deleted_at IS NOT NULL OR apiculteur_id IS NOT NULL",
            name="ck_hive_active_needs_apiculteur",
        ),
        Index(
            "ix_hive_apiculteur_active",
            "apiculteur_id",
            postgresql_where="deleted_at IS NULL",
        ),
    )

    @validates("apiculteur_id", "deleted_at")
    def validate_active_hive_has_apiculteur(self, key, value):
        deleted_at    = value if key == "deleted_at"    else getattr(self, "deleted_at", None)
        apiculteur_id = value if key == "apiculteur_id" else getattr(self, "apiculteur_id", None)

        if deleted_at is None and apiculteur_id is None and key == "apiculteur_id":
            raise ValueError("Une ruche active doit appartenir à un apiculteur")

        return value


class Device(SQLModel, table=True):
    __tablename__ = "device"

    id           : Optional[int]      = Field(default=None, primary_key=True)
    dev_eui      : str                = Field(index=True, unique=True)
    hive_id      : Optional[int]      = Field(default=None, foreign_key="hive.id", index=True)
    status       : str                = Field(default="unknown", index=True)
    last_seen_at : Optional[datetime] = Field(default=None, index=True)
    created_at   : datetime           = Field(default_factory=_utcnow, index=True)


class Measurement(SQLModel, table=True):
    """
    One row per sensor reading.  apiculteur_id is denormalized so access-control
    queries never need a join.

    weight_kg — optional load-cell reading in kilograms.  NULL when the hardware
    does not include a scale (older hive versions).
    """
    __tablename__ = "measurement"

    id            : Optional[int] = Field(default=None, primary_key=True)
    device_id     : int           = Field(foreign_key="device.id", index=True)
    apiculteur_id : Optional[int] = Field(
        default=None,
        foreign_key="apiculteur.id",
        index=True,
    )
    ts            : datetime      = Field(default_factory=_utcnow, index=True)

    temperature_c : Optional[float] = None
    humidity_pct  : Optional[float] = None
    sound_level   : Optional[int]   = None
    door_open     : Optional[bool]  = None
    weight_kg     : Optional[float] = None   # ← hive scale reading (NEW)

    gps_lat   : Optional[float] = None
    gps_lng   : Optional[float] = None
    battery_v : Optional[float] = None

    rssi : Optional[int]   = None
    snr  : Optional[float] = None

    __table_args__ = (
        # Composite index for the most common query:
        # "give me all measurements for apiculteur X in time range T"
        Index("ix_measurement_apiculteur_ts", "apiculteur_id", "ts"),
    )


class HiveThreshold(SQLModel, table=True):
    """
    Per-hive alert thresholds set by admin or superuser.
    Falls back to global defaults when absent.
    Only one row per hive — upsert on hive_id.

    weight_drop_kg: alert when the hive loses more than this many kg
    within a rolling 24-hour window. NULL = weight alerting disabled.
    """
    __tablename__ = "hive_threshold"

    id             : Optional[int]   = Field(default=None, primary_key=True)
    hive_id        : int             = Field(foreign_key="hive.id", unique=True, index=True)
    # Temperature
    temp_attention : Optional[float] = Field(default=35.0)
    temp_urgente   : Optional[float] = Field(default=40.0)
    # Humidity
    hum_attention  : Optional[float] = Field(default=70.0)
    hum_urgente    : Optional[float] = Field(default=80.0)
    # Battery (alert when BELOW this value)
    battery_v      : Optional[float] = Field(default=3.5)
    # Sound (alert when ABOVE this value)
    sound_level    : Optional[int]   = Field(default=80)
    # Weight drop alert (alert when daily loss EXCEEDS this value in kg) (NEW)
    weight_drop_kg : Optional[float] = Field(default=None)
    # Metadata
    updated_at     : datetime        = Field(default_factory=_utcnow)
    updated_by_id  : Optional[int]   = Field(default=None, foreign_key="user.id")

    # ------ support --------

class TicketType(str, Enum):
    bug         = "bug"
    assistance  = "assistance"
    amelioration = "amelioration"
    urgence     = "urgence"
 
 
class TicketStatus(str, Enum):
    ouvert     = "ouvert"
    en_cours   = "en_cours"
    resolu     = "resolu"
    ferme      = "ferme"
 
 
class TicketPriority(str, Enum):
    basse   = "basse"
    normale = "normale"
    haute   = "haute"
    urgente = "urgente"
 
 
class SupportTicket(Base):  # noqa: F821 — Base is defined in models.py
    __tablename__ = "support_tickets"
 
    id             = Column(Integer, primary_key=True, index=True)
    title          = Column(String(200), nullable=False)
    description    = Column(Text, nullable=False)
    type           = Column(SAEnum(TicketType),     nullable=False, default=TicketType.assistance)
    status         = Column(SAEnum(TicketStatus),   nullable=False, default=TicketStatus.ouvert)
    priority       = Column(SAEnum(TicketPriority), nullable=False, default=TicketPriority.normale)
 
    # Who created it
    created_by_id      = Column(Integer, ForeignKey("users.id"), nullable=False)
    apiculteur_id      = Column(Integer, ForeignKey("apiculteurs.id"), nullable=True)
 
    # Superuser who handles it
    assigned_to_id     = Column(Integer, ForeignKey("users.id"), nullable=True)
 
    # Superuser response
    response           = Column(Text, nullable=True)
    responded_at       = Column(DateTime(timezone=True), nullable=True)
 
    created_at         = Column(DateTime(timezone=True), server_default="now()", nullable=False)
    updated_at         = Column(DateTime(timezone=True), server_default="now()", onupdate="now()", nullable=False)
    closed_at          = Column(DateTime(timezone=True), nullable=True)
 
    # Relationships
    created_by         = relationship("User", foreign_keys=[created_by_id])
    assigned_to        = relationship("User", foreign_keys=[assigned_to_id])
    apiculteur         = relationship("Apiculteur", foreign_keys=[apiculteur_id])
 