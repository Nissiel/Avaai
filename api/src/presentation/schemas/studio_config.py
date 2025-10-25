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
    aiModel: str = Field(default="gpt-4o", description="AI model (gpt-4o recommended for French)")
    aiTemperature: float = Field(default=0.7, ge=0.0, le=1.0, description="Response creativity (0.7=balanced)")
    aiMaxTokens: int = Field(default=200, ge=50, le=500, description="Max response length")
    
    # 🎤 NEW: Voice settings
    voiceProvider: str = Field(default="11labs", description="Voice provider")
    voiceId: str = Field(default="XB0fDUnXU5powFXDhCwa", description="Voice ID (Charlotte - French by default)")
    voiceSpeed: float = Field(default=1.0, ge=0.5, le=2.0, description="Voice speed (1.0=normal, slower for clarity)")
    
    # 📝 NEW: Conversation behavior
    systemPrompt: str = Field(
        default=(
            "Tu es AVA, une assistante professionnelle française. "
            "Sois concise, claire et utile. "
            "IMPORTANT: Demande le nom de l'appelant dans les 2 premiers échanges. "
            "Écoute attentivement et réponds rapidement sans répéter inutilement."
        ),
        description="Core AI instructions"
    )
    firstMessage: str = Field(
        default="Bonjour ! Je suis AVA. Puis-je avoir votre nom s'il vous plaît ?",
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
    # 🔥 DIVINE: Optimized for FRENCH phone calls
    aiModel="gpt-4o",  # Best for French comprehension
    aiTemperature=0.7,  # Balanced: natural but focused
    aiMaxTokens=200,  # Reasonable response length
    voiceProvider="11labs",
    voiceId="XB0fDUnXU5powFXDhCwa",  # Charlotte - French female voice
    voiceSpeed=1.0,  # Normal speed for clarity
    systemPrompt=(
        "Tu es AVA, une assistante professionnelle française. "
        "Sois concise et claire dans tes réponses. "
        "CRITIQUE: Demande le nom de l'appelant dans ta première ou deuxième réponse. "
        "Exemple: 'Bonjour ! Je suis AVA. Puis-je avoir votre nom s'il vous plaît ?' "
        "Écoute attentivement, comprends le contexte rapidement, et réponds promptement. "
        "NE RÉPÈTE JAMAIS la même chose deux fois. Passe directement à la suite."
    ),
    firstMessage="Bonjour ! Je suis AVA, votre assistante IA. Puis-je avoir votre nom s'il vous plaît ?",
    askForName=True,
    askForEmail=False,
    askForPhone=False,
    vapiAssistantId="98d71a30-c55c-43dd-8d64-1af9cf8b57cb",  # 🔥 DIVINE: Use existing assistant
)


__all__ = [
    "StudioConfig",
    "StudioConfigUpdate",
    "DEFAULT_STUDIO_CONFIG",
]
