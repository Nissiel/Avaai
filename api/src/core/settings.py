"""Application settings using pydantic."""

from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import List, Optional

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


API_DIR = Path(__file__).resolve().parents[2]
IS_TESTING = bool(os.getenv("PYTEST_CURRENT_TEST"))


class Settings(BaseSettings):
    api_prefix: str = "/api/v1"
    environment: str = "development"
    allowed_origins: List[str] = []  # List of allowed origins
    database_url: str  # No default - must be set in .env (PostgreSQL required)
    log_level: str = "INFO"
    vapi_base_url: str = "https://api.vapi.ai"
    vapi_api_key: Optional[str] = None
    jwt_secret_key: str = "CHANGE_ME_IN_PRODUCTION_USE_ENV_VAR"

    # Email settings (Resend)
    resend_api_key: Optional[str] = None
    resend_domain: str = "avaai.app"
    app_url: str = "http://localhost:3000"

    # Backend URL (for webhook configuration)
    backend_url: str = "https://ava-api-production.onrender.com"

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


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


__all__ = ["Settings", "get_settings"]
