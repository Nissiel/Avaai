"""Analytics endpoints returning dashboard metrics."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from api.src.application.services.analytics import (
    compute_activity_heatmap,
    compute_overview_metrics,
    compute_time_series,
    compute_trending_topics,
    detect_anomalies,
    recent_calls_with_transcripts,
    synchronise_calls_from_vapi,
)
from api.src.infrastructure.external.vapi_client import VapiApiError, VapiClient
from api.src.infrastructure.database.session import get_session
from api.src.infrastructure.email import get_email_service
from api.src.infrastructure.persistence.models.call import CallRecord
from api.src.infrastructure.persistence.models.user import User
from api.src.presentation.api.v1.routes.auth import get_current_user
from sqlalchemy import select

router = APIRouter(prefix="/analytics", tags=["Analytics"])


def _client(user: User) -> VapiClient:
    """Create VapiClient with user's personal API key (multi-tenant)."""
    try:
        return VapiClient(token=user.vapi_api_key)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc


async def _sync_calls(session: AsyncSession, tenant_id, client: VapiClient) -> None:
    try:
        await synchronise_calls_from_vapi(session, tenant_id=tenant_id, vapi_client=client)
    except VapiApiError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc


@router.get("/overview")
async def analytics_overview(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> dict[str, object]:
    client = _client(user)
    await _sync_calls(session, user.id, client)

    overview = await compute_overview_metrics(session, tenant_id=user.id)
    calls = await recent_calls_with_transcripts(session, tenant_id=user.id)
    topics = await compute_trending_topics(session, tenant_id=user.id, limit=6)

    return {
        "overview": overview,
        "calls": calls,
        "topics": topics,
    }


@router.get("/timeseries")
async def analytics_timeseries(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> dict[str, object]:
    client = _client(user)
    await _sync_calls(session, user.id, client)
    series = await compute_time_series(session, tenant_id=user.id)
    return {"series": series}


@router.get("/topics")
async def analytics_topics(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> dict[str, object]:
    client = _client(user)
    await _sync_calls(session, user.id, client)
    topics = await compute_trending_topics(session, tenant_id=user.id)
    return {"topics": topics}


@router.get("/anomalies")
async def analytics_anomalies(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> dict[str, object]:
    client = _client(user)
    await _sync_calls(session, user.id, client)
    anomalies = await detect_anomalies(session, tenant_id=user.id)
    return {"anomalies": anomalies}


@router.get("/heatmap")
async def analytics_heatmap(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> dict[str, object]:
    client = _client(user)
    await _sync_calls(session, user.id, client)
    heatmap = await compute_activity_heatmap(session, tenant_id=user.id)
    return {"heatmap": heatmap}


@router.post("/calls/{call_id}/email")
async def send_call_transcript_email(
    call_id: str,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> dict[str, str]:
    """
    Send call transcript via email to the user.
    
    Args:
        call_id: The ID of the call to send
        user: Current authenticated user
        session: Database session
        
    Returns:
        Success message with email ID
        
    Raises:
        HTTPException: If call not found or email fails
    """
    # Fetch call record
    result = await session.execute(
        select(CallRecord)
        .where(CallRecord.id == call_id)
        .where(CallRecord.tenant_id == user.id)
    )
    call = result.scalar_one_or_none()
    
    if not call:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Call {call_id} not found"
        )
    
    # Parse transcript into lines
    transcript_lines = []
    if call.transcript:
        for line in call.transcript.split('\n'):
            line = line.strip()
            if line.startswith('AI:'):
                transcript_lines.append({
                    'speaker': 'AI',
                    'text': line[3:].strip()
                })
            elif line.startswith('User:'):
                transcript_lines.append({
                    'speaker': 'User',
                    'text': line[5:].strip()
                })
    
    # Build HTML email
    html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Call Transcript - AVA</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">
    <div style="max-width: 800px; margin: 0 auto; padding: 40px 20px;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: white; font-size: 48px; font-weight: 800; margin: 0 0 16px 0; text-shadow: 0 2px 10px rgba(0,0,0,0.2);">
                ✨ AVA
            </h1>
            <p style="color: rgba(255,255,255,0.9); font-size: 18px; margin: 0;">
                Call Transcript
            </p>
        </div>

        <!-- Card -->
        <div style="background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border-radius: 24px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); padding: 40px; margin-bottom: 24px;">
            <!-- Call Info -->
            <div style="border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 24px; margin-bottom: 32px;">
                <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #1a202c;">
                    📞 Call Details
                </h2>
                <div style="display: grid; gap: 12px; font-size: 14px; color: #4a5568;">
                    <div><strong>Phone Number:</strong> {call.customer_number or 'N/A'}</div>
                    <div><strong>Status:</strong> <span style="display: inline-block; padding: 4px 12px; background: #48bb78; color: white; border-radius: 12px; font-size: 12px; font-weight: 600;">{call.status}</span></div>
                    <div><strong>Duration:</strong> {call.duration_seconds or 0}s</div>
                    <div><strong>Cost:</strong> ${(call.cost if call.cost else 0):.4f}</div>
                    <div><strong>Date:</strong> {call.started_at.strftime('%Y-%m-%d %H:%M:%S UTC') if call.started_at else 'N/A'}</div>
                </div>
            </div>

            <!-- Transcript -->
            <div>
                <h2 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 700; color: #1a202c;">
                    💬 Conversation
                </h2>
                <div style="display: flex; flex-direction: column; gap: 20px;">
"""
    
    # Add transcript messages
    for msg in transcript_lines:
        if msg['speaker'] == 'AI':
            html_content += f"""
                    <div style="display: flex; align-items: start; gap: 12px;">
                        <div style="flex-shrink: 0; width: 40px; height: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">
                            AI
                        </div>
                        <div style="flex: 1; background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px; max-width: 70%;">
                            <div style="font-size: 12px; font-weight: 600; color: #667eea; margin-bottom: 8px;">AVA Assistant</div>
                            <div style="font-size: 14px; color: #2d3748; line-height: 1.6;">{msg['text']}</div>
                        </div>
                    </div>
"""
        else:
            html_content += f"""
                    <div style="display: flex; align-items: start; gap: 12px; flex-direction: row-reverse;">
                        <div style="flex-shrink: 0; width: 40px; height: 40px; background: linear-gradient(135deg, #4299e1 0%, #38b2ac 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">
                            U
                        </div>
                        <div style="flex: 1; background: #ebf8ff; border: 1px solid #bee3f8; border-radius: 16px; padding: 16px; max-width: 70%;">
                            <div style="font-size: 12px; font-weight: 600; color: #4299e1; margin-bottom: 8px;">Customer</div>
                            <div style="font-size: 14px; color: #2d3748; line-height: 1.6;">{msg['text']}</div>
                        </div>
                    </div>
"""
    
    html_content += """
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; color: rgba(255,255,255,0.8); font-size: 12px;">
            <p style="margin: 0 0 8px 0;">Powered by AVA - AI Voice Assistant Platform</p>
            <p style="margin: 0; opacity: 0.7;">This is an automated email. Please do not reply.</p>
        </div>
    </div>
</body>
</html>
"""
    
    # Send email
    try:
        email_service = get_email_service()
        
        # Use verified email for testing (Resend sandbox restriction)
        recipient_email = "nissieltb@gmail.com"  # TODO: Get from current.user when auth is wired
        
        result = await email_service.send_email(
            to=recipient_email,
            subject=f"📞 Call Transcript - {call.customer_number or call_id[:8]}",
            html=html_content
        )
        
        return {
            "status": "success",
            "message": f"Transcript sent to {recipient_email}",
            "email_id": result.get('id', 'unknown')
        }
        
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send email: {str(exc)}"
        ) from exc

