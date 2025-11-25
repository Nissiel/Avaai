"""Helpers for working with the Vapi client across application layers."""

from __future__ import annotations

from fastapi import HTTPException, status

from api.src.core.settings import get_settings
from api.src.infrastructure.external.vapi_client import VapiClient


def _clean(value: str | None) -> str | None:
    """Strip and validate string value."""
    if not value:
        return None
    return value.strip() or None


def get_vapi_api_key() -> str:
    """
    Get Vapi API key from environment.

    Returns:
        Vapi API key string

    Raises:
        HTTPException: If no valid API key found
    """
    settings = get_settings()
    api_key = _clean(settings.vapi_api_key)
    if api_key:
        return api_key

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Vapi API key not configured. Set AVA_API_VAPI_API_KEY environment variable.",
    )


def get_vapi_client() -> VapiClient:
    """
    Return a VapiClient configured with platform API key.

    Returns:
        Configured VapiClient instance

    Raises:
        HTTPException: If no valid API key found or key is invalid
    """
    api_key = get_vapi_api_key()

    try:
        return VapiClient(token=api_key)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vapi API key is invalid. Check your configuration.",
        ) from exc


__all__ = ["get_vapi_client", "get_vapi_api_key"]
