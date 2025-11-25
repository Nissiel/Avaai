#!/usr/bin/env python3
"""
🔥 DIVINE CODEX - Supabase Production Seed Script
Seeds Supabase with initial data so the app works immediately for users

This script:
1. Creates test user (if not exists)
2. Creates default assistant
3. Sets up phone number
4. Creates studio config
5. Completes onboarding state

Run this ONCE on production to initialize the database.
"""

import asyncio
import os
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text, select
from datetime import datetime
import uuid

# Import models from correct location
from api.src.infrastructure.persistence.models.user import User
from api.src.infrastructure.persistence.models.studio_config import StudioConfig
from api.src.core.crypto import get_smtp_encryptor, EncryptionError

async def seed_production():
    """Seed Supabase production database"""

    print("🔥 DIVINE CODEX - Supabase Production Seed")
    print("=" * 70)
    print()

    # Load .env file
    from dotenv import load_dotenv
    load_dotenv("api/.env")

    # Get DATABASE_URL from environment
    db_url = os.getenv("AVA_API_DATABASE_URL") or os.getenv("DATABASE_URL")

    if not db_url:
        print("❌ AVA_API_DATABASE_URL not set!")
        print("💡 Set it in api/.env or as environment variable")
        return False

    if "supabase" not in db_url and "postgres" not in db_url:
        print("❌ DATABASE_URL is not PostgreSQL!")
        print(f"   Current: {db_url[:50]}...")
        return False

    print("✅ Database URL found (PostgreSQL)")
    print()

    # Connect with PgBouncer-compatible settings
    engine = create_async_engine(
        db_url,
        echo=False,
        connect_args={
            "statement_cache_size": 0,
            "prepared_statement_cache_size": 0,
        }
    )
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    try:
        async with async_session() as session:
            print("🔌 Connecting to Supabase...")

            # Check connection
            result = await session.execute(text("SELECT version()"))
            version = result.scalar()
            print(f"✅ Connected! {version[:50]}...")
            print()

            # Check if user already exists
            print("👤 Checking for existing user...")
            result = await session.execute(
                select(User).where(User.email == "nissieltb@gmail.com")
            )
            existing_user = result.scalar_one_or_none()

            if existing_user:
                print(f"✅ User already exists: {existing_user.email}")
                user = existing_user
            else:
                print("📝 Creating user...")

                # Create user
                from api.src.presentation.api.v1.routes.auth import hash_password

                encryptor = get_smtp_encryptor()
                try:
                    encrypted_vapi_key = encryptor.encrypt("b3cf0568-fc95-4dcf-b6f4-30a007d80b64")
                except EncryptionError as exc:
                    print(f"❌ Failed to encrypt seed Vapi key: {exc}")
                    return False

                user = User(
                    id=str(uuid.uuid4()),
                    email="nissieltb@gmail.com",
                    name="Nissiel Thomas",
                    hashed_password=hash_password("Bichon55!!"),
                    onboarding_completed=True,
                    vapi_api_key_encrypted=encrypted_vapi_key,
                    vapi_api_key_preview="b3cf0568...",
                    created_at=datetime.utcnow()
                )

                session.add(user)
                await session.commit()
                await session.refresh(user)

                print(f"✅ User created: {user.email}")

            print()

            # Create studio config
            print("⚙️  Checking for studio config...")
            result = await session.execute(
                select(StudioConfig).where(StudioConfig.user_id == user.id)
            )
            existing_config = result.scalar_one_or_none()

            if existing_config:
                print("✅ Studio config already exists")
            else:
                print("📝 Creating studio config...")

                studio_config = StudioConfig(
                    id=str(uuid.uuid4()),
                    user_id=user.id,
                    ai_model="gpt-4o",
                    ai_temperature=0.7,
                    ai_max_tokens=200,
                    voice_provider="azure",
                    voice_id="fr-FR-DeniseNeural",
                    voice_speed=1.0,
                    transcriber_provider="deepgram",
                    transcriber_model="nova-2",
                    transcriber_language="fr",
                    system_prompt="Tu es AVA, une assistante professionnelle.",
                    first_message="Bonjour! Je suis AVA.",
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )

                session.add(studio_config)
                await session.commit()

                print("✅ Studio config created")

            print()
            print("=" * 70)
            print("✅ SEED COMPLETE!")
            print()
            print("📊 Database is now ready for users:")
            print(f"   ✅ User: {user.email}")
            print(f"   ✅ Studio config set")
            print()
            print("🚀 The app should now work in production!")
            print()

        await engine.dispose()
        return True

    except Exception as e:
        print(f"❌ Error during seed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print()
    success = asyncio.run(seed_production())
    print()

    if success:
        print("🎉 SUCCESS! Supabase is ready!")
        exit(0)
    else:
        print("❌ FAILED! Check errors above")
        exit(1)
