"""Studio configuration endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from api.src.application.services.vapi import get_vapi_client
from api.src.infrastructure.database.session import get_session
from api.src.infrastructure.persistence.models.user import User
from api.src.infrastructure.persistence.models.studio_config import StudioConfig as StudioConfigModel
from api.src.infrastructure.persistence.models.email_config import EmailConfig
from api.src.infrastructure.persistence.models.voice_config import VoiceConfig
from api.src.infrastructure.persistence.models.ai_config import AIConfig
from api.src.infrastructure.persistence.models.transcriber_config import TranscriberConfig
from api.src.presentation.dependencies.auth import get_current_user
from api.src.presentation.schemas.studio_config import (
    DEFAULT_STUDIO_CONFIG,
    StudioConfig,
    StudioConfigUpdate,
)
from api.src.infrastructure.external.vapi_client import VapiApiError, VapiClient
from api.src.core.settings import get_settings
from api.src.core.crypto import get_smtp_encryptor, EncryptionError
from api.src.core.rate_limiting import limiter

router = APIRouter(prefix="/studio", tags=["Studio"])


async def get_or_create_user_config(
    db: AsyncSession,
    user: User,
) -> StudioConfigModel:
    """
    Get user's studio config from database, or create default if doesn't exist.

    This replaces the old in-memory _config_state with proper database persistence.
    Uses normalized schema with related configs for email, voice, AI, and transcriber.
    """
    # Try to find existing config for this user (eagerly load related configs)
    result = await db.execute(
        select(StudioConfigModel)
        .where(StudioConfigModel.user_id == user.id)
        .options(
            selectinload(StudioConfigModel.email_config),
            selectinload(StudioConfigModel.voice_config),
            selectinload(StudioConfigModel.ai_config),
            selectinload(StudioConfigModel.transcriber_config),
        )
    )
    config = result.scalar_one_or_none()

    if config is None:
        # Create default config for new user (normalized structure)
        config = StudioConfigModel(
            user_id=user.id,
            organization_name=DEFAULT_STUDIO_CONFIG.organizationName,
            timezone=DEFAULT_STUDIO_CONFIG.timezone,
            phone_number=DEFAULT_STUDIO_CONFIG.phoneNumber,
            business_hours=DEFAULT_STUDIO_CONFIG.businessHours,
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
        await db.flush()  # Get the config ID for related configs

        # Create related configs
        email_config = EmailConfig(
            studio_config_id=config.id,
            admin_email=DEFAULT_STUDIO_CONFIG.adminEmail,
            fallback_email=DEFAULT_STUDIO_CONFIG.fallbackEmail,
            summary_email=DEFAULT_STUDIO_CONFIG.summaryEmail,
            smtp_server=DEFAULT_STUDIO_CONFIG.smtpServer,
            smtp_port=str(DEFAULT_STUDIO_CONFIG.smtpPort),
            smtp_username=DEFAULT_STUDIO_CONFIG.smtpUsername,
            smtp_password_encrypted="",
        )
        db.add(email_config)

        voice_config = VoiceConfig(
            studio_config_id=config.id,
            voice_provider=DEFAULT_STUDIO_CONFIG.voiceProvider,
            voice_id=DEFAULT_STUDIO_CONFIG.voiceId,
            voice_speed=DEFAULT_STUDIO_CONFIG.voiceSpeed,
        )
        db.add(voice_config)

        ai_config = AIConfig(
            studio_config_id=config.id,
            ai_model=DEFAULT_STUDIO_CONFIG.aiModel,
            ai_temperature=DEFAULT_STUDIO_CONFIG.aiTemperature,
            ai_max_tokens=DEFAULT_STUDIO_CONFIG.aiMaxTokens,
        )
        db.add(ai_config)

        transcriber_config = TranscriberConfig(
            studio_config_id=config.id,
            transcriber_provider=DEFAULT_STUDIO_CONFIG.transcriberProvider,
            transcriber_model=DEFAULT_STUDIO_CONFIG.transcriberModel,
            transcriber_language=DEFAULT_STUDIO_CONFIG.transcriberLanguage,
        )
        db.add(transcriber_config)

        await db.commit()
        await db.refresh(config)

    return config


def db_to_schema(db_config: StudioConfigModel) -> StudioConfig:
    """Convert database model to Pydantic schema (reading from normalized related configs)."""
    # Get related configs (may be None if not yet created)
    email = db_config.email_config
    voice = db_config.voice_config
    ai = db_config.ai_config
    transcriber = db_config.transcriber_config

    return StudioConfig(
        # Core config fields
        organizationName=db_config.organization_name,
        timezone=db_config.timezone,
        phoneNumber=db_config.phone_number,
        businessHours=db_config.business_hours,
        vapiAssistantId=db_config.vapi_assistant_id,
        firstMessage=db_config.first_message,
        systemPrompt=db_config.system_prompt,
        guidelines=db_config.guidelines,
        persona=db_config.persona,
        tone=db_config.tone,
        language=db_config.language,
        askForName=db_config.ask_for_name,
        askForEmail=db_config.ask_for_email,
        askForPhone=db_config.ask_for_phone,
        # Email config fields
        adminEmail=email.admin_email if email else "",
        fallbackEmail=email.fallback_email if email else "",
        summaryEmail=email.summary_email if email else "",
        smtpServer=email.smtp_server if email else "",
        smtpPort=email.smtp_port if email else "587",
        smtpUsername=email.smtp_username if email else "",
        smtpPassword="",  # Never return encrypted password
        # Voice config fields
        voiceProvider=voice.voice_provider if voice else "11labs",
        voiceId=voice.voice_id if voice else "sarah",
        voiceSpeed=voice.voice_speed if voice else 1.0,
        # AI config fields
        aiModel=ai.ai_model if ai else "gpt-4o-mini",
        aiTemperature=ai.ai_temperature if ai else 0.7,
        aiMaxTokens=ai.ai_max_tokens if ai else 500,
        # Transcriber config fields
        transcriberProvider=transcriber.transcriber_provider if transcriber else "deepgram",
        transcriberModel=transcriber.transcriber_model if transcriber else "nova-2",
        transcriberLanguage=transcriber.transcriber_language if transcriber else "en",
    )


def _client() -> VapiClient:
    """Get Vapi client using platform credentials."""
    return get_vapi_client()


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

    # Field mappings for normalized schema
    core_fields = {
        "organizationName": "organization_name",
        "timezone": "timezone",
        "phoneNumber": "phone_number",
        "businessHours": "business_hours",
        "vapiAssistantId": "vapi_assistant_id",
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

    email_fields = {
        "adminEmail": "admin_email",
        "fallbackEmail": "fallback_email",
        "summaryEmail": "summary_email",
        "smtpServer": "smtp_server",
        "smtpPort": "smtp_port",
        "smtpUsername": "smtp_username",
    }

    voice_fields = {
        "voiceProvider": "voice_provider",
        "voiceId": "voice_id",
        "voiceSpeed": "voice_speed",
    }

    ai_fields = {
        "aiModel": "ai_model",
        "aiTemperature": "ai_temperature",
        "aiMaxTokens": "ai_max_tokens",
    }

    transcriber_fields = {
        "transcriberProvider": "transcriber_provider",
        "transcriberModel": "transcriber_model",
        "transcriberLanguage": "transcriber_language",
    }

    # Handle SMTP password encryption
    if "smtpPassword" in data:
        password_value = data.pop("smtpPassword") or ""
        if db_config.email_config:
            encryptor = get_smtp_encryptor()
            try:
                db_config.email_config.smtp_password_encrypted = encryptor.encrypt(password_value) if password_value else ""
            except EncryptionError as exc:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=str(exc),
                ) from exc

    # Update core config fields
    for camel_key, value in data.items():
        if camel_key in core_fields:
            snake_key = core_fields[camel_key]
            setattr(db_config, snake_key, value)
        elif camel_key in email_fields and db_config.email_config:
            snake_key = email_fields[camel_key]
            setattr(db_config.email_config, snake_key, value)
        elif camel_key in voice_fields and db_config.voice_config:
            snake_key = voice_fields[camel_key]
            setattr(db_config.voice_config, snake_key, value)
        elif camel_key in ai_fields and db_config.ai_config:
            snake_key = ai_fields[camel_key]
            setattr(db_config.ai_config, snake_key, value)
        elif camel_key in transcriber_fields and db_config.transcriber_config:
            snake_key = transcriber_fields[camel_key]
            setattr(db_config.transcriber_config, snake_key, value)

    await db.commit()
    await db.refresh(db_config)

    return db_to_schema(db_config)


@router.post("/sync-vapi")
@limiter.limit("10/minute")  # Rate limit: max 10 syncs per minute
async def sync_config_to_vapi(
    request: Request,  # Required for rate limiter
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
    # 🔥 DIVINE FIX: Refresh user from DB to get latest vapi_api_key
    # Without this, user object has stale data from JWT token
    await db.refresh(current_user)
    
    client = _client(current_user)
    db_config = await get_or_create_user_config(db, current_user)
    config = db_to_schema(db_config)
    settings = get_settings()
    webhook_url = f"{settings.backend_url.rstrip('/')}{settings.api_prefix}/webhooks/vapi"

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
        safe_speed = min(max(config.voiceSpeed or 1.0, 0.5), 1.2)

        assistant = await client.get_or_create_assistant(
            assistant_id=config.vapiAssistantId,  # Will update this if exists
            name=f"{config.organizationName} Assistant",
            voice_provider=config.voiceProvider,
            voice_id=config.voiceId,
            voice_speed=safe_speed,  # ✨ NEW: Voice speed control (Vapi max 1.2)
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
            server_url=webhook_url,
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
