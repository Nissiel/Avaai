"""Pydantic schemas representing studio configuration."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class StudioConfig(BaseModel):
    # Organization settings
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
    
    # 🎯 NEW: AI Performance settings
    aiModel: str = Field(default="gpt-4", description="AI model (gpt-4, gpt-3.5-turbo)")
    aiTemperature: float = Field(default=0.5, ge=0.0, le=1.0, description="Response creativity (0=precise, 1=creative)")
    aiMaxTokens: int = Field(default=150, ge=50, le=500, description="Max response length (lower=faster)")
    
    # 🎤 NEW: Voice settings
    voiceProvider: str = Field(default="11labs", description="Voice provider")
    voiceId: str = Field(default="21m00Tcm4TlvDq8ikWAM", description="Voice ID (Rachel by default)")
    voiceSpeed: float = Field(default=1.2, ge=0.5, le=2.0, description="Voice speed (1.0=normal, 1.5=faster)")
    
    # 📝 NEW: Conversation behavior
    systemPrompt: str = Field(
        default=(
            "You are AVA, a professional AI assistant. "
            "Be concise, clear, and helpful. "
            "IMPORTANT: Ask for the caller's name within the first 2 exchanges. "
            "Listen carefully and respond quickly."
        ),
        description="Core AI instructions"
    )
    firstMessage: str = Field(
        default="Hello! I'm AVA. May I have your name please?",
        description="Initial greeting"
    )
    askForName: bool = Field(default=True, description="Ask for caller's name")
    askForEmail: bool = Field(default=False, description="Ask for email")
    askForPhone: bool = Field(default=False, description="Ask for phone number")
    
    # 🎯 NEW: Vapi Assistant ID (for sync)
    vapiAssistantId: str | None = Field(default=None, description="Linked Vapi Assistant ID")


class StudioConfigUpdate(BaseModel):
    organizationName: Optional[str] = None
    adminEmail: EmailStr | None = None
    timezone: Optional[str] = None
    language: Optional[str] = None
    persona: Optional[str] = None
    tone: Optional[str] = None
    guidelines: Optional[str] = None
    phoneNumber: Optional[str] = None
    businessHours: Optional[str] = None
    fallbackEmail: EmailStr | None = None
    summaryEmail: EmailStr | None = None
    smtpServer: Optional[str] = None
    smtpPort: Optional[str] = None
    smtpUsername: Optional[str] = None
    smtpPassword: Optional[str] = None
    
    # 🎯 NEW: AI Performance settings
    aiModel: Optional[str] = None
    aiTemperature: Optional[float] = None
    aiMaxTokens: Optional[int] = None
    
    # 🎤 NEW: Voice settings
    voiceProvider: Optional[str] = None
    voiceId: Optional[str] = None
    voiceSpeed: Optional[float] = None
    
    # 📝 NEW: Conversation behavior
    systemPrompt: Optional[str] = None
    firstMessage: Optional[str] = None
    askForName: Optional[bool] = None
    askForEmail: Optional[bool] = None
    askForPhone: Optional[bool] = None
    
    # 🎯 NEW: Vapi link
    vapiAssistantId: Optional[str] = None


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
    # 🎯 NEW: Optimized AI settings for speed and comprehension
    aiModel="gpt-4",  # Better comprehension than gpt-3.5-turbo
    aiTemperature=0.5,  # Balanced: precise but natural
    aiMaxTokens=150,  # Shorter responses = faster
    voiceProvider="11labs",
    voiceId="21m00Tcm4TlvDq8ikWAM",  # Rachel voice
    voiceSpeed=1.2,  # Slightly faster for efficiency
    systemPrompt=(
        "You are AVA, a professional and efficient AI assistant. "
        "Be concise and clear in your responses. "
        "CRITICAL: Ask for the caller's name in your first or second response. "
        "Example: 'Hello! I'm AVA. May I have your name please?' "
        "Listen carefully, understand context quickly, and respond promptly."
    ),
    firstMessage="Hello! I'm AVA, your AI assistant. May I have your name please?",
    askForName=True,
    askForEmail=False,
    askForPhone=False,
    vapiAssistantId=None,
)


__all__ = [
    "StudioConfig",
    "StudioConfigUpdate",
    "DEFAULT_STUDIO_CONFIG",
]
