"""Phone numbers API routes for Vapi and Twilio integration."""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel, Field, field_validator
from typing import Optional
import logging
from sqlalchemy.ext.asyncio import AsyncSession

from api.src.application.services.vapi import get_vapi_client
from api.src.infrastructure.external.vapi_client import VapiClient
from api.src.infrastructure.database.session import get_session
from api.src.infrastructure.persistence.models.user import User
from api.src.infrastructure.persistence.models.phone_number import PhoneProvider
from api.src.infrastructure.persistence.repositories.phone_number_repository import PhoneNumberRepository
from api.src.presentation.dependencies.auth import get_current_user
from api.src.core.settings import get_settings
from api.src.core.rate_limiting import limiter
from twilio.rest import Client as TwilioClient

router = APIRouter(prefix="/phone-numbers", tags=["phone"])
logger = logging.getLogger(__name__)
settings = get_settings()


# ==================== DTOs ====================


class CreateUSNumberRequest(BaseModel):
    """Request to create a free US number via Vapi."""

    assistant_id: str = Field(..., description="AVA assistant ID to link")
    user_id: str = Field(..., description="User ID")
    area_code: Optional[str] = Field(
        None, description="Optional US area code (e.g., '415')"
    )


class ImportTwilioRequest(BaseModel):
    """Request to import a Twilio number into Vapi."""

    twilio_account_sid: str = Field(..., description="Twilio Account SID")
    twilio_auth_token: str = Field(..., description="Twilio Auth Token")
    phone_number: str = Field(
        ..., description="E.164 format (+33612345678 or +972501234567)"
    )
    assistant_id: Optional[str] = Field(
        default=None,
        description="AVA assistant UUID. Leave empty to auto-link to the first assistant.",
    )
    user_id: str = Field(..., description="User ID")

    @field_validator("assistant_id", mode="before")
    @classmethod
    def normalize_assistant_id(cls, value: Optional[str]) -> Optional[str]:
        if isinstance(value, str):
            stripped = value.strip()
            return stripped or None
        return value


class VerifyTwilioRequest(BaseModel):
    """Request to verify Twilio credentials."""

    account_sid: str = Field(..., description="Twilio Account SID")
    auth_token: str = Field(..., description="Twilio Auth Token")
    phone_number: str = Field(..., description="Phone number to verify exists")


# ==================== Helper ====================


def _get_vapi_client() -> VapiClient:
    """Create VapiClient with platform credentials."""
    return get_vapi_client()


# ==================== Routes ====================


@router.post("/create-us", status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")  # Rate limit: max 5 phone creations per minute
async def create_us_number(
    request_obj: Request,  # Required for rate limiter
    request: CreateUSNumberRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a free US phone number via Vapi.

    ⚠️ LIMITATION: Only US numbers, max 10 free per account.

    Returns:
        {
            "success": True,
            "phone": {
                "id": "vapi_phone_id",
                "number": "+1234567890",
                "provider": "VAPI",
                "assistantId": "..."
            }
        }
    """
    # 🔥 DIVINE FIX: Refresh user from DB to get latest vapi_api_key
    await db.refresh(user)
    
    try:
        vapi = _get_vapi_client()

        # Create via Vapi (US only, free, max 10)
        created = await vapi.create_phone_number(
            assistant_id=request.assistant_id, area_code=request.area_code
        )

        # Save to database
        phone_number = created.get("number")
        if phone_number:  # Only save if we have the number
            repo = PhoneNumberRepository(db)
            try:
                await repo.create(
                    user_id=request.user_id,
                    provider=PhoneProvider.VAPI,
                    e164=phone_number,
                    vapi_phone_number_id=created["id"],
                    routing={"assistant_id": request.assistant_id}
                )
                logger.info(f"✅ Saved phone number {phone_number} to database")
            except ValueError as ve:
                # Number already exists, just log and continue
                logger.warning(f"Phone number already exists: {ve}")
            except Exception as save_error:
                # Don't fail the whole request if DB save fails
                logger.error(f"Failed to save phone number to DB: {save_error}")
        else:
            logger.warning("Phone number not yet provisioned, skipping DB save")
        message = (
            f"Numéro US créé: {phone_number}"
            if phone_number
            else "Numéro en cours de provisionnement (disponible dans 1-2 min)"
        )

        return {
            "success": True,
            "phone": {
                "id": created.get("id"),
                "number": phone_number,  # May be None initially
                "provider": "VAPI",
                "assistantId": created.get("assistantId"),
                "status": created.get("status"),
            },
            "message": message,
        }

    except Exception as e:
        if "limit" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Limite de 10 numéros gratuits atteinte. Utilisez l'import Twilio.",
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la création du numéro: {str(e)}",
        )


@router.post("/import-twilio", status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")  # Rate limit: max 5 phone imports per minute
async def import_twilio_number(
    request_obj: Request,  # Required for rate limiter
    request: ImportTwilioRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Import an existing Twilio number into Vapi.

    ✅ SOLUTION pour France, Israël, et tous pays hors US.

    🔥 DIVINE CODEX: Configuration COMPLÈTE et AUTOMATIQUE!

    Workflow:
    1. Vérifie que le numéro existe dans Twilio
    2. 🔥 DIVINE: Auto-liaison intelligente à l'assistant si pas fourni
    3. Appelle Vapi /phone-numbers/import avec assistant_id
    4. Vapi configure automatiquement le webhook Twilio → Vapi
    5. 🆕 Configure automatiquement le webhook Vapi → Backend
    6. Sauvegarde dans notre DB

    Returns:
        {
            "success": True,
            "phone": {...},
            "auto_linked": bool,
            "assistant_id": str,
            "webhook_configured": True,
            "message": "Numéro importé avec succès"
        }
    """
    # 🔥 DIVINE FIX: Refresh user from DB to get latest vapi_api_key + twilio credentials
    await db.refresh(user)
    
    try:
        # 🔥 DIVINE: Auto-liaison intelligente si pas d'assistant_id fourni
        assistant_id = request.assistant_id
        auto_linked = False

        if not assistant_id:
            logger.info("⚠️ Pas d'assistant_id fourni, recherche du premier assistant...")
            vapi = _get_vapi_client()

            try:
                assistants = await vapi.list_assistants()

                if not assistants or len(assistants) == 0:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=(
                            "Vous devez créer un assistant avant d'importer un numéro. "
                            "Créez votre assistant depuis Settings → AVA Profile."
                        )
                    )

                assistant_id = assistants[0]["id"]
                auto_linked = True
                logger.info(f"✅ Lié automatiquement à l'assistant: {assistant_id}")
            except Exception as e:
                logger.error(f"❌ Erreur lors de la récupération des assistants: {e}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Impossible de récupérer vos assistants. Vérifiez votre clé API Vapi."
                )

        # 1. Verify Twilio number exists
        twilio = TwilioClient(request.twilio_account_sid, request.twilio_auth_token)

        try:
            numbers = twilio.incoming_phone_numbers.list(
                phone_number=request.phone_number, limit=1
            )

            if not numbers:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Numéro {request.phone_number} non trouvé dans votre compte Twilio",
                )
        except Exception as e:
            if "authenticate" in str(e).lower() or "credentials" in str(e).lower():
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Credentials Twilio invalides",
                )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Erreur Twilio: {str(e)}",
            )

        # 2. Import to Vapi
        vapi = _get_vapi_client()

        imported = await vapi.import_phone_number(
            twilio_account_sid=request.twilio_account_sid,
            twilio_auth_token=request.twilio_auth_token,
            phone_number=request.phone_number,
            assistant_id=assistant_id,  # 🔥 DIVINE: Toujours défini maintenant!
        )

        logger.info(f"✅ Numéro {request.phone_number} importé dans Vapi: {imported.get('id')}")
        if auto_linked:
            logger.info(f"🔗 Lié automatiquement à l'assistant: {assistant_id}")

        # 3. 🔥 DIVINE: Configure Vapi webhook → Backend AUTOMATIQUEMENT
        # Vapi webhooks are configured per-assistant, not globally
        webhook_configured = False
        webhook_url = f"{settings.backend_url}/api/v1/webhooks/vapi"

        try:
            # Update the assistant to send webhooks to our backend
            await vapi.update_assistant_webhook(
                assistant_id=assistant_id,  # 🔥 DIVINE: Use the (maybe auto-linked) assistant_id
                server_url=webhook_url
            )
            webhook_configured = True
            logger.info(f"✅ Webhook Vapi → Backend configuré sur assistant: {webhook_url}")
        except Exception as webhook_error:
            # Don't fail the whole import if webhook config fails
            # User can configure it manually later
            logger.warning(f"⚠️ Webhook config failed (non-fatal): {webhook_error}")
            webhook_configured = False

        # 4. Save to our DB
        repo = PhoneNumberRepository(db)
        try:
            await repo.create(
                user_id=request.user_id,
                provider=PhoneProvider.VAPI_TWILIO,
                e164=request.phone_number,
                vapi_phone_number_id=imported["id"],
                twilio_account_sid=request.twilio_account_sid,
                routing={"assistant_id": assistant_id}
            )
            logger.info(f"✅ Saved phone number {request.phone_number} to database")
        except ValueError as ve:
            # Number already exists, just log and continue
            logger.warning(f"Phone number already exists: {ve}")
        except Exception as save_error:
            # Don't fail the whole request if DB save fails
            logger.error(f"Failed to save phone number to DB: {save_error}")

        return {
            "success": True,
            "phone": {
                "id": imported.get("id"),
                "number": imported.get("number"),
                "provider": "VAPI_TWILIO",
                "assistantId": imported.get("assistantId"),
            },
            "auto_linked": auto_linked,  # 🔥 DIVINE: Indicate if auto-linked
            "assistant_id": assistant_id,  # 🔥 DIVINE: Return the assistant_id used
            "webhook_configured": webhook_configured,
            "webhook_url": webhook_url if webhook_configured else None,
            "message": (
                f"✅ Numéro importé et {'automatiquement lié' if auto_linked else 'lié'} à l'assistant! "
                f"{'Webhook configuré automatiquement.' if webhook_configured else 'Webhook à configurer manuellement.'}"
            ),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de l'import Vapi: {str(e)}",
        )


@router.post("/twilio/verify")
async def verify_twilio_credentials(
    request: VerifyTwilioRequest,
    user: User = Depends(get_current_user),  # SECURITY: Require authentication
):
    """
    Verify Twilio credentials and check if phone number exists.

    Returns:
        {
            "valid": True,
            "number": "+33612345678",
            "country": "FR"
        }
    """
    try:
        client = TwilioClient(request.account_sid, request.auth_token)

        # Test: verify number exists in this account
        numbers = client.incoming_phone_numbers.list(
            phone_number=request.phone_number, limit=1
        )

        if not numbers:
            return {
                "valid": False,
                "error": "Numéro non trouvé dans votre compte Twilio",
            }

        phone_obj = numbers[0]

        # Extract country code from E.164 number (e.g., +33 → FR, +972 → IL, +1 → US)
        country_code = getattr(phone_obj, 'iso_country', None)
        if not country_code:
            # Fallback: extract from phone number
            phone_str = phone_obj.phone_number
            if phone_str.startswith('+33'):
                country_code = 'FR'
            elif phone_str.startswith('+972'):
                country_code = 'IL'
            elif phone_str.startswith('+1'):
                country_code = 'US'
            else:
                country_code = 'UNKNOWN'

        return {
            "valid": True,
            "number": phone_obj.phone_number,
            "country": country_code,
        }

    except Exception as e:
        return {"valid": False, "error": str(e)}


@router.get("/my-numbers")
async def get_my_numbers(
    db: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    """
    Get all phone numbers for the authenticated user.

    Returns:
        [
            {
                "id": "...",
                "number": "+33612345678",
                "provider": "VAPI",
                "country": "FR"
            }
        ]
    """
    # SECURITY: Always use authenticated user's ID, not a query parameter
    repo = PhoneNumberRepository(db)
    phones = await repo.list_by_user(user.id)

    # Extract country code from E.164 format
    def get_country_code(e164: str) -> str:
        if e164.startswith('+33'):
            return 'FR'
        elif e164.startswith('+972'):
            return 'IL'
        elif e164.startswith('+1'):
            return 'US'
        elif e164.startswith('+44'):
            return 'UK'
        elif e164.startswith('+49'):
            return 'DE'
        else:
            return 'OTHER'

    return {
        "success": True,
        "numbers": [
            {
                "id": phone.id,
                "number": phone.e164,
                "provider": phone.provider.value,
                "country": get_country_code(phone.e164),
                "vapi_id": phone.vapi_phone_number_id,
                "routing": phone.routing,
                "created_at": phone.created_at.isoformat(),
            }
            for phone in phones
        ],
        "count": len(phones),
    }
