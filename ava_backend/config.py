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
            "Bonjour, vous êtes bien en ligne avec Ava, votre assistante "
            "personnelle. Je suis ici pour répondre à vos questions ou "
            "prendre un message. Que puis-je faire pour vous ?"
        ),
        description="Opening message Ava delivers at the start of the call.",
    )
    system_prompt: str = Field(
        default=(
            "Tu es Ava, une assistante personnelle virtuelle professionnelle "
            "et chaleureuse. Tu parles exclusivement français avec un ton poli "
            "et serviable. Présente-toi systématiquement comme « Ava, votre "
            "assistante personnelle » au début de chaque appel et rappelle ton "
            "nom si l'appelant semble l'avoir oublié. Ton objectif est d'aider "
            "l'appelant, de répondre à ses questions et de prendre un message si "
            "nécessaire. Sois claire, empathique, concise, et assure-toi que "
            "l'appelant se sente entendu."
        ),
        description="System prompt injected into the Realtime session.",
    )
    realtime_voice: str = Field(
        default="alloy",
        description=(
            "Voice preset for the Realtime API. Must support French speech."
        ),
    )
    realtime_sample_rate_hz: int = Field(
        default=8000,
        description="Audio sample rate negotiated with Twilio.",
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
