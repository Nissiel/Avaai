"""
Email Config model for SMTP and email notification settings.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional, TYPE_CHECKING
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from .base import Base

if TYPE_CHECKING:
    from .studio_config import StudioConfig


class EmailConfig(Base):
    """Email configuration for a studio config."""

    __tablename__ = "email_configs"

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

    # Email addresses
    admin_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    fallback_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    summary_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # SMTP settings
    smtp_server: Mapped[str] = mapped_column(String(255), default="", nullable=False)
    smtp_port: Mapped[str] = mapped_column(String(10), default="587", nullable=False)
    smtp_username: Mapped[str] = mapped_column(String(255), default="", nullable=False)
    smtp_password_encrypted: Mapped[str] = mapped_column(Text, default="", nullable=False)

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
        back_populates="email_config"
    )

    def __repr__(self) -> str:
        return f"<EmailConfig(id={self.id}, studio_config_id={self.studio_config_id})>"
