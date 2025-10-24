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
from api.src.presentation.dependencies.auth import CurrentTenant, get_current_tenant

router = APIRouter(prefix="/analytics", tags=["Analytics"])


def _client() -> VapiClient:
    try:
        return VapiClient()
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc


async def _sync_calls(session: AsyncSession, tenant_id, client: VapiClient) -> None:
    try:
        await synchronise_calls_from_vapi(session, tenant_id=tenant_id, vapi_client=client)
    except VapiApiError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc


@router.get("/overview")
async def analytics_overview(
    current: CurrentTenant = Depends(get_current_tenant),
    session: AsyncSession = Depends(get_session),
) -> dict[str, object]:
    client = _client()
    await _sync_calls(session, current.tenant.id, client)

    overview = await compute_overview_metrics(session, tenant_id=current.tenant.id)
    calls = await recent_calls_with_transcripts(session, tenant_id=current.tenant.id)
    topics = await compute_trending_topics(session, tenant_id=current.tenant.id, limit=6)

    return {
        "overview": overview,
        "calls": calls,
        "topics": topics,
    }


@router.get("/timeseries")
async def analytics_timeseries(
    current: CurrentTenant = Depends(get_current_tenant),
    session: AsyncSession = Depends(get_session),
) -> dict[str, object]:
    client = _client()
    await _sync_calls(session, current.tenant.id, client)
    series = await compute_time_series(session, tenant_id=current.tenant.id)
    return {"series": series}


@router.get("/topics")
async def analytics_topics(
    current: CurrentTenant = Depends(get_current_tenant),
    session: AsyncSession = Depends(get_session),
) -> dict[str, object]:
    client = _client()
    await _sync_calls(session, current.tenant.id, client)
    topics = await compute_trending_topics(session, tenant_id=current.tenant.id)
    return {"topics": topics}


@router.get("/anomalies")
async def analytics_anomalies(
    current: CurrentTenant = Depends(get_current_tenant),
    session: AsyncSession = Depends(get_session),
) -> dict[str, object]:
    client = _client()
    await _sync_calls(session, current.tenant.id, client)
    anomalies = await detect_anomalies(session, tenant_id=current.tenant.id)
    return {"anomalies": anomalies}


@router.get("/heatmap")
async def analytics_heatmap(
    current: CurrentTenant = Depends(get_current_tenant),
    session: AsyncSession = Depends(get_session),
) -> dict[str, object]:
    client = _client()
    await _sync_calls(session, current.tenant.id, client)
    heatmap = await compute_activity_heatmap(session, tenant_id=current.tenant.id)
    return {"heatmap": heatmap}
