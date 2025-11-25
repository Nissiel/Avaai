"""
Studio Config model for persisting studio configuration per user.

Normalized structure - voice, AI, transcriber, and email configs are in separate tables.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional, TYPE_CHECKING
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from .base import Base

if TYPE_CHECKING:
    from .user import User


class StudioConfig(Base):
    """SQLAlchemy model for studio configuration persistence."""

    __tablename__ = "studio_configs"

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
        index=True,
        comment="User who owns this studio config",
    )

    # Organization info
    organization_name: Mapped[str] = mapped_column(
        String(255),
        default="My Organization",
        nullable=False,
    )
    timezone: Mapped[str] = mapped_column(
        String(64),
        default="Europe/Paris",
        nullable=False,
    )
    phone_number: Mapped[str] = mapped_column(
        String(50),
        default="",
        nullable=False,
    )
    business_hours: Mapped[str] = mapped_column(
        String(255),
        default="09:00-18:00",
        nullable=False,
    )

    # Vapi Assistant
    vapi_assistant_id: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        comment="Vapi assistant ID for syncing",
    )

    # Conversation Settings
    first_message: Mapped[str] = mapped_column(
        Text,
        default="Hello! How can I help you today?",
        nullable=False,
    )
    system_prompt: Mapped[str] = mapped_column(
        Text,
        default="You are a helpful AI assistant.",
        nullable=False,
    )
    guidelines: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )

    # Persona & Tone
    persona: Mapped[str] = mapped_column(
        String(100),
        default="professional",
        nullable=False,
    )
    tone: Mapped[str] = mapped_column(
        String(100),
        default="friendly",
        nullable=False,
    )
    language: Mapped[str] = mapped_column(
        String(10),
        default="en",
        nullable=False,
    )

    # Caller Info Collection
    ask_for_name: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    ask_for_email: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    ask_for_phone: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
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
    user: Mapped["User"] = relationship("User", back_populates="studio_configs")

    # Related configs (1:1 relationships)
    email_config: Mapped[Optional["EmailConfig"]] = relationship(
        "EmailConfig",
        back_populates="studio_config",
        uselist=False,
        cascade="all, delete-orphan"
    )
    voice_config: Mapped[Optional["VoiceConfig"]] = relationship(
        "VoiceConfig",
        back_populates="studio_config",
        uselist=False,
        cascade="all, delete-orphan"
    )
    ai_config: Mapped[Optional["AIConfig"]] = relationship(
        "AIConfig",
        back_populates="studio_config",
        uselist=False,
        cascade="all, delete-orphan"
    )
    transcriber_config: Mapped[Optional["TranscriberConfig"]] = relationship(
        "TranscriberConfig",
        back_populates="studio_config",
        uselist=False,
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        """String representation for debugging."""
        return f"<StudioConfig(id={self.id}, user_id={self.user_id}, organization={self.organization_name})>"


# Import the related config models at the end to avoid circular imports
from .email_config import EmailConfig
from .voice_config import VoiceConfig
from .ai_config import AIConfig
from .transcriber_config import TranscriberConfig
