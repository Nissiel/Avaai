"""
Transcriber Config model for speech-to-text settings.
"""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from .base import Base

if TYPE_CHECKING:
    from .studio_config import StudioConfig


class TranscriberConfig(Base):
    """Transcriber configuration for a studio config."""

    __tablename__ = "transcriber_configs"

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

    # Transcriber settings
    transcriber_provider: Mapped[str] = mapped_column(String(50), default="deepgram", nullable=False)
    transcriber_model: Mapped[str] = mapped_column(String(100), default="nova-2", nullable=False)
    transcriber_language: Mapped[str] = mapped_column(String(10), default="en", nullable=False)

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
        back_populates="transcriber_config"
    )

    def __repr__(self) -> str:
        return f"<TranscriberConfig(id={self.id}, provider={self.transcriber_provider}, lang={self.transcriber_language})>"
