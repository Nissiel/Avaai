"""
Database session helpers for the Ava multi-tenant backend.

The project uses SQLAlchemy 2.x with async sessions. The connection URL is
supplied via the `DATABASE_URL` environment variable.
"""

from __future__ import annotations

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from api.src.core.settings import get_settings

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
        "statement_cache_size": 0,  # 🔥 CRITICAL: Disable asyncpg prepared statements (PgBouncer compat)
        "prepared_statement_cache_size": 0,  # 🔥 CRITICAL: Disable SQLAlchemy prepared statements (PgBouncer compat)
        "timeout": 10.0,  # 🔥 10-second connection timeout (give Supabase time to wake)
        "command_timeout": 15.0,  # 🔥 15-second query timeout (enough for cold starts)
        "server_settings": {
            "jit": "off",  # 🔥 Disable JIT for predictable performance
            "application_name": "ava-api-production",  # 🔥 Identify in PostgreSQL logs
            "statement_timeout": "15000"  # 🔥 PostgreSQL-level timeout (15 seconds)
        }
    },
)
SessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session
