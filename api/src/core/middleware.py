"""Middleware registration helpers."""

from __future__ import annotations

import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.cors import ALL_METHODS

from api.src.core.settings import get_settings


def configure_middleware(app: FastAPI) -> None:
    settings = get_settings()

    # CORS Configuration - ULTRA PERMISSIVE pour debug
    # TODO: Restreindre en production
    allowed_origins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "https://avaai.vercel.app",
        "https://avaai-olive.vercel.app",
        "https://avaai-euex66lfz-nissiel-thomas-projects.vercel.app",
        "https://avaai-git-main-nissiel-thomas-projects.vercel.app",
        "https://avaai-fhtq6pdx3-nissiel-thomas-projects.vercel.app",
        "https://avaai-webapp.vercel.app",
        "https://app.avaai.com",
    ]
    
    # Override from env if set
    if settings.allowed_origins:
        allowed_origins = settings.allowed_origins
    
    print("=" * 80, flush=True)
    print(f"🔥🔥🔥 CORS Allowed Origins: {allowed_origins}", flush=True)
    print(f"🔥🔥🔥 CORS Origins count: {len(allowed_origins)}", flush=True)
    print("=" * 80, flush=True)
    sys.stdout.flush()
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
    )


__all__ = ["configure_middleware"]
__all__ = ["configure_middleware"]
