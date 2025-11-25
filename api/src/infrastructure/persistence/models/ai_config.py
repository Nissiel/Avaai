"""
AI Config model for AI model settings.
"""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import uuid4

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from .base import Base

if TYPE_CHECKING:
    from .studio_config import StudioConfig


class AIConfig(Base):
    """AI model configuration for a studio config."""

    __tablename__ = "ai_configs"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid4()),
        nullable=False,
    )

    studio_config_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("studio_configs.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    # AI settings
    ai_model: Mapped[str] = mapped_column(String(100), default="gpt-4o-mini", nullable=False)
    ai_temperature: Mapped[float] = mapped_column(Float, default=0.7, nullable=False)
    ai_max_tokens: Mapped[int] = mapped_column(Integer, default=500, nullable=False)

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
    studio_config: Mapped["StudioConfig"] = relationship(
        "StudioConfig",
        back_populates="ai_config"
    )

    def __repr__(self) -> str:
        return f"<AIConfig(id={self.id}, model={self.ai_model}, temp={self.ai_temperature})>"
