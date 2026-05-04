# backend/app/core/settings.py
from __future__ import annotations

import os
from pydantic import BaseModel


def _fix_db_url(url: str) -> str:
    """
    Railway (et d'autres services) injectent DATABASE_URL au format :
      postgresql://user:pass@host:5432/db
    ou
      postgres://user:pass@host:5432/db

    SQLAlchemy avec psycopg3 (async) exige le préfixe :
      postgresql+psycopg://...

    Cette fonction corrige automatiquement le préfixe quel que soit
    le format fourni par la plateforme.
    """
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg://", 1)
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    # Déjà au bon format ou URL locale — on laisse tel quel
    return url


class Settings(BaseModel):
    env: str = os.getenv("ENV", "local")

    # ── Database ─────────────────────────────────────────────────────────────
    # Railway injecte DATABASE_URL au format postgresql:// ou postgres://
    # _fix_db_url() le convertit en postgresql+psycopg:// pour psycopg3 async
    database_url: str = _fix_db_url(
        os.getenv(
            "DATABASE_URL",
            "postgresql+psycopg://ibee:ibee@localhost:5432/ibee",
        )
    )

    # ── Auth ──────────────────────────────────────────────────────────────────
    secret_key: str = os.getenv("SECRET_KEY", "change-me-in-production")

    # ── CORS ──────────────────────────────────────────────────────────────────
    allowed_origins: list[str] = [
        o.strip()
        for o in os.getenv(
            "ALLOWED_ORIGINS",
            "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173",
        ).split(",")
        if o.strip()
    ]

    # ── SSE ───────────────────────────────────────────────────────────────────
    sse_poll_interval: float = float(os.getenv("SSE_POLL_INTERVAL", "2.0"))


settings = Settings()
