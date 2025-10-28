"""add_onboarding_integration_flags

Revision ID: c256afd5baca
Revises: ffacb20841b4
Create Date: 2025-10-28 19:28:34.255697

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c256afd5baca'
down_revision: Union[str, None] = 'ffacb20841b4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add onboarding integration flags to track user decisions
    op.add_column('users', sa.Column('onboarding_vapi_skipped', sa.Boolean(), nullable=False, server_default='false', comment="User skipped Vapi configuration during onboarding"))
    op.add_column('users', sa.Column('onboarding_twilio_skipped', sa.Boolean(), nullable=False, server_default='false', comment="User skipped Twilio configuration during onboarding"))
    op.add_column('users', sa.Column('onboarding_assistant_created', sa.Boolean(), nullable=False, server_default='false', comment="User created first assistant during onboarding"))


def downgrade() -> None:
    # Remove onboarding integration flags
    op.drop_column('users', 'onboarding_assistant_created')
    op.drop_column('users', 'onboarding_twilio_skipped')
    op.drop_column('users', 'onboarding_vapi_skipped')
