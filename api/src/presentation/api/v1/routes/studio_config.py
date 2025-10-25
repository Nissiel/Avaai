"""Studio configuration endpoints."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from api.src.presentation.schemas.studio_config import (
    DEFAULT_STUDIO_CONFIG,
    StudioConfig,
    StudioConfigUpdate,
)
from api.src.infrastructure.external.vapi_client import VapiApiError, VapiClient

router = APIRouter(prefix="/studio", tags=["Studio"])

_config_state: StudioConfig = DEFAULT_STUDIO_CONFIG.model_copy()


def get_current_config() -> StudioConfig:
    """Get the current config state - use this instead of importing _config_state directly."""
    return _config_state


def _client() -> VapiClient:
    """Get Vapi client instance."""
    try:
        return VapiClient()
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Vapi not configured: {str(exc)}"
        ) from exc


@router.get("/config", response_model=StudioConfig)
async def get_studio_config() -> StudioConfig:
    """Get current studio configuration."""
    return _config_state


@router.patch("/config", response_model=StudioConfig)
async def update_studio_config(payload: StudioConfigUpdate) -> StudioConfig:
    """
    Update studio configuration.
    
    This updates the in-memory config but does NOT sync to Vapi automatically.
    Use POST /studio/sync-vapi to apply changes to the Vapi assistant.
    """
    global _config_state
    data = payload.model_dump(exclude_none=True)
    if not data:
        return _config_state

    _config_state = _config_state.model_copy(update=data)
    return _config_state


@router.post("/sync-vapi")
async def sync_config_to_vapi() -> dict:
    """
    🎯 DIVINE SYNC ENDPOINT
    
    Synchronize current studio config to Vapi assistant INTELLIGENTLY:
    - If assistant exists (vapiAssistantId set): UPDATE it
    - If no assistant exists: CREATE new one
    - Save assistant ID for future updates
    
    This is THE MAGIC that makes your settings actually work!
    """
    global _config_state  # Declare global FIRST
    
    client = _client()
    config = _config_state
    
    # Build enhanced system prompt with caller info collection
    enhanced_prompt = config.systemPrompt
    
    if config.askForName:
        enhanced_prompt += "\n\nCRITICAL INSTRUCTION: You MUST ask for the caller's name within the first 2 exchanges. This is mandatory."
    
    if config.askForEmail:
        enhanced_prompt += "\nIf appropriate for the conversation, politely ask for their email address."
    
    if config.askForPhone:
        enhanced_prompt += "\nIf appropriate, ask for their phone number for follow-up."
    
    if config.guidelines:
        enhanced_prompt += f"\n\nAdditional guidelines: {config.guidelines}"
    
    try:
        # 🎯 DIVINE: Use get_or_create_assistant (updates if exists, creates if not)
        assistant = await client.get_or_create_assistant(
            assistant_id=config.vapiAssistantId,  # Will update this if exists
            name=f"{config.organizationName} Assistant",
            voice_provider=config.voiceProvider,
            voice_id=config.voiceId,
            voice_speed=config.voiceSpeed,  # ✨ NEW: Voice speed control
            first_message=config.firstMessage,
            model_provider="openai",
            model=config.aiModel,
            temperature=config.aiTemperature,
            max_tokens=config.aiMaxTokens,
            system_prompt=enhanced_prompt,  # ✨ NEW: System prompt with instructions
            metadata={
                "organization": config.organizationName,
                "persona": config.persona,
                "tone": config.tone,
                "language": config.language,
                "voice_speed": config.voiceSpeed,
                "ask_for_name": config.askForName,
                "ask_for_email": config.askForEmail,
                "ask_for_phone": config.askForPhone,
            },
            functions=None,  # Disabled for now - Vapi format investigation needed
        )
        
        # Save the assistant ID in config for future updates
        assistant_id = assistant["id"]
        was_update = config.vapiAssistantId == assistant_id
        _config_state = _config_state.model_copy(update={"vapiAssistantId": assistant_id})

        reassigned_numbers: list[str] = []
        try:
            phone_numbers = await client.get_phone_numbers()
            for phone in phone_numbers:
                phone_id = phone.get("id")
                if not phone_id:
                    continue
                current_assistant = phone.get("assistantId")
                if current_assistant == assistant_id:
                    continue
                updated_phone = await client.assign_phone_number(phone_id, assistant_id)
                reassigned_numbers.append(
                    updated_phone.get("number") or phone.get("number") or phone_id
                )
        except Exception as sync_error:  # noqa: BLE001 - want to log but not fail
            # Log but do not block the sync result; numbers may still route to old assistant
            print(f"⚠️ Failed to align phone numbers with assistant {assistant_id}: {sync_error}")
        
        return {
            "success": True,
            "message": f"✅ Configuration {'updated' if was_update else 'created'} in Vapi successfully!",
            "action": "updated" if was_update else "created",
            "assistantId": assistant_id,
            "assistantName": assistant.get("name"),
            "settings": {
                "model": config.aiModel,
                "temperature": config.aiTemperature,
                "maxTokens": config.aiMaxTokens,
                "voiceProvider": config.voiceProvider,
                "voiceSpeed": config.voiceSpeed,
                "askForName": config.askForName,
                "systemPromptLength": len(enhanced_prompt),
            },
            "reassignedNumbers": reassigned_numbers,
        }
        
    except VapiApiError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to sync to Vapi: {str(exc)}"
        ) from exc
