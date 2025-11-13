"""
Database session helpers for the Ava multi-tenant backend.

The project uses SQLAlchemy 2.x with async sessions. The connection URL is
supplied via the `DATABASE_URL` environment variable.
"""

from __future__ import annotations

import asyncio
import logging
from collections.abc import AsyncGenerator

from sqlalchemy.exc import InterfaceError, OperationalError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

try:  # pragma: no cover - optional dependency
    from asyncpg import exceptions as asyncpg_exceptions  # type: ignore
except ImportError:  # pragma: no cover - fallback when asyncpg missing (tests)
    asyncpg_exceptions = None

from api.src.core.settings import get_settings

logger = logging.getLogger("ava.database")

settings = get_settings()

# 🔥 DIVINE ARCHITECTURE: Render + PgBouncer (transaction pooling)
# PgBouncer already multiplexes connections, so SQLAlchemy MUST avoid pooling.
# Using NullPool prevents cached prepared statements from leaking across
# logical connections and eliminates DuplicatePreparedStatementError.
engine = create_async_engine(
    settings.database_url,
    echo=False,
    future=True,
    poolclass=NullPool,
    connect_args={
        "statement_cache_size": 0,  # 🔥 Disable asyncpg prepared statements (PgBouncer compat)
        "prepared_statement_cache_size": 0,  # 🔥 Disable SQLAlchemy prepared statements (PgBouncer compat)
        "timeout": 10.0,  # 🔥 10-second connection timeout (give Supabase time to wake)
        "command_timeout": settings.database_statement_timeout_ms / 1000,  # 🔥 Query timeout (seconds)
        "server_settings": {
            "jit": "off",  # 🔥 Disable JIT for predictable performance
            "application_name": "ava-api-production",  # 🔥 Identify in PostgreSQL logs
            "statement_timeout": f"{settings.database_statement_timeout_ms}ms",  # 🔥 DIVINE: Must include unit!
        },
    },
)
SessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)

_ASYNC_PG_ERRORS: tuple[type[Exception], ...]
if asyncpg_exceptions:
    _ASYNC_PG_ERRORS = (
        asyncpg_exceptions.PostgresError,  # type: ignore[attr-defined]
        asyncpg_exceptions.PostgresConnectionError,  # type: ignore[attr-defined]
    )
else:  # pragma: no cover - asyncpg not installed in some unit tests
    _ASYNC_PG_ERRORS = tuple()

async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """
    🔥 DIVINE: Provide an AsyncSession for FastAPI dependency injection.
    
    Per-request sessions with NullPool (PgBouncer handles connection pooling).
    Failures bubble up to FastAPI error handlers - let upstream retry logic
    handle transient errors instead of hiding them in generator loops.
    
    Note: Retry configuration settings (database_max_retries, etc.) are
    reserved for future middleware/decorator-based retry logic.
    """
    async with SessionLocal() as session:
        yield session


__all__ = ["SessionLocal", "engine", "get_session"]
