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
# CRITICAL: statement_cache_size MUST be 0 for PgBouncer transaction pooling
# asyncpg-specific parameters go in connect_args root level
# See: https://github.com/MagicStack/asyncpg/issues/530
engine = create_async_engine(
    settings.database_url,
    echo=False,
    future=True,
    pool_pre_ping=True,  # Verify connections before using them
    pool_size=5,  # Reasonable for serverless
    max_overflow=10,  # Allow burst traffic
    connect_args={
        # CRITICAL FOR PGBOUNCER: Disable prepared statement caching
        "statement_cache_size": 0,
        # Connection timeouts
        "timeout": 10,
        "command_timeout": 60,
        # Server settings for PostgreSQL
        "server_settings": {
            "jit": "off",
            "application_name": "ava-api-production"
        }
    }
)
SessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)


async def get_session() -> AsyncSession:
    async with SessionLocal() as session:
        yield session
