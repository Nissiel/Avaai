"""
User onboarding routes for tracking onboarding progress
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from api.src.infrastructure.database.session import get_session
from api.src.infrastructure.persistence.models.user import User
from api.src.presentation.api.v1.routes.auth import get_current_user

router = APIRouter()


class OnboardingUpdatePayload(BaseModel):
    """Payload for updating onboarding flags"""
    onboarding_vapi_skipped: Optional[bool] = None
    onboarding_twilio_skipped: Optional[bool] = None
    onboarding_assistant_created: Optional[bool] = None


class OnboardingResponse(BaseModel):
    """Response with onboarding status"""
    onboarding_vapi_skipped: bool
    onboarding_twilio_skipped: bool
    onboarding_assistant_created: bool


class UserProfilePayload(BaseModel):
    """Payload for updating user profile during onboarding"""
    name: Optional[str] = Field(None, max_length=255)
    locale: Optional[str] = Field(None, max_length=8, pattern="^(en|fr|he)$")
    organization_name: Optional[str] = Field(None, max_length=255)
    industry: Optional[str] = Field(None, max_length=255)
    company_size: Optional[str] = Field(None, max_length=50)


class UserProfileResponse(BaseModel):
    """Response with user profile data"""
    id: str
    email: str
    name: Optional[str]
    locale: str
    onboarding_completed: bool
    onboarding_step: int


class CompleteOnboardingResponse(BaseModel):
    """Response after completing onboarding"""
    success: bool
    onboarding_completed: bool
    redirect_url: str


@router.patch("/user/onboarding", response_model=OnboardingResponse)
async def update_onboarding_flags(
    payload: OnboardingUpdatePayload,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Update onboarding flags for the current user
    
    This endpoint allows tracking which onboarding steps were skipped
    or completed by the user.
    """
    # Update only the fields that were provided
    if payload.onboarding_vapi_skipped is not None:
        current_user.onboarding_vapi_skipped = payload.onboarding_vapi_skipped
    
    if payload.onboarding_twilio_skipped is not None:
        current_user.onboarding_twilio_skipped = payload.onboarding_twilio_skipped
    
    if payload.onboarding_assistant_created is not None:
        current_user.onboarding_assistant_created = payload.onboarding_assistant_created
    
    await db.commit()
    await db.refresh(current_user)
    
    return OnboardingResponse(
        onboarding_vapi_skipped=current_user.onboarding_vapi_skipped or False,
        onboarding_twilio_skipped=current_user.onboarding_twilio_skipped or False,
        onboarding_assistant_created=current_user.onboarding_assistant_created or False,
    )


@router.get("/user/onboarding", response_model=OnboardingResponse)
async def get_onboarding_status(
    current_user: User = Depends(get_current_user),
):
    """
    Get current onboarding status for the user
    """
    return OnboardingResponse(
        onboarding_vapi_skipped=current_user.onboarding_vapi_skipped or False,
        onboarding_twilio_skipped=current_user.onboarding_twilio_skipped or False,
        onboarding_assistant_created=current_user.onboarding_assistant_created or False,
    )


@router.patch("/user/profile", response_model=UserProfileResponse)
async def update_user_profile(
    payload: UserProfilePayload,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Update user profile information during onboarding
    
    This endpoint saves profile data from the Welcome step:
    - name: User's full name
    - locale: Language preference (en, fr, he)
    - organization_name, industry, company_size: Optional business info
    
    Note: organization_name, industry, company_size are not stored in User model yet,
    but accepted for future use. Currently only name and locale are persisted.
    """
    # Update only the fields that were provided and exist in User model
    if payload.name is not None:
        current_user.name = payload.name
    
    if payload.locale is not None:
        current_user.locale = payload.locale
    
    # TODO: Store organization_name, industry, company_size when Organization model is implemented
    # For now, these fields are accepted but not persisted
    
    await db.commit()
    await db.refresh(current_user)
    
    return UserProfileResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        locale=current_user.locale,
        onboarding_completed=current_user.onboarding_completed,
        onboarding_step=current_user.onboarding_step,
    )


@router.post("/user/complete-onboarding", response_model=CompleteOnboardingResponse)
async def complete_onboarding(
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Mark onboarding as completed for the current user
    
    This endpoint is called when user clicks "Complete Setup" on the final step.
    Sets onboarding_completed = True and returns redirect URL.
    """
    if current_user.onboarding_completed:
        return CompleteOnboardingResponse(
            success=True,
            onboarding_completed=True,
            redirect_url="/dashboard",
        )
    
    # Mark onboarding as complete
    current_user.onboarding_completed = True
    current_user.onboarding_step = 9  # Final step
    
    await db.commit()
    await db.refresh(current_user)
    
    return CompleteOnboardingResponse(
        success=True,
        onboarding_completed=True,
        redirect_url="/dashboard",
    )
