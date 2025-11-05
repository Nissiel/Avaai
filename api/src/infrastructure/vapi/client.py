"""Vapi.ai API client for phone number and assistant management."""

import httpx
from typing import Dict, Any, Optional
from api.src.core.settings import get_settings


class VapiClient:
    """
    Client for interacting with Vapi.ai API.

    Vapi provides:
    - Free US phone numbers (max 10 per account)
    - Phone number import from Twilio
    - AI assistant management
    - Call handling and webhooks

    Docs: https://docs.vapi.ai/api-reference

    🌟 MULTI-TENANT ARCHITECTURE:
    Each user has their OWN Vapi API key stored in database.
    This allows infinite scalability - no shared key limits.
    """

    def __init__(self, user_api_key: Optional[str] = None):
        """
        Initialize Vapi client with user's API key or fallback to global key.

        Args:
            user_api_key: User's personal Vapi API key (preferred)

        Raises:
            ValueError: If no API key is available
        """
        settings = get_settings()

        # Prefer user's key, fallback to global key
        self.api_key = user_api_key or settings.vapi_api_key

        if not self.api_key:
            raise ValueError(
                "Vapi API key required. User must configure their Vapi.ai API key "
                "in settings. Get one at: https://vapi.ai"
            )

        self.base_url = settings.vapi_base_url
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    async def create_phone_number(
        self,
        assistant_id: str,
        area_code: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Create a free US phone number via Vapi.

        ⚠️ LIMITATION: Only US numbers, max 10 free per account.

        Args:
            assistant_id: ID of the AVA assistant to link to this number
            area_code: Optional US area code (e.g., "415" for San Francisco)

        Returns:
            Dict with:
                - id: Vapi phone number ID
                - number: E.164 format (+1234567890)
                - assistantId: Linked assistant ID

        Raises:
            Exception: If limit reached or Vapi API error
        """
        async with httpx.AsyncClient() as client:
            # Vapi API requires "provider" field
            # provider="vapi" creates a free US phone number
            payload = {
                "provider": "vapi",
                "assistantId": assistant_id,
            }
            if area_code:
                payload["areaCode"] = area_code

            response = await client.post(
                f"{self.base_url}/phone-number",
                headers=self.headers,
                json=payload,
                timeout=30.0,
            )

            if response.status_code == 400 and "limit" in response.text.lower():
                raise Exception(
                    "Limite de 10 numéros gratuits atteinte. "
                    "Utilisez l'import Twilio pour plus de numéros."
                )

            if response.status_code != 200:
                raise Exception(f"Vapi create_phone_number failed: {response.text}")

            return response.json()

    async def import_phone_number(
        self,
        twilio_account_sid: str,
        twilio_auth_token: str,
        phone_number: str,
        assistant_id: str,
    ) -> Dict[str, Any]:
        """
        Import an existing Twilio phone number into Vapi.

        ✅ SOLUTION DIVINE pour France, Israël, et tous pays hors US.

        Pour Twilio, Vapi attend les credentials DIRECTEMENT dans le payload
        (pas de step credential séparé comme d'autres providers).

        Vapi will automatically:
        - Verify the number exists in Twilio account
        - Configure Twilio webhook to point to Vapi
        - Handle inbound calls using the specified assistant

        Args:
            twilio_account_sid: Twilio Account SID (ACxxxx)
            twilio_auth_token: Twilio Auth Token
            phone_number: E.164 format (+33612345678 or +972501234567)
            assistant_id: UUID of the AVA assistant to link (REQUIRED)

        Returns:
            Dict with:
                - id: Vapi phone number ID
                - number: E.164 phone number
                - provider: "twilio"
                - assistantId: Linked assistant ID

        Raises:
            Exception: If Twilio credentials invalid or Vapi API error
        """
        async with httpx.AsyncClient() as client:
            # ONE-STEP: Create phone number with Twilio credentials directly
            payload = {
                "provider": "twilio",
                "twilioAccountSid": twilio_account_sid,
                "twilioAuthToken": twilio_auth_token,
                "number": phone_number,
                "assistantId": assistant_id,
            }

            phone_response = await client.post(
                f"{self.base_url}/phone-number",
                headers=self.headers,
                json=payload,
                timeout=30.0,
            )

            if phone_response.status_code == 400:
                error_data = phone_response.json()
                error_msg = error_data.get("message", phone_response.text)

                # Vapi peut retourner une list d'erreurs de validation ou une string
                if isinstance(error_msg, list):
                    error_msg = ", ".join(str(e) for e in error_msg)

                # Retourner le message EXACT de Vapi pour debugging
                raise Exception(f"Erreur Vapi (400): {error_msg}")

            if phone_response.status_code != 200 and phone_response.status_code != 201:
                error_data = phone_response.json() if phone_response.headers.get("content-type", "").startswith("application/json") else {"message": phone_response.text}
                raise Exception(f"Vapi import_phone_number failed: {error_data.get('message', phone_response.text)}")

            return phone_response.json()

    async def get_phone_numbers(self) -> list[Dict[str, Any]]:
        """
        List all phone numbers in the Vapi account.

        Returns:
            List of phone number objects with id, number, assistantId, etc.
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/phone-number",
                headers=self.headers,
                timeout=30.0,
            )

            if response.status_code != 200:
                raise Exception(f"Vapi get_phone_numbers failed: {response.text}")

            data = response.json()
            if isinstance(data, dict):
                items = data.get("items") or data.get("data") or []
                return list(items) if isinstance(items, list) else []

            if isinstance(data, list):
                return data

            return []

    async def delete_phone_number(self, phone_number_id: str) -> bool:
        """
        Delete a phone number from Vapi.

        Args:
            phone_number_id: Vapi phone number ID

        Returns:
            True if deleted successfully
        """
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{self.base_url}/phone-number/{phone_number_id}",
                headers=self.headers,
                timeout=30.0,
            )

            if response.status_code != 200:
                raise Exception(f"Vapi delete_phone_number failed: {response.text}")

            return True

    async def assign_phone_number(
        self,
        phone_number_id: str,
        assistant_id: str,
    ) -> Dict[str, Any]:
        """
        Assign an existing phone number to a specific assistant.

        Args:
            phone_number_id: Vapi phone number ID
            assistant_id: Assistant UUID to link

        Returns:
            Updated phone number object.
        """
        async with httpx.AsyncClient() as client:
            response = await client.patch(
                f"{self.base_url}/phone-number/{phone_number_id}",
                headers=self.headers,
                json={"assistantId": assistant_id},
                timeout=30.0,
            )

            if response.status_code not in (200, 201):
                raise Exception(
                    f"Vapi assign_phone_number failed: {response.text}",
                )

            return response.json()

    # ==================== ASSISTANT MANAGEMENT ====================

    async def create_assistant(
        self,
        name: str,
        voice_provider: str,
        voice_id: str,
        first_message: str,
        model_provider: str = "openai",
        model: str = "gpt-3.5-turbo",
        temperature: float = 0.7,
        max_tokens: int = 250,
        metadata: Optional[Dict[str, Any]] = None,
        server_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Create a new AI assistant in Vapi.

        This creates the personality and voice configuration that will handle calls.
        Each assistant can be linked to one or more phone numbers.

        Args:
            name: Assistant name (max 40 chars, required for transfer)
            voice_provider: Voice provider ("11labs", "azure", "deepgram", etc.)
            voice_id: Voice ID from provider (e.g., "21m00Tcm4TlvDq8ikWAM" for Rachel/11labs)
            first_message: Greeting message when call starts
            model_provider: LLM provider ("openai", "anthropic", "groq", etc.)
            model: Model name (e.g., "gpt-3.5-turbo", "claude-3-opus-20240229")
            temperature: Model creativity (0.0-1.0)
            max_tokens: Max response length
            metadata: Optional metadata to store on assistant
            server_url: 🔥 DIVINE: Webhook URL to receive call events
                       Example: "https://ava-api-production.onrender.com/api/v1/webhooks/vapi"

        Returns:
            Dict with:
                - id: Assistant UUID (use this for phone numbers!)
                - name: Assistant name
                - voice: Voice configuration
                - model: LLM configuration
                - serverUrl: Webhook URL (if provided)
                - createdAt: ISO 8601 timestamp

        Raises:
            Exception: If creation fails (400 = validation error, 401 = bad API key)

        Example:
            assistant = await client.create_assistant(
                name="AVA - Sarah's Real Estate Assistant",
                voice_provider="11labs",
                voice_id="21m00Tcm4TlvDq8ikWAM",  # Rachel voice
                first_message="Hi! I'm AVA, Sarah's assistant. How can I help you today?",
                server_url="https://ava-api-production.onrender.com/api/v1/webhooks/vapi",
                metadata={"industry": "real_estate", "user_id": "123"}
            )
            # assistant['id'] = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
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

        # Add optional webhook URL (🔥 DIVINE: This makes calls appear in app!)
        if server_url:
            payload["serverUrl"] = server_url

        # Add optional metadata
        if metadata:
            payload["metadata"] = metadata

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/assistant",
                headers=self.headers,
                json=payload,
                timeout=30.0,
            )

            # Handle errors gracefully
            if response.status_code != 201:
                error_detail = response.text
                if isinstance(error_detail, str):
                    try:
                        error_json = response.json()
                        error_detail = error_json.get("message", error_detail)
                    except:
                        pass
                raise Exception(f"Vapi create_assistant failed ({response.status_code}): {error_detail}")

            return response.json()

    async def list_assistants(self, limit: int = 10) -> Dict[str, Any]:
        """
        List all assistants in Vapi account.

        Args:
            limit: Max number of assistants to return (default 10)

        Returns:
            List of assistant objects with id, name, voice, model, etc.

        Example:
            assistants = await client.list_assistants(limit=5)
            for assistant in assistants:
                print(f"{assistant['name']}: {assistant['id']}")
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/assistant",
                headers=self.headers,
                params={"limit": limit},
                timeout=30.0,
            )

            if response.status_code != 200:
                raise Exception(f"Vapi list_assistants failed: {response.text}")

            return response.json()

    async def get_assistant(self, assistant_id: str) -> Dict[str, Any]:
        """
        Get a specific assistant by ID.

        Args:
            assistant_id: UUID of the assistant

        Returns:
            Assistant object with full configuration

        Raises:
            Exception: If assistant not found (404) or other error
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/assistant/{assistant_id}",
                headers=self.headers,
                timeout=30.0,
            )

            if response.status_code != 200:
                raise Exception(f"Vapi get_assistant failed: {response.text}")

            return response.json()

    # ==================== WEBHOOK MANAGEMENT ====================

    async def configure_server_webhook(
        self,
        server_url: str,
        events: Optional[list[str]] = None,
    ) -> Dict[str, Any]:
        """
        Configure Vapi to send webhooks to your backend server.

        🔥 DIVINE: This is what makes calls appear in your app!

        Vapi will send HTTP POST requests to your server_url whenever
        call events happen (call started, call ended, transcript updated, etc.)

        NOTE: In Vapi API, webhook configuration is done at ASSISTANT level,
        not globally. This method updates the assistant's serverUrl.

        Args:
            server_url: Your backend webhook endpoint URL
                       Example: "https://ava-api-production.onrender.com/api/v1/webhooks/vapi"
            events: Not used (kept for API compatibility). Vapi sends all events to serverUrl.

        Returns:
            Dict with success status

        Raises:
            Exception: If configuration fails (400 = invalid URL, 401 = bad API key)

        Example:
            await client.configure_server_webhook(
                server_url="https://ava-api-production.onrender.com/api/v1/webhooks/vapi"
            )

        Note:
            - Vapi doesn't have a dedicated /server endpoint
            - Webhook URL must be set when creating/updating assistants
            - This is a helper that will be called during assistant creation
            - Vapi automatically sends: call.started, call.ended, transcript events
        """
        # For Vapi, there's no separate webhook config endpoint
        # The serverUrl must be set on each assistant
        # This method is kept for API compatibility and returns success
        # The actual webhook URL should be set during assistant creation/update

        return {
            "success": True,
            "serverUrl": server_url,
            "message": "Webhook URL should be set on assistant. This is a helper method.",
            "note": "Call update_assistant() with serverUrl parameter to actually configure webhooks"
        }

    async def update_assistant_webhook(
        self,
        assistant_id: str,
        server_url: str,
    ) -> Dict[str, Any]:
        """
        Update an assistant's webhook URL.

        This is the ACTUAL way to configure webhooks in Vapi.
        Each assistant can have its own serverUrl for receiving events.

        Args:
            assistant_id: UUID of the assistant to update
            server_url: Your backend webhook endpoint URL

        Returns:
            Updated assistant object with new serverUrl

        Example:
            await client.update_assistant_webhook(
                assistant_id="a1b2c3d4...",
                server_url="https://ava-api-production.onrender.com/api/v1/webhooks/vapi"
            )
        """
        async with httpx.AsyncClient() as client:
            response = await client.patch(
                f"{self.base_url}/assistant/{assistant_id}",
                headers=self.headers,
                json={"serverUrl": server_url},
                timeout=30.0,
            )

            if response.status_code not in (200, 201):
                error_detail = response.text
                try:
                    error_json = response.json()
                    error_detail = error_json.get("message", error_detail)
                except:
                    pass
                raise Exception(
                    f"Vapi update_assistant_webhook failed ({response.status_code}): {error_detail}"
                )

            return response.json()

    async def get_server_webhook(self) -> Dict[str, Any]:
        """
        Get current webhook configuration.

        NOTE: In Vapi, webhooks are per-assistant, not global.
        This method returns a helper message.

        Returns:
            Dict with info about webhook configuration
        """
        return {
            "note": "Vapi webhooks are configured per-assistant via serverUrl property",
            "message": "Use get_assistant(id) to see an assistant's webhook URL"
        }
