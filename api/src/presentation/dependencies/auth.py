"""
Authentication and authorisation dependencies for Ava tenant endpoints.

These helpers assume JWT authentication where the token contains:
    - `sub`: user identifier
    - `tenant_id`: UUID referencing the tenant
    - `roles`: list of role strings (e.g., ["owner", "admin"])

The dependency validates the token, loads the tenant, and enforces RBAC.
"""

from __future__ import annotations

import os
import uuid
from dataclasses import dataclass
from typing import Annotated, Iterable

from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession

from ...infrastructure.persistence.models.tenant import Tenant
from ...infrastructure.database.session import get_session

# Development mode: Optional auth for local testing
DEV_MODE = os.getenv("ENVIRONMENT", "development") == "development"

bearer_scheme = HTTPBearer(auto_error=not DEV_MODE)


class Role:
    OWNER = "owner"
    ADMIN = "admin"
    VIEWER = "viewer"


@dataclass
class CurrentTenant:
    """Represents the authenticated tenant and user roles."""

    tenant: Tenant
    roles: set[str]
    user_id: uuid.UUID

    def require_roles(self, allowed: Iterable[str]) -> None:
        if not any(role in self.roles for role in allowed):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role")


async def _parse_token(token: str) -> dict:
    secret = os.getenv("JWT_SECRET")
    if not secret:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Missing JWT secret")
    try:
        return jwt.decode(token, secret, algorithms=["HS256"])
    except JWTError as exc:  # pragma: no cover - defensive
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc


async def get_current_tenant(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Security(bearer_scheme)] = None,
    session: Annotated[AsyncSession, Depends(get_session)] = None,
) -> CurrentTenant:
    """Resolve the tenant and enforce owner/admin RBAC.
    
    In DEV mode, if no credentials provided, uses default tenant for testing.
    """
    
    # DEV MODE: Create/use default tenant if no auth
    if DEV_MODE and credentials is None:
        return await _get_dev_tenant(session)
    
    # PRODUCTION: Require auth
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")

    payload = await _parse_token(credentials.credentials)
    tenant_id_raw = payload.get("tenant_id")
    user_id_raw = payload.get("sub")
    roles = set(payload.get("roles") or [])

    if not tenant_id_raw or not user_id_raw:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    try:
        tenant_id = uuid.UUID(str(tenant_id_raw))
        user_id = uuid.UUID(str(user_id_raw))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Malformed token identifiers") from exc

    tenant = await session.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant not found")

    current = CurrentTenant(tenant=tenant, roles=roles, user_id=user_id)
    current.require_roles({Role.OWNER, Role.ADMIN})
    return current


async def _get_dev_tenant(session: AsyncSession) -> CurrentTenant:
    """Get or create default dev tenant for local testing."""
    from sqlalchemy import select
    
    # Try to get first tenant
    result = await session.execute(select(Tenant).limit(1))
    tenant = result.scalar_one_or_none()
    
    # Create default if none exists
    if not tenant:
        tenant = Tenant(
            id=uuid.UUID("00000000-0000-0000-0000-000000000001"),
            name="Dev Tenant",
        )
        session.add(tenant)
        await session.commit()
        await session.refresh(tenant)
    
    return CurrentTenant(
        tenant=tenant,
        roles={Role.OWNER, Role.ADMIN},
        user_id=uuid.UUID("00000000-0000-0000-0000-000000000001"),
    )
