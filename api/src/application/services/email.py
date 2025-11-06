"""Application-level helpers for email delivery."""

from __future__ import annotations

import logging
from typing import Optional

from api.src.core.crypto import EncryptionError, get_smtp_encryptor
from api.src.infrastructure.email import EmailService, get_email_service
from api.src.infrastructure.email.smtp_client import SMTPConfig
from api.src.infrastructure.persistence.models.studio_config import StudioConfig as StudioConfigModel

logger = logging.getLogger("ava.email")


def resolve_smtp_config(config: Optional[StudioConfigModel]) -> Optional[SMTPConfig]:
    if not config:
        return None

    if not all(
        [
            config.smtp_server,
            config.smtp_port,
            config.smtp_username,
            config.smtp_password_encrypted,
        ]
    ):
        return None

    encryptor = get_smtp_encryptor()
    try:
        password = encryptor.decrypt(config.smtp_password_encrypted)
    except EncryptionError as exc:
        logger.warning("Unable to decrypt SMTP password, skipping SMTP delivery.", extra={"error": str(exc)})
        return None

    try:
        port = int(config.smtp_port)
    except ValueError:
        logger.warning("Invalid SMTP port '%s', defaulting to 587.", config.smtp_port)
        port = 587

    return SMTPConfig(
        server=config.smtp_server,
        port=port,
        username=config.smtp_username,
        password=password,
        sender=config.smtp_username or None,
    )


def get_user_email_service(config: Optional[StudioConfigModel]) -> EmailService:
    smtp_config = resolve_smtp_config(config)
    return get_email_service(smtp_config=smtp_config)
