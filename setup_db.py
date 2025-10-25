#!/usr/bin/env python3
"""
🔧 Database Setup Script
Crée toutes les tables SQLAlchemy dans PostgreSQL
"""
import asyncio
import sys
from pathlib import Path

# Add api to path
sys.path.insert(0, str(Path(__file__).parent))

from api.src.infrastructure.database.session import engine
from api.src.infrastructure.persistence.models import Base


async def create_all_tables():
    """Create all SQLAlchemy tables in the database"""
    try:
        print("🔧 Creating database tables...")
        print(f"📍 Database: {engine.url}")
        
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        print("✅ All tables created successfully!")
        print("\n📋 Tables created:")
        for table_name in Base.metadata.tables.keys():
            print(f"   - {table_name}")
            
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        raise
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(create_all_tables())
