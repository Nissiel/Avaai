"""add email fields to studio configs

Revision ID: bf5b6dc65d4c
Revises: 8cffba94b8cc
Create Date: 2025-11-06 18:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "bf5b6dc65d4c"
down_revision: Union[str, None] = "8cffba94b8cc"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("studio_configs", sa.Column("admin_email", sa.String(length=255), nullable=True))
    op.add_column(
        "studio_configs",
        sa.Column("timezone", sa.String(length=64), nullable=False, server_default="Europe/Paris"),
    )
    op.add_column(
        "studio_configs",
        sa.Column("phone_number", sa.String(length=50), nullable=False, server_default=""),
    )
    op.add_column(
        "studio_configs",
        sa.Column("business_hours", sa.String(length=255), nullable=False, server_default="09:00-18:00"),
    )
    op.add_column("studio_configs", sa.Column("fallback_email", sa.String(length=255), nullable=True))
    op.add_column("studio_configs", sa.Column("summary_email", sa.String(length=255), nullable=True))
    op.add_column(
        "studio_configs",
        sa.Column("smtp_server", sa.String(length=255), nullable=False, server_default=""),
    )
    op.add_column(
        "studio_configs",
        sa.Column("smtp_port", sa.String(length=10), nullable=False, server_default="587"),
    )
    op.add_column(
        "studio_configs",
        sa.Column("smtp_username", sa.String(length=255), nullable=False, server_default=""),
    )
    op.add_column(
        "studio_configs",
        sa.Column("smtp_password_encrypted", sa.Text(), nullable=False, server_default=""),
    )

    op.execute(
        """
        UPDATE studio_configs
        SET timezone = COALESCE(timezone, 'Europe/Paris'),
            business_hours = COALESCE(business_hours, '09:00-18:00'),
            smtp_port = COALESCE(smtp_port, '587'),
            smtp_password_encrypted = COALESCE(smtp_password_encrypted, '')
        """
    )

    op.alter_column("studio_configs", "timezone", server_default=None)
    op.alter_column("studio_configs", "business_hours", server_default=None)
    op.alter_column("studio_configs", "smtp_port", server_default=None)
    op.alter_column("studio_configs", "smtp_server", server_default=None)
    op.alter_column("studio_configs", "smtp_username", server_default=None)
    op.alter_column("studio_configs", "smtp_password_encrypted", server_default=None)
    op.alter_column("studio_configs", "phone_number", server_default=None)


def downgrade() -> None:
    op.drop_column("studio_configs", "smtp_password_encrypted")
    op.drop_column("studio_configs", "smtp_username")
    op.drop_column("studio_configs", "smtp_port")
    op.drop_column("studio_configs", "smtp_server")
    op.drop_column("studio_configs", "summary_email")
    op.drop_column("studio_configs", "fallback_email")
    op.drop_column("studio_configs", "business_hours")
    op.drop_column("studio_configs", "phone_number")
    op.drop_column("studio_configs", "timezone")
    op.drop_column("studio_configs", "admin_email")
