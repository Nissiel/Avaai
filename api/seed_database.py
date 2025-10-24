#!/usr/bin/env python3
"""
🌱 Database Seeding Script - DIVINE
Inserts default fixtures into PostgreSQL database
"""

import asyncio
import os
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Load .env file explicitly
from dotenv import load_dotenv
env_path = Path(__file__).parent / ".env"
load_dotenv(env_path)

import bcrypt
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select

from api.src.core.settings import get_settings
from api.src.infrastructure.persistence.models import User, Base


# Default fixtures (same as auth.py)
DEFAULT_USER_FIXTURES = [
    {
        "email": "test@divine.ai",
        "password": "Divine123!",
        "name": "Divine Test User",
        "phone": "+33123456789",
        "locale": "fr",
    },
]


def hash_password(password: str) -> str:
    """Hash password with bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


async def seed_database():
    """Seed database with default fixtures"""
    
    # Get DATABASE_URL directly from environment (bypass settings validation issues)
    database_url = os.getenv("AVA_API_DATABASE_URL")
    if not database_url:
        raise ValueError("AVA_API_DATABASE_URL not set in .env")
    
    print(f"🔗 Connecting to: {database_url}")
    
    # Create async engine
    engine = create_async_engine(database_url, echo=False)
    
    # Create session factory
    SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with SessionLocal() as session:
        print("\n🌱 Seeding database with fixtures...\n")
        
        for fixture in DEFAULT_USER_FIXTURES:
            # Check if user already exists
            result = await session.execute(
                select(User).where(User.email == fixture["email"])
            )
            existing_user = result.scalar_one_or_none()
            
            if existing_user:
                print(f"⏭️  User {fixture['email']} already exists, skipping...")
                continue
            
            # Hash password
            hashed_password = hash_password(fixture["password"])
            
            # Create user
            user = User(
                email=fixture["email"],
                password=hashed_password,
                name=fixture.get("name"),
                phone=fixture.get("phone"),
                locale=fixture.get("locale", "en"),
                onboarding_completed=True,  # Test user is already onboarded
                phone_verified=True,  # Test user is verified
            )
            
            session.add(user)
            await session.commit()
            await session.refresh(user)
            
            print(f"✅ Created user: {user.email} (ID: {user.id})")
            print(f"   Name: {user.name}")
            print(f"   Phone: {user.phone}")
            print(f"   Locale: {user.locale}")
            print()
    
    await engine.dispose()
    print("🎉 Seeding complete!\n")


async def verify_seed():
    """Verify seeded data"""
    database_url = os.getenv("AVA_API_DATABASE_URL")
    engine = create_async_engine(database_url, echo=False)
    SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with SessionLocal() as session:
        result = await session.execute(select(User))
        users = result.scalars().all()
        
        print("📊 Current users in database:")
        print("-" * 60)
        for user in users:
            print(f"  • {user.email} ({user.name})")
            print(f"    ID: {user.id}")
            print(f"    Created: {user.created_at}")
            print()
    
    await engine.dispose()


if __name__ == "__main__":
    print("\n" + "="*60)
    print("   🌟 DIVINE DATABASE SEEDING 🌟")
    print("="*60 + "\n")
    
    try:
        asyncio.run(seed_database())
        asyncio.run(verify_seed())
        
        print("="*60)
        print("   ✨ SUCCESS - Database ready for testing! ✨")
        print("="*60 + "\n")
        
        print("🔑 Test credentials:")
        print("   Email: test@divine.ai")
        print("   Password: Divine123!")
        print("\n🚀 Next: Start backend and test login!\n")
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}\n")
        import traceback
        traceback.print_exc()
        sys.exit(1)
