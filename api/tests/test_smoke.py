import sys

import pytest
from fastapi.testclient import TestClient

if sys.version_info < (3, 10):
    pytest.skip("Smoke tests require Python 3.10+ to evaluate typing annotations", allow_module_level=True)

from api.src.core.app import create_app


def test_app_boots_and_has_metadata():
    app = create_app()
    assert app.title == "Ava API"
    assert app.openapi_url.endswith("/openapi.json")


def test_healthcheck_endpoint():
    client = TestClient(create_app())
    response = client.get("/healthz")
    assert response.status_code == 200
    payload = response.json()
    assert payload.get("status") in {"ok", "healthy"}


def test_router_prefix_available():
    client = TestClient(create_app())
    response = client.get("/api/v1/docs")
    assert response.status_code == 200
