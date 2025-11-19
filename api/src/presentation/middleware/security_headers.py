"""
Security headers middleware.

Adds security headers to all responses to protect against common web vulnerabilities.
"""

from __future__ import annotations

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from api.src.core.settings import get_settings


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware to add security headers to all responses."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        """Add security headers to response."""
        response = await call_next(request)
        
        settings = get_settings()
        
        # Prevent clickjacking attacks
        response.headers["X-Frame-Options"] = "DENY"
        
        # Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"
        
        # Enable XSS protection (legacy browsers)
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        # Referrer policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Content Security Policy (CSP)
        # Note: Adjusted for API - frontend should have its own CSP
        if settings.environment == "production":
            response.headers["Content-Security-Policy"] = (
                "default-src 'none'; "
                "frame-ancestors 'none'; "
                "base-uri 'self'; "
                "form-action 'self'"
            )
        
        # Strict Transport Security (HTTPS only)
        # Only add HSTS in production and when using HTTPS
        if settings.environment == "production":
            # 1 year = 31536000 seconds
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )
        
        # Permissions Policy (formerly Feature Policy)
        response.headers["Permissions-Policy"] = (
            "camera=(), "
            "microphone=(), "
            "geolocation=(), "
            "interest-cohort=()"  # Disable FLoC
        )
        
        return response


__all__ = ["SecurityHeadersMiddleware"]
