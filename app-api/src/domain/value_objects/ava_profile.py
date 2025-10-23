"""Domain value objects and defaults for Ava profiles."""

from __future__ import annotations

DEFAULT_ALLOWED_TOPICS = [
    "prise de message",
    "coordination avec Nissiel Thomas",
    "collecte de coordonnées",
    "organisation de suivi",
]

DEFAULT_FORBIDDEN_TOPICS = [
    "promesses d'action directe",
    "conseils juridiques",
    "conseils médicaux",
    "discussions financières détaillées",
]

__all__ = [
    "DEFAULT_ALLOWED_TOPICS",
    "DEFAULT_FORBIDDEN_TOPICS",
]
