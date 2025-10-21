"""
Realtime bridge utilities to assemble OpenAI WebSocket connections per tenant.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any, Dict
from uuid import UUID

from openai import AsyncOpenAI

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
APP_API_SRC = ROOT / "app-api" / "src"
if str(APP_API_SRC) not in sys.path:
    sys.path.append(str(APP_API_SRC))

from models.ava_profile import AvaProfileOut  # type: ignore[import]
from routes.tenant_profile import _get_or_create_profile  # type: ignore[import]
from services.realtime_session import build_session_config
from db.session import SessionLocal  # type: ignore[import]

logger = logging.getLogger(__name__)


async def load_profile(tenant_id: UUID) -> AvaProfileOut:
    async with SessionLocal() as session:  # type: ignore[call-arg]
        profile_model = await _get_or_create_profile(session, tenant_id)
        return AvaProfileOut.from_model(profile_model)


async def create_realtime_session(
    client: AsyncOpenAI,
    *,
    tenant_id: UUID,
) -> Dict[str, Any]:
    """Open a realtime session configured for the tenant profile."""

    profile = await load_profile(tenant_id)
    session_config = build_session_config(profile)
    logger.debug("Creating realtime session with config: %s", session_config)

    response = await client.responses.create(
        model="gpt-4o-realtime-preview-2024-10-01",
        **{"session": session_config},
    )

    return {
        "profile": profile,
        "session": response,
    }


async def apply_profile_update_live(ws, profile: AvaProfileOut) -> None:
    """Send a session.update frame to reflect new profile settings."""

    await ws.send_json(
        {
            "type": "session.update",
            "session": {
                "instructions": build_session_config(profile)["instructions"],
                "voice": profile.voice,
            },
        }
    )
