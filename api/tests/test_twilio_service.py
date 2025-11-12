import pytest
from fastapi import HTTPException

from api.src.application.services.twilio import resolve_twilio_credentials, TwilioCredentials
from api.src.core.settings import get_settings


class DummyUser:
    def __init__(self, sid: str | None, token: str | None):
        self.twilio_account_sid = sid
        self.twilio_auth_token = token


def test_resolve_twilio_credentials_uses_user_values(monkeypatch):
    user = DummyUser("AC123", "secret")
    creds = resolve_twilio_credentials(user)
    assert isinstance(creds, TwilioCredentials)
    assert creds.account_sid == "AC123"
    assert creds.auth_token == "secret"


def test_resolve_twilio_credentials_falls_back_to_env(monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "twilio_account_sid", "ACENV")
    monkeypatch.setattr(settings, "twilio_auth_token", "env-token")

    user = DummyUser(None, None)
    creds = resolve_twilio_credentials(user)
    assert creds.account_sid == "ACENV"
    assert creds.auth_token == "env-token"


def test_resolve_twilio_credentials_errors_when_missing(monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "twilio_account_sid", None)
    monkeypatch.setattr(settings, "twilio_auth_token", None)

    user = DummyUser(None, None)
    with pytest.raises(HTTPException):
        resolve_twilio_credentials(user, allow_env_fallback=True)
