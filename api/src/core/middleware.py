"""Middleware registration helpers."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.src.core.settings import get_settings


def configure_middleware(app: FastAPI) -> None:
    settings = get_settings()

    # CORS Configuration - Allow frontend in development
    allowed_origins = settings.allowed_origins if settings.allowed_origins else [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
    ]
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


__all__ = ["configure_middleware"]
