"""
Helpers for ensuring tenant records exist for a given user.
"""

from __future__ import annotations

from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from api.src.infrastructure.persistence.models.tenant import Tenant
from api.src.infrastructure.persistence.models.user import User


async def ensure_tenant_for_user(session: AsyncSession, user: User, *, name: Optional[str] = None) -> Tenant:
    """
    Ensure a Tenant row exists that matches the user's ID.

    The current architecture maps tenant_id = user.id (UUID). Some legacy users
    may not yet have a persisted tenant row, which causes FK violations on the
    calls table. This helper normalizes the UUID, creates the tenant if missing,
    and flushes it so it can be referenced within the same transaction.
    """

    try:
        tenant_id = UUID(str(user.id))
    except ValueError:
        tenant_id = uuid4()

    tenant = await session.get(Tenant, tenant_id)
    if tenant:
        return tenant

    tenant = Tenant(id=tenant_id, name=name or user.name or user.email or "Ava Tenant")
    session.add(tenant)
    await session.flush()
    return tenant


__all__ = ["ensure_tenant_for_user"]
