"""
Tenant data model and helper utilities.

This module defines the SQLAlchemy mapping representing a tenant in the
platform. Tenants own an Ava profile and are referenced by authenticated
requests via `tenant_id` coming from JWT claims.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class Tenant(Base):
    """Simple tenant model storing high-level metadata."""

    __tablename__ = "tenants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(120), nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    def __repr__(self) -> str:  # pragma: no cover - repr helper
        return f"Tenant(id={self.id}, name={self.name})"
