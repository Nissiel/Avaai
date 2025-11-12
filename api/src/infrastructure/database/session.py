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
# CRITICAL: Aggressive timeouts to prevent 10-second hangs on cold DB
# See: https://docs.sqlalchemy.org/en/20/dialects/postgresql.html#prepared-statement-name-with-pgbouncer
engine = create_async_engine(
    settings.database_url,
    echo=False,
    future=True,
    poolclass=NullPool,  # CRITICAL: Let PgBouncer handle pooling
    connect_args={
        "statement_cache_size": 0,  # Disable prepared statement cache
        "prepared_statement_name_func": lambda: f"__asyncpg_{uuid4()}__",  # Unique names
        "timeout": 5.0,  # 🔥 DIVINE FIX: 5-second connection timeout (prevent 10s hangs)
        "command_timeout": 8.0,  # 🔥 DIVINE FIX: 8-second query timeout (fast-fail on slow queries)
        "server_settings": {
            "jit": "off",
            "application_name": "ava-api-production",
            "statement_timeout": "8000"  # 🔥 DIVINE FIX: PostgreSQL-level timeout (8 seconds)
        }
    }
)
SessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)


async def get_session() -> AsyncSession:
    async with SessionLocal() as session:
        yield session
