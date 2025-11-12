"""API v1 router aggregation."""

from __future__ import annotations

from fastapi import APIRouter

from api.src.presentation.api.v1.routes import (
    analytics,
    assistants,
    auth,
    calls,
    integrations,
    phone_numbers,
    runtime,
    studio_config,
    tenant_profile,
    twilio,
    twilio_settings,
    user_onboarding,
    vapi_settings,
    voices,
    webhooks,
)

api_v1_router = APIRouter()
api_v1_router.include_router(auth.router)
api_v1_router.include_router(runtime.router)
api_v1_router.include_router(studio_config.router)
api_v1_router.include_router(assistants.router)
api_v1_router.include_router(calls.router)
api_v1_router.include_router(analytics.router)
api_v1_router.include_router(voices.router)
api_v1_router.include_router(twilio.router)
api_v1_router.include_router(phone_numbers.router)
api_v1_router.include_router(tenant_profile.router)
api_v1_router.include_router(integrations.router)
api_v1_router.include_router(vapi_settings.router)
api_v1_router.include_router(twilio_settings.router)
api_v1_router.include_router(user_onboarding.router)
api_v1_router.include_router(webhooks.router)

__all__ = ["api_v1_router"]
