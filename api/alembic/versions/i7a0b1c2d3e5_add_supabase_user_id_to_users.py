"""Add supabase_user_id column to users

Revision ID: i7a0b1c2d3e5
Revises: h6f5g7h8i9j0
Create Date: 2024-08-13 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'i7a0b1c2d3e5'
down_revision = 'h6f5g7h8i9j0'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('supabase_user_id', sa.String(length=64), nullable=True))
    op.create_unique_constraint('uq_users_supabase_user_id', 'users', ['supabase_user_id'])
    op.create_index('ix_users_supabase_user_id', 'users', ['supabase_user_id'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_users_supabase_user_id', table_name='users')
    op.drop_constraint('uq_users_supabase_user_id', 'users', type_='unique')
    op.drop_column('users', 'supabase_user_id')
