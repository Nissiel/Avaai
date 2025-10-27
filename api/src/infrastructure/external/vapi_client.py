"""
Minimal async client for the Vapi REST API.
"""

from __future__ import annotations

from typing import Any, Dict, Optional, Sequence

import httpx

from api.src.core.settings import get_settings


class VapiApiError(RuntimeError):
    """Raised when the Vapi API responds with an error."""


class VapiClient:
    """Lightweight wrapper around the Vapi REST endpoints used by the platform."""

    def __init__(self, *, token: Optional[str] = None, base_url: Optional[str] = None) -> None:
        settings = get_settings()
        self._token = token or settings.vapi_api_key
        self._base_url = base_url or settings.vapi_base_url

        if not self._token:
            raise ValueError("VAPI API token is not configured.")

        self._headers = {
            "Authorization": f"Bearer {self._token}",
            "Content-Type": "application/json",
        }

    async def _request(self, method: str, path: str, *, params: dict | None = None, json: dict | None = None) -> Any:
        url = f"{self._base_url}{path}"
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.request(method, url, headers=self._headers, params=params, json=json)

        if response.status_code >= 400:
            raise VapiApiError(f"Vapi error {response.status_code}: {response.text}")
        if response.headers.get("content-type", "").startswith("application/json"):
            return response.json()
        return response.text

    async def list_assistants(self, *, limit: int = 50) -> Sequence[dict]:
        data = await self._request("GET", "/assistant", params={"limit": limit})
        return data.get("items", data) if isinstance(data, dict) else data

    async def list_calls(self, *, limit: int = 100, status: Optional[str] = None) -> Sequence[dict]:
        params: Dict[str, Any] = {"limit": limit}
        if status:
            params["status"] = status
        data = await self._request("GET", "/call", params=params)
        return data if isinstance(data, list) else data.get("items", data)

    async def get_call(self, call_id: str) -> dict:
        return await self._request("GET", f"/call/{call_id}")

    async def get_assistant(self, assistant_id: str) -> dict:
        return await self._request("GET", f"/assistant/{assistant_id}")

    async def create_assistant(
        self,
        *,
        name: str,
        voice_provider: str,
        voice_id: str,
        first_message: str,
        model_provider: str = "openai",
        model: str = "gpt-3.5-turbo",
        temperature: float = 0.7,
        max_tokens: int = 250,
        voice_speed: float = 1.0,
        system_prompt: str | None = None,
        metadata: dict | None = None,
        functions: list[dict] | None = None,
        transcriber_provider: str = "deepgram",
        transcriber_model: str = "nova-2",
        transcriber_language: str = "fr",
    ) -> dict:
        """
        Create a new AI assistant in Vapi.

        Args:
            name: Assistant name (max 40 chars)
            voice_provider: Voice provider ("11labs", "azure", "deepgram", etc.)
            voice_id: Voice ID from provider
            first_message: Greeting message when call starts
            model_provider: LLM provider ("openai", "anthropic", etc.)
            model: Model name (e.g., "gpt-3.5-turbo")
            temperature: Model creativity (0.0-1.0)
            max_tokens: Max response length
            voice_speed: Voice speed multiplier (0.5-2.0, default 1.0)
            system_prompt: Custom system instructions for the AI
            metadata: Optional metadata
            functions: Optional custom functions for function calling
            transcriber_provider: STT provider (default "deepgram")
            transcriber_model: STT model (default "nova-2")
            transcriber_language: Language code (default "fr")

        Returns:
            Assistant object with 'id' (UUID), 'name', 'voice', 'model', etc.
        """
        # Build voice config with speed
        voice_config: dict = {
            "provider": voice_provider,
            "voiceId": voice_id,
        }

        # Add speed if supported by provider (11labs, azure, deepgram)
        if voice_provider in ("11labs", "azure", "deepgram") and voice_speed != 1.0:
            voice_config["speed"] = voice_speed

        # Build model config
        model_config: dict = {
            "provider": model_provider,
            "model": model,
            "temperature": temperature,
            "maxTokens": max_tokens,
        }

        # Add system prompt if provided
        if system_prompt:
            model_config["messages"] = [
                {
                    "role": "system",
                    "content": system_prompt
                }
            ]

        payload = {
            "name": name,
            "voice": voice_config,
            "model": model_config,
            "transcriber": {
                "provider": transcriber_provider,
                "model": transcriber_model,
                "language": transcriber_language,
            },
            "firstMessage": first_message,
        }

        if metadata:
            payload["metadata"] = metadata

        if functions:
            payload["functions"] = functions

        return await self._request("POST", "/assistant", json=payload)

    async def update_assistant(
        self,
        assistant_id: str,
        *,
        name: str | None = None,
        voice_provider: str | None = None,
        voice_id: str | None = None,
        first_message: str | None = None,
        model_provider: str | None = None,
        model: str | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
        voice_speed: float | None = None,
        system_prompt: str | None = None,
        metadata: dict | None = None,
        functions: list[dict] | None = None,
        transcriber_provider: str | None = None,
        transcriber_model: str | None = None,
        transcriber_language: str | None = None,
    ) -> dict:
        """
        🔥 DIVINE UPDATE: Update an existing AI assistant in Vapi with COMPLETE configs.

        CRITICAL: Always rebuild complete voice/model configs to avoid partial updates.
        Vapi needs FULL configs, not partial ones.

        Returns:
            Updated assistant object
        """
        payload: dict = {}

        if name is not None:
            payload["name"] = name

        # 🎯 DIVINE: Build COMPLETE voice config (required by Vapi)
        if voice_provider and voice_id:
            voice_config: dict = {
                "provider": voice_provider,
                "voiceId": voice_id,
            }
            # Add speed only for providers that support it
            if voice_speed is not None and voice_provider in ("11labs", "azure", "deepgram"):
                voice_config["speed"] = voice_speed
            payload["voice"] = voice_config

        # 🎯 DIVINE: Build COMPLETE model config (required by Vapi)
        if model_provider and model:
            model_config: dict = {
                "provider": model_provider,
                "model": model,
            }
            if temperature is not None:
                model_config["temperature"] = temperature
            if max_tokens:
                model_config["maxTokens"] = max_tokens
            if system_prompt:
                model_config["messages"] = [{"role": "system", "content": system_prompt}]
            payload["model"] = model_config

        # 🎧 DIVINE: Build COMPLETE transcriber config (Speech-to-Text)
        if transcriber_provider:
            transcriber_config: dict = {
                "provider": transcriber_provider,
            }
            if transcriber_model:
                transcriber_config["model"] = transcriber_model
            if transcriber_language:
                transcriber_config["language"] = transcriber_language
            payload["transcriber"] = transcriber_config

        if first_message is not None:
            payload["firstMessage"] = first_message

        if metadata is not None:
            payload["metadata"] = metadata

        if functions is not None:
            payload["functions"] = functions

        print(f"🔥 DIVINE UPDATE: Updating assistant {assistant_id} with payload: {payload}")
        return await self._request("PATCH", f"/assistant/{assistant_id}", json=payload)

    async def get_or_create_assistant(
        self,
        assistant_id: str | None,
        *,
        name: str,
        voice_provider: str,
        voice_id: str,
        first_message: str,
        model_provider: str = "openai",
        model: str = "gpt-3.5-turbo",
        temperature: float = 0.7,
        max_tokens: int = 250,
        voice_speed: float = 1.0,
        system_prompt: str | None = None,
        metadata: dict | None = None,
        functions: list[dict] | None = None,
        transcriber_provider: str = "deepgram",
        transcriber_model: str = "nova-2",
        transcriber_language: str = "fr",
    ) -> dict:
        """
        🔥 DIVINE METHOD: Get or create assistant intelligently.

        STRATEGY:
        1. If assistant_id exists: TRY to update it
        2. If update fails (404, etc.): CREATE new one
        3. If no assistant_id: CREATE new one

        This ensures we ALWAYS reuse the same assistant when possible.

        Returns:
            Assistant object (created or updated)
        """
        # Try to update existing assistant if ID provided
        if assistant_id:
            try:
                print(f"🎯 DIVINE: Attempting to UPDATE existing assistant {assistant_id}...")
                existing = await self.get_assistant(assistant_id)
                if existing:
                    print(f"✅ Found existing assistant: {existing.get('name')}")
                    # Update existing assistant with ALL parameters
                    updated = await self.update_assistant(
                        assistant_id,
                        name=name,
                        voice_provider=voice_provider,
                        voice_id=voice_id,
                        first_message=first_message,
                        model_provider=model_provider,
                        model=model,
                        temperature=temperature,
                        max_tokens=max_tokens,
                        voice_speed=voice_speed,
                        system_prompt=system_prompt,
                        metadata=metadata,
                        functions=functions,
                        transcriber_provider=transcriber_provider,
                        transcriber_model=transcriber_model,
                        transcriber_language=transcriber_language,
                    )
                    print(f"✅ Successfully UPDATED assistant {assistant_id}")
                    return updated
            except VapiApiError as e:
                # Assistant not found or error - will create new one
                print(f"⚠️ Failed to update assistant {assistant_id}: {e}. Creating new one...")

        # Create new assistant
        print(f"🆕 Creating NEW assistant: {name}")
        created = await self.create_assistant(
            name=name,
            voice_provider=voice_provider,
            voice_id=voice_id,
            first_message=first_message,
            model_provider=model_provider,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            voice_speed=voice_speed,
            system_prompt=system_prompt,
            metadata=metadata,
            functions=functions,
            transcriber_provider=transcriber_provider,
            transcriber_model=transcriber_model,
            transcriber_language=transcriber_language,
        )
        print(f"✅ Successfully CREATED new assistant {created.get('id')}")
        return created

    async def call_transcript(self, call_id: str) -> dict:
        return await self._request("GET", f"/call/{call_id}/transcript")

    async def analytics(self, *, period: str = "7d") -> dict:
        return await self._request("GET", "/analytics", params={"period": period})

    async def voice_preview(self, *, voice_id: str, text: str) -> dict:
        return await self._request(
            "POST",
            "/voices/preview",
            json={
                "voiceId": voice_id,
                "text": text,
            },
        )

    async def list_twilio_numbers(self) -> Sequence[dict]:
        return await self._request("GET", "/integrations/twilio/numbers")

    async def list_phone_numbers(self, *, limit: int = 50) -> Sequence[dict]:
        """
        Liste tous les numéros de téléphone Vapi.

        Returns:
            Liste des phone numbers avec leurs assistantId
        """
        data = await self._request("GET", "/phone-number", params={"limit": limit})
        return data if isinstance(data, list) else data.get("items", data)

    async def get_phone_numbers(self, *, limit: int = 50) -> Sequence[dict]:
        """
        Alias for list_phone_numbers - used by studio_config.

        Returns:
            Liste des phone numbers avec leurs assistantId
        """
        return await self.list_phone_numbers(limit=limit)

    async def assign_phone_number(self, phone_id: str, assistant_id: str) -> dict:
        """
        Assigne un assistant à un numéro de téléphone.

        Args:
            phone_id: ID du phone number
            assistant_id: ID de l'assistant

        Returns:
            Phone number object mis à jour
        """
        return await self._request(
            "PATCH",
            f"/phone-number/{phone_id}",
            json={"assistantId": assistant_id}
        )


__all__ = ["VapiClient", "VapiApiError"]
