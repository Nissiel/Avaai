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

    def append_turn(self, role: str, content: str) -> None:
        if not content:
            return
        if self.turns and self.turns[-1].role == role:
            self.turns[-1].content += content
            logger.debug("Appended to conversation turn (%s): %s", role, content)
        else:
            self.add_turn(role, content)

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
        self._item_roles: Dict[str, str] = {}
        self._pending_transcripts: Dict[str, str] = {}

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
        conversation transcript. Enhanced with comprehensive debug logging.
        """
        event_type = event.get("type")
        
        # LOG TOUS LES ÉVÉNEMENTS POUR DEBUG COMPLET
        logger.debug("🔍 REALTIME EVENT: %s", event_type)
        if logger.isEnabledFor(logging.DEBUG):
            logger.debug("📦 EVENT DATA: %s", json.dumps(event, indent=2))
        
        # Capture des transcriptions audio utilisateur (événement principal)
        if event_type == "conversation.item.input_audio_transcription.completed":
            item = event.get("item") or {}
            item_id = event.get("item_id") or item.get("id")
            role = item.get("role") or self._item_roles.get(item_id, "user")

            if item_id and item_id not in self._item_roles and role:
                self._item_roles[item_id] = role

            transcript = event.get("transcript")
            if not transcript and item:
                for content in item.get("content", []):
                    transcript = content.get("transcript") or content.get("text")
                    if transcript:
                        break
            if not transcript and item_id:
                transcript = self._pending_transcripts.get(item_id)

            if transcript and transcript.strip():
                logger.info("🎤 USER TRANSCRIPT CAPTURED (%s): %s", role, transcript)
                self.conversation.add_turn(role or "user", transcript)
            else:
                logger.warning("❌ EMPTY USER TRANSCRIPT in event: %s", event)

            if item_id:
                self._pending_transcripts.pop(item_id, None)

        # Support pour les anciens formats de transcription
        elif event_type == "input_audio_buffer.transcription.completed":
            transcript = event.get("transcript")
            if transcript and transcript.strip():
                logger.info("🎤 USER TRANSCRIPT (legacy): %s", transcript)
                self.conversation.add_turn("user", transcript)
            else:
                # Vérifier dans les sous-objets
                for transcription in event.get("transcriptions", []):
                    text = transcription.get("text")
                    if text and text.strip():
                        logger.info("🎤 USER TRANSCRIPT (array): %s", text)
                        self.conversation.add_turn("user", text)
                        
        # Transcriptions en temps réel (deltas)
        elif event_type == "conversation.item.input_audio_transcription.delta":
            item_id = event.get("item_id")
            delta = event.get("delta") or event.get("transcript") or ""
            if not delta and event.get("item"):
                for content in event["item"].get("content", []):
                    delta = content.get("transcript") or content.get("text") or ""
                    if delta:
                        break
            if delta:
                if item_id:
                    logger.debug("🎤 USER TRANSCRIPT DELTA (%s): %s", item_id, delta)
                    self._pending_transcripts[item_id] = self._pending_transcripts.get(item_id, "") + delta
                else:
                    logger.debug("🎤 USER TRANSCRIPT DELTA (sans item): %s", delta)
                    self.conversation.append_turn("user", delta)
                
        # Messages texte de l'assistant terminés
        elif event_type == "response.text.done":
            text = event.get("text", "")
            if text and text.strip():
                logger.info("🤖 ASSISTANT TEXT COMPLETE: %s", text)
                self.conversation.add_turn("assistant", text)
                
        # Audio transcrit de l'assistant
        elif event_type == "response.audio_transcript.done":
            transcript = event.get("transcript", "")
            if transcript and transcript.strip():
                logger.info("🔊 ASSISTANT AUDIO TRANSCRIPT: %s", transcript)
                self.conversation.add_turn("assistant", transcript)
                
        # Deltas de texte de l'assistant
        elif event_type == "response.text.delta":
            delta = event.get("delta", "")
            if delta:
                logger.debug("🤖 ASSISTANT TEXT DELTA: %s", delta)
                self.conversation.append_turn("assistant", delta)
                
        # Items de conversation créés 
        elif event_type == "conversation.item.created":
            item = event.get("item") or {}
            role = item.get("role", "unknown")
            item_id = item.get("id")
            if item_id:
                self._item_roles[item_id] = role
                # Reset any pending transcript fragments for this item
                self._pending_transcripts.pop(item_id, None)
            content_list = item.get("content", [])
            
            logger.debug("💬 CONVERSATION ITEM CREATED: role=%s, contents=%d", role, len(content_list))
            
            for i, content in enumerate(content_list):
                content_type = content.get("type", "unknown")
                logger.debug("📝 Content %d: type=%s", i, content_type)
                
                text_value = None
                if content_type == "input_text":
                    text_value = content.get("text", "")
                elif content_type == "input_audio":
                    text_value = content.get("transcript", "")
                elif content_type == "input_audio_transcription":
                    # La transcription sera traitée via les événements dédiés.
                    text_value = ""
                elif content_type == "text":
                    text_value = content.get("text", "")
                elif content_type == "audio":
                    text_value = content.get("transcript", "")
                    
                if text_value and text_value.strip():
                    logger.info("✅ CONVERSATION ITEM (%s): %s", role, text_value)
                    self.conversation.add_turn(role, text_value)
                else:
                    logger.debug("⚪ Empty content in item: %s", content)
        
        # Items de conversation terminés 
        elif event_type == "conversation.item.completed":
            item = event.get("item") or {}
            role = item.get("role", "unknown") 
            item_id = item.get("id")
            if item_id:
                self._item_roles[item_id] = role
            content_list = item.get("content", [])
            
            logger.debug("✅ CONVERSATION ITEM COMPLETED: role=%s, contents=%d", role, len(content_list))
            
            for content in content_list:
                if content.get("type") == "input_audio_transcription":
                    text_value = ""
                else:
                    text_value = (
                        content.get("text")
                        or content.get("transcript")
                        or content.get("value")
                        or ""
                    )
                if text_value and text_value.strip():
                    logger.info("🏁 CONVERSATION COMPLETED (%s): %s", role, text_value)
                    self.conversation.add_turn(role, text_value)
                    
        # Support des anciens événements pour compatibilité
        elif event_type == "response.completed":
            response = event.get("response") or {}
            output_list = response.get("output", [])
            logger.debug("📤 RESPONSE COMPLETED: outputs=%d", len(output_list))
            
            for output in output_list:
                for content in output.get("content", []):
                    if content.get("type") == "text":
                        text = content.get("text", "")
                        if text.strip():
                            logger.info("📝 RESPONSE TEXT: %s", text)
                            self.conversation.add_turn("assistant", text)
                            
        # Deltas legacy
        elif event_type == "response.output_text.delta":
            delta = event.get("delta")
            if isinstance(delta, str) and delta.strip():
                logger.debug("🔄 OUTPUT TEXT DELTA: %s", delta)
                self.conversation.append_turn("assistant", delta)
                
        elif event_type == "response.input_text.delta":
            delta = event.get("delta")
            if isinstance(delta, str) and delta.strip():
                logger.debug("🔄 INPUT TEXT DELTA: %s", delta)
                self.conversation.append_turn("user", delta)
                
        elif event_type == "response.input_text.done":
            text = event.get("text")
            if isinstance(text, str) and text.strip():
                logger.info("📥 INPUT TEXT DONE: %s", text)
                self.conversation.add_turn("user", text)
                
        # Legacy transcription events
        elif event_type == "input_audio_buffer.transcription.delta":
            for transcription in event.get("transcriptions", []):
                text = transcription.get("text")
                if text and text.strip():
                    logger.debug("🎵 TRANSCRIPTION DELTA: %s", text)
                    self.conversation.append_turn("user", text)
        
        # Log des événements non gérés (sauf les trop verbeux)
        else:
            if event_type not in [
                "response.audio.delta", 
                "session.updated", 
                "rate_limits.updated",
                "input_audio_buffer.append",
                "response.audio.transcription.delta"
            ]:
                logger.debug("❓ UNHANDLED EVENT: %s", event_type)
                
        # Stats de conversation après chaque événement 
        if logger.isEnabledFor(logging.DEBUG):
            turn_count = len(self.conversation.turns)
            if turn_count > 0:
                last_turn = self.conversation.turns[-1]
                logger.debug("📊 CONVERSATION: %d turns, last=(%s: %s)", 
                           turn_count, last_turn.role, last_turn.content[:50] + "..." if len(last_turn.content) > 50 else last_turn.content)

    def finalize_pending_transcripts(self) -> None:
        """
        Commit any buffered transcript fragments that might not have emitted a
        completed event before the websocket closed.
        """
        for item_id, text in list(self._pending_transcripts.items()):
            if text and text.strip():
                role = self._item_roles.get(item_id, "user")
                logger.debug("🧹 Finalisation transcript (%s): %s", item_id, text)
                self.conversation.add_turn(role, text)
            else:
                logger.debug("🧹 Finalisation transcript (%s): vide ou blanc", item_id)
            self._pending_transcripts.pop(item_id, None)


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

    # Debug critique : vérifions ce qui est dans la conversation
    conversation_text = conversation.as_plaintext()
    logger.info("🔍 GÉNÉRATION RÉSUMÉ - Conversation capturée:")
    logger.info("📊 Nombre de tours: %d", len(conversation.turns))
    
    if conversation.turns:
        for i, turn in enumerate(conversation.turns):
            logger.info("💬 Tour %d: [%s] %s", i+1, turn.role, turn.content[:100] + "..." if len(turn.content) > 100 else turn.content)
    else:
        logger.warning("❌ AUCUNE CONVERSATION CAPTURÉE - Problème avec la capture des événements!")
        
    logger.info("📝 Texte final conversation: %s", conversation_text or "VIDE!")

    user_prompt_parts = [
        "Historique de l'appel :",
        conversation_text or "Aucun échange enregistré.",
    ]

    if call_metadata:
        meta_lines = "\n".join(f"- {k}: {v}" for k, v in call_metadata.items())
        user_prompt_parts.append("\nMétadonnées disponibles :")
        user_prompt_parts.append(meta_lines)

    full_prompt = "\n".join(user_prompt_parts)
    logger.info("📤 PROMPT ENVOYÉ À L'IA: %s", full_prompt)

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": full_prompt},
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
