"""Voice endpoints leveraging Vapi preview generation."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app_api.src.infrastructure.external.vapi_client import VapiApiError, VapiClient
from app_api.src.presentation.dependencies.auth import CurrentTenant, get_current_tenant

router = APIRouter(prefix="/voices", tags=["Voices"])


class VoicePreviewPayload(BaseModel):
    voiceId: str = Field(min_length=2, max_length=120)
    text: str = Field(min_length=4, max_length=240)


def _client() -> VapiClient:
    try:
        return VapiClient()
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc


@router.post("/preview")
async def preview_voice(
    payload: VoicePreviewPayload,
    _: CurrentTenant = Depends(get_current_tenant),
) -> dict[str, object]:
    client = _client()
    try:
        preview = await client.voice_preview(voice_id=payload.voiceId, text=payload.text)
    except VapiApiError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    return {"preview": preview}


__all__ = ["router"]
