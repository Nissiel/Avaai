"""Middleware registration helpers."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app_api.src.core.settings import get_settings


def configure_middleware(app: FastAPI) -> None:
    settings = get_settings()

    if settings.allowed_origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=[str(origin) for origin in settings.allowed_origins],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )


__all__ = ["configure_middleware"]
