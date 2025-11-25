"""
Call Analytics Daily model for pre-aggregated call metrics.
"""

from __future__ import annotations

from datetime import date, datetime
from typing import TYPE_CHECKING
from uuid import uuid4

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from .base import Base

if TYPE_CHECKING:
    from .user import User


class CallAnalyticsDaily(Base):
    """Pre-aggregated daily call analytics for a user."""

    __tablename__ = "call_analytics_daily"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid4()),
        nullable=False,
    )

    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)

    # Metrics
    total_calls: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    completed_calls: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    failed_calls: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_duration_seconds: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_cost: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    avg_duration_seconds: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationship
    user: Mapped["User"] = relationship("User")

    __table_args__ = (
        UniqueConstraint('user_id', 'date', name='uq_call_analytics_daily_user_date'),
    )

    def __repr__(self) -> str:
        return f"<CallAnalyticsDaily(user_id={self.user_id}, date={self.date}, calls={self.total_calls})>"
