"""
Database session helpers for the Ava multi-tenant backend.

The project uses SQLAlchemy 2.x with async sessions. The connection URL is
supplied via the `DATABASE_URL` environment variable.
"""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from api.src.core.settings import get_settings

settings = get_settings()

# DIVINE FIX: Configure asyncpg for production (Supabase/Render)
# - statement_cache_size=0: Required for PgBouncer transaction pooling mode
# - server_settings jit=off: Better ENUM handling + pooler compatibility
# - timeout=10: Reasonable connection timeout
# - command_timeout=60: Prevent hanging queries
# See: https://github.com/MagicStack/asyncpg/issues/530
engine = create_async_engine(
    settings.database_url,
    echo=False,
    future=True,
    pool_pre_ping=True,  # Verify connections before using them
    pool_size=5,  # Reasonable for serverless
    max_overflow=10,  # Allow burst traffic
    connect_args={
        "statement_cache_size": 0,  # Disable for pooler compatibility
        "timeout": 10,  # Connection timeout (seconds)
        "command_timeout": 60,  # Query timeout (seconds)
        "server_settings": {
            "jit": "off",  # Disable JIT for stability
            "application_name": "ava-api-production"  # For monitoring
        }
    }
)
SessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)


async def get_session() -> AsyncSession:
    async with SessionLocal() as session:
        yield session
