"""Pydantic schemas for Ava profile API contracts."""

from __future__ import annotations

from datetime import datetime
from typing import List, Literal

from pydantic import BaseModel, Field, constr

from ...domain.value_objects.ava_profile import (
    DEFAULT_ALLOWED_TOPICS,
    DEFAULT_FORBIDDEN_TOPICS,
)
from ...infrastructure.persistence.models.ava_profile import AvaProfile


class AvaProfileIn(BaseModel):
    """Incoming profile payload validation."""

    name: constr(strip_whitespace=True, min_length=2, max_length=40)
    voice: constr(strip_whitespace=True, min_length=2, max_length=64)
    language: Literal["fr-FR", "fr-CA", "en-GB", "en-US"] = "fr-FR"
    tone: constr(max_length=120)
    personality: constr(max_length=160)
    greeting: constr(min_length=8, max_length=200)
    allowed_topics: List[constr(min_length=2, max_length=80)] = Field(
        default_factory=lambda: DEFAULT_ALLOWED_TOPICS.copy()
    )
    forbidden_topics: List[constr(min_length=2, max_length=80)] = Field(
        default_factory=lambda: DEFAULT_FORBIDDEN_TOPICS.copy()
    )
    can_take_notes: bool = True
    can_summarize_live: bool = True
    fallback_behavior: constr(max_length=200)
    signature_style: constr(max_length=140)
    custom_rules: constr(max_length=1000)


class AvaProfileOut(AvaProfileIn):
    """Outbound profile payload with metadata."""

    updated_at: datetime

    @classmethod
    def from_model(cls, profile: AvaProfile) -> "AvaProfileOut":
        return cls(**profile.to_dict())


__all__ = ["AvaProfileIn", "AvaProfileOut"]
