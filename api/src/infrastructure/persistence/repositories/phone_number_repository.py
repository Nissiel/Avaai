"""
Phone number repository for database operations.

Handles CRUD operations for phone numbers with proper error handling.
"""

from __future__ import annotations

import logging
from typing import Optional, Sequence
from uuid import uuid4, UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


def _to_str(value) -> str:
    """Convert value to string (handles UUID objects)."""
    if isinstance(value, UUID):
        return str(value)
    return str(value) if value else ""

from api.src.infrastructure.persistence.models.phone_number import PhoneNumber, PhoneProvider

logger = logging.getLogger(__name__)


class PhoneNumberRepository:
    """Repository for phone number database operations."""

    def __init__(self, session: AsyncSession) -> None:
        """Initialize repository with database session."""
        self.session = session

    async def create(
        self,
        *,
        user_id: str,
        provider: PhoneProvider,
        e164: str,
        vapi_phone_number_id: Optional[str] = None,
        twilio_account_sid: Optional[str] = None,
        routing: Optional[dict] = None,
        business_hours: Optional[dict] = None,
        voicemail: Optional[dict] = None,
    ) -> PhoneNumber:
        """
        Create a new phone number record.

        Args:
            user_id: User ID that owns this number
            provider: Phone provider (VAPI, TWILIO, VAPI_TWILIO, SIP)
            e164: Phone number in E.164 format (+33612345678)
            vapi_phone_number_id: Vapi phone number ID if applicable
            twilio_account_sid: Twilio Account SID if applicable
            routing: Routing configuration dict
            business_hours: Business hours schedule dict
            voicemail: Voicemail configuration dict

        Returns:
            Created PhoneNumber instance

        Raises:
            ValueError: If phone number already exists
        """
        # Check if number already exists
        existing = await self.get_by_e164(e164)
        if existing:
            raise ValueError(f"Phone number {e164} already exists")

        phone = PhoneNumber(
            id=str(uuid4()),
            user_id=user_id,
            provider=provider,
            e164=e164,
            vapi_phone_number_id=vapi_phone_number_id,
            twilio_account_sid=twilio_account_sid,
            routing=routing or {},
            business_hours=business_hours or {},
            voicemail=voicemail or {},
        )

        self.session.add(phone)
        await self.session.commit()
        await self.session.refresh(phone)

        logger.info(f"Created phone number: {e164} (provider={provider}, user={user_id})")
        return phone

    async def get_by_id(self, phone_id: str) -> Optional[PhoneNumber]:
        """Get phone number by ID."""
        stmt = select(PhoneNumber).where(PhoneNumber.id == phone_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_e164(self, e164: str) -> Optional[PhoneNumber]:
        """Get phone number by E.164 format."""
        stmt = select(PhoneNumber).where(PhoneNumber.e164 == e164)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_vapi_id(self, vapi_phone_number_id: str) -> Optional[PhoneNumber]:
        """Get phone number by Vapi phone number ID."""
        stmt = select(PhoneNumber).where(
            PhoneNumber.vapi_phone_number_id == vapi_phone_number_id
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_user(self, user_id: str | UUID) -> Sequence[PhoneNumber]:
        """List all phone numbers for a user."""
        user_id_str = _to_str(user_id)
        stmt = select(PhoneNumber).where(PhoneNumber.user_id == user_id_str).order_by(PhoneNumber.created_at.desc())
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def update_routing(
        self,
        phone_id: str,
        routing: dict,
    ) -> Optional[PhoneNumber]:
        """Update routing configuration for a phone number."""
        phone = await self.get_by_id(phone_id)
        if not phone:
            return None

        phone.routing = routing
        await self.session.commit()
        await self.session.refresh(phone)

        logger.info(f"Updated routing for phone {phone.e164}")
        return phone

    async def update_business_hours(
        self,
        phone_id: str,
        business_hours: dict,
    ) -> Optional[PhoneNumber]:
        """Update business hours configuration for a phone number."""
        phone = await self.get_by_id(phone_id)
        if not phone:
            return None

        phone.business_hours = business_hours
        await self.session.commit()
        await self.session.refresh(phone)

        logger.info(f"Updated business hours for phone {phone.e164}")
        return phone

    async def update_voicemail(
        self,
        phone_id: str,
        voicemail: dict,
    ) -> Optional[PhoneNumber]:
        """Update voicemail configuration for a phone number."""
        phone = await self.get_by_id(phone_id)
        if not phone:
            return None

        phone.voicemail = voicemail
        await self.session.commit()
        await self.session.refresh(phone)

        logger.info(f"Updated voicemail for phone {phone.e164}")
        return phone

    async def delete(self, phone_id: str) -> bool:
        """
        Delete a phone number.

        Args:
            phone_id: Phone number ID to delete

        Returns:
            True if deleted, False if not found
        """
        phone = await self.get_by_id(phone_id)
        if not phone:
            return False

        await self.session.delete(phone)
        await self.session.commit()

        logger.info(f"Deleted phone number: {phone.e164}")
        return True


__all__ = ["PhoneNumberRepository"]
