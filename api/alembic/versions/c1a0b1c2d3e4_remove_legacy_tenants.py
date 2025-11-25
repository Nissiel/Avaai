"""Remove legacy tenants table and migrate to user_id

This migration:
1. Adds user_id column to ava_profiles and calls
2. Migrates tenant_id (UUID) to user_id (String)
3. Drops tenant_id columns and FK constraints
4. Drops the legacy tenants table

Revision ID: c1a0b1c2d3e4
Revises: b2d3f0f0c9d1
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'c1a0b1c2d3e4'
down_revision = 'b2d3f0f0c9d1'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # === STEP 1: Add user_id columns ===

    # Add user_id to ava_profiles
    op.add_column('ava_profiles', sa.Column('user_id', sa.String(36), nullable=True))

    # Add user_id to calls
    op.add_column('calls', sa.Column('user_id', sa.String(36), nullable=True))

    # === STEP 2: Migrate data from tenant_id (UUID) to user_id (String) ===
    # tenant_id::text gives us the UUID as a string

    op.execute("""
        UPDATE ava_profiles
        SET user_id = tenant_id::text
        WHERE tenant_id IS NOT NULL
    """)

    op.execute("""
        UPDATE calls
        SET user_id = tenant_id::text
        WHERE tenant_id IS NOT NULL
    """)

    # === STEP 3: Make user_id NOT NULL after migration ===
    op.alter_column('ava_profiles', 'user_id', nullable=False)
    op.alter_column('calls', 'user_id', nullable=False)

    # === STEP 4: Add indexes on user_id ===
    op.create_index('ix_ava_profiles_user_id', 'ava_profiles', ['user_id'])
    op.create_index('ix_calls_user_id', 'calls', ['user_id'])

    # === STEP 5: Drop FK constraints to tenants ===
    op.drop_constraint('ava_profiles_tenant_id_fkey', 'ava_profiles', type_='foreignkey')
    op.drop_constraint('calls_tenant_id_fkey', 'calls', type_='foreignkey')

    # === STEP 6: Drop tenant_id columns ===
    op.drop_index('ix_calls_tenant_id', table_name='calls')
    op.drop_column('calls', 'tenant_id')

    # For ava_profiles, tenant_id is the primary key, need to change PK first
    # Add new id column as PK
    op.add_column('ava_profiles', sa.Column('id', sa.String(36), nullable=True))
    op.execute("UPDATE ava_profiles SET id = user_id")
    op.alter_column('ava_profiles', 'id', nullable=False)

    # Drop old PK and create new one
    op.drop_constraint('ava_profiles_pkey', 'ava_profiles', type_='primary')
    op.create_primary_key('ava_profiles_pkey', 'ava_profiles', ['id'])

    # Now drop the old tenant_id column
    op.drop_column('ava_profiles', 'tenant_id')

    # === STEP 7: Drop the legacy tenants table ===
    op.drop_table('tenants')

    # === STEP 8: Add created_at to ava_profiles (was missing) ===
    op.add_column('ava_profiles', sa.Column(
        'created_at',
        sa.DateTime(timezone=True),
        server_default=sa.text('now()'),
        nullable=False
    ))


def downgrade() -> None:
    # === Recreate tenants table ===
    op.create_table(
        'tenants',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(120), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False)
    )

    # === Restore ava_profiles ===
    op.drop_column('ava_profiles', 'created_at')

    # Add back tenant_id column
    op.add_column('ava_profiles', sa.Column(
        'tenant_id',
        postgresql.UUID(as_uuid=True),
        nullable=True
    ))

    # Migrate data back
    op.execute("""
        UPDATE ava_profiles
        SET tenant_id = user_id::uuid
        WHERE user_id IS NOT NULL
    """)

    # Insert tenant records for each user
    op.execute("""
        INSERT INTO tenants (id, name, created_at)
        SELECT tenant_id, 'Migrated Tenant', now()
        FROM ava_profiles
        WHERE tenant_id IS NOT NULL
        ON CONFLICT DO NOTHING
    """)

    op.alter_column('ava_profiles', 'tenant_id', nullable=False)

    # Change PK back
    op.drop_constraint('ava_profiles_pkey', 'ava_profiles', type_='primary')
    op.create_primary_key('ava_profiles_pkey', 'ava_profiles', ['tenant_id'])

    # Drop new columns
    op.drop_index('ix_ava_profiles_user_id', table_name='ava_profiles')
    op.drop_column('ava_profiles', 'id')
    op.drop_column('ava_profiles', 'user_id')

    # Add FK back
    op.create_foreign_key(
        'ava_profiles_tenant_id_fkey',
        'ava_profiles',
        'tenants',
        ['tenant_id'],
        ['id'],
        ondelete='CASCADE'
    )

    # === Restore calls ===
    op.add_column('calls', sa.Column(
        'tenant_id',
        postgresql.UUID(as_uuid=True),
        nullable=True
    ))

    # Migrate data back
    op.execute("""
        UPDATE calls
        SET tenant_id = user_id::uuid
        WHERE user_id IS NOT NULL
    """)

    op.alter_column('calls', 'tenant_id', nullable=False)

    # Add FK and index back
    op.create_index('ix_calls_tenant_id', 'calls', ['tenant_id'])
    op.create_foreign_key(
        'calls_tenant_id_fkey',
        'calls',
        'tenants',
        ['tenant_id'],
        ['id'],
        ondelete='CASCADE'
    )

    # Drop new columns
    op.drop_index('ix_calls_user_id', table_name='calls')
    op.drop_column('calls', 'user_id')
