"""Phone numbers API routes for Vapi and Twilio integration."""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional

from api.src.infrastructure.vapi.client import VapiClient
from api.src.infrastructure.persistence.models.user import User
from api.src.presentation.api.v1.routes.auth import get_current_user
from twilio.rest import Client as TwilioClient

router = APIRouter(prefix="/phone-numbers", tags=["phone"])


# ==================== DTOs ====================


class CreateUSNumberRequest(BaseModel):
    """Request to create a free US number via Vapi."""

    assistant_id: str = Field(..., description="AVA assistant ID to link")
    org_id: str = Field(..., description="Organization ID")
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
    assistant_id: str = Field(..., description="AVA assistant UUID (REQUIRED)")
    org_id: str = Field(..., description="Organization ID")


class VerifyTwilioRequest(BaseModel):
    """Request to verify Twilio credentials."""

    account_sid: str = Field(..., description="Twilio Account SID")
    auth_token: str = Field(..., description="Twilio Auth Token")
    phone_number: str = Field(..., description="Phone number to verify exists")


# ==================== Helper ====================


def _get_vapi_client(user: User) -> VapiClient:
    """Create VapiClient with user's personal API key (multi-tenant)."""
    try:
        return VapiClient(token=user.vapi_api_key)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc)
        ) from exc


# ==================== Routes ====================


@router.post("/create-us", status_code=status.HTTP_201_CREATED)
async def create_us_number(
    request: CreateUSNumberRequest,
    user: User = Depends(get_current_user),
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
    try:
        vapi = _get_vapi_client(user)

        # Create via Vapi (US only, free, max 10)
        created = await vapi.create_phone_number(
            assistant_id=request.assistant_id, area_code=request.area_code
        )

        # TODO: Save to database
        # phone = PhoneNumber(
        #     org_id=request.org_id,
        #     provider="VAPI",
        #     e164=created["number"],
        #     vapi_phone_number_id=created["id"],
        #     routing={"assistant_id": request.assistant_id}
        # )
        # await db.add(phone)
        # await db.commit()

        # Vapi may not return 'number' immediately (provisioning takes time)
        phone_number = created.get("number")
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
async def import_twilio_number(
    request: ImportTwilioRequest,
    user: User = Depends(get_current_user),
):
    """
    Import an existing Twilio number into Vapi.
    
    ✅ SOLUTION pour France, Israël, et tous pays hors US.
    
    Workflow:
    1. Vérifie que le numéro existe dans Twilio
    2. Appelle Vapi /phone-numbers/import
    3. Vapi configure automatiquement le webhook Twilio → Vapi
    4. Sauvegarde dans notre DB
    
    Returns:
        {
            "success": True,
            "phone": {...},
            "message": "Numéro importé avec succès"
        }
    """
    try:
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
        vapi = _get_vapi_client(user)

        imported = await vapi.import_phone_number(
            twilio_account_sid=request.twilio_account_sid,
            twilio_auth_token=request.twilio_auth_token,
            phone_number=request.phone_number,
            assistant_id=request.assistant_id,
        )

        # 3. Save to our DB
        # TODO: Implement database save
        # phone = PhoneNumber(
        #     org_id=request.org_id,
        #     provider="VAPI",  # Managed by Vapi but uses Twilio under the hood
        #     e164=request.phone_number,
        #     vapi_phone_number_id=imported["id"],
        #     twilio_account_sid=request.twilio_account_sid,
        #     routing={"assistant_id": request.assistant_id}
        # )
        # await db.add(phone)
        # await db.commit()

        return {
            "success": True,
            "phone": {
                "id": imported.get("id"),
                "number": imported.get("number"),
                "provider": "VAPI_TWILIO",
                "assistantId": imported.get("assistantId"),
            },
            "message": "Numéro importé avec succès dans Vapi",
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de l'import Vapi: {str(e)}",
        )


@router.post("/twilio/verify")
async def verify_twilio_credentials(request: VerifyTwilioRequest):
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
async def get_my_numbers(org_id: str):
    """
    Get all phone numbers for an organization.
    
    TODO: Implement database query
    
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
    # TODO: Query from database
    # phones = await db.query(PhoneNumber).filter(PhoneNumber.org_id == org_id).all()

    return {
        "success": True,
        "numbers": [],  # TODO: Return from DB
        "message": "TODO: Implement database query",
    }
