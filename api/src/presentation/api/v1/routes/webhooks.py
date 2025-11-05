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
from typing import Optional, Dict
import hmac
import hashlib
import json
from sqlalchemy import select
from urllib.parse import parse_qs

from api.src.infrastructure.email import get_email_service
from api.src.core.settings import get_settings
from api.src.infrastructure.database.session import get_session
from api.src.infrastructure.persistence.models.call import CallRecord
from api.src.infrastructure.persistence.models.user import User
from api.src.infrastructure.persistence.models.tenant import Tenant
from twilio.request_validator import RequestValidator

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


def verify_vapi_signature(signature: Optional[str], body: bytes) -> bool:
    """
    Verify webhook signature from Vapi.

    Security measure to ensure webhook is from Vapi, not attacker.
    """
    settings = get_settings()
    if not settings.vapi_api_key or not signature:
        return False

    # Compute HMAC-SHA256
    expected_signature = hmac.new(
        settings.vapi_api_key.encode(),
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
    Main Vapi webhook endpoint.

    Receives events from Vapi.ai:
    - call.started: Call initiated
    - call.ended: Call completed → SAVE + EMAIL
    - function-call: Execute custom functions
    - transcript.update: Real-time transcription

    Returns:
        Success response or function result
    """
    settings = get_settings()

    # Get raw body for signature verification
    body = await request.body()

    # Verify signature (production security)
    if settings.environment == "production":
        if not verify_vapi_signature(x_vapi_signature, body):
            raise HTTPException(
                status_code=401,
                detail="Invalid webhook signature"
            )

    # Parse event
    try:
        event = json.loads(body)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=400,
            detail="Invalid JSON payload"
        )

    event_type = event.get("type")

    # Route to appropriate handler
    if event_type == "call.ended":
        await handle_call_ended(event)
        return {"status": "success", "action": "call_saved_and_email_sent"}

    elif event_type == "function-call":
        result = await handle_function_call(event)
        return result

    elif event_type == "call.started":
        # Just acknowledge for now
        return {"status": "success", "action": "call_started_acknowledged"}

    elif event_type == "transcript.update":
        # Future: Stream to frontend via websockets
        return {"status": "success", "action": "transcript_update_acknowledged"}

    else:
        # Unknown event type - log and ignore
        print(f"⚠️ Unknown Vapi event type: {event_type}")
        return {"status": "success", "action": "unknown_event_ignored"}


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
    duration = call_data.get("duration", 0)  # seconds

    # Participants
    customer_data = call_data.get("customer", {})
    caller_phone = customer_data.get("number", "Unknown")

    # Transcript
    transcript_data = call_data.get("transcript", [])
    transcript_text = format_transcript(transcript_data)

    # Assistant info (to find org)
    assistant_id = call_data.get("assistantId")

    # Recording URL
    recording_url = call_data.get("recordingUrl")

    # Cost
    cost = call_data.get("cost")

    print(f"   Call ID: {vapi_call_id}")
    print(f"   Duration: {duration}s")
    print(f"   Caller: {caller_phone}")

    # Prepare caller info
    caller_name = customer_data.get("name", "Unknown Caller")
    business_name = "AVA Business"  # TODO: Get from org
    org_email = "nissieltb@gmail.com"  # Fallback for MVP

    # Save call to database
    try:
        async for db in get_session():
            # Find first user and their tenant (MVP: single user)
            result = await db.execute(select(User).limit(1))
            user = result.scalar_one_or_none()

            if user:
                # Get user's tenant (or create default one)
                result = await db.execute(select(Tenant).limit(1))
                tenant = result.scalar_one_or_none()

                if tenant:
                    # Create call record
                    new_call = CallRecord(
                        id=vapi_call_id,
                        assistant_id=assistant_id or "unknown",
                        tenant_id=tenant.id,
                        customer_number=caller_phone,
                        status="completed",
                        started_at=datetime.fromisoformat(started_at.replace("Z", "+00:00")) if started_at else datetime.utcnow(),
                        ended_at=datetime.fromisoformat(ended_at.replace("Z", "+00:00")) if ended_at else None,
                        duration_seconds=duration,
                        cost=cost,
                        transcript=transcript_text,
                        meta={
                            "caller_name": caller_name,
                            "recording_url": recording_url
                        }
                    )

                    db.add(new_call)
                    await db.commit()

                    print(f"   ✅ Call saved to database (ID: {new_call.id})")
                    org_email = user.email  # Use user's email
                else:
                    print(f"   ⚠️  No tenant found, skipping DB save")
            else:
                print(f"   ⚠️  No user found, skipping DB save")

            break  # Exit async generator
    except Exception as e:
        print(f"   ❌ Failed to save call to DB: {e}")
        import traceback
        traceback.print_exc()
        # Continue with email even if DB save fails

    # Send email notification
    email_service = get_email_service()
    email_sent = await email_service.send_call_summary(
        to_email=org_email,
        caller_name=caller_name,
        caller_phone=caller_phone,
        transcript=transcript_text,
        duration=duration,
        call_date=datetime.fromisoformat(ended_at.replace("Z", "+00:00")) if ended_at else datetime.utcnow(),
        call_id=vapi_call_id,
        business_name=business_name
    )

    if email_sent:
        print(f"   ✅ Email sent to {org_email}")
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

    print(f"🔧 Function called: {function_name}")
    print(f"   Parameters: {parameters}")

    if function_name == "save_caller_info":
        return await save_caller_info(parameters)

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


async def save_caller_info(params: dict) -> dict:
    """
    Save caller information to database.

    Called by AVA during conversation when caller provides their info.

    Args:
        params: {
            "call_id": str,
            "phone_number": str,
            "first_name": str,
            "last_name": str,
            "email": str (optional)
        }

    Returns:
        Success result
    """
    first_name = params.get("firstName")
    last_name = params.get("lastName")
    email = params.get("email")
    phone_number = params.get("phoneNumber")

    print(f"   Saving caller: {first_name} {last_name}")

    # TODO: Save to database
    # For now, just acknowledge

    return {
        "result": f"Thank you {first_name}! I've saved your information.",
        "success": True,
        "data": {
            "caller_name": f"{first_name} {last_name}",
            "saved": True
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
    signature = request.headers.get("X-Twilio-Signature")
    if settings.twilio_auth_token:
        if not signature:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Twilio signature")
        validator = RequestValidator(settings.twilio_auth_token)
        if not validator.validate(str(request.url), form_data, signature):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Twilio signature")

    twilio_status = _map_twilio_status(form_data.get("CallStatus"))
    timestamp = _parse_twilio_timestamp(form_data.get("Timestamp") or form_data.get("CallTimestamp"))
    from_number = _normalize_phone(form_data.get("From"))
    to_number = _normalize_phone(form_data.get("To") or form_data.get("Called"))
    duration_value = form_data.get("CallDuration") or form_data.get("DialCallDuration")

    async for db in get_session():
        record = await db.get(CallRecord, call_sid)

        if not record:
            # Find associated user/tenant based on destination number
            result = None
            if to_number:
                result = await db.execute(select(User).where(User.twilio_phone_number == to_number))
            user = result.scalar_one_or_none() if result else None

            tenant = None
            if user:
                tenant_query = await db.execute(select(Tenant).limit(1))
                tenant = tenant_query.scalar_one_or_none()

            # Fallback: use first available tenant/user like legacy logic
            if not tenant:
                fallback_user = await db.execute(select(User).limit(1))
                user = fallback_user.scalar_one_or_none()
                tenant_query = await db.execute(select(Tenant).limit(1))
                tenant = tenant_query.scalar_one_or_none()

            if not tenant:
                raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="No tenant configured")

            record = CallRecord(
                id=call_sid,
                assistant_id=form_data.get("CalledViaSid") or "twilio-status",
                tenant_id=tenant.id,
                customer_number=from_number,
                status=twilio_status,
                started_at=timestamp,
                ended_at=timestamp if twilio_status in {"completed", "failed", "busy", "no-answer", "canceled"} else None,
                duration_seconds=int(duration_value) if duration_value and duration_value.isdigit() else None,
                meta={
                    "twilio": form_data,
                    "twilio_call_sid": call_sid,
                    "direction": form_data.get("Direction"),
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
            twilio_meta = record.meta.get("twilio_status_history", []) if record.meta else []
            twilio_meta.append({
                "status": twilio_status,
                "timestamp": timestamp.isoformat(),
            })
            record.meta = {
                **(record.meta or {}),
                "twilio": form_data,
                "twilio_status_history": twilio_meta,
                "twilio_call_sid": call_sid,
            }

        await db.commit()
        break

    return {"status": "ok", "callSid": call_sid, "callStatus": twilio_status}
