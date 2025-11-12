"""Expose Vapi remote settings (list/get/update) for the UI."""

from __future__ import annotations

import logging
from typing import Any, Iterable

from fastapi import APIRouter, Depends, HTTPException, Path, Request, status
from pydantic import BaseModel, Field

from api.src.application.services.vapi import get_vapi_client_for_user
from api.src.infrastructure.external.vapi_client import VapiApiError, VapiRateLimitError, VapiAuthError
from api.src.infrastructure.persistence.models.user import User
from api.src.presentation.dependencies.auth import get_current_user

router = APIRouter(prefix="/vapi/settings", tags=["Vapi Settings API"])
logger = logging.getLogger("ava.vapi")


class RemoteSetting(BaseModel):
    """Represents a key/value pair stored remotely in Vapi."""

    key: str
    value: Any
    updated_at: str | None = Field(default=None, alias="updatedAt")


class RemoteSettingsResponse(BaseModel):
    """List wrapper for remote settings."""

    settings: list[RemoteSetting]


class RemoteSettingResponse(BaseModel):
    """Single setting response."""

    setting: RemoteSetting


class UpdateRemoteSettingRequest(BaseModel):
    """Payload for updating a remote setting."""

    value: Any = Field(..., description="New value to store. JSON payloads are accepted.")


def _normalize(payload: Any) -> RemoteSetting:
    if isinstance(payload, dict):
        key = str(payload.get("key") or payload.get("id") or "")
        updated = payload.get("updated_at") or payload.get("updatedAt")
        return RemoteSetting(key=key, value=payload.get("value"), updated_at=updated)
    return RemoteSetting(key=str(payload), value=payload, updated_at=None)


def _normalize_list(payload: Any) -> list[RemoteSetting]:
    if isinstance(payload, dict) and isinstance(payload.get("settings"), Iterable):
        return [_normalize(item) for item in payload["settings"]]
    if isinstance(payload, Iterable):
        return [_normalize(item) for item in payload]
    return []


@router.get("", response_model=RemoteSettingsResponse)
async def list_remote_settings(
    request: Request,
    user: User = Depends(get_current_user),
) -> RemoteSettingsResponse:
    correlation_id = getattr(request.state, "correlation_id", "unknown")
    logger.info(
        "Listing Vapi remote settings",
        extra={"user_id": user.id, "correlation_id": correlation_id},
    )
    
    client = get_vapi_client_for_user(user)
    try:
        remote = await client.list_settings()
    except VapiRateLimitError as exc:
        logger.warning(
            "Vapi rate limit exceeded",
            extra={"user_id": user.id, "correlation_id": correlation_id},
        )
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests to Vapi. Please try again in a moment.",
        ) from exc
    except VapiAuthError as exc:
        logger.error(
            "Vapi authentication failed",
            extra={"user_id": user.id, "correlation_id": correlation_id},
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Vapi API key. Please update your credentials in Settings.",
        ) from exc
    except VapiApiError as exc:
        logger.error(
            "Vapi API error",
            extra={"user_id": user.id, "correlation_id": correlation_id, "error": str(exc)},
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Connection to Vapi failed. Please try again later.",
        ) from exc

    return RemoteSettingsResponse(settings=_normalize_list(remote))


@router.get("/{setting_key}", response_model=RemoteSettingResponse)
async def get_remote_setting(
    request: Request,
    setting_key: str = Path(..., description="Vapi setting key"),
    user: User = Depends(get_current_user),
) -> RemoteSettingResponse:
    correlation_id = getattr(request.state, "correlation_id", "unknown")
    logger.info(
        f"Getting Vapi setting: {setting_key}",
        extra={"user_id": user.id, "correlation_id": correlation_id, "key": setting_key},
    )
    
    client = get_vapi_client_for_user(user)
    try:
        remote = await client.get_setting(setting_key)
    except VapiRateLimitError as exc:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests to Vapi. Please try again in a moment.",
        ) from exc
    except VapiAuthError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Vapi API key. Please update your credentials in Settings.",
        ) from exc
    except VapiApiError as exc:
        logger.error(
            f"Failed to get Vapi setting: {setting_key}",
            extra={"user_id": user.id, "correlation_id": correlation_id, "error": str(exc)},
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Connection to Vapi failed. Please try again later.",
        ) from exc

    return RemoteSettingResponse(setting=_normalize(remote))


@router.put("/{setting_key}", response_model=RemoteSettingResponse)
async def update_remote_setting(
    request: Request,
    setting_key: str,
    payload: UpdateRemoteSettingRequest,
    user: User = Depends(get_current_user),
) -> RemoteSettingResponse:
    correlation_id = getattr(request.state, "correlation_id", "unknown")
    logger.info(
        f"Updating Vapi setting: {setting_key}",
        extra={"user_id": user.id, "correlation_id": correlation_id, "key": setting_key},
    )
    
    client = get_vapi_client_for_user(user)
    try:
        remote = await client.update_setting(setting_key, payload.value)
    except VapiRateLimitError as exc:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests to Vapi. Please try again in a moment.",
        ) from exc
    except VapiAuthError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Vapi API key. Please update your credentials in Settings.",
        ) from exc
    except VapiApiError as exc:
        logger.error(
            f"Failed to update Vapi setting: {setting_key}",
            extra={"user_id": user.id, "correlation_id": correlation_id, "error": str(exc)},
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Connection to Vapi failed. Please try again later.",
        ) from exc

    logger.info(
        f"Successfully updated Vapi setting: {setting_key}",
        extra={"user_id": user.id, "correlation_id": correlation_id},
    )
    return RemoteSettingResponse(setting=_normalize(remote))


__all__ = ["router"]
