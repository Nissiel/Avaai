"""Middleware registration helpers."""

from __future__ import annotations

import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.cors import ALL_METHODS

from api.src.core.settings import get_settings
from api.src.core.middleware_observability import ObservabilityMiddleware


def _normalize_origin(origin: str | None) -> str | None:
    if not origin:
        return None
    origin = origin.strip()
    if not origin:
        return None
    # Remove trailing slash to avoid duplicates
    return origin[:-1] if origin.endswith("/") else origin


def configure_middleware(app: FastAPI) -> None:
    settings = get_settings()

    env_origins = [_normalize_origin(origin) for origin in settings.allowed_origins]
    env_origins = [origin for origin in env_origins if origin]

    defaults = {
        "local": [
            "http://localhost:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:3001",
        ],
        "production": [
            _normalize_origin(settings.app_url),
            "https://app.ava.ai",
            "https://avaai-olive.vercel.app",
        ],
    }

    candidate_origins = env_origins or []
    candidate_origins.extend(defaults["production"])
    candidate_origins.extend(defaults["local"])

    allowed_origins = sorted({origin for origin in candidate_origins if origin})

    print("=" * 80, flush=True)
    print("🔥 CORS ALLOW LIST:", file=sys.stdout, flush=True)
    for origin in allowed_origins:
        print(f"  • {origin}", file=sys.stdout, flush=True)
    print("=" * 80, flush=True)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=list(ALL_METHODS),
        allow_headers=["*"],
        expose_headers=["*"],
    )

    app.add_middleware(ObservabilityMiddleware)


__all__ = ["configure_middleware"]
__all__ = ["configure_middleware"]
