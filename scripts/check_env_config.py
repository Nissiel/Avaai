#!/usr/bin/env python3
"""
🔥 DIVINE CODEX - Environment Configuration Check
Checks and fixes DATABASE_URL configuration for local and production
"""

import os
from pathlib import Path

def check_environment():
    """Check environment configuration"""

    print("🔥 DIVINE CODEX - Environment Check")
    print("=" * 60)

    # Check local .env
    env_path = Path(__file__).parent.parent / "api" / ".env"

    if not env_path.exists():
        print(f"❌ .env file not found at: {env_path}")
        return False

    print(f"✅ Found .env file")
    print()

    # Read and parse .env
    with open(env_path, 'r') as f:
        env_content = f.read()

    # Check DATABASE_URL
    print("📋 Current Configuration:")
    print()

    if 'AVA_API_DATABASE_URL' in env_content:
        for line in env_content.split('\n'):
            if line.startswith('AVA_API_DATABASE_URL'):
                db_url = line.split('=', 1)[1] if '=' in line else ''
                print(f"DATABASE_URL: {db_url}")

                if 'localhost' in db_url:
                    print("⚠️  Using LOCAL PostgreSQL (localhost)")
                    print("   This requires PostgreSQL to be running on your machine")
                    print()
                elif 'supabase' in db_url:
                    print("✅ Using SUPABASE PostgreSQL")
                    print()
                elif 'sqlite' in db_url:
                    print("⚠️  Using SQLite (local file)")
                    print()
                else:
                    print("❓ Unknown database type")
                    print()

    # Recommendations
    print("=" * 60)
    print("💡 RECOMMENDATIONS:")
    print()
    print("FOR LOCAL DEVELOPMENT:")
    print("Option 1 (Recommended): Use Supabase for everything")
    print("  - Get DATABASE_URL from Supabase Dashboard")
    print("  - Update api/.env with Supabase URL")
    print()
    print("Option 2: Use SQLite locally (simple, no setup)")
    print("  - Change DATABASE_URL to: sqlite+aiosqlite:///./ava.db")
    print("  - Good for quick testing")
    print()
    print("Option 3: Install PostgreSQL locally")
    print("  - brew install postgresql@15")
    print("  - brew services start postgresql@15")
    print("  - createdb avaai_db")
    print()
    print("FOR PRODUCTION (Render):")
    print("✅ Already configured with Supabase via environment variables")
    print("  DATABASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY set on Render")
    print()
    print("=" * 60)

    return True

if __name__ == "__main__":
    check_environment()
