"""
Call persistence models for storing Vapi call metadata and transcripts.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from .tenant import Base


class CallRecord(Base):
    """Represents a single call captured from Vapi."""

    __tablename__ = "calls"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    assistant_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    tenant_id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_number: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    cost: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    meta: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    transcript: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    def update_from_payload(self, payload: dict[str, object]) -> None:
        """Update the record using a Vapi call payload."""

        self.status = str(payload.get("status", self.status))
        self.meta = {**(self.meta or {}), **payload}

        if "endedAt" in payload and payload["endedAt"]:
            self.ended_at = _parse_datetime(payload["endedAt"]) or self.ended_at

        if "startedAt" in payload and payload["startedAt"]:
            self.started_at = _parse_datetime(payload["startedAt"]) or self.started_at

        if "durationSeconds" in payload:
            try:
                self.duration_seconds = int(payload["durationSeconds"])  # type: ignore[arg-type]
            except (TypeError, ValueError):
                pass

        if "cost" in payload:
            try:
                self.cost = float(payload["cost"])  # type: ignore[arg-type]
            except (TypeError, ValueError):
                pass

        transcript = payload.get("transcript")
        if isinstance(transcript, str) and transcript.strip():
            self.transcript = transcript


def _parse_datetime(value: object) -> Optional[datetime]:
    if not isinstance(value, str):
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


__all__ = ["CallRecord"]
