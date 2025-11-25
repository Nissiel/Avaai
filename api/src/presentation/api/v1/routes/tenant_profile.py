"""
REST endpoints to manage Ava personalisation per user.
"""

from __future__ import annotations

from typing import Annotated

import os

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, constr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.src.infrastructure.persistence.models.user import User
from api.src.presentation.dependencies.auth import get_current_user
from api.src.presentation.schemas.ava_profile import AvaProfileIn, AvaProfileOut
from api.src.infrastructure.persistence.models.ava_profile import AvaProfile
from api.src.application.services.realtime_session import (
    build_session_config,
    build_system_prompt,
)
from api.src.infrastructure.external.text_to_speech import (
    VoicePreviewError,
    synthesize_preview,
)
from api.src.infrastructure.database.session import get_session
from api.src.domain.value_objects.ava_profile import (
    DEFAULT_ALLOWED_TOPICS,
    DEFAULT_FORBIDDEN_TOPICS,
)

router = APIRouter(prefix="/tenant/ava-profile", tags=["Ava Profile"])


async def _get_or_create_profile(session: AsyncSession, user_id) -> AvaProfile:
    """Get or create AVA profile for user."""
    result = await session.execute(select(AvaProfile).where(AvaProfile.user_id == user_id))
    profile: AvaProfile | None = result.scalar_one_or_none()
    if profile:
        return profile

    profile = AvaProfile(
        user_id=user_id,
        name="Ava",
        voice="alloy",
        language="en-US",
        tone="warm, calm and professional",
        personality="empathetic, efficient, reassuring",
        greeting=(
            "Hello and welcome. I'm Ava, your personal assistant. "
            "Please provide your first name, last name, and phone number, "
            "then let me know how I can help you today."
        ),
        allowed_topics=DEFAULT_ALLOWED_TOPICS.copy(),
        forbidden_topics=DEFAULT_FORBIDDEN_TOPICS.copy(),
        can_take_notes=True,
        can_summarize_live=True,
        fallback_behavior="If a request is outside scope, politely explain that you will forward the message to the appropriate person.",
        signature_style="warm and professional",
        custom_rules=(
            "Always detect the caller's language and adapt accordingly. "
            "Ask for first name, last name, phone number and email, then summarize the purpose of the call. "
            "Never promise any actions: you forward the information to the appropriate person."
        ),
    )
    session.add(profile)
    await session.commit()
    await session.refresh(profile)
    return profile


@router.get("", response_model=AvaProfileOut)
async def get_ava_profile(
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> AvaProfileOut:
    profile = await _get_or_create_profile(session, user.id)
    return AvaProfileOut.from_model(profile)


@router.put("", response_model=AvaProfileOut)
async def update_ava_profile(
    payload: AvaProfileIn,
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> AvaProfileOut:
    profile = await _get_or_create_profile(session, user.id)

    for field, value in payload.model_dump().items():
        setattr(profile, field, value)

    await session.commit()
    await session.refresh(profile)
    return AvaProfileOut.from_model(profile)


class VoicePreviewRequest(BaseModel):
    text: constr(min_length=4, max_length=160) = "Bonjour, je suis Ava."


@router.post("/test-voice")
async def test_voice_snippet(
    payload: VoicePreviewRequest,
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict:
    """Generate a short audio preview for the selected voice."""

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="OpenAI API key not configured")

    profile = await _get_or_create_profile(session, user.id)

    try:
        audio_b64 = await synthesize_preview(
            api_key=api_key,
            text=payload.text,
            voice=profile.voice,
            language=profile.language,
        )
    except VoicePreviewError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    return {"audio": audio_b64, "content_type": "audio/wav"}


__all__ = ["router", "build_system_prompt", "build_session_config"]
