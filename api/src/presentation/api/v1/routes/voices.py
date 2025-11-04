"""Voice endpoints leveraging Vapi preview generation."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from api.src.infrastructure.external.vapi_client import VapiApiError, VapiClient
from api.src.infrastructure.persistence.models.user import User
from api.src.presentation.dependencies.auth import get_current_user

router = APIRouter(prefix="/voices", tags=["Voices"])


class VoicePreviewPayload(BaseModel):
    voiceId: str = Field(min_length=2, max_length=120)
    text: str = Field(min_length=4, max_length=240)


def _client(user: User) -> VapiClient:
    """Create VapiClient with user's personal API key (multi-tenant)."""
    try:
        # 🔥 DIVINE FIX: Correct parameter is user_api_key, not token
        return VapiClient(user_api_key=user.vapi_api_key)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc


@router.post("/preview")
async def preview_voice(
    payload: VoicePreviewPayload,
    user: User = Depends(get_current_user),
) -> dict[str, object]:
    client = _client(user)
    try:
        preview = await client.voice_preview(voice_id=payload.voiceId, text=payload.text)
    except VapiApiError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    return {"preview": preview}


__all__ = ["router"]
