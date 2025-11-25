"""
Persistence models for SQLAlchemy.

Exports all database models for easy import.
"""

from .base import Base
from .user import User
from .studio_config import StudioConfig
from .phone_number import PhoneNumber, PhoneProvider
from .call import CallRecord
from .ava_profile import AvaProfile
from .assistant import Assistant
from .audit_log import AuditLog
from .call_analytics import CallAnalyticsDaily
from .business_profile import BusinessProfile

# Normalized config models
from .email_config import EmailConfig
from .voice_config import VoiceConfig
from .ai_config import AIConfig
from .transcriber_config import TranscriberConfig

__all__ = [
    # Base
    "Base",
    # Core models
    "User",
    "StudioConfig",
    "PhoneNumber",
    "PhoneProvider",
    "CallRecord",
    "AvaProfile",
    "Assistant",
    "BusinessProfile",
    # Analytics & Audit
    "AuditLog",
    "CallAnalyticsDaily",
    # Normalized config models
    "EmailConfig",
    "VoiceConfig",
    "AIConfig",
    "TranscriberConfig",
]
