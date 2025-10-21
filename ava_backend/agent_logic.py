"""
Core logic for interacting with OpenAI's Realtime API and post-call summarisation.

This module provides helper classes for configuring the realtime session, sending
messages (greeting, conversation updates), tracking transcripts, and generating a
final summary using the Chat Completions API.
"""

from __future__ import annotations
import json
import logging
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

import websockets
from openai import AsyncOpenAI

from .config import Settings

logger = logging.getLogger(__name__)


@dataclass
class ConversationTurn:
    role: str
    content: str


@dataclass
class ConversationState:
    turns: List[ConversationTurn] = field(default_factory=list)

    def add_turn(self, role: str, content: str) -> None:
        text = content.strip()
        if not text:
            return
        self.turns.append(ConversationTurn(role=role, content=text))
        logger.debug("Added conversation turn (%s): %s", role, text)

    def as_prompt(self) -> List[Dict[str, str]]:
        return [{"role": t.role, "content": t.content} for t in self.turns]

    def as_plaintext(self) -> str:
        return "\n".join(f"{t.role}: {t.content}" for t in self.turns)


class RealtimeAgent:
    """
    Helper around OpenAI's Realtime WebSocket API.

    This class wraps connection lifecycle, initial session configuration, and
    provides methods to send frames (session update, responses, tool outputs).
    """

    def __init__(self, settings: Settings, *, call_id: str) -> None:
        self._settings = settings
        self._call_id = call_id
        self._ws: Optional[websockets.WebSocketClientProtocol] = None
        self.conversation = ConversationState()

    @property
    def websocket(self) -> websockets.WebSocketClientProtocol:
        if not self._ws:
            raise RuntimeError("Realtime WS not connected yet.")
        return self._ws

    async def connect(self) -> None:
        """
        Establish the WebSocket connection to the Realtime API and send the
        initial session configuration payload.
        """

        headers = {
            "Authorization": f"Bearer {self._settings.openai_api_key}",
            "OpenAI-Beta": "realtime=v1",
        }
        logger.info("🔌 Connexion à OpenAI Realtime API...")
        self._ws = await websockets.connect(
            f"wss://api.openai.com/v1/realtime?model={self._settings.openai_realtime_model}",
            extra_headers=headers,
            max_size=None,
        )
        logger.info("✅ Connexion Realtime ouverte pour l'appel %s", self._call_id)
        
        # SEULEMENT session.update avec instructions - c'est la méthode officielle
        await self._send_session_update()
        logger.info("✅ Session configurée avec le system prompt d'AVA")

    async def close(self) -> None:
        if self._ws:
            await self._ws.close()
            logger.info("Connexion Realtime fermée pour l'appel %s", self._call_id)
            self._ws = None

    @property
    def is_connected(self) -> bool:
        return bool(self._ws and not self._ws.closed)

    async def _send_session_update(self) -> None:
        logger.info("🔧 CONFIGURATION SESSION OPENAI POUR %s", self._call_id)
        logger.info("🔧 INSTRUCTIONS SYSTÈME: %s", self._settings.system_prompt[:100])
        logger.info("🔧 VOIX: %s", self._settings.realtime_voice)
        
        payload = {
            "type": "session.update",
            "session": {
                "modalities": ["text", "audio"],
                "voice": self._settings.realtime_voice,
                "turn_detection": {"type": "server_vad"},
                "input_audio_format": "g711_ulaw",
                "output_audio_format": "g711_ulaw",
                "input_audio_transcription": {"model": "whisper-1"},
                "instructions": self._settings.system_prompt,
            },
        }
        logger.info("🔧 PAYLOAD SESSION UPDATE ENVOYÉ")
        await self.send(payload)



    async def send_greeting(self) -> None:
        """
        EXPERT FIX: Dans l'API Realtime, l'assistant ne parle PAS automatiquement.
        Il faut attendre que l'utilisateur parle en premier, puis AVA répond selon son system prompt.
        On ne force AUCUN greeting automatique - c'est la bonne pratique OpenAI !
        """
        logger.info("🎯 CONFIGURATION TERMINÉE - AVA prête à répondre pour %s", self._call_id)
        logger.info("🎯 AVA attend que l'utilisateur parle en premier (API Realtime standard)")
        
        # PAS de greeting forcé ! L'utilisateur parle en premier, AVA répond naturellement
        # selon son system prompt configuré dans session.update
        
        # La conversation se déroulera automatiquement :
        # 1. User parle -> server_vad détecte
        # 2. OpenAI génère une réponse selon le system prompt  
        # 3. AVA répond naturellement en français comme configuré

    async def send(self, payload: Dict[str, Any]) -> None:
        message = json.dumps(payload)
        logger.debug("→ OpenAI: %s", message)
        await self.websocket.send(message)

    async def recv(self) -> Dict[str, Any]:
        raw = await self.websocket.recv()
        logger.debug("← OpenAI raw: %s", raw)
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            logger.exception("Failed to decode message from OpenAI: %s", raw)
            raise

    async def drain_events(self, handler) -> None:
        """
        Continuously receive events from the Realtime session and delegate them
        to the provided handler callable.

        Args:
            handler: Coroutine function taking the parsed event dictionary.
        """

        if not self._ws:
            raise RuntimeError("Realtime agent not connected.")

        try:
            async for raw in self.websocket:
                logger.debug("← OpenAI: %s", raw)
                try:
                    event = json.loads(raw)
                except json.JSONDecodeError:
                    logger.warning("Ignoring non-JSON OpenAI frame: %s", raw)
                    continue
                await handler(event)
        except websockets.ConnectionClosedOK:
            logger.info("OpenAI realtime connection closed gracefully.")
        except websockets.ConnectionClosedError:
            logger.warning("OpenAI realtime connection closed with error.")

    def record_from_event(self, event: Dict[str, Any]) -> None:
        """
        Inspect an OpenAI event and pull any textual contributions into the
        conversation transcript.
        """

        event_type = event.get("type")
        if event_type == "response.completed":
            response = event.get("response") or {}
            for output in response.get("output", []):
                for content in output.get("content", []):
                    if content.get("type") == "output_text":
                        self.conversation.add_turn("assistant", content.get("text", ""))
        elif event_type == "conversation.item.completed":
            item = event.get("item") or {}
            role = item.get("role") or "assistant"
            for content in item.get("content", []):
                text_value = content.get("text") or content.get("transcript")
                if text_value:
                    self.conversation.add_turn(role, text_value)
        elif event_type == "conversation.item.created":
            item = event.get("item") or {}
            role = item.get("role") or "assistant"
            for content in item.get("content", []):
                if content.get("type") == "input_text":
                    self.conversation.add_turn(role, content.get("text", ""))
        elif event_type == "response.output_text.delta":
            delta = event.get("delta")
            if isinstance(delta, str):
                # Append to last assistant turn if available
                if self.conversation.turns and self.conversation.turns[-1].role == "assistant":
                    self.conversation.turns[-1].content += delta
                else:
                    self.conversation.add_turn("assistant", delta)
        elif event_type == "input_audio_buffer.transcription.completed":
            for transcription in event.get("transcriptions", []):
                text = transcription.get("text")
                if text:
                    self.conversation.add_turn("user", text)


async def generate_summary(
    settings: Settings,
    conversation: ConversationState,
    *,
    call_metadata: Optional[Dict[str, Any]] = None,
) -> str:
    """
    Use the Chat Completions API to summarise the conversation in French.

    Args:
        settings: Shared application settings.
        conversation: Recorded dialogue between the caller and Ava.
        call_metadata: Optional dictionary containing timestamps, caller info, etc.

    Returns:
        Formatted summary text in French.
    """

    client = AsyncOpenAI(api_key=settings.openai_api_key)

    system_prompt = (
        "Tu es Ava, une secrétaire IA professionnelle. Tu vas résumer un appel "
        "téléphonique en français. Produis un résumé concis (3 à 5 phrases) qui "
        "couvre : le motif de l'appel, les informations clés échangées, les "
        "actions ou suivis éventuels. Utilise un ton poli et professionnel."
    )

    user_prompt_parts = [
        "Historique de l'appel :",
        conversation.as_plaintext() or "Aucun échange enregistré.",
    ]

    if call_metadata:
        meta_lines = "\n".join(f"- {k}: {v}" for k, v in call_metadata.items())
        user_prompt_parts.append("\nMétadonnées disponibles :")
        user_prompt_parts.append(meta_lines)

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": "\n".join(user_prompt_parts)},
    ]

    logger.info("Génération du résumé via le modèle %s", settings.openai_summary_model)

    response = await client.chat.completions.create(
        model=settings.openai_summary_model,
        messages=messages,
        temperature=0.3,
        max_tokens=400,
    )

    summary = response.choices[0].message.content or ""
    logger.debug("Résumé généré : %s", summary)
    return summary.strip()
