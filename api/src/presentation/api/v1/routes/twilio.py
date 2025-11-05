"""Twilio integration endpoints."""

from __future__ import annotations

import os

from fastapi import APIRouter, Depends, HTTPException, status
from twilio.base.exceptions import TwilioRestException
from twilio.rest import Client as TwilioClient

from api.src.infrastructure.persistence.models.user import User
from api.src.presentation.dependencies.auth import get_current_user

router = APIRouter(prefix="/twilio", tags=["Twilio"])


def _client() -> TwilioClient:
    """Create Twilio client from environment credentials.

    TODO: Move to user-specific credentials (user.twilio_account_sid, user.twilio_auth_token)
    for true multi-tenant support.
    """
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    if not account_sid or not auth_token:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Twilio credentials missing")
    return TwilioClient(account_sid, auth_token)


@router.get("/numbers")
async def list_numbers(user: User = Depends(get_current_user)) -> dict[str, object]:
    """List Twilio phone numbers.

    Currently uses global credentials.
    TODO: Use user.twilio_account_sid and user.twilio_auth_token for user-specific numbers.
    """
    client = _client()
    try:
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
