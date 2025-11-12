"""Twilio integration endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from twilio.base.exceptions import TwilioRestException

from api.src.application.services.twilio import get_twilio_client
from api.src.infrastructure.persistence.models.user import User
from api.src.presentation.dependencies.auth import get_current_user

router = APIRouter(prefix="/twilio", tags=["Twilio"])


@router.get("/numbers")
async def list_numbers(user: User = Depends(get_current_user)) -> dict[str, object]:
    """List Twilio phone numbers for the current user's credentials."""
    try:
        client = get_twilio_client(user, allow_env_fallback=True)
        numbers = client.incoming_phone_numbers.list(limit=50)
    except TwilioRestException as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    return {
        "numbers": [
            {
                "sid": number.sid,
                "phoneNumber": number.phone_number,
                "friendlyName": number.friendly_name,
                "capabilities": number.capabilities,
            }
            for number in numbers
        ]
    }


__all__ = ["router"]
