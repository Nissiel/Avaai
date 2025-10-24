"""Assistant management endpoints backed by Vapi."""

from __future__ import annotations

from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, Query, status

from api.src.infrastructure.external.vapi_client import VapiApiError, VapiClient
from api.src.presentation.dependencies.auth import CurrentTenant, get_current_tenant

router = APIRouter(prefix="/assistants", tags=["Assistants"])


class CreateAssistantRequest(BaseModel):
    """Request body for creating a new assistant."""
    
    model_config = {"protected_namespaces": ()}  # Allow model_* fields
    
    name: str = Field(..., min_length=1, max_length=40, description="Assistant name")
    voice_provider: str = Field(..., description="Voice provider (11labs, azure, deepgram, etc.)")
    voice_id: str = Field(..., description="Voice ID from provider")
    first_message: str = Field(..., description="Greeting message when call starts")
    model_provider: str = Field(default="openai", description="LLM provider")
    model: str = Field(default="gpt-3.5-turbo", description="Model name")
    temperature: float = Field(default=0.7, ge=0.0, le=1.0, description="Model creativity")
    max_tokens: int = Field(default=250, ge=50, le=1000, description="Max response length")
    metadata: dict | None = Field(default=None, description="Optional metadata")


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


@router.post("/create")
async def create_assistant(
    request: CreateAssistantRequest,
    # Note: No auth required during onboarding - user not logged in yet
    # TODO: Add tenant_id to request body once user is authenticated
) -> dict[str, object]:
    """
    Create a new AI assistant with personalized voice and configuration.
    
    This creates the assistant FIRST, then you link it to phone numbers.
    Returns the assistant_id (UUID) which you'll use for phone setup.
    
    During onboarding: No auth required (user creates assistant before signup)
    After onboarding: Should validate tenant ownership
    """
    client = _client()
    try:
        assistant = await client.create_assistant(
            name=request.name,
            voice_provider=request.voice_provider,
            voice_id=request.voice_id,
            first_message=request.first_message,
            model_provider=request.model_provider,
            model=request.model,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            metadata=request.metadata,
        )
    except VapiApiError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, 
            detail=f"Failed to create assistant: {str(exc)}"
        ) from exc
    
    return {"assistant": assistant}


__all__ = ["router"]
