"""
Security validation module for startup checks.

Validates critical security configuration before allowing the application to start.
Prevents common security misconfigurations from reaching production.
"""

from __future__ import annotations

import logging
import sys
from typing import List, Tuple

from api.src.core.settings import get_settings

logger = logging.getLogger(__name__)


class SecurityValidationError(Exception):
    """Raised when security validation fails."""
    pass


def validate_jwt_secret() -> Tuple[bool, str]:
    """
    Validate JWT secret key configuration.
    
    Returns:
        (is_valid, error_message)
    """
    settings = get_settings()
    
    if not settings.jwt_secret_key:
        return False, "JWT_SECRET_KEY is not set"
    
    if settings.jwt_secret_key == "CHANGE_ME_IN_PRODUCTION_USE_ENV_VAR":
        if settings.environment == "production":
            return False, "JWT_SECRET_KEY must be changed in production"
        logger.warning("⚠️  JWT_SECRET_KEY using default value (development only)")
    
    if len(settings.jwt_secret_key) < 32:
        return False, f"JWT_SECRET_KEY is too short ({len(settings.jwt_secret_key)} chars, minimum 32)"
    
    return True, ""


def validate_encryption_key() -> Tuple[bool, str]:
    """
    Validate encryption key for SMTP passwords.
    
    Returns:
        (is_valid, error_message)
    """
    settings = get_settings()
    
    if not settings.smtp_encryption_key:
        # Encryption key is optional - only needed if users want email integration
        logger.info("ℹ️  SMTP_ENCRYPTION_KEY not set (email integration will be disabled)")
        return True, ""
    
    # Fernet keys are always 44 bytes when base64 encoded
    if len(settings.smtp_encryption_key) != 44:
        return False, f"SMTP_ENCRYPTION_KEY invalid length ({len(settings.smtp_encryption_key)} bytes, expected 44)"
    
    return True, ""


def validate_database_url() -> Tuple[bool, str]:
    """
    Validate database URL configuration.
    
    Returns:
        (is_valid, error_message)
    """
    settings = get_settings()
    
    if not settings.database_url:
        return False, "DATABASE_URL is not set"
    
    if "postgresql" not in settings.database_url.lower():
        return False, "DATABASE_URL must be a PostgreSQL connection string"
    
    if settings.environment == "production":
        if "localhost" in settings.database_url or "127.0.0.1" in settings.database_url:
            return False, "DATABASE_URL points to localhost in production"
    
    return True, ""


def validate_cors_configuration() -> Tuple[bool, str]:
    """
    Validate CORS allowed origins.
    
    Returns:
        (is_valid, error_message)
    """
    settings = get_settings()
    
    if settings.environment == "production":
        if not settings.allowed_origins:
            return False, "ALLOWED_ORIGINS must be set in production"
        
        # Check for wildcard in production
        for origin in settings.allowed_origins:
            if "*" in origin:
                return False, "ALLOWED_ORIGINS cannot contain wildcards in production"
            
            # Check for localhost/127.0.0.1 in production
            if "localhost" in origin or "127.0.0.1" in origin:
                logger.warning(f"⚠️  Production CORS allows localhost: {origin}")
    
    return True, ""


def validate_external_api_keys() -> Tuple[bool, str]:
    """
    Validate external API keys (non-critical, just warnings).
    
    Returns:
        (is_valid, error_message)
    """
    settings = get_settings()
    warnings = []
    
    if not settings.vapi_api_key:
        warnings.append("VAPI_API_KEY not set (voice assistants will not work)")
    
    if not settings.twilio_account_sid or not settings.twilio_auth_token:
        warnings.append("Twilio credentials not set (phone number import will not work)")
    
    if not settings.resend_api_key:
        warnings.append("RESEND_API_KEY not set (email notifications will not work)")
    
    # These are warnings, not errors - API can start without them
    for warning in warnings:
        logger.warning(f"⚠️  {warning}")
    
    return True, ""


def run_security_validation(strict: bool = True) -> None:
    """
    Run all security validations.
    
    Args:
        strict: If True, raise exception on validation failure. If False, only log errors.
    
    Raises:
        SecurityValidationError: If validation fails and strict=True
    """
    logger.info("🔒 Running security validation...")
    
    validations = [
        ("JWT Secret", validate_jwt_secret),
        ("Encryption Key", validate_encryption_key),
        ("Database URL", validate_database_url),
        ("CORS Configuration", validate_cors_configuration),
        ("External API Keys", validate_external_api_keys),
    ]
    
    errors: List[str] = []
    
    for name, validator in validations:
        try:
            is_valid, error_msg = validator()
            if is_valid:
                logger.info(f"  ✅ {name}")
            else:
                logger.error(f"  ❌ {name}: {error_msg}")
                errors.append(f"{name}: {error_msg}")
        except Exception as e:
            logger.exception(f"  ❌ {name}: Validation error")
            errors.append(f"{name}: {str(e)}")
    
    if errors:
        error_summary = "\n  - " + "\n  - ".join(errors)
        message = f"""
╔═══════════════════════════════════════════════════════════════╗
║                 SECURITY VALIDATION FAILED                    ║
╚═══════════════════════════════════════════════════════════════╝

The following security issues were detected:{error_summary}

⚠️  APPLICATION STARTUP BLOCKED

Please fix these issues before starting the application.
See api/.env.example for configuration examples.

Generate secure keys:
  JWT Secret:       openssl rand -hex 32
  Encryption Key:   python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

╚═══════════════════════════════════════════════════════════════╝
"""
        
        if strict:
            logger.critical(message)
            raise SecurityValidationError(message)
        else:
            logger.error(message)
    else:
        logger.info("✅ All security validations passed")


__all__ = ["run_security_validation", "SecurityValidationError"]
