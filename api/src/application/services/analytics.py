"""
Analytics service orchestrating Vapi data with local persistence.
"""

from __future__ import annotations

from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from math import sqrt
from statistics import mean
from typing import Any, Dict, Iterable, List, Sequence

from sqlalchemy.ext.asyncio import AsyncSession

from api.src.infrastructure.external.vapi_client import VapiClient
from api.src.infrastructure.persistence.models.call import CallRecord
from api.src.infrastructure.persistence.repositories.call_repository import (
    get_calls_in_range,
    get_recent_calls,
    upsert_calls,
)

SECONDS_IN_MINUTE = 60
STOPWORDS = {
    "the",
    "and",
    "you",
    "est",
    "que",
    "pour",
    "avec",
    "from",
    "your",
    "nous",
    "this",
    "that",
    "have",
    "call",
    "bonjour",
    "hello",
    "merci",
    "please",
    "avez",
    "dans",
    "will",
    "just",
    "been",
    "could",
    "would",
}


def _now() -> datetime:
    return datetime.now(tz=timezone.utc)


def _parse_datetime(value: Any) -> datetime:
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            pass
    return _now()


def _as_call_record(raw: dict[str, Any], tenant_id) -> CallRecord:
    started_at = _parse_datetime(raw.get("startedAt"))
    ended_at = _parse_datetime(raw.get("endedAt")) if raw.get("endedAt") else None
    record = CallRecord(
        id=str(raw.get("id")),
        assistant_id=str(raw.get("assistantId", "")),
        tenant_id=tenant_id,
        customer_number=str(raw.get("customer", {}).get("number", "")) if isinstance(raw.get("customer"), dict) else None,
        status=str(raw.get("status", "unknown")),
        started_at=started_at,
        ended_at=ended_at,
        duration_seconds=_safe_int(raw.get("durationSeconds")),
        cost=_safe_float(raw.get("cost")),
        metadata=raw,
        transcript=_extract_transcript(raw),
    )
    return record


def _safe_int(value: Any) -> int | None:
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _safe_float(value: Any) -> float | None:
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _extract_transcript(raw: dict[str, Any]) -> str | None:
    transcript = raw.get("transcript")
    if isinstance(transcript, str):
        return transcript
    if isinstance(transcript, dict):
        return transcript.get("text")
    return None


async def synchronise_calls_from_vapi(
    session: AsyncSession,
    *,
    tenant_id,
    vapi_client: VapiClient,
    limit: int = 100,
) -> Sequence[CallRecord]:
    """Fetch latest calls from Vapi and persist them locally."""

    raw_calls = await vapi_client.list_calls(limit=limit)
    records = [_as_call_record(raw, tenant_id) for raw in raw_calls if raw.get("id")]
    await upsert_calls(session, records)
    return records


async def compute_overview_metrics(
    session: AsyncSession,
    *,
    tenant_id,
    lookback_days: int = 7,
) -> Dict[str, Any]:
    """Return aggregated analytics metrics for the given tenant."""

    end = _now()
    start = end - timedelta(days=lookback_days)
    calls = await get_calls_in_range(session, tenant_id=tenant_id, start=start, end=end)

    total_calls = len(calls)
    active_now = sum(1 for call in calls if call.status in {"in-progress", "ringing", "queued"})
    durations = [call.duration_seconds for call in calls if call.duration_seconds]
    avg_duration = mean(durations) if durations else 0
    satisfaction_scores = _collect_satisfaction_scores(calls)
    avg_satisfaction = mean(satisfaction_scores) if satisfaction_scores else 0.95
    total_cost = sum(call.cost or 0 for call in calls)

    return {
        "totalCalls": total_calls,
        "activeNow": active_now,
        "avgDuration": _format_duration(avg_duration),
        "satisfaction": round(avg_satisfaction, 2),
        "totalCost": round(total_cost, 2),
        "period": {
            "start": start.isoformat(),
            "end": end.isoformat(),
        },
    }


async def compute_time_series(
    session: AsyncSession,
    *,
    tenant_id,
    lookback_days: int = 14,
) -> Sequence[Dict[str, Any]]:
    end = _now()
    start = end - timedelta(days=lookback_days)
    calls = await get_calls_in_range(session, tenant_id=tenant_id, start=start, end=end)

    day_buckets: Dict[datetime, Dict[str, Any]] = defaultdict(
        lambda: {
            "totalCalls": 0,
            "durationSeconds": 0,
            "failed": 0,
            "sentiments": [],
        }
    )

    for call in calls:
        day = call.started_at.astimezone(timezone.utc).date()
        bucket_key = datetime.combine(day, datetime.min.time(), tzinfo=timezone.utc)
        bucket = day_buckets[bucket_key]
        bucket["totalCalls"] += 1
        bucket["durationSeconds"] += call.duration_seconds or 0
        if call.status.lower() in {"failed", "no-answer", "error", "abandoned"}:
            bucket["failed"] += 1
        sentiment = _extract_sentiment(call)
        if sentiment is not None:
            bucket["sentiments"].append(sentiment)

    series: List[Dict[str, Any]] = []
    cursor = datetime.combine(start.date(), datetime.min.time(), tzinfo=timezone.utc)
    end_cursor = datetime.combine(end.date(), datetime.min.time(), tzinfo=timezone.utc)

    while cursor <= end_cursor:
        bucket = day_buckets.get(cursor)
        if bucket:
            total_calls = bucket["totalCalls"]
            avg_duration = (bucket["durationSeconds"] / total_calls) if total_calls else 0
            avg_sentiment = mean(bucket["sentiments"]) if bucket["sentiments"] else None
            failed_rate = (bucket["failed"] / total_calls) if total_calls else 0
        else:
            total_calls = 0
            avg_duration = 0
            avg_sentiment = None
            failed_rate = 0

        series.append(
            {
                "date": cursor.date().isoformat(),
                "totalCalls": total_calls,
                "avgDuration": round(avg_duration / SECONDS_IN_MINUTE, 2),
                "failedRate": round(failed_rate, 3),
                "avgSentiment": round(avg_sentiment, 3) if avg_sentiment is not None else None,
            }
        )
        cursor += timedelta(days=1)

    return series


async def compute_trending_topics(
    session: AsyncSession,
    *,
    tenant_id,
    lookback_days: int = 14,
    limit: int = 12,
) -> Sequence[Dict[str, Any]]:
    end = _now()
    start = end - timedelta(days=lookback_days)
    calls = await get_calls_in_range(session, tenant_id=tenant_id, start=start, end=end)

    counter: Counter[str] = Counter()
    samples: Dict[str, str] = {}

    for call in calls:
        for topic in _extract_topics(call):
            normalized = topic.lower()
            if not normalized or normalized in STOPWORDS:
                continue
            counter[normalized] += 1
            samples.setdefault(normalized, call.id)

    if not counter:
        return []

    most_common = counter.most_common(limit)
    max_count = most_common[0][1]
    topics = [
        {
            "label": label,
            "count": count,
            "weight": round(count / max_count, 2),
            "callId": samples.get(label),
        }
        for label, count in most_common
    ]

    return topics


async def detect_anomalies(
    session: AsyncSession,
    *,
    tenant_id,
    lookback_days: int = 14,
    limit: int = 20,
) -> Sequence[Dict[str, Any]]:
    end = _now()
    start = end - timedelta(days=lookback_days)
    calls = await get_calls_in_range(session, tenant_id=tenant_id, start=start, end=end)

    durations = [call.duration_seconds for call in calls if call.duration_seconds]
    mean_duration = mean(durations) if durations else 0
    variance = mean([(duration - mean_duration) ** 2 for duration in durations]) if durations else 0
    std_dev = sqrt(variance)
    long_threshold = max(mean_duration + 2 * std_dev, 15 * 60) if durations else 15 * 60

    anomalies: List[Dict[str, Any]] = []
    for call in calls:
        if call.duration_seconds and call.duration_seconds >= long_threshold:
            anomalies.append(
                {
                    "callId": call.id,
                    "type": "long_duration",
                    "occurredAt": call.started_at.isoformat(),
                    "severity": "warning" if call.duration_seconds < long_threshold * 1.5 else "critical",
                    "message": f"Durée anormalement longue ({round((call.duration_seconds or 0) / 60, 2)} min)",
                    "assistantId": call.assistant_id,
                }
            )
        if call.status.lower() in {"failed", "error", "no-answer"}:
            anomalies.append(
                {
                    "callId": call.id,
                    "type": "call_failed",
                    "occurredAt": call.started_at.isoformat(),
                    "severity": "critical" if call.status.lower() == "error" else "warning",
                    "message": f"Statut d'appel défavorable: {call.status}",
                    "assistantId": call.assistant_id,
                }
            )
        sentiment = _extract_sentiment(call)
        if sentiment is not None and sentiment < 0.2:
            anomalies.append(
                {
                    "callId": call.id,
                    "type": "negative_sentiment",
                    "occurredAt": call.started_at.isoformat(),
                    "severity": "warning",
                    "message": "Analyse de sentiment très négative",
                    "assistantId": call.assistant_id,
                }
            )

    anomalies.sort(key=lambda item: item["occurredAt"], reverse=True)
    return anomalies[:limit]


async def compute_activity_heatmap(
    session: AsyncSession,
    *,
    tenant_id,
    lookback_days: int = 14,
) -> Sequence[Dict[str, Any]]:
    end = _now()
    start = end - timedelta(days=lookback_days)
    calls = await get_calls_in_range(session, tenant_id=tenant_id, start=start, end=end)

    heatmap: Dict[tuple[int, int], int] = defaultdict(int)
    for call in calls:
        dt = call.started_at.astimezone(timezone.utc)
        weekday = dt.weekday()  # Monday = 0
        hour = dt.hour
        heatmap[(weekday, hour)] += 1

    if not heatmap:
        return []

    max_value = max(heatmap.values()) or 1
    return [
        {
            "weekday": day,
            "hour": hour,
            "count": count,
            "intensity": round(count / max_value, 2),
        }
        for (day, hour), count in sorted(heatmap.items())
    ]


async def recent_calls_with_transcripts(
    session: AsyncSession,
    *,
    tenant_id,
    limit: int = 20,
) -> Sequence[dict]:
    """Return recent calls, enriched with transcripts."""

    calls = await get_recent_calls(session, tenant_id=tenant_id, limit=limit)
    return [
        {
            "id": call.id,
            "assistantId": call.assistant_id,
            "startedAt": call.started_at.isoformat(),
            "endedAt": call.ended_at.isoformat() if call.ended_at else None,
            "status": call.status,
            "durationSeconds": call.duration_seconds,
            "cost": call.cost,
            "customerNumber": call.customer_number,
            "transcript": call.transcript,
            "sentiment": _extract_sentiment(call),
        }
        for call in calls
    ]


def _collect_satisfaction_scores(calls: Sequence[CallRecord]) -> list[float]:
    scores: list[float] = []
    for call in calls:
        satisfaction = None
        if isinstance(call.metadata, dict):
            analytics = call.metadata.get("analytics")
            if isinstance(analytics, dict):
                satisfaction = analytics.get("sentimentScore") or analytics.get("customerSatisfaction")
        if satisfaction is None and call.metadata.get("sentimentScore") if isinstance(call.metadata, dict) else None:
            satisfaction = call.metadata["sentimentScore"]
        if satisfaction is not None:
            try:
                scores.append(float(satisfaction))
            except (TypeError, ValueError):
                continue
    return scores


def _format_duration(value: float) -> str:
    if value <= 0:
        return "0:00"
    total_seconds = int(round(value))
    minutes, seconds = divmod(total_seconds, SECONDS_IN_MINUTE)
    return f"{minutes}:{seconds:02d}"


def _extract_sentiment(call: CallRecord) -> float | None:
    metadata = call.metadata or {}
    if not isinstance(metadata, dict):
        return None
    analytics = metadata.get("analytics")
    if isinstance(analytics, dict):
        sentiment = analytics.get("sentimentScore") or analytics.get("customerSatisfaction")
        if sentiment is not None:
            try:
                return float(sentiment)
            except (TypeError, ValueError):
                return None
    sentiment = metadata.get("sentimentScore")
    if sentiment is not None:
        try:
            return float(sentiment)
        except (TypeError, ValueError):
            return None
    return None


def _extract_topics(call: CallRecord) -> Iterable[str]:
    metadata = call.metadata or {}
    topics: List[str] = []
    if isinstance(metadata, dict):
        for key in ("topics", "tags", "keywords"):
            value = metadata.get(key)
            if isinstance(value, list):
                topics.extend([str(item) for item in value if item])
    if call.transcript:
        tokens = [token.strip(".,!?:;()[]{}\"'").lower() for token in call.transcript.split()]
        topics.extend([token for token in tokens if len(token) > 3])
    return topics


__all__ = [
    "synchronise_calls_from_vapi",
    "compute_overview_metrics",
    "compute_time_series",
    "compute_trending_topics",
    "detect_anomalies",
    "compute_activity_heatmap",
    "recent_calls_with_transcripts",
]
