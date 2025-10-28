"""Middleware registration helpers."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.src.core.settings import get_settings


def configure_middleware(app: FastAPI) -> None:
    settings = get_settings()

    # CORS Configuration - Allow frontend in development and production
    allowed_origins = settings.allowed_origins if settings.allowed_origins else [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "https://avaai.vercel.app",
        "https://avaai-olive.vercel.app",
        "https://avaai-git-main-nissiel-thomas-projects.vercel.app",
        "https://avaai-fhtq6pdx3-nissiel-thomas-projects.vercel.app",
        "https://avaai-webapp.vercel.app",
        "https://app.avaai.com",
    ]
    
    print(f"🔥 CORS Allowed Origins: {allowed_origins}")
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


__all__ = ["configure_middleware"]
