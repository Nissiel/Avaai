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
    """

    def __init__(self):
        """Initialize Vapi client with API key from settings."""
        settings = get_settings()
        self.api_key = settings.vapi_api_key
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
            response = await client.post(
                f"{self.base_url}/phone-numbers",
                headers=self.headers,
                json={
                    "assistantId": assistant_id,
                    "areaCode": area_code,
                },
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
        
        ✅ SOLUTION pour France, Israël, et tous pays hors US.
        
        Vapi will automatically:
        - Verify the number exists in Twilio
        - Configure Twilio webhook to point to Vapi
        - Handle inbound calls using the specified assistant
        
        Args:
            twilio_account_sid: Twilio Account SID
            twilio_auth_token: Twilio Auth Token
            phone_number: E.164 format (+33612345678 or +972501234567)
            assistant_id: ID of the AVA assistant to link
        
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
            response = await client.post(
                f"{self.base_url}/phone-numbers/import",
                headers=self.headers,
                json={
                    "twilioAccountSid": twilio_account_sid,
                    "twilioAuthToken": twilio_auth_token,
                    "number": phone_number,
                    "assistantId": assistant_id,
                },
                timeout=30.0,
            )

            if response.status_code == 400:
                error_msg = response.json().get("error", response.text)
                if "not found" in error_msg.lower():
                    raise Exception(
                        f"Numéro {phone_number} non trouvé dans votre compte Twilio"
                    )
                elif "invalid" in error_msg.lower():
                    raise Exception("Credentials Twilio invalides")
                else:
                    raise Exception(f"Erreur Vapi: {error_msg}")

            if response.status_code != 200:
                raise Exception(f"Vapi import_phone_number failed: {response.text}")

            return response.json()

    async def get_phone_numbers(self) -> list[Dict[str, Any]]:
        """
        List all phone numbers in the Vapi account.
        
        Returns:
            List of phone number objects with id, number, assistantId, etc.
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/phone-numbers",
                headers=self.headers,
                timeout=30.0,
            )

            if response.status_code != 200:
                raise Exception(f"Vapi get_phone_numbers failed: {response.text}")

            return response.json()

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
                f"{self.base_url}/phone-numbers/{phone_number_id}",
                headers=self.headers,
                timeout=30.0,
            )

            if response.status_code != 200:
                raise Exception(f"Vapi delete_phone_number failed: {response.text}")

            return True
