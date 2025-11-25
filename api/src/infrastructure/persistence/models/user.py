"""
User model for authentication and user management.

Clean Architecture persistence layer for User entity.
Stores authentication credentials, profile info, and onboarding state.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from typing import TYPE_CHECKING

from .base import Base

if TYPE_CHECKING:
    from .studio_config import StudioConfig
    from .phone_number import PhoneNumber
    from .call import CallRecord
    from .ava_profile import AvaProfile
    from .assistant import Assistant
    from .business_profile import BusinessProfile


class User(Base):
    """SQLAlchemy model for user authentication and profile."""

    __tablename__ = "users"

    # Primary key (stored as String, not UUID type)
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid4()),
        nullable=False,
    )

    # Authentication fields
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )
    phone: Mapped[Optional[str]] = mapped_column(
        String(20),
        unique=True,
        nullable=True,
        index=True,
    )
    supabase_user_id: Mapped[Optional[str]] = mapped_column(
        String(64),
        unique=True,
        nullable=True,
        index=True,
        comment="Supabase Auth user ID (maps to GoTrue user)",
    )
    password: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,  # Nullable for OAuth-only users
    )

    # Profile fields
    name: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )
    image: Mapped[Optional[str]] = mapped_column(
        String(512),
        nullable=True,
    )
    locale: Mapped[str] = mapped_column(
        String(8),
        default="en",
        nullable=False,
    )

    # Security fields
    phone_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    two_fa_enabled: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    # Onboarding tracking
    onboarding_completed: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    onboarding_step: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    onboarding_assistant_created: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        comment="User created first assistant during onboarding",
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    # NOTE: Using lazy="select" (default) to avoid N+1 queries.
    # Use explicit selectinload() or joinedload() in queries when you need related data.
    # Example: select(User).options(selectinload(User.studio_configs))
    studio_configs: Mapped[list["StudioConfig"]] = relationship(
        "StudioConfig",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="select"  # Changed from selectin to prevent automatic N+1
    )
    phone_numbers: Mapped[list["PhoneNumber"]] = relationship(
        "PhoneNumber",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="select"  # Changed from selectin to prevent automatic N+1
    )
    call_records: Mapped[list["CallRecord"]] = relationship(
        "CallRecord",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="select"  # Changed from selectin to prevent automatic N+1
    )
    ava_profiles: Mapped[list["AvaProfile"]] = relationship(
        "AvaProfile",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="select"  # Changed from selectin to prevent automatic N+1
    )
    assistants: Mapped[list["Assistant"]] = relationship(
        "Assistant",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="select"  # Changed from selectin to prevent automatic N+1
    )
    business_profile: Mapped[Optional["BusinessProfile"]] = relationship(
        "BusinessProfile",
        back_populates="user",
        cascade="all, delete-orphan",
        uselist=False,  # One-to-one relationship
        lazy="select"
    )

    def __repr__(self) -> str:
        """String representation for debugging."""
        return f"<User(id={self.id}, email={self.email}, name={self.name})>"
