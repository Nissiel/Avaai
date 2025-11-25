"""Twilio client helpers used across the application."""

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from typing import Any

from fastapi import HTTPException, status
from twilio.rest import Client as TwilioRestClient

from api.src.core.settings import get_settings
from api.src.infrastructure.external.circuit_breaker import get_circuit_breaker


def _clean(value: str | None) -> str | None:
    if not value:
        return None
    return value.strip() or None


@dataclass(frozen=True)
class TwilioCredentials:
    account_sid: str
    auth_token: str


def get_twilio_credentials() -> TwilioCredentials:
    """Get Twilio credentials from environment."""
    settings = get_settings()
    account_sid = _clean(settings.twilio_account_sid)
    auth_token = _clean(settings.twilio_auth_token)

    if account_sid and auth_token:
        return TwilioCredentials(account_sid=account_sid, auth_token=auth_token)

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Twilio credentials not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables.",
    )


@lru_cache(maxsize=128)
def _get_cached_client(account_sid: str, auth_token: str) -> TwilioRestClient:
    """
    Return cached Twilio client for connection pooling.
    
    LRU cache ensures we reuse clients for same credentials,
    reducing connection overhead.
    """
    return TwilioRestClient(account_sid, auth_token)


def get_twilio_client() -> TwilioRestClient:
    """
    Get Twilio client with connection pooling.

    Returns cached client instance using platform credentials.
    """
    creds = get_twilio_credentials()
    return _get_cached_client(creds.account_sid, creds.auth_token)


async def make_twilio_call_with_circuit_breaker(
    to: str,
    from_: str,
    url: str,
    *,
    method: str = "POST",
) -> Any:
    """
    Make a Twilio call with circuit breaker protection.

    Args:
        to: Destination phone number
        from_: Source phone number (Twilio number)
        url: TwiML webhook URL
        method: HTTP method for webhook (default: POST)

    Returns:
        Twilio call resource

    Raises:
        HTTPException: If circuit is open or credentials invalid
    """
    breaker = get_circuit_breaker("twilio", config=None)

    async def _make_call():
        client = get_twilio_client()
        # Note: Twilio SDK is synchronous, but we wrap it for circuit breaker compatibility
        return client.calls.create(to=to, from_=from_, url=url, method=method)

    return await breaker.call(_make_call)


async def send_twilio_sms_with_circuit_breaker(
    to: str,
    from_: str,
    body: str,
) -> Any:
    """
    Send Twilio SMS with circuit breaker protection.

    Args:
        to: Destination phone number
        from_: Source phone number (Twilio number)
        body: Message content

    Returns:
        Twilio message resource

    Raises:
        HTTPException: If circuit is open or credentials invalid
    """
    breaker = get_circuit_breaker("twilio", config=None)

    async def _send_sms():
        client = get_twilio_client()
        return client.messages.create(to=to, from_=from_, body=body)

    return await breaker.call(_send_sms)


__all__ = [
    "TwilioCredentials",
    "get_twilio_credentials",
    "get_twilio_client",
    "make_twilio_call_with_circuit_breaker",
    "send_twilio_sms_with_circuit_breaker",
]
