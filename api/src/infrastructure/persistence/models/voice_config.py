"""
Voice Config model for voice provider settings.
"""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import uuid4

from sqlalchemy import DateTime, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from .base import Base

if TYPE_CHECKING:
    from .studio_config import StudioConfig


class VoiceConfig(Base):
    """Voice configuration for a studio config."""

    __tablename__ = "voice_configs"

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

    # Voice settings
    voice_provider: Mapped[str] = mapped_column(String(50), default="11labs", nullable=False)
    voice_id: Mapped[str] = mapped_column(String(255), default="sarah", nullable=False)
    voice_speed: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)

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
        back_populates="voice_config"
    )

    def __repr__(self) -> str:
        return f"<VoiceConfig(id={self.id}, provider={self.voice_provider}, voice={self.voice_id})>"
