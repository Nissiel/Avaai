"""Vapi API key settings management."""

from __future__ import annotations

from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from api.src.infrastructure.persistence.models.user import User
from api.src.presentation.dependencies.auth import get_current_user
from api.src.infrastructure.database.session import get_session

router = APIRouter(prefix="/vapi-settings", tags=["Vapi Settings"])


class UpdateVapiKeyRequest(BaseModel):
    """Request body for updating user's Vapi API key."""
    
    vapi_api_key: str = Field(
        ...,
        min_length=10,
        max_length=255,
        description="User's personal Vapi.ai API key"
    )


class VapiSettingsResponse(BaseModel):
    """Response with Vapi configuration status."""
    
    has_vapi_key: bool = Field(description="Whether user has configured their Vapi API key")
    vapi_api_key_preview: str | None = Field(
        default=None,
        description="First 8 chars of API key for verification (e.g., 'sk_live_...')"
    )


@router.get("")
async def get_vapi_settings(
    user: User = Depends(get_current_user),
) -> VapiSettingsResponse:
    """
    Get user's Vapi configuration status.
    
    Returns whether the user has configured their Vapi API key,
    with a preview of the first 8 characters for verification.
    """
    has_key = bool(user.vapi_api_key)
    preview = None
    
    if has_key and user.vapi_api_key:
        # Show first 8 chars for verification (e.g., "sk_live_")
        preview = user.vapi_api_key[:8] + "..." if len(user.vapi_api_key) > 8 else "***"
    
    return VapiSettingsResponse(
        has_vapi_key=has_key,
        vapi_api_key_preview=preview,
    )


@router.post("")
async def update_vapi_key(
    request: UpdateVapiKeyRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> VapiSettingsResponse:
    """
    Update user's personal Vapi.ai API key.
    
    This allows each user to use their own Vapi account,
    enabling infinite scalability without shared key limits.
    
    Get your Vapi API key at: https://vapi.ai/dashboard
    """
    # 🔥 DIVINE: Merge user into current session to ensure updates are tracked
    user = await session.merge(current_user)
    
    # Update user's Vapi key
    user.vapi_api_key = request.vapi_api_key
    
    try:
        await session.commit()
        await session.refresh(user)
    except Exception as exc:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save Vapi API key: {str(exc)}"
        ) from exc
    
    # 🔥 DIVINE: Return proper response format
    preview = user.vapi_api_key[:8] + "..." if len(user.vapi_api_key) > 8 else "***"
    
    return VapiSettingsResponse(
        has_vapi_key=True,
        vapi_api_key_preview=preview,
    )


@router.delete("")
async def delete_vapi_key(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> VapiSettingsResponse:
    """
    Remove user's Vapi API key.
    
    This will disable Vapi features until a new key is configured.
    """
    # 🔥 DIVINE: Merge user into current session to ensure deletes are tracked
    user = await session.merge(current_user)
    
    user.vapi_api_key = None
    
    try:
        await session.commit()
        await session.refresh(user)
    except Exception as exc:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete Vapi API key: {str(exc)}"
        ) from exc
    
    # 🔥 DIVINE: Return proper response format
    return VapiSettingsResponse(
        has_vapi_key=False,
        vapi_api_key_preview=None,
    )
