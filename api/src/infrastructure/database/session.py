"""
Database session helpers for the Ava multi-tenant backend.

The project uses SQLAlchemy 2.x with async sessions. The connection URL is
supplied via the `DATABASE_URL` environment variable.
"""

from __future__ import annotations
from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import AsyncAdaptedQueuePool

from api.src.core.settings import get_settings

settings = get_settings()

# 🔥 DIVINE FIX: Use connection pooling to keep database warm
# CRITICAL: Pre-create connections to prevent cold-start delays
# CRITICAL: Aggressive timeouts to fast-fail on truly slow queries
engine = create_async_engine(
    settings.database_url,
    echo=False,
    future=True,
    poolclass=AsyncAdaptedQueuePool,  # 🔥 Use connection pool
    pool_size=5,  # Keep 5 warm connections
    max_overflow=10,  # Allow burst to 15 total
    pool_pre_ping=True,  # Test connections before use (handles sleeping DB)
    pool_recycle=300,  # Recycle connections every 5 minutes
    connect_args={
        "statement_cache_size": 0,  # Disable prepared statement cache (PgBouncer compatibility)
        "prepared_statement_name_func": lambda: f"__asyncpg_{uuid4()}__",  # Unique names (PgBouncer compatibility)
        "timeout": 10.0,  # 🔥 10-second connection timeout (give Supabase time to wake)
        "command_timeout": 15.0,  # 🔥 15-second query timeout (enough for cold starts)
        "server_settings": {
            "jit": "off",
            "application_name": "ava-api-production",
            "statement_timeout": "15000"  # 🔥 PostgreSQL-level timeout (15 seconds)
        }
    }
)
SessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)


async def get_session() -> AsyncSession:
    async with SessionLocal() as session:
        yield session
