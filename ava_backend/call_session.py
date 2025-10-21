"""
Session management for a single Twilio Media Stream call.

The `CallSession` class orchestrates the realtime audio bridge between Twilio
and OpenAI, collects transcripts for post-call summarisation, and triggers the
email workflow when the call ends.
"""

from __future__ import annotations

import contextlib
import asyncio
import json
import logging
import time
import uuid
from functools import partial
from typing import Any, Dict, Optional

from fastapi import WebSocket

from .agent_logic import RealtimeAgent, generate_summary
from .config import Settings
from .email_utils import send_summary_via_email

logger = logging.getLogger(__name__)

TwilioMessage = Dict[str, Any]


class CallSession:
    """
    Bridge a Twilio Media Stream WebSocket with OpenAI's Realtime API.

    Lifecycle:
    1. Receive start event from Twilio.
    2. Connect to OpenAI Realtime, configure session, send greeting.
    3. Forward audio payloads both ways and track transcripts.
    4. When the call ends, generate a summary and trigger the email workflow.
    """

    def __init__(self, websocket: WebSocket, settings: Settings) -> None:
        self.web_socket = websocket
        self.settings = settings
        self.call_id = str(uuid.uuid4())
        self.stream_sid: Optional[str] = None
        self.openai_agent = RealtimeAgent(settings, call_id=self.call_id)
        self._openai_task: Optional[asyncio.Task[None]] = None
        self._call_started_at: float = time.time()
        self._call_ended_at: Optional[float] = None
        self._latest_twilio_timestamp_ms: int = 0
        self._last_assistant_item: Optional[str] = None
        self._response_start_timestamp_ms: Optional[int] = None
        self._running = False

    async def run(self) -> None:
        """
        Main entry point: process Twilio messages until the call ends, ensuring
        resources are cleaned up and the summary workflow executes.
        """

        self._running = True
        logger.info("Session %s ouverte", self.call_id)

        try:
            await self._process_twilio_messages()
        finally:
            await self._teardown()
            self._running = False

    async def _process_twilio_messages(self) -> None:
        """
        Read frames from Twilio's WebSocket and dispatch them to handlers.
        """

        while True:
            try:
                data = await self.web_socket.receive_text()
            except Exception as exc:  # websockets.exceptions or WebSocketDisconnect
                logger.info("WebSocket Twilio fermé (%s): %s", self.call_id, exc)
                break

            try:
                message: TwilioMessage = json.loads(data)
            except json.JSONDecodeError:
                logger.warning("Message Twilio invalide ignoré: %s", data)
                continue

            event_type = message.get("event")
            if event_type == "start":
                await self._handle_start(message)
            elif event_type == "media":
                await self._handle_media(message)
            elif event_type == "stop":
                logger.info("Événement stop reçu pour %s", self.call_id)
                break
            elif event_type == "mark":
                continue  # Marks are acknowledgements; nothing to do.
            elif event_type == "clear":
                logger.debug("Twilio clear reçu pour %s", self.call_id)
            elif event_type == "close":
                logger.info("Événement close reçu pour %s", self.call_id)
                break
            else:
                logger.debug("Événement Twilio non géré (%s): %s", event_type, message)

    async def _handle_start(self, message: TwilioMessage) -> None:
        self.stream_sid = message.get("start", {}).get("streamSid")
        logger.info("🚀 DÉMARRAGE APPEL %s (SID: %s)", self.call_id, self.stream_sid)

        logger.info("🔌 CONNEXION À OPENAI...")
        await self.openai_agent.connect()
        logger.info("✅ CONNECTÉ À OPENAI")

        # Launch background task to drain OpenAI events.
        logger.info("🔄 LANCEMENT TÂCHE ÉVÉNEMENTS OPENAI...")
        self._openai_task = asyncio.create_task(self._drain_openai_events())

        # Send greeting asynchronously to avoid blocking.
        logger.info("👋 ENVOI SALUTATION AVA...")
        await self.openai_agent.send_greeting()
        logger.info("✅ SALUTATION ENVOYÉE")

    async def _handle_media(self, message: TwilioMessage) -> None:
        if not self.openai_agent.is_connected:
            logger.debug("Audio reçu avant la connexion OpenAI; ignoré.")
            return

        media = message.get("media", {})
        payload = media.get("payload")
        timestamp = media.get("timestamp")
        if timestamp is not None:
            self._latest_twilio_timestamp_ms = int(timestamp)

        if payload:
            await self.openai_agent.send(
                {
                    "type": "input_audio_buffer.append",
                    "audio": payload,
                }
            )
            # Rely on OpenAI's server-side VAD to decide when an utterance ends.

    async def _drain_openai_events(self) -> None:
        async def handler(event: Dict[str, Any]) -> None:
            self.openai_agent.record_from_event(event)
            if event.get("type") == "response.audio.delta":
                await self._forward_audio_delta(event)
            elif event.get("type") == "response.output_item.done":
                item = event.get("item") or {}
                if item.get("type") == "function_call":
                    logger.info(
                        "Réception d'un appel de fonction (%s) non géré.",
                        item.get("name"),
                    )
            elif event.get("type") == "input_audio_buffer.speech_started":
                await self._handle_barge_in()

        await self.openai_agent.drain_events(handler)

    async def _forward_audio_delta(self, event: Dict[str, Any]) -> None:
        if not self.stream_sid:
            return

        delta = event.get("delta")
        if not delta:
            return

        if self._response_start_timestamp_ms is None:
            self._response_start_timestamp_ms = self._latest_twilio_timestamp_ms

        if event.get("item_id"):
            self._last_assistant_item = event["item_id"]

        payload = {
            "event": "media",
            "streamSid": self.stream_sid,
            "media": {"payload": delta},
        }
        await self.web_socket.send_text(json.dumps(payload))

        # Twilio expects an acknowledgement mark to sequence playback.
        mark_payload = {"event": "mark", "streamSid": self.stream_sid}
        await self.web_socket.send_text(json.dumps(mark_payload))

    async def _handle_barge_in(self) -> None:
        """
        Handle interruption when the caller speaks over Ava by truncating the
        assistant audio currently streaming.
        """

        if not self.stream_sid or not self._last_assistant_item:
            return

        elapsed_ms = max(
            0,
            self._latest_twilio_timestamp_ms - (self._response_start_timestamp_ms or 0),
        )

        await self.openai_agent.send(
            {
                "type": "conversation.item.truncate",
                "item_id": self._last_assistant_item,
                "content_index": 0,
                "audio_end_ms": elapsed_ms,
            }
        )

        await self.web_socket.send_text(
            json.dumps({"event": "clear", "streamSid": self.stream_sid})
        )

        self._last_assistant_item = None
        self._response_start_timestamp_ms = None

    async def _teardown(self) -> None:
        """
        Ensure all resources are closed and trigger the summary workflow.
        """

        if not self._running:
            return

        self._call_ended_at = time.time()

        if self._openai_task:
            self._openai_task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await self._openai_task
            self._openai_task = None

        with contextlib.suppress(Exception):
            await self.openai_agent.close()

        await self._deliver_summary()

    async def _deliver_summary(self) -> None:
        duration_seconds = None
        if self._call_started_at and self._call_ended_at:
            duration_seconds = max(0, self._call_ended_at - self._call_started_at)

        metadata = {
            "Call ID": self.call_id,
            "Durée (s)": f"{duration_seconds:.1f}" if duration_seconds else "n/a",
        }

        try:
            summary = await generate_summary(
                self.settings,
                self.openai_agent.conversation,
                call_metadata=metadata,
            )
        except Exception:
            logger.exception("Échec de la génération du résumé pour %s", self.call_id)
            return

        logger.info("Résumé généré pour l'appel %s : %s", self.call_id, summary)

        loop = asyncio.get_running_loop()
        await loop.run_in_executor(
            None,
            partial(
                send_summary_via_email,
                self.settings,
                summary,
                conversation_id=self.call_id,
            ),
        )
