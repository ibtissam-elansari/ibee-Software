# backend/app/core/settings.py
from __future__ import annotations

import os
from pydantic import BaseModel


class Settings(BaseModel):
    env: str = os.getenv("ENV", "local")

    # ── Database ────────────────────────────────────────────────────────────
    # Render injecte DATABASE_URL automatiquement depuis render.yaml
    # Format attendu : postgresql+psycopg://user:pass@host:5432/dbname
    database_url: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg://ibee:ibee@localhost:5432/ibee",
    )

    # ── Auth ────────────────────────────────────────────────────────────────
    # Render génère une valeur aléatoire sécurisée via generateValue: true
    secret_key: str = os.getenv("SECRET_KEY", "change-me-in-production")

    # ── CORS ────────────────────────────────────────────────────────────────
    # En production : ton URL Vercel (ex: https://ibee.vercel.app)
    # En local : localhost
    allowed_origins: list[str] = [
        o.strip()
        for o in os.getenv(
            "ALLOWED_ORIGINS",
            "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173",
        ).split(",")
        if o.strip()
    ]

    # ── SSE ─────────────────────────────────────────────────────────────────
    sse_poll_interval: float = float(os.getenv("SSE_POLL_INTERVAL", "2.0"))


settings = Settings()