"""Phase 4 stubs for Email + Calendar integrations."""

from __future__ import annotations

import logging
from datetime import datetime, timedelta
from enum import Enum

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field

from api.src.core.settings import get_settings
from api.src.infrastructure.persistence.models.user import User
from api.src.presentation.dependencies.auth import get_current_user

router = APIRouter(prefix="/integrations", tags=["Integrations"])
logger = logging.getLogger("ava.integrations")


class TestEmailRequest(BaseModel):
    to: EmailStr
    subject: str = Field(..., min_length=1, max_length=120)
    text: str = Field(..., min_length=1, max_length=2000)


class TestEmailResponse(BaseModel):
    backend: str
    delivered: bool
    message: str


@router.post("/email/test", response_model=TestEmailResponse)
async def send_test_email_stub(
    payload: TestEmailRequest,
    user: User = Depends(get_current_user),
):
    """Stub endpoint (DEV/STAGING ONLY) - validates payload and reports available transporter."""
    settings = get_settings()
    
    # Feature flag check - block in production
    if not settings.integrations_stub_mode:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Stub integrations are disabled in production. Please configure real email provider in Settings.",
        )
    
    backend = "resend" if settings.resend_api_key else "smtp" if getattr(user, "smtp_username", None) else "unconfigured"

    logger.info(
        "Email test stub invoked",
        extra={
            "to": payload.to,
            "subject": payload.subject,
            "user": user.id,
            "backend": backend,
        },
    )

    return TestEmailResponse(
        backend=backend,
        delivered=False,
        message=(
            "Email not sent in stub mode. Configure Resend or SMTP in Settings → Email to enable delivery."
        ),
    )


class CalendarProvider(str, Enum):
    google = "google"
    microsoft = "microsoft"


class CalendarEvent(BaseModel):
    id: str
    title: str
    start: datetime
    end: datetime
    location: str | None = None
    attendees: list[str] = Field(default_factory=list)


class CalendarEventsResponse(BaseModel):
    provider: CalendarProvider
    events: list[CalendarEvent]
    status: str
    next_steps: str


def _generate_stub_events(provider: CalendarProvider, user: User) -> list[CalendarEvent]:
    now = datetime.utcnow().replace(microsecond=0)
    base_title = "Discovery Call" if provider == CalendarProvider.google else "Project Sync"
    return [
        CalendarEvent(
            id=f"stub-{provider}-{i}",
            title=f"{base_title} #{i + 1}",
            start=now + timedelta(days=i, hours=1),
            end=now + timedelta(days=i, hours=2),
            location="Google Meet" if provider == CalendarProvider.google else "Teams Meeting",
            attendees=[user.email] if user.email else [],
        )
        for i in range(2)
    ]


@router.get("/calendar/{provider}/events", response_model=CalendarEventsResponse)
async def list_calendar_events_stub(
    provider: CalendarProvider,
    user: User = Depends(get_current_user),
):
    """Return stubbed calendar events (DEV/STAGING ONLY) - real OAuth flow coming in Phase 5."""
    settings = get_settings()
    
    # Feature flag check - block in production
    if not settings.integrations_stub_mode:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Stub integrations are disabled in production. Please complete OAuth setup for calendar access.",
        )
    
    events = _generate_stub_events(provider, user)
    next_steps = (
        "Connect Google Workspace via OAuth (Scopes: calendar.events.readonly)."
        if provider == CalendarProvider.google
        else "Connect Microsoft 365 via OAuth (Scopes: Calendars.Read)."
    )
    logger.info(
        "Calendar stub invoked",
        extra={"provider": provider, "user": user.id, "count": len(events)},
    )
    return CalendarEventsResponse(
        provider=provider,
        events=events,
        status="stub",
        next_steps=next_steps,
    )


__all__ = ["router"]
