"""
Studio Config model for persisting studio configuration per user.

Stores all studio settings (voice, AI model, prompts, etc.) in the database
instead of in-memory _config_state.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from .tenant import Base


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

    # Vapi Assistant
    vapi_assistant_id: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        comment="Vapi assistant ID for syncing",
    )

    # Voice Configuration
    voice_provider: Mapped[str] = mapped_column(
        String(50),
        default="11labs",
        nullable=False,
    )
    voice_id: Mapped[str] = mapped_column(
        String(255),
        default="sarah",
        nullable=False,
    )
    voice_speed: Mapped[float] = mapped_column(
        Float,
        default=1.0,
        nullable=False,
    )

    # AI Model Configuration
    ai_model: Mapped[str] = mapped_column(
        String(100),
        default="gpt-4o-mini",
        nullable=False,
    )
    ai_temperature: Mapped[float] = mapped_column(
        Float,
        default=0.7,
        nullable=False,
    )
    ai_max_tokens: Mapped[int] = mapped_column(
        Integer,
        default=500,
        nullable=False,
    )

    # Transcriber Configuration
    transcriber_provider: Mapped[str] = mapped_column(
        String(50),
        default="deepgram",
        nullable=False,
    )
    transcriber_model: Mapped[str] = mapped_column(
        String(100),
        default="nova-2",
        nullable=False,
    )
    transcriber_language: Mapped[str] = mapped_column(
        String(10),
        default="en",
        nullable=False,
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

    def __repr__(self) -> str:
        """String representation for debugging."""
        return f"<StudioConfig(id={self.id}, user_id={self.user_id}, organization={self.organization_name})>"
