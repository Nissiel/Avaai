"""
User repository for database operations.

Clean Architecture repository pattern for User entity.
All database operations are async and use SQLAlchemy 2.x sessions.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.src.infrastructure.persistence.models.user import User

if TYPE_CHECKING:
    from uuid import UUID


class UserRepository:
    """Repository for User database operations."""

    def __init__(self, session: AsyncSession):
        """Initialize repository with database session."""
        self.session = session

    async def create(
        self,
        email: str,
        password: Optional[str] = None,
        phone: Optional[str] = None,
        name: Optional[str] = None,
        locale: str = "en",
    ) -> User:
        """
        Create a new user in database.

        Args:
            email: User email (required, unique)
            password: Hashed password (optional for OAuth users)
            phone: Phone number in E.164 format (optional, unique if provided)
            name: User display name (optional)
            locale: User locale (default: "en")

        Returns:
            Created User model with generated ID and timestamps

        Raises:
            IntegrityError: If email or phone already exists
        """
        user = User(
            email=email,
            password=password,
            phone=phone,
            name=name,
            locale=locale,
        )
        self.session.add(user)
        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def get_by_email(self, email: str) -> User | None:
        """
        Find user by email address.

        Args:
            email: Email address to search for

        Returns:
            User if found, None otherwise
        """
        result = await self.session.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()

    async def get_by_phone(self, phone: str) -> User | None:
        """
        Find user by phone number.

        Args:
            phone: Phone number in E.164 format

        Returns:
            User if found, None otherwise
        """
        result = await self.session.execute(
            select(User).where(User.phone == phone)
        )
        return result.scalar_one_or_none()

    async def get_by_id(self, user_id: str | UUID) -> User | None:
        """
        Find user by ID.

        Args:
            user_id: User UUID (string or UUID object)

        Returns:
            User if found, None otherwise
        """
        result = await self.session.execute(
            select(User).where(User.id == str(user_id))
        )
        return result.scalar_one_or_none()

    async def update(
        self,
        user_id: str | UUID,
        **fields,
    ) -> User | None:
        """
        Update user fields.

        Args:
            user_id: User UUID to update
            **fields: Fields to update (e.g., name="John", onboarding_completed=True)

        Returns:
            Updated User if found, None otherwise

        Example:
            await repo.update(user_id, name="John Doe", onboarding_completed=True)
        """
        user = await self.get_by_id(user_id)
        if not user:
            return None

        for key, value in fields.items():
            if hasattr(user, key):
                setattr(user, key, value)

        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def delete(self, user_id: str | UUID) -> bool:
        """
        Delete user by ID.

        Args:
            user_id: User UUID to delete

        Returns:
            True if deleted, False if not found
        """
        user = await self.get_by_id(user_id)
        if not user:
            return False

        await self.session.delete(user)
        await self.session.commit()
        return True
