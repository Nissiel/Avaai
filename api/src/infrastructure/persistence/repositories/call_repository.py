"""
Repository functions for persisting and querying call records.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Iterable, Optional, Sequence

from sqlalchemy import Select, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.src.infrastructure.persistence.models.call import CallRecord


async def upsert_calls(session: AsyncSession, calls: Iterable[CallRecord]) -> None:
    """Persist a collection of call records, merging on primary key."""

    for call in calls:
        existing = await session.get(CallRecord, call.id)
        if existing:
            existing.update_from_payload(call.meta)
        else:
            session.add(call)

    await session.commit()


async def get_recent_calls(
    session: AsyncSession,
    *,
    tenant_id: Optional[str] = None,
    since: datetime | None = None,
    limit: int = 100,
) -> Sequence[CallRecord]:
    """Return recent calls ordered by start time."""

    query: Select[tuple[CallRecord]] = select(CallRecord).order_by(CallRecord.started_at.desc())
    if tenant_id:
        query = query.where(CallRecord.tenant_id == tenant_id)
    if since:
        query = query.where(CallRecord.started_at >= since)
    if limit:
        query = query.limit(limit)

    result = await session.execute(query)
    return result.scalars().all()


async def get_calls_in_range(
    session: AsyncSession,
    *,
    tenant_id,
    start: datetime,
    end: datetime,
) -> Sequence[CallRecord]:
    """Return calls within a date range for analytics."""

    query: Select[tuple[CallRecord]] = (
        select(CallRecord)
        .where(CallRecord.tenant_id == tenant_id)
        .where(CallRecord.started_at >= start)
        .where(CallRecord.started_at <= end)
    )

    result = await session.execute(query.order_by(CallRecord.started_at.desc()))
    return result.scalars().all()


async def prune_old_calls(session: AsyncSession, *, before: datetime) -> int:
    """Optionally remove very old call metadata."""

    query = select(CallRecord).where(CallRecord.started_at < before)
    result = await session.execute(query)
    records = result.scalars().all()
    deleted = len(records)
    for record in records:
        await session.delete(record)
    await session.commit()
    return deleted


async def get_call_by_id(session: AsyncSession, call_id: str) -> CallRecord | None:
    """Retrieve a call by its identifier."""

    return await session.get(CallRecord, call_id)


async def delete_call_record(session: AsyncSession, call_id: str, tenant_id: str) -> bool:
    """Delete a call record if it belongs to the tenant."""

    call = await session.get(CallRecord, call_id)
    if not call or str(call.tenant_id) != str(tenant_id):
        return False

    await session.delete(call)
    await session.commit()
    return True


async def scrub_transcript_if_expired(
    session: AsyncSession,
    call: CallRecord,
    *,
    now: datetime,
    retention: timedelta,
) -> bool:
    """
    Remove transcript if older than the retention window.

    Returns True if the transcript was scrubbed.
    """

    if not call.transcript or not call.started_at:
        return False

    started_at = call.started_at
    if started_at.tzinfo is None:
        started_at = started_at.replace(tzinfo=timezone.utc)
    else:
        started_at = started_at.astimezone(timezone.utc)

    if started_at <= now - retention:
        call.transcript = None
        await session.flush()
        return True

    return False


__all__ = [
    "CallRecord",
    "upsert_calls",
    "get_recent_calls",
    "get_calls_in_range",
    "get_call_by_id",
    "prune_old_calls",
    "delete_call_record",
    "scrub_transcript_if_expired",
]
