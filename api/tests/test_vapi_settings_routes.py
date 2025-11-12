import pytest
from fastapi.testclient import TestClient

from api.src.core.app import create_app
from api.src.infrastructure.external.vapi_client import VapiClient
from api.src.presentation.dependencies.auth import get_current_user


@pytest.fixture(name="test_client")
def test_client_fixture():
    app = create_app()

    async def _fake_user():
        class DummyUser:
            id = "user-1"
            email = "test@example.com"
            vapi_api_key = "sk_test"
        return DummyUser()

    app.dependency_overrides[get_current_user] = _fake_user

    with TestClient(app) as client:
        yield client

    app.dependency_overrides.clear()


def test_list_remote_settings(monkeypatch, test_client):
    async def _fake_list(self):
        return [
            {"key": "assistant.defaultGreeting", "value": "Hello"},
            {"key": "json.setting", "value": {"enabled": True}},
        ]

    monkeypatch.setattr(VapiClient, "list_settings", _fake_list)

    response = test_client.get("/api/v1/vapi/settings")
    assert response.status_code == 200
    data = response.json()
    assert "settings" in data
    assert data["settings"][0]["key"] == "assistant.defaultGreeting"
    assert data["settings"][1]["value"] == {"enabled": True}


def test_update_remote_setting(monkeypatch, test_client):
    captured = {}

    async def _fake_update(self, key, value):
        captured["key"] = key
        captured["value"] = value
        return {"key": key, "value": value, "updatedAt": "2024-01-01T00:00:00Z"}

    monkeypatch.setattr(VapiClient, "update_setting", _fake_update)

    payload = {"value": {"enabled": False}}
    response = test_client.put("/api/v1/vapi/settings/assistant.defaultGreeting", json=payload)
    assert response.status_code == 200
    assert captured["key"] == "assistant.defaultGreeting"
    assert captured["value"] == {"enabled": False}
    assert response.json()["setting"]["key"] == "assistant.defaultGreeting"
