from __future__ import annotations

import os
from urllib.parse import urlparse, urlunparse, quote
from pydantic import BaseModel


def _fix_db_url(url: str) -> str:
    if not url:
        return url
    normalised = url
    if normalised.startswith("postgres://"):
        normalised = "postgresql" + normalised[len("postgres"):]
    parsed = urlparse(normalised)
    password = parsed.password or ""
    encoded_password = quote(password, safe="")
    username = parsed.username or ""
    host     = parsed.hostname or ""
    port     = f":{parsed.port}" if parsed.port else ""
    netloc   = f"{username}:{encoded_password}@{host}{port}"
    return urlunparse((
        "postgresql+psycopg",
        netloc,
        parsed.path,
        parsed.params,
        parsed.query,
        parsed.fragment,
    ))


class Settings(BaseModel):
    env: str = os.getenv("ENV", "local")

    database_url: str = _fix_db_url(
        os.getenv(
            "DATABASE_URL",
            "postgresql+psycopg://ibee:ibee@localhost:5432/ibee",
        )
    )

    secret_key: str = os.getenv("SECRET_KEY", "change-me-in-production")

    # Explicit origins list (comma-separated in env var)
    allowed_origins: list[str] = [
        o.strip()
        for o in os.getenv(
            "ALLOWED_ORIGINS",
            "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173",
        ).split(",")
        if o.strip()
    ]

    # Set to "true" in Railway to also allow ALL *.vercel.app preview URLs
    allow_vercel_previews: bool = (
        os.getenv("ALLOW_VERCEL_PREVIEWS", "false").lower() == "true"
    )

    sse_poll_interval: float = float(os.getenv("SSE_POLL_INTERVAL", "2.0"))

    kafka_brokers: list[str] = [
        b.strip()
        for b in os.getenv(
            "KAFKA_BROKERS",
            "broker.agri40.ma:19092,broker.agri40.ma:29092,broker.agri40.ma:39092",
        ).split(",")
        if b.strip()
    ]
    kafka_topic:   str  = os.getenv("KAFKA_TOPIC",   "chirpstack.events")
    kafka_enabled: bool = os.getenv("KAFKA_ENABLED", "true").lower() == "true"


settings = Settings()