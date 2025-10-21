"""
Application configuration helpers.

Settings are sourced from environment variables with optional overrides coming
from a `.env` file loaded at import time. The module exposes a shared
`Settings` instance via `get_settings()` to avoid repeated parsing.
"""

from __future__ import annotations

import os
from functools import lru_cache
from typing import Optional

from dotenv import load_dotenv
from pydantic import BaseModel, EmailStr, Field, model_validator

# Load .env as early as possible so other modules can rely on environment
# variables being populated.
load_dotenv()


class Settings(BaseModel):
    """Application-wide configuration container."""

    # Core server configuration
    app_host: str = Field(
        default="0.0.0.0",
        description="Host interface FastAPI should bind to.",
    )
    app_port: int = Field(default=8081, description="Port for the FastAPI app.")

    # Twilio / public routing configuration
    public_base_url: Optional[str] = Field(
        default=None,
        description="Publicly reachable base URL (e.g. ngrok URL) Twilio uses.",
    )

    # OpenAI configuration
    openai_api_key: str = Field(..., description="API key for OpenAI services.")
    openai_realtime_model: str = Field(
        default="gpt-4o-realtime-preview-2024-10-01",
        description="Realtime model identifier used for the live call.",
    )
    openai_summary_model: str = Field(
        default="gpt-4.1-mini",
        description=(
            "Chat Completions model used to summarise the conversation once "
            "the call ends."
        ),
    )

    # Voice and persona customisation
    greeting_message: str = Field(
        default=(
            "Bonjour et bienvenue. Je suis Ava, l'assistante personnelle de Nissiel Thomas. "
            "Comment puis-je vous aider aujourd'hui ?"
        ),
        description="Opening message Ava delivers at the start of the call.",
    )
    system_prompt: str = Field(
        default=(
            "Tu es Ava, assistante personnelle de Nissiel Thomas.\n"
            "Langues : français, anglais, hébreu.\n"
            "Ta voix est féminine, douce, claire et posée.\n\n"
            "Ta mission pendant chaque appel :\n"
            "1️⃣ Te présenter poliment.\n"
            "2️⃣ Identifier la langue et t’y adapter.\n"
            "3️⃣ Comprendre pourquoi la personne appelle.\n"
            "4️⃣ Poser les bonnes questions pour clarifier la demande.\n"
            "5️⃣ Demander et confirmer les coordonnées : prénom + nom, numéro de téléphone, adresse email.\n"
            "6️⃣ Reformuler et confirmer l’objet de l’appel.\n"
            "7️⃣ Clôturer avec un ton chaleureux et professionnel : « Merci beaucoup, je vais transmettre tout cela à Nissiel Thomas. »\n\n"
            "Important :\n"
            "- Sois calme, empathique et efficace.\n"
            "- Le message d’accueil est diffusé automatiquement : ne le répète pas lorsque l’appelant répond, remercie-le et poursuis.\n"
            "- Conduis un échange très humain : pose une question à la fois avec douceur, remercie pour chaque réponse et crée un climat chaleureux.\n"
            "- Présente-toi toujours comme Ava, assistante personnelle de Nissiel Thomas, et ne te présente jamais avec un autre prénom.\n"
            "- Laisse toujours l’appelant terminer avant de relancer.\n"
            "- Dès que tu comprends le motif de l'appel, demande poliment son prénom, son nom et son numéro de téléphone, puis reformule ces informations pour les confirmer.\n"
            "- Si la personne hésite ou semble stressée, rassure-la, reformule, propose des exemples et reste patiente.\n"
            "- Si la personne ne veut pas donner une information, respecte-le et précise que tu notes l’absence.\n"
            "- Reformule régulièrement ce que tu as compris, surtout lors de la collecte des coordonnées.\n"
            "- Après les informations clés, propose un bref résumé oral et confirme que tu vas transmettre à Nissiel Thomas.\n"
            "- Ne fais jamais de promesse d’action. Tu transmets simplement le message.\n"
            "- À la fin de chaque appel, ton système enverra un résumé complet à Nissiel."
        ),
        description="System prompt injected into the Realtime session.",
    )
    realtime_voice: str = Field(
        default="fr-feminine-calm",
        description=(
            "Voice preset for the Realtime API. Must support French speech."
        ),
    )
    realtime_sample_rate_hz: int = Field(
        default=8000,
        description="Audio sample rate negotiated with Twilio.",
    )
    default_tenant_id: Optional[str] = Field(
        default=os.getenv("DEFAULT_TENANT_ID"),
        description="Tenant identifier used when routing calls.",
    )
    ava_profile_api_base: Optional[str] = Field(
        default=os.getenv("AVA_PROFILE_API_BASE"),
        description="Base URL for the Ava profile management API.",
    )
    ava_profile_service_token: Optional[str] = Field(
        default=os.getenv("AVA_PROFILE_SERVICE_TOKEN"),
        description="Service token used when calling the Ava profile API.",
    )

    # Email summary configuration
    summary_email_recipient: Optional[EmailStr] = Field(
        default=None,
        description="Destination email address for call summaries.",
    )
    smtp_server: Optional[str] = Field(
        default=None, description="SMTP server hostname."
    )
    smtp_port: int = Field(default=587, description="SMTP server port.")
    smtp_use_tls: bool = Field(
        default=True,
        description="Toggle STARTTLS usage when connecting to SMTP server.",
    )
    smtp_username: Optional[str] = Field(
        default=None, description="SMTP username/login."
    )
    smtp_password: Optional[str] = Field(
        default=None, description="SMTP password or app token."
    )
    smtp_sender: Optional[EmailStr] = Field(
        default=None,
        description="From address used when sending summary emails.",
    )

    # Optional logging tweaks
    log_level: str = Field(
        default=os.getenv("LOG_LEVEL", "INFO"),
        description="Logging level for the application.",
    )

    @model_validator(mode="after")
    def _default_sender(self) -> "Settings":
        if self.summary_email_recipient and not self.smtp_sender and self.smtp_username:
            return self.model_copy(update={"smtp_sender": self.smtp_username})
        return self


def _build_settings() -> Settings:
    """Initialise the Settings object from the current environment."""

    return Settings(
        app_host=os.getenv("APP_HOST", "0.0.0.0"),
        app_port=int(os.getenv("APP_PORT", "8081")),
        public_base_url=os.getenv("PUBLIC_BASE_URL"),
        openai_api_key=os.environ["OPENAI_API_KEY"],
        openai_realtime_model=os.getenv(
            "OPENAI_REALTIME_MODEL", "gpt-4o-realtime-preview-2024-10-01"
        ),
        openai_summary_model=os.getenv(
            "OPENAI_SUMMARY_MODEL", "gpt-4.1-mini"
        ),
        greeting_message=os.getenv("AVA_GREETING_MESSAGE")
        or Settings.model_fields["greeting_message"].default,  # type: ignore[index]
        system_prompt=os.getenv("AVA_SYSTEM_PROMPT")
        or Settings.model_fields["system_prompt"].default,  # type: ignore[index]
        realtime_voice=os.getenv("AVA_REALTIME_VOICE", "alloy"),
        realtime_sample_rate_hz=int(
            os.getenv("AVA_SAMPLE_RATE_HZ", "8000")
        ),
        default_tenant_id=os.getenv("DEFAULT_TENANT_ID"),
        ava_profile_api_base=os.getenv("AVA_PROFILE_API_BASE"),
        ava_profile_service_token=os.getenv("AVA_PROFILE_SERVICE_TOKEN"),
        summary_email_recipient=os.getenv("SUMMARY_EMAIL"),
        smtp_server=os.getenv("SMTP_SERVER"),
        smtp_port=int(os.getenv("SMTP_PORT", "587")),
        smtp_use_tls=os.getenv("SMTP_USE_TLS", "true").lower() != "false",
        smtp_username=os.getenv("SMTP_USERNAME"),
        smtp_password=os.getenv("SMTP_PASSWORD"),
        smtp_sender=os.getenv("SMTP_SENDER"),
        log_level=os.getenv("LOG_LEVEL", "INFO"),
    )


@lru_cache
def get_settings() -> Settings:
    """Return a cached application settings instance."""

    return _build_settings()
