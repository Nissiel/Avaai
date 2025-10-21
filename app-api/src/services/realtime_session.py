"""
Helpers to assemble OpenAI Realtime sessions with tenant personalisation.
"""

from __future__ import annotations

from typing import Any, Dict

from ..models.ava_profile import AvaProfileOut


def build_system_prompt(profile: AvaProfileOut) -> str:
    """Render the dynamic system prompt based on the tenant profile."""

    allowed = ", ".join(profile.allowed_topics) if profile.allowed_topics else "—"
    forbidden = ", ".join(profile.forbidden_topics) if profile.forbidden_topics else "—"
    return (
        f"Tu es {profile.name}, une assistante virtuelle {profile.tone} et {profile.personality}.\n"
        f"Langue: {profile.language}.\n"
        f"Ta mission principale: {allowed}.\n"
        f"Ne réponds jamais sur: {forbidden}.\n\n"
        f'Message d’accueil (à dire en premier): "{profile.greeting}"\n\n'
        "Règles de conduite:\n"
        f'- Réponds de façon claire, concise et polie.\n'
        f'- Style de conclusion: "{profile.signature_style}"\n'
        f'- Comportement par défaut hors périmètre: "{profile.fallback_behavior}"\n'
        f"- can_take_notes={profile.can_take_notes}, can_summarize_live={profile.can_summarize_live}\n"
        f"- {profile.custom_rules}\n\n"
        "Important:\n"
        "- Poser des questions courtes et une à la fois.\n"
        "- Toujours vérifier que tu as bien compris.\n"
        "- Si l’utilisateur demande un résumé pendant l’appel: bref récapitulatif et tu continues.\n"
        "- Si l’utilisateur donne des coordonnées: reformule et confirme.\n"
    ).strip()


def build_session_config(profile: AvaProfileOut) -> Dict[str, Any]:
    """Return the OpenAI Realtime session payload for the tenant profile."""

    return {
        "modalities": ["text", "audio"],
        "voice": profile.voice,
        "instructions": build_system_prompt(profile),
        "input_audio_transcription": {
            "model": "whisper-1",
            "language": profile.language,
        },
        "turn_detection": {"type": "server_vad"},
        "output_audio_format": "g711_ulaw",
        "input_audio_format": "g711_ulaw",
    }
