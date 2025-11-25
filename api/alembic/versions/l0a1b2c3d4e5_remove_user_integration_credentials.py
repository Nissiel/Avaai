"""Remove user integration credentials

This migration removes per-user Vapi and Twilio credentials.
These integrations will now use platform-level credentials from environment variables.

Revision ID: l0a1b2c3d4e5
Revises: k9c2d3e4f5g6
Create Date: 2024-01-01 00:00:11.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'l0a1b2c3d4e5'
down_revision = 'k9c2d3e4f5g6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop Vapi credentials
    op.drop_column('users', 'vapi_api_key_encrypted')
    op.drop_column('users', 'vapi_api_key_preview')

    # Drop Twilio credentials
    op.drop_column('users', 'twilio_account_sid_encrypted')
    op.drop_column('users', 'twilio_auth_token_encrypted')
    op.drop_column('users', 'twilio_phone_number')

    # Drop onboarding integration flags
    op.drop_column('users', 'onboarding_vapi_skipped')
    op.drop_column('users', 'onboarding_twilio_skipped')


def downgrade() -> None:
    # Re-add onboarding integration flags
    op.add_column('users', sa.Column('onboarding_twilio_skipped', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('users', sa.Column('onboarding_vapi_skipped', sa.Boolean(), nullable=False, server_default='false'))

    # Re-add Twilio credentials
    op.add_column('users', sa.Column('twilio_phone_number', sa.String(50), nullable=True))
    op.add_column('users', sa.Column('twilio_auth_token_encrypted', sa.Text(), nullable=True))
    op.add_column('users', sa.Column('twilio_account_sid_encrypted', sa.Text(), nullable=True))

    # Re-add Vapi credentials
    op.add_column('users', sa.Column('vapi_api_key_preview', sa.String(32), nullable=True))
    op.add_column('users', sa.Column('vapi_api_key_encrypted', sa.Text(), nullable=True))
