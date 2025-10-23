"""Studio configuration endpoints."""

from __future__ import annotations

from fastapi import APIRouter

from app_api.src.presentation.schemas.studio_config import (
    DEFAULT_STUDIO_CONFIG,
    StudioConfig,
    StudioConfigUpdate,
)

router = APIRouter(prefix="/studio", tags=["Studio"])

_config_state: StudioConfig = DEFAULT_STUDIO_CONFIG.model_copy()


@router.get("/config", response_model=StudioConfig)
async def get_studio_config() -> StudioConfig:
    return _config_state


@router.patch("/config", response_model=StudioConfig)
async def update_studio_config(payload: StudioConfigUpdate) -> StudioConfig:
    global _config_state
    data = payload.model_dump(exclude_none=True)
    if not data:
        return _config_state

    _config_state = _config_state.model_copy(update=data)
    return _config_state
