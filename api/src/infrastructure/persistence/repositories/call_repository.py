"""
Repository functions for persisting and querying call records.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Iterable, Optional, Sequence

from uuid import UUID

from sqlalchemy import Select, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.src.infrastructure.persistence.models.call import CallRecord

logger = logging.getLogger(__name__)


def _coerce_user_id(value) -> str | None:
    """Normalize user identifiers to strings for VARCHAR columns."""

    if value is None:
        return None
    if isinstance(value, UUID):
        return str(value)
    if isinstance(value, str):
        return value
    return str(value)


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
    user_id: Optional[str] = None,
    since: datetime | None = None,
    limit: int = 100,
) -> Sequence[CallRecord]:
    """Return recent calls ordered by start time."""

    query: Select[tuple[CallRecord]] = select(CallRecord).order_by(CallRecord.started_at.desc())
    user_filter = _coerce_user_id(user_id)
    if user_filter:
        query = query.where(CallRecord.user_id == user_filter)
    if since:
        query = query.where(CallRecord.started_at >= since)
    if limit:
        query = query.limit(limit)

    result = await session.execute(query)
    return result.scalars().all()


async def get_calls_in_range(
    session: AsyncSession,
    *,
    user_id,
    start: datetime,
    end: datetime,
) -> Sequence[CallRecord]:
    """Return calls within a date range for analytics."""

    user_filter = _coerce_user_id(user_id)
    query: Select[tuple[CallRecord]] = (
        select(CallRecord)
        .where(CallRecord.user_id == user_filter)
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


async def delete_call_record(session: AsyncSession, call_id: str, user_id: str) -> bool:
    """Delete a call record if it belongs to the user."""

    logger.debug("Attempting to delete call: call_id=%s, user_id=%s", call_id, user_id)

    # Try to find by ID first
    call = await session.get(CallRecord, call_id)

    if not call:
        # If not found by direct get, try query (maybe ID has extra chars)
        logger.debug("Call not found by session.get(), trying stripped query")
        stmt = select(CallRecord).where(CallRecord.id == call_id.strip())
        result = await session.execute(stmt)
        call = result.scalar_one_or_none()

    if not call:
        logger.debug("Call %s not found in database", call_id)
        return False

    logger.debug("Found call: id=%s, user_id=%s", call.id, call.user_id)

    # Compare user IDs as strings to avoid UUID vs str mismatch
    if str(call.user_id) != str(user_id):
        logger.warning("User ID mismatch: call.user_id=%s, requested user_id=%s", call.user_id, user_id)
        return False

    await session.delete(call)
    await session.commit()
    logger.debug("Call %s deleted successfully", call_id)
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
