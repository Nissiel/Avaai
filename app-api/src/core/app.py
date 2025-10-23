"""FastAPI application factory."""

from __future__ import annotations

from fastapi import FastAPI

from app_api.src.core.middleware import configure_middleware
from app_api.src.core.settings import get_settings
from app_api.src.presentation.api.v1.router import api_v1_router


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="Ava API",
        version="1.0.0",
        openapi_url=f"{settings.api_prefix}/openapi.json",
        docs_url=f"{settings.api_prefix}/docs",
        redoc_url=f"{settings.api_prefix}/redoc",
    )

    configure_middleware(app)

    @app.get("/healthz", tags=["Health"])
    async def healthcheck() -> dict[str, str]:  # pragma: no cover - trivial
        return {"status": "ok"}

    app.include_router(api_v1_router, prefix=settings.api_prefix)

    return app


__all__ = ["create_app"]
