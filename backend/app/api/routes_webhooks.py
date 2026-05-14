from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.engine import get_session
from app.services.uplink import process_uplink

router = APIRouter()


@router.post("/chirpstack/uplink")
async def chirpstack_uplink(
    payload : dict[str, Any],
    session : AsyncSession = Depends(get_session),
) -> dict:
    """
    Receives ChirpStack v4 HTTP integration uplink events.

    Acts as a fallback / testing path — the primary ingestion path is Kafka.
    Accepts the same payload shape ChirpStack sends to Kafka so the two paths
    are fully interchangeable.
    """
    return await process_uplink(payload, session)