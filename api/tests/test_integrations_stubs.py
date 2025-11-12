from fastapi.testclient import TestClient

from api.src.core.app import create_app
from api.src.presentation.dependencies.auth import get_current_user


class DummyUser:
    def __init__(self, *, user_id: str = "user-1", email: str = "test@example.com"):
        self.id = user_id
        self.email = email
        self.twilio_account_sid = None
        self.twilio_auth_token = None


def _client():
    app = create_app()

    async def _fake_user():
        return DummyUser()

    app.dependency_overrides[get_current_user] = _fake_user
    return TestClient(app)


def test_email_stub_requires_valid_payload(monkeypatch):
    client = _client()
    response = client.post(
        "/api/v1/integrations/email/test",
        json={"to": "stub@example.com", "subject": "Hello", "text": "Body"},
    )
    # In DEV mode auth is optional; endpoint should return stub metadata.
    assert response.status_code == 200
    payload = response.json()
    assert payload["delivered"] is False
    assert "backend" in payload


def test_calendar_stub_returns_events(monkeypatch):
    client = _client()
    response = client.get("/api/v1/integrations/calendar/google/events")
    assert response.status_code == 200
    payload = response.json()
    assert payload["provider"] == "google"
    assert payload["status"] == "stub"
    assert len(payload["events"]) == 2
