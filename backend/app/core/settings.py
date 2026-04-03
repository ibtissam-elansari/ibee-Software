from __future__ import annotations

import os

from pydantic import BaseModel


class Settings(BaseModel):
    env: str = os.getenv("ENV", "local")

    # Uses psycopg3 async driver.
    # In docker-compose, set:
    #   DATABASE_URL: postgresql+psycopg://ibee:ibee@db:5432/ibee
    # The +psycopg driver supports both sync and async with psycopg3.
    database_url: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg://ibee:ibee@localhost:5432/ibee",
    )

    # How often (seconds) the SSE stream checks for new data
    sse_poll_interval: float = 2.0


settings = Settings()