"""Calls REST endpoints."""

from __future__ import annotations

from typing import Optional
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from api.src.infrastructure.database.session import get_session
from api.src.infrastructure.persistence.repositories.call_repository import (
    delete_call_record,
    get_call_by_id,
    get_recent_calls,
    scrub_transcript_if_expired,
)
from api.src.presentation.dependencies.auth import CurrentTenant, get_current_tenant

router = APIRouter(prefix="/calls", tags=["calls"])
TRANSCRIPT_RETENTION = timedelta(hours=24)


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
    now_utc = datetime.now(timezone.utc)
    scrubbed = False
    for call in calls:
        scrubbed |= await scrub_transcript_if_expired(
            session,
            call,
            now=now_utc,
            retention=TRANSCRIPT_RETENTION,
        )

    if scrubbed:
        await session.commit()

    if status:
        calls = [call for call in calls if call.status == status]

    return {
        "calls": [
            {
                "id": call.id,
                "assistantId": call.assistant_id,
                "customerNumber": call.customer_number,
                "status": call.status,
                "startedAt": call.started_at.isoformat() if call.started_at else None,
                "endedAt": call.ended_at.isoformat() if call.ended_at else None,
                "durationSeconds": call.duration_seconds,
                "cost": call.cost,
                "transcriptPreview": call.transcript[:200] if call.transcript else None,
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

    scrubbed = await scrub_transcript_if_expired(
        session,
        call,
        now=datetime.now(timezone.utc),
        retention=TRANSCRIPT_RETENTION,
    )
    if scrubbed:
        await session.commit()

    return {
        "id": call.id,
        "assistantId": call.assistant_id,
        "customerNumber": call.customer_number,
        "status": call.status,
        "startedAt": call.started_at.isoformat() if call.started_at else None,
        "endedAt": call.ended_at.isoformat() if call.ended_at else None,
        "durationSeconds": call.duration_seconds,
        "cost": call.cost,
        "transcript": call.transcript,
        "metadata": call.meta,
        "recordingUrl": call.meta.get("recordingUrl") if isinstance(call.meta, dict) else None,
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

    recording_url = call.meta.get("recordingUrl") if isinstance(call.meta, dict) else None
    if not recording_url:
        raise HTTPException(status_code=404, detail="Recording not available")

    return {"recording_url": recording_url}


@router.delete("/{call_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_call(
    call_id: str,
    current: CurrentTenant = Depends(get_current_tenant),
    session: AsyncSession = Depends(get_session),
):
    """
    Permanently delete a call and its associated transcript/metadata.
    """

    deleted = await delete_call_record(session, call_id, str(current.tenant.id))
    if not deleted:
        raise HTTPException(status_code=404, detail="Call not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


__all__ = ["router"]
