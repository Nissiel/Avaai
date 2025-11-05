"""add_studio_configs_table

Revision ID: 8cffba94b8cc
Revises: c256afd5baca
Create Date: 2025-10-28 20:53:30.040207

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8cffba94b8cc'
down_revision: Union[str, None] = 'c256afd5baca'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Add studio_configs table for persisting studio configuration per user.

    Replaces the old in-memory _config_state with proper database persistence.
    Each user gets their own studio config with voice settings, AI model config,
    prompts, and caller info collection preferences.
    """
    op.create_table(
        'studio_configs',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False, comment='User who owns this studio config'),

        # Organization info
        sa.Column('organization_name', sa.String(length=255), nullable=False, server_default='My Organization'),

        # Vapi Assistant
        sa.Column('vapi_assistant_id', sa.String(length=255), nullable=True, comment='Vapi assistant ID for syncing'),

        # Voice Configuration
        sa.Column('voice_provider', sa.String(length=50), nullable=False, server_default='11labs'),
        sa.Column('voice_id', sa.String(length=255), nullable=False, server_default='sarah'),
        sa.Column('voice_speed', sa.Float(), nullable=False, server_default='1.0'),

        # AI Model Configuration
        sa.Column('ai_model', sa.String(length=100), nullable=False, server_default='gpt-4o-mini'),
        sa.Column('ai_temperature', sa.Float(), nullable=False, server_default='0.7'),
        sa.Column('ai_max_tokens', sa.Integer(), nullable=False, server_default='500'),

        # Transcriber Configuration
        sa.Column('transcriber_provider', sa.String(length=50), nullable=False, server_default='deepgram'),
        sa.Column('transcriber_model', sa.String(length=100), nullable=False, server_default='nova-2'),
        sa.Column('transcriber_language', sa.String(length=10), nullable=False, server_default='en'),

        # Conversation Settings
        sa.Column('first_message', sa.Text(), nullable=False, server_default='Hello! How can I help you today?'),
        sa.Column('system_prompt', sa.Text(), nullable=False, server_default='You are a helpful AI assistant.'),
        sa.Column('guidelines', sa.Text(), nullable=True),

        # Persona & Tone
        sa.Column('persona', sa.String(length=100), nullable=False, server_default='professional'),
        sa.Column('tone', sa.String(length=100), nullable=False, server_default='friendly'),
        sa.Column('language', sa.String(length=10), nullable=False, server_default='en'),

        # Caller Info Collection
        sa.Column('ask_for_name', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('ask_for_email', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('ask_for_phone', sa.Boolean(), nullable=False, server_default='0'),

        # Timestamps
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),

        sa.PrimaryKeyConstraint('id'),
    )

    # Create index on user_id for fast lookup
    op.create_index('idx_studio_configs_user_id', 'studio_configs', ['user_id'])


def downgrade() -> None:
    """Remove studio_configs table."""
    op.drop_index('idx_studio_configs_user_id', table_name='studio_configs')
    op.drop_table('studio_configs')
