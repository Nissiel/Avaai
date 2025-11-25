"""Add assistants, audit_logs, and call_analytics_daily tables

This migration creates:
1. assistants - Store AI assistant configurations
2. audit_logs - Track user actions for security/compliance
3. call_analytics_daily - Pre-aggregated call metrics

Revision ID: g5e4f6g7h8i9
Revises: f4d3e5f6g7h8
Create Date: 2024-01-01 00:00:04.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'g5e4f6g7h8i9'
down_revision = 'f4d3e5f6g7h8'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # === CREATE assistants TABLE ===
    op.create_table(
        'assistants',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('vapi_assistant_id', sa.String(255), nullable=True, unique=True),
        sa.Column('status', sa.String(50), default='active', nullable=False),

        # Voice settings (reference to voice_configs or inline)
        sa.Column('voice_provider', sa.String(50), default='11labs', nullable=False),
        sa.Column('voice_id', sa.String(255), default='sarah', nullable=False),
        sa.Column('voice_speed', sa.Float(), default=1.0, nullable=False),

        # AI settings
        sa.Column('ai_model', sa.String(100), default='gpt-4o-mini', nullable=False),
        sa.Column('ai_temperature', sa.Float(), default=0.7, nullable=False),
        sa.Column('ai_max_tokens', sa.Integer(), default=500, nullable=False),

        # Conversation settings
        sa.Column('system_prompt', sa.Text(), nullable=False),
        sa.Column('first_message', sa.Text(), nullable=False),
        sa.Column('language', sa.String(10), default='en', nullable=False),

        # Timestamps
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),  # Soft delete

        # Check constraints
        sa.CheckConstraint('voice_speed > 0', name='ck_assistants_voice_speed_positive'),
        sa.CheckConstraint('ai_temperature >= 0 AND ai_temperature <= 2', name='ck_assistants_temperature_range'),
        sa.CheckConstraint('ai_max_tokens > 0', name='ck_assistants_max_tokens_positive'),
    )
    # Only create indexes not already created by index=True or unique=True in column definitions
    op.create_index('ix_assistants_status', 'assistants', ['status'])

    # === CREATE audit_logs TABLE ===
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True),
        sa.Column('action', sa.String(100), nullable=False, index=True),
        sa.Column('resource_type', sa.String(100), nullable=False),
        sa.Column('resource_id', sa.String(255), nullable=True),
        sa.Column('old_value', sa.JSON(), nullable=True),
        sa.Column('new_value', sa.JSON(), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),  # IPv6 can be up to 45 chars
        sa.Column('user_agent', sa.String(500), nullable=True),
        sa.Column('extra_data', sa.JSON(), nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False, index=True),
    )
    # Indexes for user_id, action, and timestamp already created by index=True in column definitions
    # Only create composite index not already covered
    op.create_index('ix_audit_logs_resource', 'audit_logs', ['resource_type', 'resource_id'])

    # === CREATE call_analytics_daily TABLE ===
    op.create_table(
        'call_analytics_daily',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),

        # Metrics
        sa.Column('total_calls', sa.Integer(), default=0, nullable=False),
        sa.Column('completed_calls', sa.Integer(), default=0, nullable=False),
        sa.Column('failed_calls', sa.Integer(), default=0, nullable=False),
        sa.Column('total_duration_seconds', sa.Integer(), default=0, nullable=False),
        sa.Column('total_cost', sa.Float(), default=0.0, nullable=False),
        sa.Column('avg_duration_seconds', sa.Float(), default=0.0, nullable=False),

        # Timestamps
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),

        # Unique constraint on user_id + date
        sa.UniqueConstraint('user_id', 'date', name='uq_call_analytics_daily_user_date'),
    )
    op.create_index('ix_call_analytics_daily_user_id', 'call_analytics_daily', ['user_id'])
    op.create_index('ix_call_analytics_daily_date', 'call_analytics_daily', ['date'])
    # Note: composite index on (user_id, date) not needed - unique constraint already creates it


def downgrade() -> None:
    op.drop_table('call_analytics_daily')
    op.drop_table('audit_logs')
    op.drop_table('assistants')
