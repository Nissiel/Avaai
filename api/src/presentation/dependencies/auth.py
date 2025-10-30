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

from ...core.settings import Settings, get_settings
from ...infrastructure.persistence.models.tenant import Tenant
from ...infrastructure.persistence.models.user import User
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


async def _parse_token(token: str, settings: Settings) -> dict:
    """Parse and validate JWT token using settings-based secret.
    
    🔐 DIVINE: Uses Pydantic settings instead of direct os.getenv for consistency.
    """
    secret = settings.jwt_secret_key
    if not secret or secret == "CHANGE_ME_IN_PRODUCTION_USE_ENV_VAR":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="JWT secret not configured. Set AVA_API_JWT_SECRET_KEY environment variable."
        )
    try:
        return jwt.decode(token, secret, algorithms=["HS256"])
    except JWTError as exc:  # pragma: no cover - defensive
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc


async def get_current_tenant(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Security(bearer_scheme)] = None,
    session: Annotated[AsyncSession, Depends(get_session)] = None,
    settings: Annotated[Settings, Depends(get_settings)] = None,
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

    payload = await _parse_token(credentials.credentials, settings)
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


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Security(bearer_scheme)] = None,
    session: Annotated[AsyncSession, Depends(get_session)] = None,
    settings: Annotated[Settings, Depends(get_settings)] = None,
) -> User:
    """
    Resolve the authenticated user from JWT token.
    
    Returns the full User object with vapi_api_key for multi-tenant Vapi operations.
    In DEV mode, returns default dev user if no credentials provided.
    """
    from sqlalchemy import select
    
    # DEV MODE: Get or create default user
    if DEV_MODE and credentials is None:
        result = await session.execute(select(User).limit(1))
        user = result.scalar_one_or_none()
        
        if not user:
            # Create default dev user
            from uuid import uuid4
            user = User(
                id=str(uuid4()),
                email="dev@avaai.com",
                name="Dev User",
                locale="en",
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)
        
        return user
    
    # PRODUCTION: Require auth
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    
    payload = await _parse_token(credentials.credentials, settings)
    user_id_raw = payload.get("sub")
    
    if not user_id_raw:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    
    # Query user by ID
    result = await session.execute(select(User).where(User.id == str(user_id_raw)))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    return user
