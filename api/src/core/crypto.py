"""Symmetric encryption helpers for sensitive configuration values."""

from __future__ import annotations

import base64
import logging
from dataclasses import dataclass
from typing import Optional

from cryptography.fernet import Fernet, InvalidToken

from api.src.core.settings import get_settings

logger = logging.getLogger("ava.crypto")


class EncryptionError(RuntimeError):
    """Raised when encryption or decryption cannot be performed."""


@dataclass(frozen=True)
class SymmetricEncryptor:
    """Thin wrapper around Fernet to simplify encryption/decryption."""

    _fernet: Optional[Fernet]

    def __bool__(self) -> bool:  # pragma: no cover - trivial
        return self._fernet is not None

    def encrypt(self, plaintext: str) -> str:
        if not plaintext:
            return ""
        if not self._fernet:
            raise EncryptionError("SMTP encryption key is not configured.")
        token = self._fernet.encrypt(plaintext.encode("utf-8"))
        return token.decode("utf-8")

    def decrypt(self, token: str) -> str:
        if not token:
            return ""
        if not self._fernet:
            raise EncryptionError("SMTP encryption key is not configured.")
        try:
            decrypted = self._fernet.decrypt(token.encode("utf-8"))
            return decrypted.decode("utf-8")
        except InvalidToken as exc:
            raise EncryptionError("Invalid encryption token.") from exc


_SMTP_ENCRYPTOR: Optional[SymmetricEncryptor] = None


def _load_fernet(key: str) -> Optional[Fernet]:
    if not key:
        return None

    try:
        # Validate base64 encoding – Fernet requires 32-byte urlsafe base64 string
        base64.urlsafe_b64decode(key.encode("utf-8"))
    except (ValueError, base64.binascii.Error) as exc:  # pragma: no cover - defensive
        logger.error("Invalid SMTP encryption key provided.", exc_info=exc)
        raise EncryptionError("Invalid SMTP encryption key.") from exc

    return Fernet(key.encode("utf-8"))


def get_smtp_encryptor() -> SymmetricEncryptor:
    """Return cached encryptor for SMTP secrets."""
    global _SMTP_ENCRYPTOR

    if _SMTP_ENCRYPTOR is None:
        settings = get_settings()
        fernet = _load_fernet(settings.smtp_encryption_key) if settings.smtp_encryption_key else None
        _SMTP_ENCRYPTOR = SymmetricEncryptor(fernet)

    return _SMTP_ENCRYPTOR


__all__ = ["SymmetricEncryptor", "EncryptionError", "get_smtp_encryptor"]
