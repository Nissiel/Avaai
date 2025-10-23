"""Pydantic schemas representing studio configuration."""

from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field


class StudioConfig(BaseModel):
    organizationName: str = Field(min_length=2)
    adminEmail: EmailStr
    timezone: str = Field(default="Europe/Paris", min_length=3)
    language: str = Field(default="fr-FR", min_length=2)
    persona: str = Field(default="secretary", min_length=2)
    tone: str = Field(default="warm", min_length=2)
    guidelines: str = Field(default="", min_length=0)
    phoneNumber: str = Field(default="", min_length=0)
    businessHours: str = Field(default="09:00-18:00")
    fallbackEmail: EmailStr
    summaryEmail: EmailStr
    smtpServer: str = Field(default="")
    smtpPort: str = Field(default="587")
    smtpUsername: str = Field(default="")
    smtpPassword: str = Field(default="")


class StudioConfigUpdate(BaseModel):
    organizationName: str | None = None
    adminEmail: EmailStr | None = None
    timezone: str | None = None
    language: str | None = None
    persona: str | None = None
    tone: str | None = None
    guidelines: str | None = None
    phoneNumber: str | None = None
    businessHours: str | None = None
    fallbackEmail: EmailStr | None = None
    summaryEmail: EmailStr | None = None
    smtpServer: str | None = None
    smtpPort: str | None = None
    smtpUsername: str | None = None
    smtpPassword: str | None = None


DEFAULT_STUDIO_CONFIG = StudioConfig(
    organizationName="Ava",
    adminEmail="support@ava.ai",
    timezone="Europe/Paris",
    language="fr-FR",
    persona="secretary",
    tone="warm",
    guidelines="Toujours accueillir chaleureusement et collecter les coordonnées.",
    phoneNumber="",
    businessHours="09:00-18:00",
    fallbackEmail="support@ava.ai",
    summaryEmail="support@ava.ai",
    smtpServer="",
    smtpPort="587",
    smtpUsername="",
    smtpPassword="",
)


__all__ = [
    "StudioConfig",
    "StudioConfigUpdate",
    "DEFAULT_STUDIO_CONFIG",
]
