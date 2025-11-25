"""Encrypt twilio_account_sid in users table

This migration:
1. Creates encrypted column for twilio_account_sid
2. Encrypts existing data
3. Drops the plain text column

Revision ID: e3c2d4e5f6g7
Revises: d2b1c3d4e5f6
Create Date: 2024-01-01 00:00:02.000000

"""
from alembic import op
import sqlalchemy as sa
import os
from cryptography.fernet import Fernet

# revision identifiers, used by Alembic.
revision = 'e3c2d4e5f6g7'
down_revision = 'd2b1c3d4e5f6'
branch_labels = None
depends_on = None


def get_fernet():
    """Get Fernet encryption instance from environment variable."""
    key = os.getenv('AVA_API_SMTP_ENCRYPTION_KEY')
    if not key:
        raise RuntimeError(
            "AVA_API_SMTP_ENCRYPTION_KEY environment variable is required for this migration. "
            "Please set it before running."
        )
    return Fernet(key.encode())


def upgrade() -> None:
    # === STEP 1: Add encrypted column ===
    op.add_column('users', sa.Column(
        'twilio_account_sid_encrypted',
        sa.Text(),
        nullable=True,
        comment='Encrypted Twilio Account SID'
    ))

    # === STEP 2: Encrypt existing data ===
    # Get connection for data migration
    connection = op.get_bind()
    fernet = get_fernet()

    # Fetch all users with twilio_account_sid
    result = connection.execute(sa.text(
        "SELECT id, twilio_account_sid FROM users WHERE twilio_account_sid IS NOT NULL"
    ))

    for row in result:
        user_id = row[0]
        plain_sid = row[1]

        if plain_sid:
            encrypted = fernet.encrypt(plain_sid.encode()).decode()
            connection.execute(sa.text(
                "UPDATE users SET twilio_account_sid_encrypted = :encrypted WHERE id = :id"
            ), {'encrypted': encrypted, 'id': user_id})

    # === STEP 3: Drop the plain text column ===
    op.drop_column('users', 'twilio_account_sid')


def downgrade() -> None:
    # === Add back plain text column ===
    op.add_column('users', sa.Column(
        'twilio_account_sid',
        sa.String(255),
        nullable=True,
        comment="User's Twilio Account SID"
    ))

    # === Decrypt data back ===
    connection = op.get_bind()
    fernet = get_fernet()

    result = connection.execute(sa.text(
        "SELECT id, twilio_account_sid_encrypted FROM users WHERE twilio_account_sid_encrypted IS NOT NULL"
    ))

    for row in result:
        user_id = row[0]
        encrypted_sid = row[1]

        if encrypted_sid:
            try:
                decrypted = fernet.decrypt(encrypted_sid.encode()).decode()
                connection.execute(sa.text(
                    "UPDATE users SET twilio_account_sid = :decrypted WHERE id = :id"
                ), {'decrypted': decrypted, 'id': user_id})
            except Exception:
                # If decryption fails, leave as null
                pass

    # === Drop encrypted column ===
    op.drop_column('users', 'twilio_account_sid_encrypted')
