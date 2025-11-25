"""
Supabase Auth Service - Admin SDK operations for user management.

This service uses the Supabase Admin API (service role key) to:
- Create users in Supabase Auth
- Verify user credentials
- Get user by ID
- Delete users

The service role key has full access and bypasses RLS.
"""

from __future__ import annotations

import logging
from typing import Optional
from dataclasses import dataclass

from supabase import create_client, Client
from supabase_auth.errors import AuthApiError

from api.src.core.settings import get_settings

logger = logging.getLogger("ava.supabase_auth")


@dataclass
class SupabaseUser:
    """Supabase Auth user data."""
    id: str
    email: str
    phone: Optional[str] = None
    email_confirmed_at: Optional[str] = None
    phone_confirmed_at: Optional[str] = None
    user_metadata: Optional[dict] = None


class SupabaseAuthService:
    """Service for Supabase Auth Admin operations."""

    def __init__(self):
        settings = get_settings()

        if not settings.supabase_project_url or not settings.supabase_service_role_key:
            raise ValueError(
                "Supabase Auth requires SUPABASE_PROJECT_URL and SUPABASE_SERVICE_ROLE_KEY"
            )

        self._client: Client = create_client(
            settings.supabase_project_url,
            settings.supabase_service_role_key
        )
        self._admin = self._client.auth.admin

    async def create_user(
        self,
        email: str,
        password: str,
        name: Optional[str] = None,
        phone: Optional[str] = None,
        locale: str = "en",
        email_confirm: bool = False,
    ) -> SupabaseUser:
        """
        Create a new user in Supabase Auth.

        This will trigger the database function that syncs to public.users.

        Args:
            email: User's email address
            password: User's password
            name: User's display name
            phone: User's phone number (E.164 format)
            locale: User's preferred locale
            email_confirm: Whether to auto-confirm email (skip verification)

        Returns:
            SupabaseUser with the created user's data

        Raises:
            AuthApiError: If user creation fails
        """
        try:
            user_metadata = {
                "name": name,
                "locale": locale,
            }
            if phone:
                user_metadata["phone"] = phone

            response = self._admin.create_user({
                "email": email,
                "password": password,
                "email_confirm": email_confirm,
                "user_metadata": user_metadata,
            })

            user = response.user
            logger.info(f"Created Supabase user: {user.id} ({email})")

            return SupabaseUser(
                id=user.id,
                email=user.email,
                phone=user.phone,
                email_confirmed_at=str(user.email_confirmed_at) if user.email_confirmed_at else None,
                phone_confirmed_at=str(user.phone_confirmed_at) if user.phone_confirmed_at else None,
                user_metadata=user.user_metadata,
            )

        except AuthApiError as e:
            logger.error(f"Failed to create Supabase user: {e.message}")
            raise

    async def sign_in_with_password(
        self,
        email: str,
        password: str,
    ) -> tuple[SupabaseUser, str, str]:
        """
        Sign in user with email and password.

        Returns:
            Tuple of (SupabaseUser, access_token, refresh_token)

        Raises:
            AuthApiError: If authentication fails
        """
        try:
            # Use client auth (not admin) for password verification
            response = self._client.auth.sign_in_with_password({
                "email": email,
                "password": password,
            })

            user = response.user
            session = response.session

            logger.info(f"Supabase sign in successful: {user.id} ({email})")

            supabase_user = SupabaseUser(
                id=user.id,
                email=user.email,
                phone=user.phone,
                email_confirmed_at=str(user.email_confirmed_at) if user.email_confirmed_at else None,
                phone_confirmed_at=str(user.phone_confirmed_at) if user.phone_confirmed_at else None,
                user_metadata=user.user_metadata,
            )

            return supabase_user, session.access_token, session.refresh_token

        except AuthApiError as e:
            logger.error(f"Supabase sign in failed: {e.message}")
            raise

    async def get_user_by_id(self, user_id: str) -> Optional[SupabaseUser]:
        """
        Get user by Supabase Auth ID.

        Args:
            user_id: Supabase Auth user ID

        Returns:
            SupabaseUser or None if not found
        """
        try:
            response = self._admin.get_user_by_id(user_id)
            user = response.user

            return SupabaseUser(
                id=user.id,
                email=user.email,
                phone=user.phone,
                email_confirmed_at=str(user.email_confirmed_at) if user.email_confirmed_at else None,
                phone_confirmed_at=str(user.phone_confirmed_at) if user.phone_confirmed_at else None,
                user_metadata=user.user_metadata,
            )

        except AuthApiError as e:
            logger.warning(f"Failed to get Supabase user {user_id}: {e.message}")
            return None

    async def delete_user(self, user_id: str) -> bool:
        """
        Delete user from Supabase Auth.

        Args:
            user_id: Supabase Auth user ID

        Returns:
            True if deleted, False otherwise
        """
        try:
            self._admin.delete_user(user_id)
            logger.info(f"Deleted Supabase user: {user_id}")
            return True

        except AuthApiError as e:
            logger.error(f"Failed to delete Supabase user {user_id}: {e.message}")
            return False

    async def update_user(
        self,
        user_id: str,
        email: Optional[str] = None,
        password: Optional[str] = None,
        user_metadata: Optional[dict] = None,
    ) -> Optional[SupabaseUser]:
        """
        Update user in Supabase Auth.

        Args:
            user_id: Supabase Auth user ID
            email: New email address
            password: New password
            user_metadata: New user metadata

        Returns:
            Updated SupabaseUser or None if failed
        """
        try:
            update_data = {}
            if email:
                update_data["email"] = email
            if password:
                update_data["password"] = password
            if user_metadata:
                update_data["user_metadata"] = user_metadata

            response = self._admin.update_user_by_id(user_id, update_data)
            user = response.user

            logger.info(f"Updated Supabase user: {user_id}")

            return SupabaseUser(
                id=user.id,
                email=user.email,
                phone=user.phone,
                email_confirmed_at=str(user.email_confirmed_at) if user.email_confirmed_at else None,
                phone_confirmed_at=str(user.phone_confirmed_at) if user.phone_confirmed_at else None,
                user_metadata=user.user_metadata,
            )

        except AuthApiError as e:
            logger.error(f"Failed to update Supabase user {user_id}: {e.message}")
            return None


# Singleton instance
_supabase_auth_service: Optional[SupabaseAuthService] = None


def get_supabase_auth_service() -> SupabaseAuthService:
    """Get or create Supabase Auth service instance."""
    global _supabase_auth_service

    if _supabase_auth_service is None:
        _supabase_auth_service = SupabaseAuthService()

    return _supabase_auth_service


__all__ = ["SupabaseAuthService", "SupabaseUser", "get_supabase_auth_service"]
