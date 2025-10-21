"""
WebSocket handlers applying tenant Ava profiles to OpenAI sessions.
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Any, Awaitable, Callable
from uuid import UUID

from websockets import WebSocketClientProtocol

from .session_builder import apply_profile_update_live, create_realtime_session

logger = logging.getLogger(__name__)


class RealtimeBridge:
    """Bridge between Twilio Media Stream and OpenAI Realtime per tenant."""

    def __init__(self, tenant_id: UUID, openai_client, twilio_ws: WebSocketClientProtocol):
        self.tenant_id = tenant_id
        self.openai_client = openai_client
        self.twilio_ws = twilio_ws
        self.model_ws: WebSocketClientProtocol | None = None

    async def start(self) -> None:
        session_data = await create_realtime_session(self.openai_client, tenant_id=self.tenant_id)
        self.profile = session_data["profile"]
        self.model_ws = session_data["session"]

    async def apply_profile_update(self, profile) -> None:
        if not self.model_ws:
            raise RuntimeError("Realtime session not initialised")
        await apply_profile_update_live(self.model_ws, profile)

    async def forward_twilio_event(self, payload: dict[str, Any]) -> None:
        if not self.model_ws:
            raise RuntimeError("Realtime session not initialised")
        await self.model_ws.send(json.dumps(payload))

    async def stream_model_events(self, handler: Callable[[dict[str, Any]], Awaitable[None]]) -> None:
        if not self.model_ws:
            raise RuntimeError("Realtime session not initialised")

        async for raw in self.model_ws:
            try:
                event = json.loads(raw)
            except json.JSONDecodeError:
                logger.warning("Dropping non-JSON frame: %s", raw)
                continue
            await handler(event)
