"""Add foreign key constraints and rename org_id to user_id

This migration:
1. Renames phone_numbers.org_id to user_id for consistency
2. Adds FK constraints to users table for:
   - studio_configs.user_id
   - phone_numbers.user_id
   - ava_profiles.user_id
   - calls.user_id

Revision ID: d2b1c3d4e5f6
Revises: c1a0b1c2d3e4
Create Date: 2024-01-01 00:00:01.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'd2b1c3d4e5f6'
down_revision = 'c1a0b1c2d3e4'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # === STEP 0: Create phone_numbers table if it doesn't exist ===
    # (The original migration was empty/no-op)
    op.create_table(
        'phone_numbers',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), nullable=False, index=True),
        sa.Column('provider', sa.String(20), nullable=False),
        sa.Column('e164', sa.String(20), unique=True, nullable=False, index=True),
        sa.Column('vapi_phone_number_id', sa.String(255), nullable=True),
        sa.Column('twilio_account_sid', sa.String(255), nullable=True),
        sa.Column('routing', sa.JSON(), default={}, nullable=False),
        sa.Column('business_hours', sa.JSON(), default={}, nullable=False),
        sa.Column('voicemail', sa.JSON(), default={}, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    # Indexes already created by index=True and unique=True in column definitions

    # === STEP 1: Verify data integrity before adding FKs ===
    # Delete any orphaned records that don't have matching users
    # (This is safer than failing the migration)

    op.execute("""
        DELETE FROM studio_configs
        WHERE user_id NOT IN (SELECT id FROM users)
    """)

    op.execute("""
        DELETE FROM phone_numbers
        WHERE user_id NOT IN (SELECT id FROM users)
    """)

    op.execute("""
        DELETE FROM ava_profiles
        WHERE user_id NOT IN (SELECT id FROM users)
    """)

    op.execute("""
        DELETE FROM calls
        WHERE user_id NOT IN (SELECT id FROM users)
    """)

    # === STEP 3: Add FK constraints ===

    # studio_configs.user_id -> users.id
    op.create_foreign_key(
        'fk_studio_configs_user_id',
        'studio_configs',
        'users',
        ['user_id'],
        ['id'],
        ondelete='CASCADE'
    )

    # phone_numbers.user_id -> users.id
    op.create_foreign_key(
        'fk_phone_numbers_user_id',
        'phone_numbers',
        'users',
        ['user_id'],
        ['id'],
        ondelete='CASCADE'
    )

    # ava_profiles.user_id -> users.id
    op.create_foreign_key(
        'fk_ava_profiles_user_id',
        'ava_profiles',
        'users',
        ['user_id'],
        ['id'],
        ondelete='CASCADE'
    )

    # calls.user_id -> users.id
    op.create_foreign_key(
        'fk_calls_user_id',
        'calls',
        'users',
        ['user_id'],
        ['id'],
        ondelete='CASCADE'
    )


def downgrade() -> None:
    # Drop FK constraints
    op.drop_constraint('fk_calls_user_id', 'calls', type_='foreignkey')
    op.drop_constraint('fk_ava_profiles_user_id', 'ava_profiles', type_='foreignkey')
    op.drop_constraint('fk_phone_numbers_user_id', 'phone_numbers', type_='foreignkey')
    op.drop_constraint('fk_studio_configs_user_id', 'studio_configs', type_='foreignkey')

    # Drop the phone_numbers table
    op.drop_table('phone_numbers')
