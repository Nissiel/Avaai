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
        data = await self._request("GET", "/assistants", params={"limit": limit})
        return data.get("items", data)

    async def list_calls(self, *, limit: int = 100, status: str | None = None) -> Sequence[dict]:
        params: Dict[str, Any] = {"limit": limit}
        if status:
            params["status"] = status
        data = await self._request("GET", "/calls", params=params)
        return data.get("items", data)

    async def get_call(self, call_id: str) -> dict:
        return await self._request("GET", f"/calls/{call_id}")

    async def get_assistant(self, assistant_id: str) -> dict:
        return await self._request("GET", f"/assistants/{assistant_id}")

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
        metadata: dict | None = None,
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
            metadata: Optional metadata
        
        Returns:
            Assistant object with 'id' (UUID), 'name', 'voice', 'model', etc.
        """
        payload = {
            "name": name,
            "voice": {
                "provider": voice_provider,
                "voiceId": voice_id,
            },
            "model": {
                "provider": model_provider,
                "model": model,
                "temperature": temperature,
                "maxTokens": max_tokens,
            },
            "firstMessage": first_message,
        }
        
        if metadata:
            payload["metadata"] = metadata
        
        return await self._request("POST", "/assistant", json=payload)

    async def call_transcript(self, call_id: str) -> dict:
        return await self._request("GET", f"/calls/{call_id}/transcript")

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


__all__ = ["VapiClient", "VapiApiError"]
