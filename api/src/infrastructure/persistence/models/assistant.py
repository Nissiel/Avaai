"""
Assistant model for AI assistant configurations.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional, TYPE_CHECKING
from uuid import uuid4

from sqlalchemy import CheckConstraint, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from .base import Base

if TYPE_CHECKING:
    from .user import User


class Assistant(Base):
    """SQLAlchemy model for AI assistant configurations."""

    __tablename__ = "assistants"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid4()),
        nullable=False,
    )

    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    vapi_assistant_id: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="active", nullable=False)

    # Voice settings
    voice_provider: Mapped[str] = mapped_column(String(50), default="11labs", nullable=False)
    voice_id: Mapped[str] = mapped_column(String(255), default="sarah", nullable=False)
    voice_speed: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)

    # AI settings
    ai_model: Mapped[str] = mapped_column(String(100), default="gpt-4o-mini", nullable=False)
    ai_temperature: Mapped[float] = mapped_column(Float, default=0.7, nullable=False)
    ai_max_tokens: Mapped[int] = mapped_column(Integer, default=500, nullable=False)

    # Conversation settings
    system_prompt: Mapped[str] = mapped_column(Text, nullable=False)
    first_message: Mapped[str] = mapped_column(Text, nullable=False)
    language: Mapped[str] = mapped_column(String(10), default="en", nullable=False)

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
    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Relationship
    user: Mapped["User"] = relationship("User", back_populates="assistants")

    __table_args__ = (
        CheckConstraint('voice_speed > 0', name='ck_assistants_voice_speed_positive'),
        CheckConstraint('ai_temperature >= 0 AND ai_temperature <= 2', name='ck_assistants_temperature_range'),
        CheckConstraint('ai_max_tokens > 0', name='ck_assistants_max_tokens_positive'),
    )

    def __repr__(self) -> str:
        return f"<Assistant(id={self.id}, name={self.name}, status={self.status})>"
