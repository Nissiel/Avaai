"""
Database session helpers for the Ava multi-tenant backend.

The project uses SQLAlchemy 2.x with async sessions. The connection URL is
supplied via the `DATABASE_URL` environment variable.
"""

from __future__ import annotations
from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from api.src.core.settings import get_settings

settings = get_settings()

# DIVINE FIX: asyncpg + PgBouncer configuration
# CRITICAL: Use NullPool to prevent prepared statement conflicts with poolers
# CRITICAL: Use unique prepared statement names to avoid collisions
# See: https://docs.sqlalchemy.org/en/20/dialects/postgresql.html#prepared-statement-name-with-pgbouncer
engine = create_async_engine(
    settings.database_url,
    echo=False,
    future=True,
    poolclass=NullPool,  # CRITICAL: Let PgBouncer handle pooling
    connect_args={
        "statement_cache_size": 0,  # Disable prepared statement cache
        "prepared_statement_name_func": lambda: f"__asyncpg_{uuid4()}__",  # Unique names
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
