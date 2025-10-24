"""Assistant management endpoints backed by Vapi."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status

from api.src.infrastructure.external.vapi_client import VapiApiError, VapiClient
from api.src.presentation.dependencies.auth import CurrentTenant, get_current_tenant

router = APIRouter(prefix="/assistants", tags=["Assistants"])


def _client() -> VapiClient:
    try:
        return VapiClient()
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc


@router.get("")
async def list_assistants(
    _: CurrentTenant = Depends(get_current_tenant),
    limit: int = Query(default=50, ge=1, le=200),
) -> dict[str, object]:
    client = _client()
    try:
        assistants = await client.list_assistants(limit=limit)
    except VapiApiError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
    return {"assistants": assistants}


@router.get("/{assistant_id}")
async def get_assistant(
    assistant_id: str,
    _: CurrentTenant = Depends(get_current_tenant),
) -> dict[str, object]:
    client = _client()
    try:
        assistant = await client.get_assistant(assistant_id)
    except VapiApiError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
    return {"assistant": assistant}


__all__ = ["router"]
