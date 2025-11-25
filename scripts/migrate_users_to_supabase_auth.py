#!/usr/bin/env python3
"""
Migrate existing users from public.users to Supabase Auth.

This script creates auth.users entries for existing public.users and links them
via the supabase_user_id field.

Usage:
    python scripts/migrate_users_to_supabase_auth.py

Requirements:
    - SUPABASE_PROJECT_URL environment variable
    - SUPABASE_SERVICE_ROLE_KEY environment variable
    - AVA_API_DATABASE_URL environment variable

Note: Since we cannot recover original passwords, users will need to reset
their passwords after migration. The script sets a temporary random password.
"""

import asyncio
import os
import sys
import secrets
from pathlib import Path

# Add api directory to path for imports
api_dir = Path(__file__).resolve().parents[1] / "api"
sys.path.insert(0, str(api_dir))

from supabase import create_client, Client
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker


def get_env_or_exit(key: str) -> str:
    """Get environment variable or exit with error."""
    value = os.getenv(key)
    if not value:
        print(f"ERROR: {key} environment variable is required")
        sys.exit(1)
    return value


def generate_temp_password() -> str:
    """Generate a secure temporary password."""
    return secrets.token_urlsafe(32)


async def migrate_users():
    """Migrate existing users to Supabase Auth."""

    # Get configuration from environment
    supabase_url = get_env_or_exit("SUPABASE_PROJECT_URL")
    service_role_key = get_env_or_exit("SUPABASE_SERVICE_ROLE_KEY")
    database_url = get_env_or_exit("AVA_API_DATABASE_URL")

    # Initialize Supabase client with service role
    supabase: Client = create_client(supabase_url, service_role_key)

    # Initialize database connection
    engine = create_engine(database_url)
    Session = sessionmaker(bind=engine)

    print("=" * 60)
    print("Migrating existing users to Supabase Auth")
    print("=" * 60)

    # Get users that need migration (supabase_user_id is NULL)
    with Session() as session:
        result = session.execute(text("""
            SELECT id, email, name, phone, locale
            FROM public.users
            WHERE supabase_user_id IS NULL
            ORDER BY created_at
        """))
        users_to_migrate = result.fetchall()

    if not users_to_migrate:
        print("\nNo users need migration. All users already have supabase_user_id.")
        return

    print(f"\nFound {len(users_to_migrate)} users to migrate:\n")

    migrated_count = 0
    failed_count = 0
    password_reset_needed = []

    for user in users_to_migrate:
        user_id, email, name, phone, locale = user
        print(f"Migrating: {email}...", end=" ")

        try:
            # Generate temporary password (user will need to reset)
            temp_password = generate_temp_password()

            # Create user in Supabase Auth
            auth_response = supabase.auth.admin.create_user({
                "email": email,
                "password": temp_password,
                "email_confirm": True,  # Skip email confirmation
                "user_metadata": {
                    "name": name,
                    "phone": phone,
                    "locale": locale or "en"
                }
            })

            if not auth_response.user:
                print("FAILED - No user returned")
                failed_count += 1
                continue

            supabase_user_id = auth_response.user.id

            # Update public.users with supabase_user_id
            with Session() as session:
                session.execute(text("""
                    UPDATE public.users
                    SET supabase_user_id = :supabase_user_id,
                        updated_at = NOW()
                    WHERE id = :user_id
                """), {
                    "supabase_user_id": supabase_user_id,
                    "user_id": user_id
                })
                session.commit()

            print(f"OK (supabase_id: {supabase_user_id})")
            migrated_count += 1
            password_reset_needed.append(email)

        except Exception as e:
            error_msg = str(e)
            if "User already registered" in error_msg:
                # User exists in auth, just need to link
                print("ALREADY EXISTS - Attempting to link...")
                try:
                    # Get the existing auth user by email
                    users_response = supabase.auth.admin.list_users()
                    auth_user = None
                    for u in users_response:
                        if hasattr(u, 'email') and u.email == email:
                            auth_user = u
                            break

                    if auth_user:
                        # Update public.users with supabase_user_id
                        with Session() as session:
                            session.execute(text("""
                                UPDATE public.users
                                SET supabase_user_id = :supabase_user_id,
                                    updated_at = NOW()
                                WHERE id = :user_id
                            """), {
                                "supabase_user_id": str(auth_user.id),
                                "user_id": user_id
                            })
                            session.commit()
                        print(f"LINKED (supabase_id: {auth_user.id})")
                        migrated_count += 1
                    else:
                        print("FAILED - Could not find auth user")
                        failed_count += 1
                except Exception as link_error:
                    print(f"FAILED - {link_error}")
                    failed_count += 1
            else:
                print(f"FAILED - {error_msg}")
                failed_count += 1

    # Summary
    print("\n" + "=" * 60)
    print("Migration Summary")
    print("=" * 60)
    print(f"Total users to migrate: {len(users_to_migrate)}")
    print(f"Successfully migrated: {migrated_count}")
    print(f"Failed: {failed_count}")

    if password_reset_needed:
        print("\n" + "=" * 60)
        print("IMPORTANT: Password Reset Required")
        print("=" * 60)
        print("The following users were created with temporary passwords.")
        print("They MUST reset their passwords to log in:\n")
        for email in password_reset_needed:
            print(f"  - {email}")
        print("\nSend password reset emails using:")
        print("  supabase.auth.admin.generate_link({'type': 'recovery', 'email': '<email>'})")

    print("\n" + "=" * 60)
    print("Migration Complete")
    print("=" * 60)


def main():
    """Entry point."""
    # Check for required environment variables
    required_vars = [
        "SUPABASE_PROJECT_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
        "AVA_API_DATABASE_URL"
    ]

    missing = [var for var in required_vars if not os.getenv(var)]
    if missing:
        print("ERROR: Missing required environment variables:")
        for var in missing:
            print(f"  - {var}")
        print("\nPlease set these variables and try again.")
        sys.exit(1)

    # Run migration
    asyncio.run(migrate_users())


if __name__ == "__main__":
    main()
