"""
app/api/routes_support.py
─────────────────────────
Support ticket endpoints.

Role matrix
-----------
  admin / user  → create, list-own, get-own, update-own (while ouvert)
  superuser     → list-all (with filters), get-any, respond, patch-status, delete
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.schemas import (
    SupportTicketCreate,
    SupportTicketOut,
    SupportTicketRespond,
    SupportTicketStatusPatch,
    SupportTicketUpdate,
)
from app.core.dependencies import get_current_user, require_min_role
from app.db.engine import get_session
from app.models.models import SupportTicket, TicketStatus

router = APIRouter(prefix="/support", tags=["support"])


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _ticket_query_with_relations():
    return (
        select(SupportTicket)
        .options(
            selectinload(SupportTicket.created_by),
            selectinload(SupportTicket.assigned_to),
        )
    )


async def _get_ticket_or_404(ticket_id: int, session: AsyncSession) -> SupportTicket:
    row = (await session.execute(
        _ticket_query_with_relations()
        .where(SupportTicket.id == ticket_id)
    )).scalars().first()
    if not row:
        raise HTTPException(status_code=404, detail="Ticket introuvable")
    return row


# ── CREATE ────────────────────────────────────────────────────────────────────

@router.post("", response_model=SupportTicketOut, status_code=201)
async def create_ticket(
    payload : SupportTicketCreate,
    session : AsyncSession = Depends(get_session),
    current : dict         = Depends(get_current_user),
):
    ticket = SupportTicket(
        **payload.model_dump(),
        created_by_id = current["user_id"],
        apiculteur_id = current.get("apiculteur_id"),
        status        = TicketStatus.ouvert,
    )
    session.add(ticket)
    await session.commit()
    await session.refresh(ticket)
    # reload with relations
    return await _get_ticket_or_404(ticket.id, session)


# ── LIST ──────────────────────────────────────────────────────────────────────

@router.get("", response_model=List[SupportTicketOut])
async def list_tickets(
    status        : Optional[TicketStatus] = Query(default=None),
    type          : Optional[str]          = Query(default=None),
    priority      : Optional[str]          = Query(default=None),
    apiculteur_id : Optional[int]          = Query(default=None),
    skip          : int                    = Query(default=0, ge=0),
    limit         : int                    = Query(default=50, ge=1, le=200),
    session       : AsyncSession           = Depends(get_session),
    current       : dict                   = Depends(get_current_user),
):
    q = _ticket_query_with_relations()

    if current["role"] != "superuser":
        # Regular users only see their own tickets
        q = q.where(SupportTicket.created_by_id == current["user_id"])
    else:
        # Superuser can filter by cooperative
        if apiculteur_id is not None:
            q = q.where(SupportTicket.apiculteur_id == apiculteur_id)

    if status is not None:
        q = q.where(SupportTicket.status == status)
    if type is not None:
        q = q.where(SupportTicket.type == type)
    if priority is not None:
        q = q.where(SupportTicket.priority == priority)

    q = q.order_by(SupportTicket.created_at.desc()).offset(skip).limit(limit)
    rows = (await session.execute(q)).scalars().all()
    return rows


# ── GET ONE ───────────────────────────────────────────────────────────────────

@router.get("/{ticket_id}", response_model=SupportTicketOut)
async def get_ticket(
    ticket_id : int,
    session   : AsyncSession = Depends(get_session),
    current   : dict         = Depends(get_current_user),
):
    ticket = await _get_ticket_or_404(ticket_id, session)
    if current["role"] != "superuser" and ticket.created_by_id != current["user_id"]:
        raise HTTPException(status_code=403, detail="Accès refusé")
    return ticket


# ── UPDATE (owner, while open) ────────────────────────────────────────────────

@router.patch("/{ticket_id}", response_model=SupportTicketOut)
async def update_ticket(
    ticket_id : int,
    payload   : SupportTicketUpdate,
    session   : AsyncSession = Depends(get_session),
    current   : dict         = Depends(get_current_user),
):
    ticket = await _get_ticket_or_404(ticket_id, session)

    if current["role"] != "superuser":
        if ticket.created_by_id != current["user_id"]:
            raise HTTPException(status_code=403, detail="Accès refusé")
        if ticket.status != TicketStatus.ouvert:
            raise HTTPException(
                status_code=400,
                detail="Seuls les tickets ouverts peuvent être modifiés"
            )

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(ticket, field, value)

    ticket.updated_at = _utcnow()
    session.add(ticket)
    await session.commit()
    return await _get_ticket_or_404(ticket_id, session)


# ── RESPOND (superuser only) ──────────────────────────────────────────────────

@router.post("/{ticket_id}/respond", response_model=SupportTicketOut)
async def respond_to_ticket(
    ticket_id : int,
    payload   : SupportTicketRespond,
    session   : AsyncSession = Depends(get_session),
    current   : dict         = Depends(require_min_role("superuser")),
):
    ticket = await _get_ticket_or_404(ticket_id, session)

    ticket.response       = payload.response
    ticket.status         = payload.status
    ticket.responded_at   = _utcnow()
    ticket.updated_at     = _utcnow()
    ticket.assigned_to_id = current["user_id"]

    if payload.priority is not None:
        ticket.priority = payload.priority

    if payload.status in (TicketStatus.resolu, TicketStatus.ferme):
        ticket.closed_at = _utcnow()

    session.add(ticket)
    await session.commit()
    return await _get_ticket_or_404(ticket_id, session)


# ── PATCH STATUS (superuser only) ─────────────────────────────────────────────

@router.patch("/{ticket_id}/status", response_model=SupportTicketOut)
async def patch_ticket_status(
    ticket_id : int,
    payload   : SupportTicketStatusPatch,
    session   : AsyncSession = Depends(get_session),
    current   : dict         = Depends(require_min_role("superuser")),
):
    ticket = await _get_ticket_or_404(ticket_id, session)

    ticket.status     = payload.status
    ticket.updated_at = _utcnow()

    if payload.status in (TicketStatus.resolu, TicketStatus.ferme):
        ticket.closed_at = _utcnow()
    else:
        ticket.closed_at = None

    session.add(ticket)
    await session.commit()
    return await _get_ticket_or_404(ticket_id, session)


# ── DELETE (superuser only) ───────────────────────────────────────────────────

@router.delete("/{ticket_id}", status_code=204)
async def delete_ticket(
    ticket_id : int,
    session   : AsyncSession = Depends(get_session),
    current   : dict         = Depends(require_min_role("superuser")),
):
    ticket = await _get_ticket_or_404(ticket_id, session)
    await session.delete(ticket)
    await session.commit()