"""FastAPI application factory."""

from __future__ import annotations

import sys
from fastapi import FastAPI, Request
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from api.src.core.middleware import configure_middleware
from api.src.core.settings import get_settings
from api.src.core.logging import configure_logging
from api.src.core.rate_limiting import limiter
from api.src.presentation.api.v1.router import api_v1_router

# Prometheus metrics (Phase 2-4)
try:
    from prometheus_client import make_asgi_app
    PROMETHEUS_AVAILABLE = True
except ImportError:
    PROMETHEUS_AVAILABLE = False


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

    # Wire rate limiting (Phase 2-4)
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    configure_middleware(app)

    print("=" * 80, flush=True)
    print("✅ MIDDLEWARE CONFIGURED", flush=True)
    print("=" * 80, flush=True)
    sys.stdout.flush()

    @app.get("/healthz", tags=["Health"])
    async def healthcheck() -> dict[str, str]:  # pragma: no cover - trivial
        return {"status": "healthy"}

    @app.on_event("startup")
    async def warmup_database() -> None:
        """🔥 DIVINE FIX: Warmup database on startup to prevent first-request timeouts"""
        import asyncio
        import time
        
        try:
            from api.src.infrastructure.database.session import engine
            from sqlalchemy import text
            
            print("🔥 Warming up database connection pool...", flush=True)
            async with engine.connect() as conn:
                # Simple ping query with generous timeout for cold Supabase
                start = time.time()
                await asyncio.wait_for(
                    conn.execute(text("SELECT 1")),
                    timeout=20.0  # 🔥 Give Supabase 20s to wake from sleep
                )
                elapsed = time.time() - start
                print(f"✅ Database warmed up in {elapsed:.2f}s (cold start handled)", flush=True)
        except asyncio.TimeoutError:
            print(f"⚠️  Database warmup timed out after 20s (continuing anyway)", flush=True)
        except Exception as e:
            # Don't block startup if warmup fails - log and continue
            print(f"⚠️  Database warmup failed (non-blocking): {e}", flush=True)
        sys.stdout.flush()

    # Mount Prometheus metrics endpoint (Phase 2-4)
    if PROMETHEUS_AVAILABLE:
        metrics_app = make_asgi_app()
        app.mount("/metrics", metrics_app)
        print("✅ Prometheus metrics exposed at /metrics", flush=True)

    app.include_router(api_v1_router, prefix=settings.api_prefix)

    return app


__all__ = ["create_app"]
