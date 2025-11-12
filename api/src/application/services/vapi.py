"""Helpers for working with the Vapi client across application layers."""

from __future__ import annotations

from fastapi import HTTPException, status

from api.src.infrastructure.external.vapi_client import VapiClient
from api.src.infrastructure.persistence.models.user import User


def get_vapi_client_for_user(user: User) -> VapiClient:
    """Return a VapiClient configured with the user's personal API key."""
    if not user.vapi_api_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vapi API key is missing. Add it in Settings → Vapi to enable this feature.",
        )

    token = user.vapi_api_key.strip()
    try:
        return VapiClient(token=token)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vapi API key looks invalid. Double-check the value in Settings → Vapi.",
        ) from exc


__all__ = ["get_vapi_client_for_user"]
