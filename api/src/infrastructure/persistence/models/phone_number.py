"""
PhoneNumber model for phone number management and routing.

Stores phone numbers from Vapi (free US) or Twilio (international).
Links numbers to organizations and AVA assistants for call handling.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import uuid4

from sqlalchemy import JSON, DateTime, Enum as SQLEnum, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from .base import Base


class PhoneProvider(str, Enum):
    """Phone number provider types."""

    VAPI = "VAPI"  # Free US numbers from Vapi (max 10)
    TWILIO = "TWILIO"  # Direct Twilio (not imported to Vapi)
    VAPI_TWILIO = "VAPI_TWILIO"  # Twilio imported into Vapi
    SIP = "SIP"  # SIP trunk (future)


class PhoneNumber(Base):
    """SQLAlchemy model for phone number management."""

    __tablename__ = "phone_numbers"

    # Primary key
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid4()),
        nullable=False,
    )

    # Organization link
    org_id: Mapped[str] = mapped_column(
        String(36),
        nullable=False,
        index=True,
    )

    # Provider info
    provider: Mapped[PhoneProvider] = mapped_column(
        SQLEnum(PhoneProvider),
        nullable=False,
    )

    # Phone number (E.164 format)
    e164: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        nullable=False,
        index=True,
        comment="E.164 format: +33612345678 or +972501234567",
    )

    # Vapi specific
    vapi_phone_number_id: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        comment="Vapi phone number ID (for VAPI or VAPI_TWILIO providers)",
    )

    # Twilio specific (encrypted in production)
    twilio_account_sid: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        comment="Twilio Account SID (encrypted)",
    )

    # Routing configuration
    routing: Mapped[dict] = mapped_column(
        JSON,
        default=dict,
        nullable=False,
        comment="Routing config: assistant_id, fallback, business_hours, etc.",
    )

    # Business hours configuration
    business_hours: Mapped[dict] = mapped_column(
        JSON,
        default=dict,
        nullable=False,
        comment="Business hours schedule for routing",
    )

    # Voicemail configuration
    voicemail: Mapped[dict] = mapped_column(
        JSON,
        default=dict,
        nullable=False,
        comment="Voicemail settings: enabled, message, email, etc.",
    )

    # Metadata
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
        """String representation."""
        return f"<PhoneNumber(id={self.id}, e164={self.e164}, provider={self.provider})>"
