#!/usr/bin/env python3
"""Simple seed script to create a test user in Supabase using psycopg2 (sync)."""

import os
import sys
import uuid
from pathlib import Path
from datetime import datetime, timezone

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

import psycopg2
from dotenv import load_dotenv

# Load environment
load_dotenv("api/.env")

def seed_user():
    """Seed a test user in Supabase."""

    print("Seeding Supabase database...")
    print("=" * 50)

    # Get database URL
    db_url = os.getenv("AVA_API_DATABASE_URL")
    if not db_url:
        print("ERROR: AVA_API_DATABASE_URL not set!")
        return False

    # Convert async URL to sync
    db_url = db_url.replace("postgresql+asyncpg://", "postgresql://")

    try:
        # Connect
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()

        print("Connected to Supabase!")

        # Check if user exists
        cur.execute("SELECT id, email FROM users WHERE email = %s", ("nissieltb@gmail.com",))
        existing = cur.fetchone()

        if existing:
            print(f"User already exists: {existing[1]}")
            user_id = existing[0]
        else:
            # Hash password using bcrypt
            import bcrypt
            hashed = bcrypt.hashpw("Bichon55!!".encode('utf-8'), bcrypt.gensalt())
            hashed_password = hashed.decode('utf-8')

            # Encrypt Vapi key
            from cryptography.fernet import Fernet
            encryption_key = os.getenv("AVA_API_SMTP_ENCRYPTION_KEY")
            if not encryption_key:
                print("ERROR: AVA_API_SMTP_ENCRYPTION_KEY not set!")
                return False
            fernet = Fernet(encryption_key.encode())
            encrypted_vapi_key = fernet.encrypt("b3cf0568-fc95-4dcf-b6f4-30a007d80b64".encode()).decode()

            # Create user
            user_id = str(uuid.uuid4())
            now = datetime.now(timezone.utc)
            cur.execute("""
                INSERT INTO users (
                    id, email, name, password, locale,
                    phone_verified, two_fa_enabled,
                    onboarding_completed, onboarding_step,
                    onboarding_vapi_skipped, onboarding_twilio_skipped, onboarding_assistant_created,
                    vapi_api_key_encrypted, vapi_api_key_preview,
                    created_at, updated_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                user_id,
                "nissieltb@gmail.com",
                "Nissiel Thomas",
                hashed_password,
                "fr",
                False,  # phone_verified
                False,  # two_fa_enabled
                True,   # onboarding_completed
                4,      # onboarding_step
                False,  # onboarding_vapi_skipped
                False,  # onboarding_twilio_skipped
                True,   # onboarding_assistant_created
                encrypted_vapi_key,
                "b3cf0568...",
                now,
                now
            ))
            conn.commit()
            print(f"Created user: nissieltb@gmail.com")

        # Check for studio config
        cur.execute("SELECT id FROM studio_configs WHERE user_id = %s", (user_id,))
        existing_config = cur.fetchone()

        if existing_config:
            print("Studio config already exists")
        else:
            # Create studio config with all required fields
            config_id = str(uuid.uuid4())
            now = datetime.now(timezone.utc)
            cur.execute("""
                INSERT INTO studio_configs (
                    id, user_id,
                    organization_name, timezone, phone_number, business_hours,
                    smtp_server, smtp_port, smtp_username, smtp_password_encrypted,
                    voice_provider, voice_id, voice_speed,
                    ai_model, ai_temperature, ai_max_tokens,
                    transcriber_provider, transcriber_model, transcriber_language,
                    first_message, system_prompt,
                    persona, tone, language,
                    ask_for_name, ask_for_email, ask_for_phone,
                    created_at, updated_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                config_id,
                user_id,
                "My Organization",  # organization_name
                "Europe/Paris",     # timezone
                "",                 # phone_number
                "09:00-18:00",      # business_hours
                "",                 # smtp_server
                "587",              # smtp_port
                "",                 # smtp_username
                "",                 # smtp_password_encrypted
                "azure",            # voice_provider
                "fr-FR-DeniseNeural", # voice_id
                1.0,                # voice_speed
                "gpt-4o",           # ai_model
                0.7,                # ai_temperature
                200,                # ai_max_tokens
                "deepgram",         # transcriber_provider
                "nova-2",           # transcriber_model
                "fr",               # transcriber_language
                "Bonjour! Je suis AVA.", # first_message
                "Tu es AVA, une assistante professionnelle.", # system_prompt
                "professional",     # persona
                "friendly",         # tone
                "fr",               # language
                True,               # ask_for_name
                False,              # ask_for_email
                False,              # ask_for_phone
                now,
                now
            ))
            conn.commit()
            print("Created studio config")

        # Verify
        cur.execute("SELECT COUNT(*) FROM users")
        user_count = cur.fetchone()[0]
        print(f"\nTotal users in database: {user_count}")

        cur.close()
        conn.close()

        print("\n" + "=" * 50)
        print("Seed complete!")
        return True

    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = seed_user()
    sys.exit(0 if success else 1)
