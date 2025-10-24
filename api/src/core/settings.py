"""Application settings using pydantic."""

from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    api_prefix: str = "/api/v1"
    environment: str = "development"
    allowed_origins: str = ""  # Comma-separated string, will be parsed
    database_url: str  # No default - must be set in .env (PostgreSQL required)
    log_level: str = "INFO"
    vapi_base_url: str = "https://api.vapi.ai"
    vapi_api_key: str | None = None
    jwt_secret_key: str = "CHANGE_ME_IN_PRODUCTION_USE_ENV_VAR"

    @field_validator("allowed_origins", mode="after")
    @classmethod
    def parse_origins(cls, v: str) -> List[str]:
        """Parse comma-separated origins from .env"""
        if not v:
            return []
        return [origin.strip() for origin in v.split(",") if origin.strip()]

    class Config:
        # Load .env.test in test environment, otherwise .env
        env_file_path = Path(__file__).parent.parent.parent / "api"
        is_testing = os.getenv("PYTEST_CURRENT_TEST") is not None
        env_file = str(env_file_path / (".env.test" if is_testing else ".env"))
        env_prefix = "AVA_API_"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


__all__ = ["Settings", "get_settings"]
