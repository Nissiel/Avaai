"""Test Supabase database connection."""
import asyncio
import sys
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

# Supabase connection URL (pooler for connection pooling)
SUPABASE_URL = "postgresql+asyncpg://postgres.zymlhofsintkycruwznc:Bichon55!!??@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"


async def test_connection():
    """Test Supabase database connection."""
    try:
        print("🔍 Testing Supabase connection...")
        engine = create_async_engine(SUPABASE_URL, echo=False)
        
        async with engine.begin() as conn:
            # Test basic query
            result = await conn.execute(text("SELECT version()"))
            version = result.scalar()
            print(f"✅ Supabase connection successful!")
            print(f"PostgreSQL version: {version[:80]}...")
            
            # Check if users table exists
            result = await conn.execute(text(
                "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')"
            ))
            users_exists = result.scalar()
            print(f"✅ Users table exists: {users_exists}")
            
            if users_exists:
                # Count users
                result = await conn.execute(text("SELECT COUNT(*) FROM users"))
                user_count = result.scalar()
                print(f"✅ Total users in database: {user_count}")
        
        await engine.dispose()
        print("\n✅ All database checks passed!")
        return True
        
    except Exception as e:
        print(f"\n❌ Connection failed: {type(e).__name__}: {e}")
        return False


if __name__ == "__main__":
    success = asyncio.run(test_connection())
    sys.exit(0 if success else 1)
