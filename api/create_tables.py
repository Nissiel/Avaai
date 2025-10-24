"""
Simple script to create all database tables.
Run once to initialize the database schema.
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from api.src.infrastructure.database.session import engine
from api.src.infrastructure.persistence.models.tenant import Base
from api.src.infrastructure.persistence.models.user import User  # Import to register with Base


async def create_tables():
    """Create all tables defined in models."""
    print("Creating database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ All tables created successfully!")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(create_tables())
