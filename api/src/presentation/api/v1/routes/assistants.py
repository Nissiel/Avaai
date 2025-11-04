"""Assistant management endpoints backed by Vapi."""

from __future__ import annotations

import logging
from typing import Any, Optional

from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, Query, status

from api.src.infrastructure.external.vapi_client import VapiApiError, VapiClient
from api.src.infrastructure.vapi.client import VapiClient as PhoneNumberVapiClient
from api.src.infrastructure.persistence.models.user import User
from api.src.presentation.dependencies.auth import get_current_user
from api.src.core.settings import get_settings

router = APIRouter(prefix="/assistants", tags=["Assistants"])


class CreateAssistantRequest(BaseModel):
    """Request body for creating a new assistant."""
    
    model_config = {"protected_namespaces": ()}  # Allow model_* fields
    
    name: str = Field(..., min_length=1, max_length=40, description="Assistant name")
    voice_provider: str = Field(..., description="Voice provider (11labs, azure, deepgram, etc.)")
    voice_id: str = Field(..., description="Voice ID from provider")
    first_message: str = Field(..., description="Greeting message when call starts")
    system_prompt: str | None = Field(default=None, description="🔥 DIVINE: Custom system instructions for AI behavior")
    voice_speed: float = Field(default=1.0, ge=0.5, le=2.0, description="Voice speed multiplier")
    model_provider: str = Field(default="openai", description="LLM provider")
    model: str = Field(default="gpt-3.5-turbo", description="Model name")
    temperature: float = Field(default=0.7, ge=0.0, le=1.0, description="Model creativity")
    max_tokens: int = Field(default=250, ge=50, le=1000, description="Max response length")
    transcriber_provider: str = Field(default="deepgram", description="Speech-to-text provider")
    transcriber_model: str = Field(default="nova-2", description="STT model")
    transcriber_language: str = Field(default="fr", description="Language code")
    metadata: dict | None = Field(default=None, description="Optional metadata")


class UpdateAssistantRequest(BaseModel):
    """Request body for updating an assistant."""
    
    model_config = {"protected_namespaces": ()}  # Allow model_* fields
    
    name: str | None = Field(None, min_length=1, max_length=40, description="Assistant name")
    voice_provider: str | None = Field(None, description="Voice provider")
    voice_id: str | None = Field(None, description="Voice ID from provider")
    first_message: str | None = Field(None, description="Greeting message")
    system_prompt: str | None = Field(None, description="🔥 DIVINE: Custom system instructions")
    voice_speed: float | None = Field(None, ge=0.5, le=2.0, description="Voice speed multiplier")
    model_provider: str | None = Field(None, description="LLM provider")
    model: str | None = Field(None, description="Model name")
    temperature: float | None = Field(None, ge=0.0, le=1.0, description="Model creativity")
    max_tokens: int | None = Field(None, ge=50, le=1000, description="Max response length")
    transcriber_provider: str | None = Field(None, description="STT provider")
    transcriber_model: str | None = Field(None, description="STT model")
    transcriber_language: str | None = Field(None, description="Language code")
    metadata: dict | None = Field(None, description="Optional metadata")


logger = logging.getLogger(__name__)


def _client(user: User) -> VapiClient:
    """🎯 DIVINE: Create VapiClient with user's personal API key (multi-tenant)."""
    try:
        return VapiClient(user_api_key=user.vapi_api_key)  # 🔥 DIVINE: Fixed parameter name!
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Vapi API key not configured. Please add your Vapi key in Settings."
        ) from exc


async def _auto_link_twilio_number(user: User, assistant_id: Optional[str]) -> Optional[dict[str, Any]]:
    """
    Automatically import or assign the user's Twilio number to the newly created assistant.

    Strategy:
    - Skip if credentials incomplete or assistant_id missing
    - Reuse existing imported number when possible (assign if unlinked)
    - Import the number via Vapi if it does not exist yet
    - Never raise (best-effort to avoid blocking assistant creation)
    """
    if not assistant_id:
        return None

    if not (user.twilio_account_sid and user.twilio_auth_token and user.twilio_phone_number):
        return None

    if not user.vapi_api_key:
        logger.info("Skipping Twilio auto-link: user %s missing Vapi key", user.id)
        return None

    try:
        phone_client = PhoneNumberVapiClient(user_api_key=user.vapi_api_key)
    except ValueError as exc:
        logger.warning("Skipping Twilio auto-link for user %s: %s", user.id, exc)
        return {
            "status": "vapi_key_missing",
            "message": str(exc),
        }

    try:
        existing_numbers = await phone_client.get_phone_numbers()
    except Exception as exc:  # noqa: BLE001 - non-fatal diagnostics only
        logger.warning("Failed to list Vapi phone numbers for user %s: %s", user.id, exc)
        existing_numbers = []

    matching = next(
        (phone for phone in existing_numbers if phone.get("number") == user.twilio_phone_number),
        None,
    )

    if matching:
        phone_id = matching.get("id")
        current_assistant = matching.get("assistantId")

        if current_assistant == assistant_id:
            logger.info("Twilio number %s already linked to assistant %s", user.twilio_phone_number, assistant_id)
            return {
                "status": "already_linked",
                "phoneId": phone_id,
                "assistantId": assistant_id,
            }

        if current_assistant:
            logger.info(
                "Twilio number %s already linked to assistant %s. Skipping reassignment.",
                user.twilio_phone_number,
                current_assistant,
            )
            return {
                "status": "linked_elsewhere",
                "phoneId": phone_id,
                "assistantId": current_assistant,
            }

        if phone_id:
            try:
                updated = await phone_client.assign_phone_number(phone_id, assistant_id)
                logger.info(
                    "Assigned existing Twilio number %s to assistant %s",
                    user.twilio_phone_number,
                    assistant_id,
                )
                return {
                    "status": "assigned_existing",
                    "phoneId": phone_id,
                    "assistantId": assistant_id,
                    "number": updated.get("number"),
                }
            except Exception as exc:  # noqa: BLE001
                logger.warning(
                    "Failed to assign existing Twilio number %s to assistant %s: %s",
                    user.twilio_phone_number,
                    assistant_id,
                    exc,
                )
                return {
                    "status": "assignment_failed",
                    "error": str(exc),
                }

    try:
        imported = await phone_client.import_phone_number(
            twilio_account_sid=user.twilio_account_sid,
            twilio_auth_token=user.twilio_auth_token,
            phone_number=user.twilio_phone_number,
            assistant_id=assistant_id,
        )
        logger.info(
            "Imported Twilio number %s into Vapi and linked to assistant %s for user %s",
            user.twilio_phone_number,
            assistant_id,
            user.id,
        )
        return {
            "status": "imported",
            "phoneId": imported.get("id"),
            "assistantId": assistant_id,
            "number": imported.get("number"),
        }
    except Exception as exc:  # noqa: BLE001
        logger.warning(
            "Failed to auto-import Twilio number %s for user %s: %s",
            user.twilio_phone_number,
            user.id,
            exc,
        )
        return {
            "status": "import_failed",
            "error": str(exc),
        }


@router.get("")
async def list_assistants(
    user: User = Depends(get_current_user),
    limit: int = Query(default=50, ge=1, le=200),
) -> dict[str, object]:
    client = _client(user)
    try:
        assistants = await client.list_assistants(limit=limit)
        # 🎯 DIVINE: Return format compatible with frontend expectations
        return {
            "success": True,
            "assistants": assistants,
            "configured": True,
        }
    except VapiApiError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc


@router.get("/{assistant_id}")
async def get_assistant(
    assistant_id: str,
    user: User = Depends(get_current_user),
) -> dict[str, object]:
    client = _client(user)
    try:
        assistant = await client.get_assistant(assistant_id)
        # 🎯 DIVINE: Return format compatible with frontend expectations
        return {
            "success": True,
            "assistant": assistant,
        }
    except VapiApiError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc


@router.post("")
async def create_assistant(
    request: CreateAssistantRequest,
    user: User = Depends(get_current_user),
    # Note: No auth required during onboarding - user not logged in yet
    # TODO: Add tenant_id to request body once user is authenticated
) -> dict[str, object]:
    """
    Create a new AI assistant with personalized voice and configuration.
    
    This creates the assistant FIRST, then you link it to phone numbers.
    Returns the assistant_id (UUID) which you'll use for phone setup.
    
    During onboarding: No auth required (user creates assistant before signup)
    After onboarding: Should validate tenant ownership
    """
    client = _client(user)
    settings = get_settings()
    
    # DIVINE: Safe metadata handling - use empty dict if None
    metadata = request.metadata or {}
    
    # TODO: Add function calling for caller info collection
    # Vapi requires specific format for functions - needs investigation
    # For now, create assistant without functions to unblock onboarding
    functions = None  # Disabled temporarily due to Vapi format requirements
    
    try:
        # 🔥 DIVINE: Create assistant with webhook URL so calls appear in app!
        webhook_url = f"{settings.backend_url}/api/v1/webhooks/vapi"

        assistant = await client.create_assistant(
            name=request.name,
            voice_provider=request.voice_provider,
            voice_id=request.voice_id,
            voice_speed=request.voice_speed,
            first_message=request.first_message,
            system_prompt=request.system_prompt,  # 🔥 DIVINE: Pass system prompt!
            model_provider=request.model_provider,
            model=request.model,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            transcriber_provider=request.transcriber_provider,
            transcriber_model=request.transcriber_model,
            transcriber_language=request.transcriber_language,
            metadata=metadata,  # Use safe metadata
            functions=functions,  # Disabled temporarily - Vapi format issue
            server_url=webhook_url,  # 🔥 DIVINE: Webhook for call events!
        )
    except VapiApiError as exc:
        # DIVINE: Log the full error for debugging
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Vapi API error creating assistant: {exc}")
        logger.error(f"Request payload - name: {request.name}, voice: {request.voice_provider}/{request.voice_id}")
        
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, 
            detail=f"Failed to create assistant: {str(exc)}"
        ) from exc
    
    # 🔥 DIVINE: Auto-link Twilio number if credentials are configured
    twilio_link = await _auto_link_twilio_number(user, assistant.get("id"))

    # 🎯 DIVINE: Return format compatible with frontend expectations
    return {
        "success": True,
        "assistant": assistant,
        "twilio_link": twilio_link,
    }


@router.patch("/{assistant_id}")
async def update_assistant(
    assistant_id: str,
    request: UpdateAssistantRequest,
    user: User = Depends(get_current_user),
) -> dict[str, object]:
    """
    Update an existing AI assistant.
    
    Only provided fields will be updated. Omitted fields remain unchanged.
    """
    client = _client(user)
    
    try:
        # 🔥 DIVINE: Build COMPLETE update payload - ALL fields!
        update_data = {}
        
        # Basic fields
        if request.name is not None:
            update_data["name"] = request.name
        if request.first_message is not None:
            update_data["firstMessage"] = request.first_message
        
        # 🔥 DIVINE: System prompt (custom AI instructions)
        if request.system_prompt is not None:
            update_data["model"] = update_data.get("model", {})
            update_data["model"]["messages"] = [
                {"role": "system", "content": request.system_prompt}
            ]
        
        # Voice configuration
        if request.voice_provider is not None and request.voice_id is not None:
            update_data["voice"] = {
                "provider": request.voice_provider,
                "voiceId": request.voice_id,
            }
            # 🔥 DIVINE: Voice speed
            if request.voice_speed is not None:
                update_data["voice"]["speed"] = request.voice_speed
        elif request.voice_speed is not None:
            # Update only voice speed
            update_data["voice"] = {"speed": request.voice_speed}
        
        # Model configuration
        if request.model is not None:
            update_data["model"] = update_data.get("model", {})
            update_data["model"]["provider"] = request.model_provider or "openai"
            update_data["model"]["model"] = request.model
            
            if request.temperature is not None:
                update_data["model"]["temperature"] = request.temperature
            if request.max_tokens is not None:
                update_data["model"]["maxTokens"] = request.max_tokens
        
        # 🔥 DIVINE: Transcriber configuration (speech-to-text)
        if request.transcriber_provider is not None:
            update_data["transcriber"] = {
                "provider": request.transcriber_provider,
                "model": request.transcriber_model or "nova-2",
                "language": request.transcriber_language or "fr",
            }
        
        # Metadata
        if request.metadata is not None:
            update_data["metadata"] = request.metadata
        
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"🔄 Updating assistant {assistant_id} with: {list(update_data.keys())}")
        
        assistant = await client.update_assistant(assistant_id, update_data)
    except VapiApiError as exc:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Vapi API error updating assistant {assistant_id}: {exc}")
        
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, 
            detail=f"Failed to update assistant: {str(exc)}"
        ) from exc
    
    # 🎯 DIVINE: Return format compatible with frontend expectations
    return {
        "success": True,
        "assistant": assistant,
    }


@router.post("/{assistant_id}/configure-webhook")
async def configure_webhook(
    assistant_id: str,
    user: User = Depends(get_current_user),
) -> dict[str, object]:
    """
    🔥 DIVINE: Configure webhook on existing assistant.
    
    Use this endpoint to migrate existing assistants created before
    automatic webhook configuration was implemented.
    
    This endpoint:
    1. Gets the backend webhook URL from settings
    2. Updates the assistant's serverUrl via Vapi API
    3. Returns confirmation with webhook URL
    
    Returns:
        {
            "success": True,
            "assistant_id": "abc-123",
            "webhook_url": "https://ava-api-production.onrender.com/api/v1/webhooks/vapi",
            "message": "Webhook configured successfully"
        }
    """
    client = _client(user)
    settings = get_settings()
    
    webhook_url = f"{settings.backend_url}/api/v1/webhooks/vapi"
    
    try:
        # Update assistant with webhook URL
        update_data = {"serverUrl": webhook_url}
        assistant = await client.update_assistant(assistant_id, update_data)
        
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"✅ Webhook configured on assistant {assistant_id}: {webhook_url}")
        
        return {
            "success": True,
            "assistant_id": assistant_id,
            "webhook_url": webhook_url,
            "message": "✅ Webhook configuré avec succès! Les appels vont maintenant apparaître dans l'app.",
        }
    except VapiApiError as exc:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to configure webhook on assistant {assistant_id}: {exc}")
        
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to configure webhook: {str(exc)}"
        ) from exc


__all__ = ["router"]
