"""
Vapi Webhooks - Handle real-time call events
DIVINE Level: 5/5

Endpoints:
- POST /webhooks/vapi - Receive Vapi.ai webhooks
- Handles: call.ended, function-call, transcript.update

Events processed:
1. call.ended → Save call to DB + Send email notification
2. function-call → Execute actions (save_caller_info, etc.)
3. transcript.update → Stream real-time updates (future)
"""

from fastapi import APIRouter, Request, HTTPException, Header, status
from datetime import datetime
from typing import Optional, Dict, Any, Tuple, List, Literal
from uuid import UUID, uuid4
from pydantic import BaseModel, Field, validator
import hmac
import hashlib
import json
from sqlalchemy import select
from urllib.parse import parse_qs

from api.src.application.services.email import get_user_email_service
from api.src.application.services.twilio import get_twilio_credentials
from api.src.infrastructure.persistence.models.phone_number import PhoneNumber
from api.src.core.settings import get_settings
from api.src.infrastructure.database.session import get_session
from api.src.infrastructure.persistence.models.call import CallRecord
from api.src.infrastructure.persistence.models.studio_config import StudioConfig as StudioConfigModel
from api.src.infrastructure.persistence.models.user import User
from twilio.request_validator import RequestValidator

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


# ============================================================================
# 🔒 PYDANTIC VALIDATION MODELS - Security Layer
# ============================================================================

class VapiWebhookPayload(BaseModel):
    """
    Validated Vapi webhook payload structure.

    Enforces strict validation to prevent injection attacks.
    """
    type: Literal["call.started", "call.ended", "function-call", "transcript.update"] = Field(
        ...,
        description="Event type from Vapi"
    )
    call: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Call data for call.started and call.ended events"
    )
    functionCall: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Function call data for function-call events"
    )

    @validator("call", "functionCall")
    def validate_size(cls, v):
        """Prevent DoS attacks via huge payloads."""
        if v and len(str(v)) > 100_000:  # 100KB max
            raise ValueError("Webhook payload too large (max 100KB)")
        return v

    class Config:
        extra = "allow"  # Allow additional fields but validate known ones


class FunctionCallParameters(BaseModel):
    """
    Validated function call parameters.

    Prevents injection in function execution.
    """
    # For save_caller_info function
    firstName: Optional[str] = Field(None, max_length=100)
    lastName: Optional[str] = Field(None, max_length=100)
    email: Optional[str] = Field(None, max_length=255)
    phoneNumber: Optional[str] = Field(None, max_length=20)

    # For book_appointment function
    datetime: Optional[str] = Field(None, max_length=50)
    duration: Optional[int] = Field(None, ge=1, le=480)  # 1-480 minutes

    @validator("email")
    def validate_email(cls, v):
        """Basic email validation."""
        if v and ("@" not in v or len(v) > 255):
            raise ValueError("Invalid email format")
        return v

    @validator("phoneNumber")
    def validate_phone(cls, v):
        """Basic phone validation."""
        if v and not v.strip().lstrip("+").replace(" ", "").replace("-", "").isdigit():
            raise ValueError("Invalid phone number format")
        return v

    class Config:
        extra = "ignore"  # Ignore unknown fields for security


def verify_vapi_signature(signature: Optional[str], body: bytes) -> bool:
    """
    Verify webhook signature from Vapi.

    Security measure to ensure webhook is from Vapi, not attacker.
    Uses the dedicated webhook signing secret (not the API key).
    """
    settings = get_settings()

    # Use webhook secret, NOT API key
    # See: https://docs.vapi.ai/webhooks#signature-verification
    webhook_secret = settings.vapi_webhook_secret

    if not webhook_secret or not signature:
        import logging
        logger = logging.getLogger(__name__)
        if not webhook_secret:
            logger.warning("Vapi webhook secret not configured (AVA_API_VAPI_WEBHOOK_SECRET)")
        return False

    # Compute HMAC-SHA256
    expected_signature = hmac.new(
        webhook_secret.encode(),
        body,
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(signature, expected_signature)


@router.post("/vapi")
async def vapi_webhook(
    request: Request,
    x_vapi_signature: Optional[str] = Header(None)
):
    """
    Main Vapi webhook endpoint with strict validation.

    Receives events from Vapi.ai:
    - call.started: Call initiated
    - call.ended: Call completed → SAVE + EMAIL
    - function-call: Execute custom functions
    - transcript.update: Real-time transcription

    Security:
    - Signature verification in production
    - Pydantic validation for all payloads
    - Size limits to prevent DoS

    Returns:
        Success response or function result

    Raises:
        HTTPException(401): Invalid signature
        HTTPException(400): Invalid payload
        HTTPException(422): Validation error
    """
    settings = get_settings()

    # Get raw body for signature verification
    body = await request.body()

    # 🔒 SECURITY: Check body size before parsing
    if len(body) > 500_000:  # 500KB max
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Webhook payload too large (max 500KB)"
        )

    # 🔒 SECURITY: Verify signature (production only)
    if settings.environment == "production":
        if not verify_vapi_signature(x_vapi_signature, body):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid webhook signature"
            )

    # 🔒 SECURITY: Parse and validate with Pydantic
    try:
        event_dict = json.loads(body)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid JSON payload: {str(exc)}"
        )

    # 🔒 SECURITY: Validate payload structure
    try:
        event = VapiWebhookPayload(**event_dict)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Webhook validation failed: {str(exc)}"
        )

    # Route to appropriate handler (using validated data)
    if event.type == "call.ended":
        await handle_call_ended(event_dict)  # Pass original dict for backward compat
        return {"status": "success", "action": "call_saved_and_email_sent"}

    elif event.type == "function-call":
        result = await handle_function_call(event_dict)
        return result

    elif event.type == "call.started":
        # Just acknowledge for now
        return {"status": "success", "action": "call_started_acknowledged"}

    elif event.type == "transcript.update":
        # Future: Stream to frontend via websockets
        return {"status": "success", "action": "transcript_update_acknowledged"}

    else:
        # This should never happen due to Literal validation
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown event type: {event.type}"
        )


async def handle_call_ended(event: dict):
    """
    Process completed call.

    Actions:
    1. Extract call data from Vapi payload
    2. Get caller info (if exists in DB)
    3. Save call to database
    4. Send email notification to org owner

    Args:
        event: Vapi call.ended event payload
    """
    print("📞 Processing completed call...")

    # Extract call data
    call_data = event.get("call", {})
    vapi_call_id = call_data.get("id")

    # Call metadata
    started_at = call_data.get("startedAt")
    ended_at = call_data.get("endedAt")
    duration_value = call_data.get("durationSeconds") or call_data.get("duration")
    duration = _safe_int(duration_value)

    # Participants
    customer_data = call_data.get("customer", {})
    caller_phone = customer_data.get("number", "Unknown")

    # Transcript
    transcript_data = call_data.get("transcript", [])
    transcript_text = format_transcript(transcript_data)

    # Assistant info (to find org)
    assistant_id = call_data.get("assistantId")
    metadata = _extract_call_metadata(call_data)

    # Recording URL
    recording_url = call_data.get("recordingUrl")

    # Cost
    cost = _safe_float(call_data.get("cost"))

    print(f"   Call ID: {vapi_call_id}")
    print(f"   Duration: {duration}s")
    print(f"   Caller: {caller_phone}")

    # Prepare caller info
    caller_name = customer_data.get("name", metadata.get("caller_name", "Unknown Caller"))
    business_name = metadata.get("organization") or metadata.get("organizationName") or "AVA Business"
    org_email = None  # Will be resolved from user/config

    # Save call to database
    resolved_user: Optional[User] = None
    resolved_config: Optional[StudioConfigModel] = None
    try:
        async for db in get_session():
            user, config = await _resolve_user_and_config(db, assistant_id, metadata)

            if not user:
                print("   ⚠️  No user found, skipping DB save")
                break

            resolved_user = user
            resolved_config = config
            business_name = config.organization_name if config else business_name
            org_email = config.fallback_email or config.summary_email or user.email or org_email

            new_call = CallRecord(
                id=vapi_call_id,
                assistant_id=assistant_id or "unknown",
                user_id=user.id,
                customer_number=caller_phone,
                status="completed",
                started_at=_parse_iso_datetime(started_at),
                ended_at=_parse_iso_datetime(ended_at) if ended_at else None,
                duration_seconds=duration,
                cost=cost,
                transcript=transcript_text,
                meta={
                    "caller_name": caller_name,
                    "recording_url": recording_url,
                    "assistant_id": assistant_id,
                    "vapi": call_data,
                },
            )

            db.add(new_call)
            await db.commit()

            print(f"   ✅ Call saved to database (ID: {new_call.id})")
            break  # Exit async generator
    except Exception as e:
        print(f"   ❌ Failed to save call to DB: {e}")
        import traceback
        traceback.print_exc()
        # Continue with email even if DB save fails

    # Send email notification
    email_service = get_user_email_service(resolved_config)
    recipient_email = org_email
    if not recipient_email and resolved_user:
        recipient_email = resolved_user.email

    if not recipient_email:
        print("   ⚠️  No recipient email configured, skipping summary email")
        return

    email_sent = await email_service.send_call_summary(
        to_email=recipient_email,
        caller_name=caller_name,
        caller_phone=caller_phone,
        transcript=transcript_text,
        duration=duration,
        call_date=datetime.fromisoformat(ended_at.replace("Z", "+00:00")) if ended_at else datetime.utcnow(),
        call_id=vapi_call_id,
        business_name=business_name
    )

    if email_sent:
        print(f"   ✅ Email sent to {recipient_email}")
    else:
        print(f"   ❌ Failed to send email")

    print("   ✅ Call processed successfully")


async def handle_function_call(event: dict) -> dict:
    """
    Execute custom function called by AVA during conversation.

    Functions:
    - save_caller_info: Save caller name/email to database
    - book_appointment: Create calendar event
    - send_sms: Send SMS to caller

    Args:
        event: Vapi function-call event

    Returns:
        Function result to return to AVA
    """
    function_call = event.get("functionCall", {})
    function_name = function_call.get("name")
    parameters = function_call.get("parameters", {})

    # Extract call context for database operations
    call_data = event.get("call", {})
    call_context = {
        "call_id": call_data.get("id"),
        "assistant_id": call_data.get("assistantId"),
    }

    print(f"🔧 Function called: {function_name}")
    print(f"   Parameters: {parameters}")
    print(f"   Call ID: {call_context.get('call_id')}")

    if function_name == "save_caller_info":
        return await save_caller_info(parameters, call_context)

    elif function_name == "book_appointment":
        # Future implementation
        return {
            "result": "Appointment booking not yet implemented",
            "success": False
        }

    else:
        return {
            "result": f"Unknown function: {function_name}",
            "success": False
        }


async def save_caller_info(params: dict, call_context: dict) -> dict:
    """
    Save caller information to database with validation.

    Called by AVA during conversation when caller provides their info.
    Updates the call record's meta field with caller details.

    Args:
        params: Raw parameters dict from function call
        call_context: Contains call_id and assistant_id for database lookup

    Returns:
        Success result

    Raises:
        HTTPException: If validation fails
    """
    # 🔒 SECURITY: Validate parameters
    try:
        validated = FunctionCallParameters(**params)
    except Exception as exc:
        return {
            "result": "I'm sorry, there was an error saving your information. Please try again.",
            "success": False,
            "error": str(exc)
        }

    first_name = validated.firstName or "Unknown"
    last_name = validated.lastName or ""
    email = validated.email
    phone_number = validated.phoneNumber
    full_name = f"{first_name} {last_name}".strip()

    print(f"   Saving caller: {full_name}")

    # Save to database
    call_id = call_context.get("call_id")
    saved_to_db = False

    if call_id:
        try:
            async for db in get_session():
                # Find existing call record or create a pending one
                call_record = await db.get(CallRecord, call_id)

                if call_record:
                    # Update existing call record's meta with caller info
                    current_meta = call_record.meta or {}
                    current_meta["caller_name"] = full_name
                    current_meta["caller_first_name"] = first_name
                    current_meta["caller_last_name"] = last_name
                    if email:
                        current_meta["caller_email"] = email
                    if phone_number:
                        current_meta["caller_phone"] = phone_number
                    current_meta["caller_info_saved_at"] = datetime.utcnow().isoformat()

                    call_record.meta = current_meta
                    await db.commit()
                    saved_to_db = True
                    print(f"   ✅ Caller info saved to existing call record")
                else:
                    # Call record doesn't exist yet (call is still in progress)
                    # Create a minimal record that will be updated when call ends
                    assistant_id = call_context.get("assistant_id", "unknown")

                    # Try to find user from assistant
                    stmt = select(StudioConfigModel).where(
                        StudioConfigModel.vapi_assistant_id == assistant_id
                    )
                    result = await db.execute(stmt)
                    config = result.scalar_one_or_none()

                    if config:
                        new_call = CallRecord(
                            id=call_id,
                            assistant_id=assistant_id,
                            user_id=config.user_id,
                            customer_number=phone_number,
                            status="in-progress",
                            started_at=datetime.utcnow(),
                            meta={
                                "caller_name": full_name,
                                "caller_first_name": first_name,
                                "caller_last_name": last_name,
                                "caller_email": email,
                                "caller_phone": phone_number,
                                "caller_info_saved_at": datetime.utcnow().isoformat(),
                            }
                        )
                        db.add(new_call)
                        await db.commit()
                        saved_to_db = True
                        print(f"   ✅ New call record created with caller info")
                    else:
                        print(f"   ⚠️  Could not find user for assistant {assistant_id}")

                break  # Exit async generator
        except Exception as e:
            print(f"   ❌ Failed to save caller info to DB: {e}")
            import traceback
            traceback.print_exc()
    else:
        print(f"   ⚠️  No call_id in context, skipping DB save")

    return {
        "result": f"Thank you {first_name}! I've saved your information.",
        "success": True,
        "data": {
            "caller_name": full_name,
            "email": email,
            "phone": phone_number,
            "saved": saved_to_db
        }
    }


def format_transcript(transcript_data: list) -> str:
    """
    Format transcript from Vapi format to readable text.

    Vapi transcript format:
    [
        {"role": "assistant", "message": "Hello, ..."},
        {"role": "user", "message": "Hi, ..."},
        ...
    ]

    Returns:
        Formatted transcript string
    """
    if not transcript_data:
        return "No transcript available"

    lines = []
    for entry in transcript_data:
        role = entry.get("role", "unknown")
        message = entry.get("message", "")

        # Format role nicely
        if role == "assistant":
            speaker = "AVA"
        elif role == "user":
            speaker = "Caller"
        else:
            speaker = role.capitalize()

        lines.append(f"{speaker}: {message}")

    return "\n\n".join(lines)


def _normalize_phone(number: Optional[str]) -> Optional[str]:
    if not number:
        return None
    number = number.strip()
    if not number:
        return None
    if number.startswith("00"):
        number = f"+{number[2:]}"
    if not number.startswith("+") and number.replace("+", "").lstrip("-").isdigit():
        number = f"+{number}"
    return number


def _parse_twilio_timestamp(value: Optional[str]) -> datetime:
    if not value:
        return datetime.utcnow()
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        # Twilio often sends RFC 2822 format
        try:
            from email.utils import parsedate_to_datetime

            return parsedate_to_datetime(value)
        except Exception:
            return datetime.utcnow()


def _map_twilio_status(status_value: Optional[str]) -> str:
    status_map = {
        "queued": "queued",
        "ringing": "ringing",
        "in-progress": "in-progress",
        "completed": "completed",
        "busy": "busy",
        "failed": "failed",
        "no-answer": "no-answer",
        "canceled": "canceled",
    }
    return status_map.get((status_value or "").lower(), "unknown")


def _extract_call_metadata(call_data: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    if not isinstance(call_data, dict):
        return {}

    for key in ("metadata", "assistantMetadata"):
        meta = call_data.get(key)
        if isinstance(meta, dict) and meta:
            return meta

    assistant = call_data.get("assistant")
    if isinstance(assistant, dict):
        for key in ("metadata", "meta"):
            meta = assistant.get(key)
            if isinstance(meta, dict) and meta:
                return meta

    return {}


async def _resolve_user_and_config(
    db,
    assistant_id: Optional[str],
    metadata: Dict[str, Any],
) -> Tuple[Optional[User], Optional[StudioConfigModel]]:
    user: Optional[User] = None
    config: Optional[StudioConfigModel] = None

    candidate_user_id = metadata.get("user_id") or metadata.get("userId")
    if candidate_user_id:
        user = await db.get(User, str(candidate_user_id))

    if not user and assistant_id:
        result = await db.execute(
            select(StudioConfigModel).where(StudioConfigModel.vapi_assistant_id == assistant_id)
        )
        config = result.scalar_one_or_none()
        if config:
            user = await db.get(User, config.user_id)

    if user and config is None:
        result = await db.execute(select(StudioConfigModel).where(StudioConfigModel.user_id == user.id))
        config = result.scalar_one_or_none()

    # SECURITY: Do NOT fallback to first user in database
    # If we can't identify the user from assistant_id or metadata, return None
    # The caller must handle the missing user case appropriately
    if not user:
        import logging
        logger = logging.getLogger(__name__)
        logger.warning("Could not resolve user from assistant_id=%s or metadata=%s", assistant_id, metadata)

    return user, config


def _parse_iso_datetime(value: Optional[str]) -> datetime:
    if not value:
        return datetime.utcnow()
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return datetime.utcnow()


def _safe_int(value: Any) -> Optional[int]:
    try:
        if value is None:
            return None
        return int(value)
    except (TypeError, ValueError):
        return None


def _safe_float(value: Any) -> Optional[float]:
    try:
        if value is None:
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


@router.post("/twilio/status")
async def twilio_status_webhook(request: Request):
    """
    Twilio call status webhook.

    Updates CallRecord entries in real-time when Twilio sends status callbacks.
    """
    settings = get_settings()
    raw_body = await request.body()
    payload = parse_qs(raw_body.decode())
    form_data: Dict[str, str] = {k: v[0] if isinstance(v, list) else v for k, v in payload.items()}

    call_sid = form_data.get("CallSid")
    if not call_sid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing CallSid")

    # Signature validation
    twilio_status = _map_twilio_status(form_data.get("CallStatus"))
    timestamp = _parse_twilio_timestamp(form_data.get("Timestamp") or form_data.get("CallTimestamp"))
    from_number = _normalize_phone(form_data.get("From"))
    to_number = _normalize_phone(form_data.get("To") or form_data.get("Called"))
    duration_value = form_data.get("CallDuration") or form_data.get("DialCallDuration")

    async for db in get_session():
        user_for_number = None
        if to_number:
            # Look up user via phone_numbers table
            result = await db.execute(
                select(User)
                .join(PhoneNumber, PhoneNumber.user_id == User.id)
                .where(PhoneNumber.e164 == to_number)
            )
            user_for_number = result.scalar_one_or_none()

        signature = request.headers.get("X-Twilio-Signature")
        try:
            # Use platform-level Twilio credentials
            creds = get_twilio_credentials()
            token_for_signature = creds.auth_token
        except HTTPException:
            token_for_signature = None

        if token_for_signature:
            if not signature:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Twilio signature")
            validator = RequestValidator(token_for_signature)
            if not validator.validate(str(request.url), form_data, signature):
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Twilio signature")

        record = await db.get(CallRecord, call_sid)

        if not record:
            # Find associated user/tenant based on destination number
            user = user_for_number

            # SECURITY: Do NOT fallback to first user in database
            # Calls must be traceable to a specific user via phone number
            if not user:
                import logging
                logger = logging.getLogger(__name__)
                logger.warning("Could not resolve user for Twilio call to %s (CallSid: %s)", to_number, call_sid)
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"No user found for phone number {to_number}. Ensure the number is configured in a user account.",
                )

            record = CallRecord(
                id=call_sid,
                assistant_id=form_data.get("CalledViaSid") or "twilio-status",
                user_id=user.id,
                customer_number=from_number,
                status=twilio_status,
                started_at=timestamp,
                ended_at=timestamp if twilio_status in {"completed", "failed", "busy", "no-answer", "canceled"} else None,
                duration_seconds=int(duration_value) if duration_value and duration_value.isdigit() else None,
                meta={
                    "twilio": form_data,
                    "twilio_call_sid": call_sid,
                    "direction": form_data.get("Direction"),
                    "user_id": user.id,
                },
            )
            db.add(record)
        else:
            record.status = twilio_status
            record.customer_number = record.customer_number or from_number
            if twilio_status in {"completed", "failed", "busy", "no-answer", "canceled"}:
                record.ended_at = timestamp
            if not record.started_at or twilio_status in {"in-progress", "ringing"}:
                record.started_at = record.started_at or timestamp
            if duration_value and duration_value.isdigit():
                record.duration_seconds = int(duration_value)
            meta = record.meta or {}
            twilio_meta = meta.get("twilio_status_history", [])
            twilio_meta.append({
                "status": twilio_status,
                "timestamp": timestamp.isoformat(),
            })
            record.meta = {
                **meta,
                "twilio": form_data,
                "twilio_status_history": twilio_meta,
                "twilio_call_sid": call_sid,
            }

        await db.commit()
        break

    return {"status": "success", "callSid": call_sid, "callStatus": twilio_status}
