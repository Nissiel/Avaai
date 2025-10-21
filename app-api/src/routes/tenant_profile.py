"""
REST endpoints to manage Ava personalisation per tenant.
"""

from __future__ import annotations

from typing import Annotated

import os

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, constr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth.deps import CurrentTenant, get_current_tenant
from ..models.ava_profile import (
    AvaProfile,
    AvaProfileIn,
    AvaProfileOut,
    DefaultAllowed,
    DefaultForbidden,
)
from ..services.realtime_session import build_system_prompt, build_session_config
from ..services.text_to_speech import VoicePreviewError, synthesize_preview
from ..db.session import get_session

router = APIRouter(prefix="/tenant/ava-profile", tags=["Ava Profile"])


async def _get_or_create_profile(session: AsyncSession, tenant_id) -> AvaProfile:
    result = await session.execute(select(AvaProfile).where(AvaProfile.tenant_id == tenant_id))
    profile: AvaProfile | None = result.scalar_one_or_none()
    if profile:
        return profile

    profile = AvaProfile(
        tenant_id=tenant_id,
        name="Ava",
        voice="alloy",
        language="fr-FR",
        tone="douce, calme et professionnelle",
        personality="empathique, efficace, rassurante",
        greeting=(
            "Bonjour et bienvenue. Je suis Ava, l'assistante personnelle de Nissiel Thomas. "
            "Merci de m'indiquer votre prénom, votre nom ainsi que votre numéro de téléphone, "
            "puis dites-moi comment je peux vous aider."
        ),
        allowed_topics=DefaultAllowed.copy(),
        forbidden_topics=DefaultForbidden.copy(),
        can_take_notes=True,
        can_summarize_live=True,
        fallback_behavior="Si une demande sort du périmètre, explique poliment que tu vas transmettre le message à Nissiel Thomas.",
        signature_style="chaleureuse et professionnelle",
        custom_rules=(
            "Toujours vérifier la langue de l’appelant (français, anglais ou hébreu) et t’y adapter. "
            "Demander prénom, nom, numéro de téléphone et email, puis reformuler l’objet de l’appel. "
            "Ne jamais promettre d’action : tu transmets les informations à Nissiel Thomas."
        ),
    )
    session.add(profile)
    await session.commit()
    await session.refresh(profile)
    return profile


@router.get("", response_model=AvaProfileOut)
async def get_ava_profile(
    current: Annotated[CurrentTenant, Depends(get_current_tenant)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> AvaProfileOut:
    profile = await _get_or_create_profile(session, current.tenant.id)
    return AvaProfileOut.from_model(profile)


@router.put("", response_model=AvaProfileOut)
async def update_ava_profile(
    payload: AvaProfileIn,
    current: Annotated[CurrentTenant, Depends(get_current_tenant)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> AvaProfileOut:
    profile = await _get_or_create_profile(session, current.tenant.id)

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
    current: Annotated[CurrentTenant, Depends(get_current_tenant)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict:
    """Generate a short audio preview for the selected voice."""

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="OpenAI API key not configured")

    profile = await _get_or_create_profile(session, current.tenant.id)

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
