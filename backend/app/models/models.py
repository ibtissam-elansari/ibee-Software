from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import CheckConstraint, event, Index
from sqlalchemy.orm import validates
from sqlmodel import Field, SQLModel
from enum import Enum


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
        # superuser has no apiculteur; admin and user always belong to one
        CheckConstraint(
            "(role = 'superuser' AND apiculteur_id IS NULL) OR "
            "(role != 'superuser' AND apiculteur_id IS NOT NULL)",
            name="ck_user_role_apiculteur",
        ),
    )

    @validates("role", "apiculteur_id")
    def validate_role_apiculteur(self, key, value):
        """
        Python-layer guard (fires before flush, gives a readable error
        instead of a cryptic IntegrityError from Postgres).
        """
        role = value if key == "role" else getattr(self, "role", None)
        apiculteur_id = value if key == "apiculteur_id" else getattr(self, "apiculteur_id", None)

        if role is None:
            return value  # not yet set, skip

        role_val = role.value if isinstance(role, UserRole) else role

        if role_val == "superuser" and apiculteur_id is not None:
            raise ValueError("Un superuser ne peut pas appartenir à un apiculteur")
        if role_val != "superuser" and apiculteur_id is None:
            # Only raise when both are fully known (not during partial construction)
            if key == "apiculteur_id":
                raise ValueError("Un admin/user doit appartenir à un apiculteur")

        return value


class Hive(SQLModel, table=True):
    """
    Every active hive must belong to an apiculteur.
    Soft-deleted hives (deleted_at IS NOT NULL) are excluded from
    normal queries via the active_hives partial index.
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
        # Partial index: only live hives are indexed — keeps the index small
        # and makes "list active hives for apiculteur X" fast.
        Index(
            "ix_hive_apiculteur_active",
            "apiculteur_id",
            postgresql_where="deleted_at IS NULL",
        ),
    )

    @validates("apiculteur_id", "deleted_at")
    def validate_active_hive_has_apiculteur(self, key, value):
        deleted_at = value if key == "deleted_at" else getattr(self, "deleted_at", None)
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
    apiculteur_id is denormalized here (device → hive → apiculteur) so that
    access-control queries never need a join. It is set by the webhook handler
    when the measurement is persisted and must never be NULL after insert.
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
    Per-hive alert thresholds set by an admin or superuser.
    Falls back to global defaults when absent.
    Only one active row per hive — upsert on hive_id.
    """
    __tablename__ = "hive_threshold"

    id            : Optional[int]   = Field(default=None, primary_key=True)
    hive_id       : int             = Field(foreign_key="hive.id", unique=True, index=True)
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
    # Metadata
    updated_at     : datetime        = Field(default_factory=_utcnow)
    updated_by_id  : Optional[int]   = Field(default=None, foreign_key="user.id")