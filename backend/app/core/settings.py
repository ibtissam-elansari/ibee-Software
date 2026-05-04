# backend/app/core/settings.py
from __future__ import annotations

import os
from urllib.parse import urlparse, urlunparse, quote

from pydantic import BaseModel


def _fix_db_url(url: str) -> str:
    """
    Fixes two issues with Railway-injected DATABASE_URL:

    1. Wrong scheme: converts postgres:// or postgresql:// → postgresql+psycopg://
    2. Special characters in password (@, +, #, %, etc.) that break URL parsing.

    Strategy: parse the URL, percent-encode the password, rebuild cleanly.
    """
    if not url:
        return url

    # Step 1 — normalise scheme so urlparse can handle it
    normalised = url
    if normalised.startswith("postgres://"):
        normalised = "postgresql" + normalised[len("postgres"):]
    # Now it starts with postgresql://

    # Step 2 — parse
    parsed = urlparse(normalised)

    # Step 3 — encode password (handles @, +, #, %, spaces, etc.)
    password = parsed.password or ""
    encoded_password = quote(password, safe="")

    # Step 4 — rebuild netloc with encoded password
    username = parsed.username or ""
    host     = parsed.hostname or ""
    port     = f":{parsed.port}" if parsed.port else ""
    netloc   = f"{username}:{encoded_password}@{host}{port}"

    # Step 5 — rebuild full URL with correct async scheme
    fixed = urlunparse((
        "postgresql+psycopg",   # scheme
        netloc,
        parsed.path,
        parsed.params,
        parsed.query,
        parsed.fragment,
    ))

    return fixed


class Settings(BaseModel):
    env: str = os.getenv("ENV", "local")

    database_url: str = _fix_db_url(
        os.getenv(
            "DATABASE_URL",
            "postgresql+psycopg://ibee:ibee@localhost:5432/ibee",
        )
    )

    secret_key: str = os.getenv("SECRET_KEY", "change-me-in-production")

    allowed_origins: list[str] = [
        o.strip()
        for o in os.getenv(
            "ALLOWED_ORIGINS",
            "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173",
        ).split(",")
        if o.strip()
    ]

    sse_poll_interval: float = float(os.getenv("SSE_POLL_INTERVAL", "2.0"))


settings = Settings()