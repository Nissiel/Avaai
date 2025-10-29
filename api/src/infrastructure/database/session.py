"""
Database session helpers for the Ava multi-tenant backend.

The project uses SQLAlchemy 2.x with async sessions. The connection URL is
supplied via the `DATABASE_URL` environment variable.
"""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from api.src.core.settings import get_settings

settings = get_settings()

# Fix for Render's PgBouncer: Disable prepared statement cache
# asyncpg documentation: "set statement_cache_size to 0 when creating the asyncpg connection"
# See: https://github.com/MagicStack/asyncpg/issues/530
engine = create_async_engine(
    settings.database_url,
    echo=False,
    future=True,
    connect_args={
        "statement_cache_size": 0,  # MUST be 0 for PgBouncer transaction mode
        "server_settings": {"jit": "off"}  # Also disable JIT for better ENUM handling
    }
)
SessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)


async def get_session() -> AsyncSession:
    async with SessionLocal() as session:
        yield session
