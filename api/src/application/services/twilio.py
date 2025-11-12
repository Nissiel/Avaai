"""Twilio client helpers used across the application."""

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache

from fastapi import HTTPException, status
from twilio.rest import Client as TwilioRestClient

from api.src.core.settings import get_settings
from api.src.infrastructure.persistence.models.user import User


def _clean(value: str | None) -> str | None:
    if not value:
        return None
    return value.strip() or None


@dataclass(frozen=True)
class TwilioCredentials:
    account_sid: str
    auth_token: str


def resolve_twilio_credentials(
    user: User | None = None,
    *,
    allow_env_fallback: bool = True,
) -> TwilioCredentials:
    """Return Twilio credentials for the given user or fall back to env."""

    if user:
        account_sid = _clean(user.twilio_account_sid)
        auth_token = _clean(user.twilio_auth_token)
        if account_sid and auth_token:
            return TwilioCredentials(account_sid=account_sid, auth_token=auth_token)

    if allow_env_fallback:
        settings = get_settings()
        account_sid = _clean(settings.twilio_account_sid)
        auth_token = _clean(settings.twilio_auth_token)
        if account_sid and auth_token:
            return TwilioCredentials(account_sid=account_sid, auth_token=auth_token)

    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="Twilio credentials not configured. Add them in Settings → Telephony.",
    )


@lru_cache(maxsize=128)
def _get_cached_client(account_sid: str, auth_token: str) -> TwilioRestClient:
    """
    Return cached Twilio client for connection pooling.
    
    LRU cache ensures we reuse clients for same credentials,
    reducing connection overhead.
    """
    return TwilioRestClient(account_sid, auth_token)


def get_twilio_client(
    user: User | None = None,
    *,
    allow_env_fallback: bool = True,
) -> TwilioRestClient:
    """
    Get Twilio client with connection pooling.
    
    Resolves credentials and returns cached client instance.
    """
    creds = resolve_twilio_credentials(user, allow_env_fallback=allow_env_fallback)
    return _get_cached_client(creds.account_sid, creds.auth_token)


__all__ = ["TwilioCredentials", "resolve_twilio_credentials", "get_twilio_client"]
