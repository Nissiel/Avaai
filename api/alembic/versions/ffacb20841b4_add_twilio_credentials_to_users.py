"""add_twilio_credentials_to_users

Revision ID: ffacb20841b4
Revises: dac3b75879bc
Create Date: 2025-10-28 19:12:25.842665

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ffacb20841b4'
down_revision: Union[str, None] = 'dac3b75879bc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add Twilio credentials columns to users table
    op.add_column('users', sa.Column('twilio_account_sid', sa.String(255), nullable=True, comment="User's Twilio Account SID"))
    op.add_column('users', sa.Column('twilio_auth_token', sa.String(255), nullable=True, comment="User's Twilio Auth Token"))
    op.add_column('users', sa.Column('twilio_phone_number', sa.String(50), nullable=True, comment="User's Twilio phone number"))


def downgrade() -> None:
    # Remove Twilio credentials columns
    op.drop_column('users', 'twilio_phone_number')
    op.drop_column('users', 'twilio_auth_token')
    op.drop_column('users', 'twilio_account_sid')
