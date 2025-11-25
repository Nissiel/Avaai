"""
Business Profile model for storing company/business information.

Clean Architecture persistence layer for BusinessProfile entity.
Stores business context that powers the AI agent's understanding.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from typing import TYPE_CHECKING

from .base import Base

if TYPE_CHECKING:
    from .user import User


class BusinessProfile(Base):
    """SQLAlchemy model for business/company profile information."""

    __tablename__ = "business_profiles"

    # Primary key
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid4()),
        nullable=False,
    )

    # Foreign key to user
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,  # One business profile per user
        index=True,
    )

    # Company Identity
    company_name: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )
    website: Mapped[Optional[str]] = mapped_column(
        String(512),
        nullable=True,
    )
    industry: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )
    company_size: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
    )

    # Business Focus
    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="Business description/overview",
    )
    services: Mapped[Optional[list]] = mapped_column(
        JSONB,
        nullable=True,
        default=list,
        comment="List of services/products offered",
    )
    target_market: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )
    value_proposition: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
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

    # Relationship
    user: Mapped["User"] = relationship(
        "User",
        back_populates="business_profile",
        lazy="select",
    )

    def __repr__(self) -> str:
        """String representation for debugging."""
        return f"<BusinessProfile(id={self.id}, user_id={self.user_id}, company={self.company_name})>"
