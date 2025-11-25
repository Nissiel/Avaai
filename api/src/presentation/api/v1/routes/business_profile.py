"""
REST endpoints to manage business/company profile per user.
"""

from __future__ import annotations

from typing import Annotated, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.src.infrastructure.persistence.models.user import User
from api.src.infrastructure.persistence.models.business_profile import BusinessProfile
from api.src.presentation.dependencies.auth import get_current_user
from api.src.infrastructure.database.session import get_session

router = APIRouter(prefix="/business-profile", tags=["Business Profile"])


# === Pydantic Schemas ===

class BusinessProfileIn(BaseModel):
    """Input schema for creating/updating business profile."""
    company_name: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    description: Optional[str] = None
    services: Optional[list[str]] = None
    target_market: Optional[str] = None
    value_proposition: Optional[str] = None


class BusinessProfileOut(BaseModel):
    """Output schema for business profile."""
    id: str
    user_id: str
    company_name: Optional[str]
    website: Optional[str]
    industry: Optional[str]
    company_size: Optional[str]
    description: Optional[str]
    services: Optional[list[str]]
    target_market: Optional[str]
    value_proposition: Optional[str]

    class Config:
        from_attributes = True

    @classmethod
    def from_model(cls, model: BusinessProfile) -> "BusinessProfileOut":
        return cls(
            id=model.id,
            user_id=model.user_id,
            company_name=model.company_name,
            website=model.website,
            industry=model.industry,
            company_size=model.company_size,
            description=model.description,
            services=model.services or [],
            target_market=model.target_market,
            value_proposition=model.value_proposition,
        )


# === Helper Functions ===

async def _get_or_create_profile(session: AsyncSession, user_id: str) -> BusinessProfile:
    """Get or create business profile for user."""
    result = await session.execute(
        select(BusinessProfile).where(BusinessProfile.user_id == user_id)
    )
    profile: BusinessProfile | None = result.scalar_one_or_none()

    if profile:
        return profile

    # Create new profile with defaults
    profile = BusinessProfile(
        user_id=user_id,
        services=[],
    )
    session.add(profile)
    await session.commit()
    await session.refresh(profile)
    return profile


# === Route Handlers ===

@router.get("", response_model=BusinessProfileOut)
async def get_business_profile(
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> BusinessProfileOut:
    """Get the current user's business profile."""
    profile = await _get_or_create_profile(session, user.id)
    return BusinessProfileOut.from_model(profile)


@router.patch("", response_model=BusinessProfileOut)
async def update_business_profile(
    payload: BusinessProfileIn,
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> BusinessProfileOut:
    """Update the current user's business profile."""
    profile = await _get_or_create_profile(session, user.id)

    # Update only provided fields
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)

    await session.commit()
    await session.refresh(profile)
    return BusinessProfileOut.from_model(profile)


__all__ = ["router"]
