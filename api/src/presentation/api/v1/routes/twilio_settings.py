"""
Twilio Settings API Routes.

Multi-tenant architecture: Each user manages their own Twilio credentials.
Allows users to configure their personal Twilio Account SID, Auth Token, and phone number.

🎯 DIVINE ARCHITECTURE:
- This endpoint handles ONLY credential storage (Single Responsibility)
- Auto-import orchestration is frontend's responsibility
- Frontend calls: 1) Save credentials 2) List assistants 3) Import number
- Clean separation: Backend = Data, Frontend = User Flow
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from api.src.infrastructure.persistence.models.user import User
from api.src.presentation.dependencies.auth import get_current_user
from api.src.infrastructure.database.session import get_session

router = APIRouter(prefix="/twilio-settings", tags=["Twilio Settings"])


class TwilioSettingsResponse(BaseModel):
    """Response model for Twilio settings status."""

    has_twilio_credentials: bool = Field(
        description="Whether user has configured Twilio credentials"
    )
    account_sid_preview: Optional[str] = Field(
        None, description="Preview of Account SID (first 8 chars)"
    )
    phone_number: Optional[str] = Field(
        None, description="Configured Twilio phone number"
    )


class TwilioSettingsUpdate(BaseModel):
    """Request model for updating Twilio credentials."""

    account_sid: str = Field(
        ..., 
        min_length=34, 
        max_length=34,
        description="Twilio Account SID (starts with AC)"
    )
    auth_token: str = Field(
        ..., 
        min_length=32,
        description="Twilio Auth Token"
    )
    phone_number: Optional[str] = Field(
        None,
        description="Twilio phone number (E.164 format, e.g., +15551234567)"
    )


@router.get("", response_model=TwilioSettingsResponse)
async def get_twilio_settings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get user's Twilio configuration status.
    
    Returns whether the user has configured Twilio credentials,
    and a preview of the Account SID if configured.
    """
    has_credentials = bool(
        current_user.twilio_account_sid and current_user.twilio_auth_token
    )
    
    account_sid_preview = None
    if current_user.twilio_account_sid:
        # Show first 8 characters: AC123456...
        account_sid_preview = f"{current_user.twilio_account_sid[:8]}..."
    
    return TwilioSettingsResponse(
        has_twilio_credentials=has_credentials,
        account_sid_preview=account_sid_preview,
        phone_number=current_user.twilio_phone_number,
    )


@router.post("", response_model=TwilioSettingsResponse)
async def update_twilio_settings(
    settings: TwilioSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    🎯 DIVINE: Save Twilio credentials (Single Responsibility Principle).
    
    This endpoint ONLY handles credential storage.
    Auto-import orchestration is handled by frontend calling /phone-numbers/import-twilio.
    
    Why this design?
    - Backend = Data layer (save credentials)
    - Frontend = UX layer (orchestrate multi-step flows)
    - Separation of Concerns = DIVINE 🌟
    """
    # Validate Account SID format
    if not settings.account_sid.startswith("AC"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Account SID format. Must start with 'AC'",
        )
    
    # Validate phone number format if provided
    if settings.phone_number and not settings.phone_number.startswith("+"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number must be in E.164 format (e.g., +15551234567)",
        )
    
    # 🔥 DIVINE: Merge user into current session to ensure updates are tracked
    user = await db.merge(current_user)
    
    # Update user's Twilio credentials
    user.twilio_account_sid = settings.account_sid
    user.twilio_auth_token = settings.auth_token
    user.twilio_phone_number = settings.phone_number
    
    await db.commit()
    await db.refresh(user)
    
    return TwilioSettingsResponse(
        has_twilio_credentials=True,
        account_sid_preview=f"{settings.account_sid[:8]}...",
        phone_number=settings.phone_number,
    )


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def delete_twilio_settings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Delete user's Twilio credentials.
    
    🔥 DIVINE: Complete cleanup - removes BOTH:
    1. Credentials from database
    2. Phone number from Vapi (so it can be re-imported later)
    
    This ensures users can re-add their Twilio number without conflicts.
    """
    import logging
    from api.src.infrastructure.vapi.client import VapiClient
    
    logger = logging.getLogger(__name__)
    
    # 🔥 DIVINE: Merge user into current session to ensure deletes are tracked
    user = await db.merge(current_user)
    
    # Step 1: Delete from Vapi FIRST (if user has Vapi key and phone number)
    if user.vapi_api_key and user.twilio_phone_number:
        try:
            logger.info(f"🗑️ Deleting Twilio number from Vapi: {user.twilio_phone_number}")
            vapi = VapiClient(token=user.vapi_api_key)
            
            # Get all phone numbers to find the ID
            phone_numbers = await vapi.get_phone_numbers()
            
            # Find the phone number that matches
            phone_to_delete = None
            for phone in phone_numbers:
                if phone.get("number") == user.twilio_phone_number:
                    phone_to_delete = phone
                    break
            
            if phone_to_delete:
                phone_id = phone_to_delete.get("id")
                await vapi.delete_phone_number(phone_id)
                logger.info(f"✅ Deleted phone number from Vapi: {phone_id}")
            else:
                logger.warning(f"⚠️ Phone number {user.twilio_phone_number} not found in Vapi (already deleted?)")
                
        except Exception as e:
            # Don't fail the whole operation if Vapi delete fails
            # User can still delete credentials from DB
            logger.error(f"❌ Failed to delete from Vapi (non-fatal): {e}")
    
    # Step 2: Delete from database
    user.twilio_account_sid = None
    user.twilio_auth_token = None
    user.twilio_phone_number = None
    
    await db.commit()
    
    return None
