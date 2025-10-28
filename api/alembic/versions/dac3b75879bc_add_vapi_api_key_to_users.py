"""add_vapi_api_key_to_users

Revision ID: dac3b75879bc
Revises: e9c6b907d1be
Create Date: 2025-10-28 18:27:45.365668

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'dac3b75879bc'
down_revision: Union[str, None] = 'e9c6b907d1be'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add vapi_api_key column to users table
    op.add_column(
        'users',
        sa.Column(
            'vapi_api_key',
            sa.String(255),
            nullable=True,
            comment="User's personal Vapi.ai API key for their assistants"
        )
    )


def downgrade() -> None:
    # Remove vapi_api_key column from users table
    op.drop_column('users', 'vapi_api_key')
