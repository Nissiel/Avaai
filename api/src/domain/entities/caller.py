"""
Caller Entity - Domain Model
DIVINE Level: 5/5

Represents a person who has called the business.
Stores contact information collected during calls.
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass(frozen=True)
class CallerId:
    """Value Object for Caller ID"""
    value: str

    def __post_init__(self):
        if not self.value or len(self.value) < 8:
            raise ValueError("Caller ID must be at least 8 characters")


@dataclass
class Caller:
    """
    Caller entity representing a person who has called.
    
    Attributes:
        id: Unique identifier
        org_id: Organization this caller belongs to
        phone_number: E.164 format phone number
        first_name: Caller's first name (collected during call)
        last_name: Caller's last name (collected during call)
        email: Caller's email (optional)
        notes: Additional notes about the caller
        created_at: When first call was received
        updated_at: Last update timestamp
    """
    id: CallerId
    org_id: str
    phone_number: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = None
    updated_at: datetime = None

    @property
    def full_name(self) -> str:
        """Get full name of caller"""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        elif self.first_name:
            return self.first_name
        elif self.last_name:
            return self.last_name
        else:
            return "Unknown Caller"

    def update_info(
        self,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
        email: Optional[str] = None,
        notes: Optional[str] = None
    ) -> None:
        """Update caller information"""
        if first_name is not None:
            self.first_name = first_name
        if last_name is not None:
            self.last_name = last_name
        if email is not None:
            self.email = email
        if notes is not None:
            self.notes = notes
        self.updated_at = datetime.utcnow()
