from fastapi import FastAPI
from fastapi.testclient import TestClient

from api.src.core.middleware.observability import ObservabilityMiddleware


app = FastAPI()
app.add_middleware(ObservabilityMiddleware, timeout_seconds=1, dedupe_ttl=2)


@app.post("/echo")
async def echo():
    return {"status": "ok"}


client = TestClient(app)


def test_duplicate_request_blocked():
    headers = {"X-Request-ID": "duplicate-test"}
    first = client.post("/echo", headers=headers)
    assert first.status_code == 200

    second = client.post("/echo", headers=headers)
    assert second.status_code == 409
    assert second.json()["detail"] == "Duplicate request"


def test_request_id_header_returned():
    response = client.post("/echo")
    assert response.status_code == 200
    assert "X-Request-ID" in response.headers
