"""
Voice preview helper using OpenAI TTS (or fallback if unavailable).
"""

from __future__ import annotations

import base64
import logging
from typing import Optional

import httpx

logger = logging.getLogger(__name__)


class VoicePreviewError(RuntimeError):
    pass


async def synthesize_preview(
    *,
    api_key: str,
    text: str,
    voice: str,
    language: str,
    duration_seconds: int = 3,
) -> str:
    """
    Generate a short audio preview using OpenAI's audio TTS endpoint.

    Returns:
        Base64 encoded WAV audio.
    """

    payload = {
        "model": "gpt-4o-mini-tts",
        "voice": voice,
        "input": text,
        "sample_rate": 16000,
        "format": "wav",
        "language": language,
        "response_format": "b64",
        "max_duration_seconds": duration_seconds,
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(
            "https://api.openai.com/v1/audio/speech",
            json=payload,
            headers=headers,
        )

    if response.status_code != 200:
        logger.error("Voice preview request failed: %s", response.text)
        raise VoicePreviewError("Failed to generate voice preview")

    data = response.json()
    audio_b64: Optional[str] = data.get("data")
    if not audio_b64:
        raise VoicePreviewError("Preview payload missing audio data")
    return audio_b64
