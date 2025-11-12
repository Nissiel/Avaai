"""Rate limiting configuration using slowapi."""

from __future__ import annotations

from slowapi import Limiter
from slowapi.util import get_remote_address

from api.src.core.settings import get_settings

# Initialize rate limiter with remote address as key
# This limits requests per IP address
limiter = Limiter(key_func=get_remote_address)


def get_rate_limit_string() -> str:
    """
    Get rate limit string from settings.
    
    Returns rate limit in format: "10/minute" or "60/hour"
    """
    settings = get_settings()
    return f"{settings.rate_limit_per_minute}/minute"


__all__ = ["limiter", "get_rate_limit_string"]
