"""Helpers for working with the Vapi client across application layers."""

from __future__ import annotations

from fastapi import HTTPException, status

from api.src.infrastructure.external.vapi_client import VapiClient
from api.src.infrastructure.persistence.models.user import User


def get_vapi_client_for_user(user: User) -> VapiClient:
    """Return a VapiClient configured with the user's personal API key."""
    try:
        return VapiClient(token=user.vapi_api_key)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Vapi API key not configured. Please add your Vapi key in Settings.",
        ) from exc


__all__ = ["get_vapi_client_for_user"]
