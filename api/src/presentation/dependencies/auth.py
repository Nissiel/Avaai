"""
Authentication dependencies for Ava API.

Provides `get_current_user()` dependency that validates Supabase JWT tokens
and returns the authenticated User object for multi-tenant operations.

NOTE: This is Supabase-only authentication. Legacy JWT support has been removed.
"""

from __future__ import annotations

import os
import logging
from typing import Annotated

from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.settings import Settings, get_settings
from ...infrastructure.persistence.models.user import User
from ...infrastructure.database.session import get_session
from ...infrastructure.persistence.repositories.user_repository import UserRepository

logger = logging.getLogger(__name__)

# Development mode: Optional auth for local testing
# SECURITY WARNING: This completely bypasses authentication!
DEV_MODE = os.getenv("ENVIRONMENT", "development") == "development"

# Log warning if dev mode is enabled
if DEV_MODE:
    logger.warning(
        "⚠️  SECURITY WARNING: Running in DEVELOPMENT mode - authentication is DISABLED! "
        "Set ENVIRONMENT=production to enable authentication."
    )

bearer_scheme = HTTPBearer(auto_error=not DEV_MODE)


async def _parse_supabase_token(token: str, settings: Settings) -> dict:
    """
    Decode and validate a Supabase JWT token.

    Raises HTTPException on failure.
    """
    if not settings.supabase_auth_enabled:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase Auth is not enabled. Set ENABLE_SUPABASE_AUTH=true."
        )

    if not settings.supabase_jwt_secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase JWT secret not configured. Set SUPABASE_JWT_SECRET environment variable."
        )

    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            options={"verify_aud": False},  # Supabase uses multiple audiences (authenticated/service_role)
        )
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        ) from exc

    # Validate this is a Supabase token
    iss = (payload.get("iss") or "").lower()
    aud = payload.get("aud")

    if "supabase" not in iss and "gotrue" not in iss:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token issuer"
        )

    if aud and aud not in {"authenticated", "service_role"}:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token audience"
        )

    return payload


async def _resolve_supabase_user(payload: dict, repository: UserRepository) -> User:
    """Map Supabase JWT payload to a local User (link or create)."""
    supabase_user_id = payload.get("sub")
    email = payload.get("email")

    if not supabase_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Supabase token (missing sub)",
        )

    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Supabase token missing email claim",
        )

    user_metadata = payload.get("user_metadata") or {}
    name = user_metadata.get("full_name") or user_metadata.get("name")
    locale = user_metadata.get("locale") or "en"

    try:
        return await repository.get_or_create_by_supabase(
            supabase_user_id=supabase_user_id,
            email=email,
            name=name,
            locale=locale,
        )
    except Exception as exc:  # pragma: no cover - defensive
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to resolve Supabase user",
        ) from exc


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Security(bearer_scheme)] = None,
    session: Annotated[AsyncSession, Depends(get_session)] = None,
    settings: Annotated[Settings, Depends(get_settings)] = None,
) -> User:
    """
    Resolve the authenticated user from JWT token (Supabase or Custom).

    Returns the full User object for multi-tenant operations.
    In DEV mode, returns default dev user if no credentials provided.

    Supports both:
    - Supabase Auth JWT (when AVA_API_SUPABASE_AUTH_ENABLED=true)
    - Custom JWT (when AVA_API_SUPABASE_AUTH_ENABLED=false)
    """
    from sqlalchemy import select
    repository = UserRepository(session)

    # DEV MODE: Get or create default user
    # SECURITY WARNING: This bypasses authentication completely!
    if DEV_MODE and credentials is None:
        logger.warning("🔓 DEV MODE: Bypassing authentication - returning dev user")

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
            logger.info("Created default dev user: %s", user.email)

        return user

    # PRODUCTION: Require auth
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")

    # Choose authentication method based on settings
    if settings.supabase_auth_enabled:
        # Supabase Auth: Parse and validate Supabase JWT token
        supabase_payload = await _parse_supabase_token(credentials.credentials, settings)
        return await _resolve_supabase_user(supabase_payload, repository)
    else:
        # Custom JWT: Parse and validate custom JWT token
        try:
            payload = jwt.decode(
                credentials.credentials,
                settings.jwt_secret_key,
                algorithms=["HS256"],
            )
        except JWTError as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token"
            ) from exc

        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token (missing sub)"
            )

        user = await repository.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        return user
