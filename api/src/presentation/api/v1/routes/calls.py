"""Calls REST endpoints."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from api.src.infrastructure.database.session import get_session
from api.src.infrastructure.persistence.repositories.call_repository import (
    get_call_by_id,
    get_recent_calls,
)
from api.src.presentation.dependencies.auth import CurrentTenant, get_current_tenant

router = APIRouter(prefix="/calls", tags=["calls"])


@router.get("")
async def list_calls(
    limit: int = Query(50, ge=1, le=200),
    status: Optional[str] = Query(None),
    current: CurrentTenant = Depends(get_current_tenant),
    session: AsyncSession = Depends(get_session),
):
    """
    List recent calls with optional status filter.

    Query params:
    - limit: Max number of calls (1-200)
    - status: Filter by status (in-progress, ended, failed)
    """

    calls = await get_recent_calls(session, tenant_id=str(current.tenant.id), limit=limit)

    if status:
        calls = [call for call in calls if call.status == status]

    return {
        "calls": [
            {
                "id": call.id,
                "assistant_id": call.assistant_id,
                "customer_number": call.customer_number,
                "status": call.status,
                "started_at": call.started_at.isoformat() if call.started_at else None,
                "ended_at": call.ended_at.isoformat() if call.ended_at else None,
                "duration_seconds": call.duration_seconds,
                "cost": call.cost,
                "transcript_preview": call.transcript[:200] if call.transcript else None,
            }
            for call in calls
        ],
        "total": len(calls),
    }


@router.get("/{call_id}")
async def get_call_detail(
    call_id: str,
    current: CurrentTenant = Depends(get_current_tenant),
    session: AsyncSession = Depends(get_session),
):
    """
    Get full call details including transcript.
    """

    call = await get_call_by_id(session, call_id)
    if not call or str(call.tenant_id) != str(current.tenant.id):
        raise HTTPException(status_code=404, detail="Call not found")

    return {
        "id": call.id,
        "assistant_id": call.assistant_id,
        "customer_number": call.customer_number,
        "status": call.status,
        "started_at": call.started_at.isoformat() if call.started_at else None,
        "ended_at": call.ended_at.isoformat() if call.ended_at else None,
        "duration_seconds": call.duration_seconds,
        "cost": call.cost,
        "transcript": call.transcript,
        "metadata": call.metadata,
        "recording_url": call.metadata.get("recordingUrl") if isinstance(call.metadata, dict) else None,
    }


@router.get("/{call_id}/recording")
async def get_call_recording(
    call_id: str,
    current: CurrentTenant = Depends(get_current_tenant),
    session: AsyncSession = Depends(get_session),
):
    """
    Get recording URL for a call.
    """

    call = await get_call_by_id(session, call_id)
    if not call or str(call.tenant_id) != str(current.tenant.id):
        raise HTTPException(status_code=404, detail="Call not found")

    recording_url = call.metadata.get("recordingUrl") if isinstance(call.metadata, dict) else None
    if not recording_url:
        raise HTTPException(status_code=404, detail="Recording not available")

    return {"recording_url": recording_url}


__all__ = ["router"]
