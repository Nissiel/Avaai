"""Email infrastructure"""

from api.src.infrastructure.email.resend_client import get_email_service, EmailService

__all__ = ["get_email_service", "EmailService"]
