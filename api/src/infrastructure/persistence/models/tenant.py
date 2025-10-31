"""
Tenant data model (LEGACY).

⚠️ IMPORTANT: This model is LEGACY and not actively used in the application.
The current architecture uses a simplified 1:1 mapping where user.id = tenant_id.

Historical context:
- Originally designed for multi-tenant with multiple users per tenant
- Simplified to single-user-per-tenant model (user.id serves as tenant_id)
- Table kept in database for backwards compatibility only

Current usage:
- Provides Base class export (actual definition in base.py)
- tenant_id references in calls/profiles use user.id directly
- No active CRUD operations on Tenant table
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, String
from sqlalchemy.dialects.postgresql import UUID

from .base import Base


class Tenant(Base):
    """
    LEGACY tenant model - kept for DB schema compatibility.
    
    ⚠️ In current architecture: user.id = tenant_id (1:1 mapping)
    ⚠️ No active operations - this table exists but is not used
    """

    __tablename__ = "tenants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(120), nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    def __repr__(self) -> str:  # pragma: no cover - repr helper
        return f"Tenant(id={self.id}, name={self.name}) [LEGACY]"
