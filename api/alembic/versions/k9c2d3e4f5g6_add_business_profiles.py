"""Add business_profiles table

This migration creates the business_profiles table to store
company/business information for AI agent context.

Revision ID: k9c2d3e4f5g6
Revises: j8b1c2d3e4f5
Create Date: 2024-01-01 00:00:10.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

# revision identifiers, used by Alembic.
revision = 'k9c2d3e4f5g6'
down_revision = 'j8b1c2d3e4f5'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'business_profiles',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True, index=True),

        # Company Identity
        sa.Column('company_name', sa.String(255), nullable=True),
        sa.Column('website', sa.String(512), nullable=True),
        sa.Column('industry', sa.String(100), nullable=True),
        sa.Column('company_size', sa.String(50), nullable=True),

        # Business Focus
        sa.Column('description', sa.Text(), nullable=True, comment='Business description/overview'),
        sa.Column('services', JSONB(), nullable=True, default=[], comment='List of services/products offered'),
        sa.Column('target_market', sa.String(255), nullable=True),
        sa.Column('value_proposition', sa.String(500), nullable=True),

        # Timestamps
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )


def downgrade() -> None:
    op.drop_table('business_profiles')
