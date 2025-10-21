"""
Ava profile persistence and validation schema definitions.

The AvaProfile model stores per-tenant customisation such as the assistant name,
voice preset, conversational tone, allowed topics, and behavioural rules.
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Literal

from pydantic import BaseModel, Field, constr
from sqlalchemy import (
    ARRAY,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .tenant import Base, Tenant


class AvaProfile(Base):
    """SQLAlchemy model persisting per-tenant Ava personalisation."""

    __tablename__ = "ava_profiles"

    tenant_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        primary_key=True,
    )
    name: Mapped[str] = mapped_column(String(40), default="Ava", nullable=False)
    voice: Mapped[str] = mapped_column(String(64), default="alloy", nullable=False)
    language: Mapped[str] = mapped_column(String(8), default="fr-FR", nullable=False)
    tone: Mapped[str] = mapped_column(String(120), default="douce, calme et professionnelle", nullable=False)
    personality: Mapped[str] = mapped_column(String(160), default="empathique, efficace, rassurante", nullable=False)
    greeting: Mapped[str] = mapped_column(
        String(200),
        default=(
            "Bonjour et bienvenue. Je suis Ava, l'assistante personnelle de Nissiel Thomas. "
            "Merci de m'indiquer votre prénom, votre nom ainsi que votre numéro de téléphone, "
            "puis dites-moi comment je peux vous aider."
        ),
        nullable=False,
    )
    allowed_topics: Mapped[List[str]] = mapped_column(
        ARRAY(String(80)),
        default=list,
        nullable=False,
    )
    forbidden_topics: Mapped[List[str]] = mapped_column(
        ARRAY(String(80)),
        default=list,
        nullable=False,
    )
    can_take_notes: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    can_summarize_live: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    fallback_behavior: Mapped[str] = mapped_column(
        String(200),
        default="Si une demande sort du périmètre, explique poliment que tu vas transmettre le message à Nissiel Thomas.",
        nullable=False,
    )
    signature_style: Mapped[str] = mapped_column(
        String(140),
        default="chaleureuse et professionnelle",
        nullable=False,
    )
    custom_rules: Mapped[str] = mapped_column(
        Text,
        default=(
            "Toujours vérifier la langue de l’appelant (français, anglais ou hébreu) et t’y adapter. "
            "Demander prénom, nom, numéro de téléphone et email, puis reformuler l’objet de l’appel. "
            "Ne jamais promettre d’action : tu transmets les informations à Nissiel Thomas."
        ),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
    )

    tenant = relationship(Tenant, backref="ava_profile", lazy="joined")

    def to_dict(self) -> dict:
        """Utility for serialising the profile to JSON-friendly structures."""
        return {
            "tenant_id": str(self.tenant_id),
            "name": self.name,
            "voice": self.voice,
            "language": self.language,
            "tone": self.tone,
            "personality": self.personality,
            "greeting": self.greeting,
            "allowed_topics": self.allowed_topics or [],
            "forbidden_topics": self.forbidden_topics or [],
            "can_take_notes": self.can_take_notes,
            "can_summarize_live": self.can_summarize_live,
            "fallback_behavior": self.fallback_behavior,
            "signature_style": self.signature_style,
            "custom_rules": self.custom_rules,
            "updated_at": self.updated_at,
        }


DefaultAllowed = [
    "prise de message",
    "coordination avec Nissiel Thomas",
    "collecte de coordonnées",
    "organisation de suivi",
]

DefaultForbidden = [
    "promesses d'action directe",
    "conseils juridiques",
    "conseils médicaux",
    "discussions financières détaillées",
]


class AvaProfileIn(BaseModel):
    """Incoming profile payload validation."""

    name: constr(strip_whitespace=True, min_length=2, max_length=40)
    voice: constr(strip_whitespace=True, min_length=2, max_length=64)
    language: Literal["fr-FR", "fr-CA", "en-GB", "en-US"] = "fr-FR"
    tone: constr(max_length=120)
    personality: constr(max_length=160)
    greeting: constr(min_length=8, max_length=200)
    allowed_topics: List[constr(min_length=2, max_length=80)] = Field(default_factory=lambda: DefaultAllowed.copy())
    forbidden_topics: List[constr(min_length=2, max_length=80)] = Field(default_factory=lambda: DefaultForbidden.copy())
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
