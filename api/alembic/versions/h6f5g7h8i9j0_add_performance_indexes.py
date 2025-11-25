"""Add performance indexes for common query patterns

This migration adds indexes to improve query performance for:
- Call history queries (user + date range)
- Phone number lookups
- User analytics

Revision ID: h6f5g7h8i9j0
Revises: g5e4f6g7h8i9
Create Date: 2024-01-01 00:00:05.000000

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = 'h6f5g7h8i9j0'
down_revision = 'g5e4f6g7h8i9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # === CALLS TABLE INDEXES ===

    # Composite index for call history queries: "get calls for user between dates"
    op.create_index(
        'ix_calls_user_started_desc',
        'calls',
        ['user_id', 'started_at'],
        postgresql_ops={'started_at': 'DESC'}
    )

    # Index for filtering by status
    op.create_index('ix_calls_status', 'calls', ['status'])

    # Index for cost analytics
    op.create_index('ix_calls_cost', 'calls', ['cost'])

    # === PHONE_NUMBERS TABLE INDEXES ===

    # Composite index for phone number list operations
    op.create_index(
        'ix_phone_numbers_user_created',
        'phone_numbers',
        ['user_id', 'created_at'],
        postgresql_ops={'created_at': 'DESC'}
    )

    # Index for filtering by provider
    op.create_index('ix_phone_numbers_provider', 'phone_numbers', ['provider'])

    # === USERS TABLE INDEXES ===

    # Index for user growth analytics and list operations
    op.create_index(
        'ix_users_created_at',
        'users',
        ['created_at'],
        postgresql_ops={'created_at': 'DESC'}
    )

    # Index for onboarding status queries
    op.create_index('ix_users_onboarding_completed', 'users', ['onboarding_completed'])

    # === STUDIO_CONFIGS TABLE INDEXES ===

    # Composite index for user's configs with date
    op.create_index(
        'ix_studio_configs_user_created',
        'studio_configs',
        ['user_id', 'created_at'],
        postgresql_ops={'created_at': 'DESC'}
    )


def downgrade() -> None:
    # Drop all created indexes

    # Studio configs
    op.drop_index('ix_studio_configs_user_created', table_name='studio_configs')

    # Users
    op.drop_index('ix_users_onboarding_completed', table_name='users')
    op.drop_index('ix_users_created_at', table_name='users')

    # Phone numbers
    op.drop_index('ix_phone_numbers_provider', table_name='phone_numbers')
    op.drop_index('ix_phone_numbers_user_created', table_name='phone_numbers')

    # Calls
    op.drop_index('ix_calls_cost', table_name='calls')
    op.drop_index('ix_calls_status', table_name='calls')
    op.drop_index('ix_calls_user_started_desc', table_name='calls')
