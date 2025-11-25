"""encrypt_api_keys

Revision ID: b2d3f0f0c9d1
Revises: bf5b6dc65d4c
Create Date: 2025-02-14 00:00:00.000000

"""
from __future__ import annotations

import base64
import os
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from cryptography.fernet import Fernet


# revision identifiers, used by Alembic.
revision: str = "b2d3f0f0c9d1"
down_revision: Union[str, None] = "bf5b6dc65d4c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _get_fernet() -> Fernet:
    key = os.getenv("AVA_API_SMTP_ENCRYPTION_KEY")
    if not key:
        raise RuntimeError(
            "AVA_API_SMTP_ENCRYPTION_KEY must be set to migrate API keys securely."
        )

    try:
        # Ensure provided key is a valid Fernet key
        base64.urlsafe_b64decode(key.encode("utf-8"))
    except Exception as exc:  # noqa: BLE001 - defensive, re-raised below
        raise RuntimeError("Invalid AVA_API_SMTP_ENCRYPTION_KEY.") from exc

    return Fernet(key.encode("utf-8"))


def _encrypt(fernet: Fernet, value: str | None) -> str | None:
    if not value:
        return None
    token = fernet.encrypt(value.encode("utf-8"))
    return token.decode("utf-8")


def _decrypt(fernet: Fernet, value: str | None) -> str | None:
    if not value:
        return None
    plaintext = fernet.decrypt(value.encode("utf-8"))
    return plaintext.decode("utf-8")


def _preview(value: str | None) -> str | None:
    if not value:
        return None
    return f"{value[:8]}..." if len(value) > 8 else "***"


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "vapi_api_key_encrypted",
            sa.Text(),
            nullable=True,
            comment="Encrypted Vapi API key",
        ),
    )
    op.add_column(
        "users",
        sa.Column(
            "vapi_api_key_preview",
            sa.String(length=32),
            nullable=True,
            comment="Preview of Vapi API key",
        ),
    )
    op.add_column(
        "users",
        sa.Column(
            "twilio_auth_token_encrypted",
            sa.Text(),
            nullable=True,
            comment="Encrypted Twilio Auth Token",
        ),
    )

    bind = op.get_bind()
    metadata = sa.MetaData()
    metadata.bind = bind
    users = sa.Table("users", metadata, autoload_with=bind)

    fernet = _get_fernet()

    results = bind.execute(
        sa.select(
            users.c.id,
            users.c.vapi_api_key,
            users.c.twilio_auth_token,
        )
    ).fetchall()

    for row in results:
        updates = {}
        if row.vapi_api_key:
            encrypted_key = _encrypt(fernet, row.vapi_api_key)
            updates["vapi_api_key_encrypted"] = encrypted_key
            updates["vapi_api_key_preview"] = _preview(row.vapi_api_key)
        if row.twilio_auth_token:
            updates["twilio_auth_token_encrypted"] = _encrypt(fernet, row.twilio_auth_token)

        if updates:
            bind.execute(
                users.update().where(users.c.id == row.id).values(**updates)
            )

    op.drop_column("users", "vapi_api_key")
    op.drop_column("users", "twilio_auth_token")


def downgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "twilio_auth_token",
            sa.String(length=255),
            nullable=True,
            comment="User's Twilio Auth Token",
        ),
    )
    op.add_column(
        "users",
        sa.Column(
            "vapi_api_key",
            sa.String(length=255),
            nullable=True,
            comment="User's personal Vapi.ai API key for their assistants",
        ),
    )

    bind = op.get_bind()
    metadata = sa.MetaData()
    metadata.bind = bind
    users = sa.Table("users", metadata, autoload_with=bind)

    fernet = _get_fernet()

    results = bind.execute(
        sa.select(
            users.c.id,
            users.c.vapi_api_key_encrypted,
            users.c.twilio_auth_token_encrypted,
        )
    ).fetchall()

    for row in results:
        updates = {}
        if row.vapi_api_key_encrypted:
            updates["vapi_api_key"] = _decrypt(fernet, row.vapi_api_key_encrypted)
        if row.twilio_auth_token_encrypted:
            updates["twilio_auth_token"] = _decrypt(fernet, row.twilio_auth_token_encrypted)

        if updates:
            bind.execute(
                users.update().where(users.c.id == row.id).values(**updates)
            )

    op.drop_column("users", "twilio_auth_token_encrypted")
    op.drop_column("users", "vapi_api_key_preview")
    op.drop_column("users", "vapi_api_key_encrypted")
