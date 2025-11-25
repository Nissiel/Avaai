"""Application settings using pydantic."""

from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import List, Optional

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic_settings.sources import DotEnvSettingsSource, EnvSettingsSource


API_DIR = Path(__file__).resolve().parents[2]
IS_TESTING = bool(os.getenv("PYTEST_CURRENT_TEST"))


class LenientEnvSettingsSource(EnvSettingsSource):
    """Env source that tolerates non-JSON lists for selected fields."""

    def decode_complex_value(self, field_name, field, value):
        if field_name == "allowed_origins":
            try:
                return super().decode_complex_value(field_name, field, value)
            except ValueError:
                return value
        return super().decode_complex_value(field_name, field, value)


class LenientDotEnvSettingsSource(DotEnvSettingsSource):
    """Dotenv source that tolerates non-JSON lists for selected fields."""

    def decode_complex_value(self, field_name, field, value):
        if field_name == "allowed_origins":
            try:
                return super().decode_complex_value(field_name, field, value)
            except ValueError:
                return value
        return super().decode_complex_value(field_name, field, value)


class Settings(BaseSettings):
    api_prefix: str = "/api/v1"
    environment: str = "development"
    allowed_origins: List[str] = Field(default_factory=list)  # List of allowed origins
    database_url: str  # No default - must be set in .env (PostgreSQL required)
    log_level: str = "INFO"
    vapi_base_url: str = "https://api.vapi.ai"
    vapi_api_key: Optional[str] = None
    vapi_webhook_secret: Optional[str] = None  # Webhook signing secret (different from API key)
    jwt_secret_key: str = "CHANGE_ME_IN_PRODUCTION_USE_ENV_VAR"
    twilio_account_sid: Optional[str] = None
    twilio_auth_token: Optional[str] = None

    # Email settings (Resend)
    resend_api_key: Optional[str] = None
    resend_domain: str = "avaai.app"
    app_url: str = "http://localhost:3000"

    # Backend URL (for webhook configuration)
    backend_url: str = "https://ava-api-production.onrender.com"
    smtp_encryption_key: str = ""

    # Supabase Auth (optional)
    supabase_auth_enabled: bool = False
    supabase_jwt_secret: Optional[str] = None
    supabase_service_role_key: Optional[str] = None
    supabase_project_url: Optional[str] = None

    # Feature flags
    integrations_stub_mode: bool = True  # Enable stub integrations (disable in production)

    # Database resilience
    database_max_retries: int = 3  # Number of times to retry transient failures
    database_retry_backoff_seconds: float = 0.5  # Base backoff between retries (exponential)
    database_statement_timeout_ms: int = 15_000  # Applied via server_settings for safety
    
    # Circuit breaker configuration (Phase 2-4)
    circuit_breaker_enabled: bool = True
    circuit_breaker_threshold: int = 3
    circuit_breaker_recovery_timeout: int = 30
    
    # Rate limiting configuration (Phase 2-4)
    rate_limit_per_minute: int = 10  # 30-60 recommended for production

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_origins(cls, v) -> List[str]:
        """Parse comma-separated origins from .env"""
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            if not v:
                return []
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return []

    model_config = SettingsConfigDict(
        env_file=str(API_DIR / (".env.test" if IS_TESTING else ".env")),
        env_prefix="AVA_API_",
        extra="ignore",
    )

    @classmethod
    def settings_customise_sources(
        cls,
        settings_cls,
        init_settings,
        env_settings,
        dotenv_settings,
        file_secret_settings,
    ):
        return (
            init_settings,
            LenientEnvSettingsSource(settings_cls),
            LenientDotEnvSettingsSource(settings_cls),
            file_secret_settings,
        )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


__all__ = ["Settings", "get_settings"]
