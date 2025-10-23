"""Application settings using pydantic."""

from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic import AnyHttpUrl
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    api_prefix: str = "/api/v1"
    environment: str = "development"
    allowed_origins: List[AnyHttpUrl] = []
    database_url: str = "postgresql+asyncpg://localhost/ava"
    log_level: str = "INFO"
    vapi_base_url: str = "https://api.vapi.ai/v1"
    vapi_api_key: str | None = None

    class Config:
        env_file = ".env"
        env_prefix = "AVA_API_"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


__all__ = ["Settings", "get_settings"]
