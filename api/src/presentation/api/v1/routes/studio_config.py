"""Studio configuration endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.src.infrastructure.database.session import get_session
from api.src.infrastructure.persistence.models.user import User
from api.src.infrastructure.persistence.models.studio_config import StudioConfig as StudioConfigModel
from api.src.presentation.dependencies.auth import get_current_user
from api.src.presentation.schemas.studio_config import (
    DEFAULT_STUDIO_CONFIG,
    StudioConfig,
    StudioConfigUpdate,
)
from api.src.infrastructure.external.vapi_client import VapiApiError, VapiClient

router = APIRouter(prefix="/studio", tags=["Studio"])


async def get_or_create_user_config(
    db: AsyncSession,
    user: User,
) -> StudioConfigModel:
    """
    Get user's studio config from database, or create default if doesn't exist.

    This replaces the old in-memory _config_state with proper database persistence.
    """
    # Try to find existing config for this user
    result = await db.execute(
        select(StudioConfigModel).where(StudioConfigModel.user_id == user.id)
    )
    config = result.scalar_one_or_none()

    if config is None:
        # Create default config for new user
        config = StudioConfigModel(
            user_id=user.id,
            organization_name=DEFAULT_STUDIO_CONFIG.organizationName,
            voice_provider=DEFAULT_STUDIO_CONFIG.voiceProvider,
            voice_id=DEFAULT_STUDIO_CONFIG.voiceId,
            voice_speed=DEFAULT_STUDIO_CONFIG.voiceSpeed,
            ai_model=DEFAULT_STUDIO_CONFIG.aiModel,
            ai_temperature=DEFAULT_STUDIO_CONFIG.aiTemperature,
            ai_max_tokens=DEFAULT_STUDIO_CONFIG.aiMaxTokens,
            transcriber_provider=DEFAULT_STUDIO_CONFIG.transcriberProvider,
            transcriber_model=DEFAULT_STUDIO_CONFIG.transcriberModel,
            transcriber_language=DEFAULT_STUDIO_CONFIG.transcriberLanguage,
            first_message=DEFAULT_STUDIO_CONFIG.firstMessage,
            system_prompt=DEFAULT_STUDIO_CONFIG.systemPrompt,
            persona=DEFAULT_STUDIO_CONFIG.persona,
            tone=DEFAULT_STUDIO_CONFIG.tone,
            language=DEFAULT_STUDIO_CONFIG.language,
            ask_for_name=DEFAULT_STUDIO_CONFIG.askForName,
            ask_for_email=DEFAULT_STUDIO_CONFIG.askForEmail,
            ask_for_phone=DEFAULT_STUDIO_CONFIG.askForPhone,
        )
        db.add(config)
        await db.commit()
        await db.refresh(config)

    return config


def db_to_schema(db_config: StudioConfigModel) -> StudioConfig:
    """Convert database model to Pydantic schema."""
    return StudioConfig(
        organizationName=db_config.organization_name,
        vapiAssistantId=db_config.vapi_assistant_id,
        voiceProvider=db_config.voice_provider,
        voiceId=db_config.voice_id,
        voiceSpeed=db_config.voice_speed,
        aiModel=db_config.ai_model,
        aiTemperature=db_config.ai_temperature,
        aiMaxTokens=db_config.ai_max_tokens,
        transcriberProvider=db_config.transcriber_provider,
        transcriberModel=db_config.transcriber_model,
        transcriberLanguage=db_config.transcriber_language,
        firstMessage=db_config.first_message,
        systemPrompt=db_config.system_prompt,
        guidelines=db_config.guidelines,
        persona=db_config.persona,
        tone=db_config.tone,
        language=db_config.language,
        askForName=db_config.ask_for_name,
        askForEmail=db_config.ask_for_email,
        askForPhone=db_config.ask_for_phone,
    )


def _client(user: User) -> VapiClient:
    """🎯 DIVINE: Get Vapi client with user's personal API key (multi-tenant)."""
    try:
        # 🔥 DIVINE FIX: Correct parameter is user_api_key, not token
        return VapiClient(user_api_key=user.vapi_api_key)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Vapi API key not configured. Please add your Vapi key in Settings."
        ) from exc


@router.get("/config", response_model=StudioConfig)
async def get_studio_config(
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> StudioConfig:
    """Get current studio configuration from database."""
    db_config = await get_or_create_user_config(db, current_user)
    return db_to_schema(db_config)


@router.patch("/config", response_model=StudioConfig)
async def update_studio_config(
    payload: StudioConfigUpdate,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> StudioConfig:
    """
    Update studio configuration in database.

    This persists the config but does NOT sync to Vapi automatically.
    Use POST /studio/sync-vapi to apply changes to the Vapi assistant.
    """
    db_config = await get_or_create_user_config(db, current_user)

    # Update only provided fields
    data = payload.model_dump(exclude_none=True)
    if not data:
        return db_to_schema(db_config)

    # Map Pydantic fields to database columns (camelCase → snake_case)
    field_mapping = {
        "organizationName": "organization_name",
        "vapiAssistantId": "vapi_assistant_id",
        "voiceProvider": "voice_provider",
        "voiceId": "voice_id",
        "voiceSpeed": "voice_speed",
        "aiModel": "ai_model",
        "aiTemperature": "ai_temperature",
        "aiMaxTokens": "ai_max_tokens",
        "transcriberProvider": "transcriber_provider",
        "transcriberModel": "transcriber_model",
        "transcriberLanguage": "transcriber_language",
        "firstMessage": "first_message",
        "systemPrompt": "system_prompt",
        "guidelines": "guidelines",
        "persona": "persona",
        "tone": "tone",
        "language": "language",
        "askForName": "ask_for_name",
        "askForEmail": "ask_for_email",
        "askForPhone": "ask_for_phone",
    }

    for camel_key, value in data.items():
        snake_key = field_mapping.get(camel_key, camel_key)
        if hasattr(db_config, snake_key):
            setattr(db_config, snake_key, value)

    await db.commit()
    await db.refresh(db_config)

    return db_to_schema(db_config)


@router.post("/sync-vapi")
async def sync_config_to_vapi(
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> dict:
    """
    🎯 DIVINE SYNC ENDPOINT

    Synchronize current studio config to Vapi assistant INTELLIGENTLY:
    - If assistant exists (vapiAssistantId set): UPDATE it
    - If no assistant exists: CREATE new one
    - Save assistant ID for future updates in DATABASE

    This is THE MAGIC that makes your settings actually work!
    """
    client = _client(current_user)
    db_config = await get_or_create_user_config(db, current_user)
    config = db_to_schema(db_config)

    # Build enhanced system prompt with caller info collection
    enhanced_prompt = config.systemPrompt

    # 🔥 DIVINE: Anti-repetition instruction
    enhanced_prompt += "\n\n⚠️ CRITICAL: NEVER repeat yourself. If you already said something, move on to the next topic. Be concise and efficient."

    if config.askForName:
        enhanced_prompt += "\n\nCRITICAL INSTRUCTION: You MUST ask for the caller's name within the first 2 exchanges. This is mandatory."

    if config.askForEmail:
        enhanced_prompt += "\nIf appropriate for the conversation, politely ask for their email address."

    if config.askForPhone:
        enhanced_prompt += "\nIf appropriate, ask for their phone number for follow-up."

    if config.guidelines:
        enhanced_prompt += f"\n\nAdditional guidelines: {config.guidelines}"

    print("🔥 DIVINE SYNC STARTING:")
    print(f"   👤 User: {current_user.email} (ID: {current_user.id})")
    print(f"   📋 Organization: {config.organizationName}")
    print(f"   🆔 Current Assistant ID: {config.vapiAssistantId or 'None (will create new)'}")
    print(f"   🎙️ Voice: {config.voiceProvider}/{config.voiceId} @ {config.voiceSpeed}x")
    print(f"   🤖 Model: {config.aiModel} (temp={config.aiTemperature}, max={config.aiMaxTokens})")
    print(f"   💬 First Message: {config.firstMessage[:50]}...")
    print(f"   📝 System Prompt Length: {len(enhanced_prompt)} chars")

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
            transcriber_provider=config.transcriberProvider,  # 🎧 NEW: Speech-to-Text
            transcriber_model=config.transcriberModel,
            transcriber_language=config.transcriberLanguage,
            metadata={
                "user_id": current_user.id,
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

        # Save the assistant ID in DATABASE for future updates
        assistant_id = assistant["id"]
        was_update = config.vapiAssistantId == assistant_id

        db_config.vapi_assistant_id = assistant_id
        await db.commit()
        await db.refresh(db_config)

        print(f"✅ DIVINE SYNC {'UPDATE' if was_update else 'CREATE'} SUCCESS!")
        print(f"   🆔 Assistant ID: {assistant_id}")
        print(f"   📛 Assistant Name: {assistant.get('name')}")
        print(f"   💾 Saved to database for user: {current_user.email}")

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
