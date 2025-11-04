"""Middleware registration helpers."""

from __future__ import annotations

import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.cors import ALL_METHODS

from api.src.core.settings import get_settings


def configure_middleware(app: FastAPI) -> None:
    settings = get_settings()

    # 🔥 DIVINE: CORS ULTRA PERMISSIVE - Allow ALL origins temporarily for debug
    # TODO: Restreindre en production avec liste exacte des origins
    allowed_origins = ["*"]  # 🔥 DIVINE: TEMPORARY - Accept ALL origins!
    
    print("=" * 80, flush=True)
    print(f"🔥🔥🔥 CORS DIVINE MODE: Allowing ALL origins (*)", flush=True)
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
