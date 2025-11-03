#!/usr/bin/env python3
"""
🔥 DIVINE CODEX - Supabase Direct Check
Connects to Supabase and shows what's actually in the database
"""

import asyncio
import os
from pathlib import Path
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

# Load environment variables
from dotenv import load_dotenv
env_path = Path(__file__).parent.parent / "api" / ".env"
load_dotenv(env_path)

async def check_supabase():
    """Check Supabase connection and data"""
    
    print("🔥 DIVINE CODEX - Supabase Direct Check")
    print("=" * 60)
    
    # Get DATABASE_URL
    db_url = os.getenv("DATABASE_URL")
    
    if not db_url:
        print("❌ DATABASE_URL not found in .env")
        print(f"📁 Checked: {env_path}")
        return False
    
    print(f"✅ DATABASE_URL found")
    print(f"🔗 Type: {'PostgreSQL' if 'postgres' in db_url else 'SQLite'}")
    print()
    
    # Connect
    try:
        engine = create_async_engine(db_url, echo=False)
        async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        
        print("🔌 Connecting to database...")
        
        async with async_session() as session:
            # Get PostgreSQL version
            result = await session.execute(text("SELECT version()"))
            version = result.scalar()
            print(f"✅ Connected!")
            print(f"📊 {version[:50]}...")
            print()
            
            # List all tables
            print("📋 Tables in database:")
            result = await session.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name
            """))
            
            tables = [row[0] for row in result.fetchall()]
            
            if not tables:
                print("⚠️  No tables found!")
                return False
            
            print(f"✅ Found {len(tables)} tables:")
            for table in tables:
                print(f"   - {table}")
            print()
            
            # Count rows in each table
            print("📊 Row counts:")
            for table in tables:
                try:
                    result = await session.execute(text(f"SELECT COUNT(*) FROM {table}"))
                    count = result.scalar()
                    
                    if count > 0:
                        print(f"✅ {table:25} → {count:4} rows")
                    else:
                        print(f"⚠️  {table:25} → Empty")
                except Exception as e:
                    print(f"❌ {table:25} → Error: {e}")
            
            print()
            
            # Check foreign keys
            print("🔗 Foreign Keys:")
            result = await session.execute(text("""
                SELECT
                    tc.table_name,
                    kcu.column_name,
                    ccu.table_name AS foreign_table_name,
                    ccu.column_name AS foreign_column_name
                FROM information_schema.table_constraints AS tc
                JOIN information_schema.key_column_usage AS kcu
                    ON tc.constraint_name = kcu.constraint_name
                JOIN information_schema.constraint_column_usage AS ccu
                    ON ccu.constraint_name = tc.constraint_name
                WHERE tc.constraint_type = 'FOREIGN KEY'
                ORDER BY tc.table_name
            """))
            
            fks = result.fetchall()
            if fks:
                print(f"✅ Found {len(fks)} foreign keys:")
                for fk in fks:
                    print(f"   {fk[0]}.{fk[1]} → {fk[2]}.{fk[3]}")
            else:
                print("⚠️  No foreign keys found")
            
            print()
            print("=" * 60)
            print("✅ Supabase check complete!")
        
        await engine.dispose()
        return True
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(check_supabase())
    exit(0 if success else 1)
