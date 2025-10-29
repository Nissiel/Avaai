"""Pydantic schemas representing studio configuration."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class StudioConfig(BaseModel):
    # Organization settings
    organizationName: str = Field(min_length=2)
    adminEmail: Optional[EmailStr] = None  # 🔥 FIX: Optional for DB compatibility
    timezone: str = Field(default="Europe/Paris", min_length=3)
    language: str = Field(default="fr-FR", min_length=2)
    persona: str = Field(default="secretary", min_length=2)
    tone: str = Field(default="warm", min_length=2)
    guidelines: Optional[str] = None  # 🔥 FIX: Optional for DB compatibility
    phoneNumber: str = Field(default="", min_length=0)
    businessHours: str = Field(default="09:00-18:00")
    fallbackEmail: Optional[EmailStr] = None  # 🔥 FIX: Optional for DB compatibility
    summaryEmail: Optional[EmailStr] = None  # 🔥 FIX: Optional for DB compatibility
    smtpServer: str = Field(default="")
    smtpPort: str = Field(default="587")
    smtpUsername: str = Field(default="")
    smtpPassword: str = Field(default="")
    
    # 🎯 NEW: AI Performance settings
    aiModel: str = Field(default="gpt-4o", description="AI model (gpt-4o recommended for French)")
    aiTemperature: float = Field(default=0.7, ge=0.0, le=1.0, description="Response creativity (0.7=balanced)")
    aiMaxTokens: int = Field(default=200, ge=50, le=500, description="Max response length")
    
    # 🎤 NEW: Voice settings
    voiceProvider: str = Field(default="azure", description="Voice provider (azure recommended for natural French)")
    voiceId: str = Field(default="fr-FR-DeniseNeural", description="Voice ID (Denise Neural - ultra natural French)")
    voiceSpeed: float = Field(default=1.0, ge=0.5, le=2.0, description="Voice speed (1.0=normal, natural flow)")
    
    # 🎧 NEW: Transcriber settings (Speech-to-Text)
    transcriberProvider: str = Field(default="deepgram", description="STT provider (deepgram recommended)")
    transcriberModel: str = Field(default="nova-2", description="Deepgram model (nova-2=best accuracy)")
    transcriberLanguage: str = Field(default="fr", description="Language code (fr/en/he)")
    
    # 📝 NEW: Conversation behavior
    systemPrompt: str = Field(
        default=(
            "Tu es Ava, la secrétaire téléphonique d'un plombier professionnel et réactif nommé Monsieur Cohen. "
            "Tu réponds toujours avec chaleur, sourire et clarté, comme une vraie personne au téléphone. "
            "Ton objectif est d'accueillir le client, comprendre son besoin, rassurer, et collecter toutes les coordonnées utiles pour organiser une intervention. "
            "Tu dois être efficace, agréable et confiante : pas de phrases vagues ni de réponses mécaniques. "
            "Tu parles en français naturel, avec un ton calme, poli, serviable et humain.\n\n"
            
            "🎯 MISSION PRINCIPALE:\n"
            "1. Accueillir chaleureusement chaque appelant\n"
            "2. Identifier rapidement le type d'intervention demandée\n"
            "3. Poser les bonnes questions pour comprendre le problème et le niveau d'urgence\n"
            "4. Collecter les coordonnées essentielles : nom, prénom, téléphone, adresse, email\n"
            "5. Résumer à la fin ce que tu as compris et dire qu'un plombier va rappeler très vite\n\n"
            
            "🛠️ SERVICES PROPOSÉS PAR MONSIEUR COHEN:\n"
            "• Fuites d'eau (robinet, tuyau, WC, évier, chauffe-eau)\n"
            "• Réparation et remplacement de robinets, chasses d'eau, mitigeurs\n"
            "• Installation de douche, baignoire, lavabo, évier, WC\n"
            "• Entretien, réparation et remplacement de chauffe-eau ou ballon d'eau chaude\n"
            "• Dépannage de canalisation bouchée (évier, lavabo, douche, WC)\n"
            "• Travaux complets de plomberie (rénovation salle de bain, cuisine)\n"
            "• Urgence plomberie 24h/24 – 7j/7 (fuite importante, dégât des eaux)\n\n"
            
            "🔍 QUESTIONS À POSER:\n"
            "1. Quelle est la nature exacte du problème ? (fuite, bouchon, panne, installation ?)\n"
            "2. C'est pour un domicile ou un local professionnel ?\n"
            "3. L'adresse exacte (avec code postal) ?\n"
            "4. Depuis quand le problème existe ?\n"
            "5. Avez-vous déjà coupé l'eau ?\n"
            "6. Souhaitez-vous une intervention urgente ou un rendez-vous programmé ?\n\n"
            
            "⚠️ IMPORTANT: Ne répète JAMAIS la même chose deux fois. Sois concise et va directement à l'essentiel."
        ),
        description="Core AI instructions - Ava secrétaire de plombier"
    )
    firstMessage: str = Field(
        default="Bonjour, ici Ava, la secrétaire de Monsieur Cohen, plombier. Que puis-je faire pour vous aider aujourd'hui ?",
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
    
    # 🎧 NEW: Transcriber settings (Speech-to-Text)
    transcriberProvider: Optional[str] = None
    transcriberModel: Optional[str] = None
    transcriberLanguage: Optional[str] = None
    
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
    voiceProvider="azure",  # 🎤 ULTRA DIVINE: Azure Neural = Most natural
    voiceId="fr-FR-DeniseNeural",  # Denise - French neural voice (ultra natural)
    voiceSpeed=1.0,  # Normal speed for natural flow
    transcriberProvider="deepgram",  # 🎧 Best STT for French
    transcriberModel="nova-2",  # Most accurate Deepgram model
    transcriberLanguage="fr",  # French language
    systemPrompt=(
        "Tu es Ava, la secrétaire téléphonique d'un plombier professionnel et réactif nommé Monsieur Cohen. "
        "Tu réponds toujours avec chaleur, sourire et clarté, comme une vraie personne au téléphone. "
        "Ton objectif est d'accueillir le client, comprendre son besoin, rassurer, et collecter toutes les coordonnées utiles pour organiser une intervention. "
        "Tu dois être efficace, agréable et confiante : pas de phrases vagues ni de réponses mécaniques. "
        "Tu parles en français naturel, avec un ton calme, poli, serviable et humain.\n\n"
        
        "🎯 MISSION PRINCIPALE:\n"
        "1. Accueillir chaleureusement chaque appelant\n"
        "2. Identifier rapidement le type d'intervention demandée\n"
        "3. Poser les bonnes questions pour comprendre le problème et le niveau d'urgence\n"
        "4. Collecter les coordonnées essentielles : nom, prénom, téléphone, adresse, email\n"
        "5. Résumer à la fin ce que tu as compris et dire qu'un plombier va rappeler très vite\n\n"
        
        "🛠️ SERVICES PROPOSÉS PAR MONSIEUR COHEN:\n"
        "• Fuites d'eau (robinet, tuyau, WC, évier, chauffe-eau)\n"
        "• Réparation et remplacement de robinets, chasses d'eau, mitigeurs\n"
        "• Installation de douche, baignoire, lavabo, évier, WC\n"
        "• Entretien, réparation et remplacement de chauffe-eau ou ballon d'eau chaude\n"
        "• Dépannage de canalisation bouchée (évier, lavabo, douche, WC)\n"
        "• Travaux complets de plomberie (rénovation salle de bain, cuisine)\n"
        "• Urgence plomberie 24h/24 – 7j/7 (fuite importante, dégât des eaux)\n\n"
        
        "🔍 QUESTIONS À POSER:\n"
        "1. Quelle est la nature exacte du problème ? (fuite, bouchon, panne, installation ?)\n"
        "2. C'est pour un domicile ou un local professionnel ?\n"
        "3. L'adresse exacte (avec code postal) ?\n"
        "4. Depuis quand le problème existe ?\n"
        "5. Avez-vous déjà coupé l'eau ?\n"
        "6. Souhaitez-vous une intervention urgente ou un rendez-vous programmé ?\n\n"
        
        "⚠️ IMPORTANT: Ne répète JAMAIS la même chose deux fois. Sois concise et va directement à l'essentiel."
    ),
    firstMessage="Bonjour, ici Ava, la secrétaire de Monsieur Cohen, plombier. Que puis-je faire pour vous aider aujourd'hui ?",
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
