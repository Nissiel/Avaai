"""FastAPI application factory."""

from __future__ import annotations

import sys
from fastapi import FastAPI

from api.src.core.middleware import configure_middleware
from api.src.core.settings import get_settings
from api.src.core.logging import configure_logging
from api.src.presentation.api.v1.router import api_v1_router


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging()

    app = FastAPI(
        title="Ava API",
        version="1.0.0",
        openapi_url=f"{settings.api_prefix}/openapi.json",
        docs_url=f"{settings.api_prefix}/docs",
        redoc_url=f"{settings.api_prefix}/redoc",
    )

    print("=" * 80, flush=True)
    print("🚀 AVA API STARTING...", flush=True)
    print("=" * 80, flush=True)
    sys.stdout.flush()

    configure_middleware(app)

    print("=" * 80, flush=True)
    print("✅ MIDDLEWARE CONFIGURED", flush=True)
    print("=" * 80, flush=True)
    sys.stdout.flush()

    @app.get("/healthz", tags=["Health"])
    async def healthcheck() -> dict[str, str]:  # pragma: no cover - trivial
        return {"status": "healthy"}

    app.include_router(api_v1_router, prefix=settings.api_prefix)

    return app


__all__ = ["create_app"]
