"""
Authentication dependencies for Ava API.

Provides `get_current_user()` dependency that validates JWT tokens and returns
the authenticated User object with vapi_api_key for multi-tenant operations.
"""

from __future__ import annotations

import os
from typing import Annotated

from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.settings import Settings, get_settings
from ...infrastructure.persistence.models.user import User
from ...infrastructure.database.session import get_session

# Development mode: Optional auth for local testing
DEV_MODE = os.getenv("ENVIRONMENT", "development") == "development"

bearer_scheme = HTTPBearer(auto_error=not DEV_MODE)


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
