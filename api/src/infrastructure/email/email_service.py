"""Unified email delivery service with SMTP + Resend fallback."""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass
from datetime import datetime
from typing import Iterable, Optional, Sequence

import resend

from api.src.core.settings import get_settings
from api.src.infrastructure.email.smtp_client import SMTPClient, SMTPConfig

logger = logging.getLogger("ava.email")


@dataclass(frozen=True)
class EmailRequest:
    to: Sequence[str]
    subject: str
    html: str
    sender: Optional[str] = None


class EmailService:
    """Dispatch emails via user-provided SMTP or Resend fallback."""

    def __init__(self, smtp_config: Optional[SMTPConfig] = None):
        settings = get_settings()
        self._smtp_config = smtp_config if smtp_config and smtp_config.is_complete() else None
        self._smtp_client = SMTPClient() if self._smtp_config else None

        self._resend_enabled = bool(settings.resend_api_key)
        self._resend_from = f"AVA <onboarding@{settings.resend_domain or 'resend.dev'}>"
        if self._resend_enabled:
            resend.api_key = settings.resend_api_key

    async def send_call_summary(
        self,
        to_email: str,
        caller_name: str,
        caller_phone: str,
        transcript: str,
        duration: int,
        call_date: datetime,
        call_id: str,
        business_name: str = "Your Business",
    ) -> bool:
        subject = f"📞 New call from {caller_name}"
        html = self._build_call_summary_html(
            caller_name=caller_name,
            caller_phone=caller_phone,
            transcript=transcript,
            duration=self._format_duration(duration),
            call_date=call_date.strftime("%B %d, %Y at %H:%M"),
            call_id=call_id,
            business_name=business_name,
        )

        response = await self.send_email(
            to=[to_email],
            subject=subject,
            html=html,
        )
        return bool(response.get("id"))

    async def send_email(
        self,
        to: Sequence[str] | str,
        subject: str,
        html: str,
        sender: Optional[str] = None,
    ) -> dict:
        recipients = [to] if isinstance(to, str) else list(to)
        request = EmailRequest(to=recipients, subject=subject, html=html, sender=sender)

        smtp_error: Optional[Exception] = None
        if self._smtp_client and self._smtp_config:
            try:
                message_id = await self._smtp_client.send_email(
                    self._smtp_config,
                    recipients=request.to,
                    subject=request.subject,
                    html=request.html,
                )
                return {"id": message_id or "smtp_delivery"}
            except Exception as exc:  # pragma: no cover - network failure
                smtp_error = exc
                logger.warning(
                    "SMTP delivery failed, attempting Resend fallback.",
                    extra={"error": str(exc), "recipients": recipients},
                )

        if not self._resend_enabled:
            if smtp_error:
                raise smtp_error
            raise RuntimeError("No email delivery backend is configured.")

        result = await asyncio.to_thread(
            resend.Emails.send,
            {
                "from": request.sender or self._smtp_config.sender if self._smtp_config else self._resend_from,
                "to": request.to,
                "subject": request.subject,
                "html": request.html,
            },
        )
        return result

    # --------------------------------------------------------------------- #
    # Helpers
    # --------------------------------------------------------------------- #

    @staticmethod
    def _format_duration(duration_seconds: int) -> str:
        minutes, seconds = divmod(duration_seconds, 60)
        if minutes:
            return f"{minutes}m {seconds}s"
        return f"{seconds}s"

    def _build_call_summary_html(
        self,
        caller_name: str,
        caller_phone: str,
        transcript: str,
        duration: str,
        call_date: str,
        call_id: str,
        business_name: str,
    ) -> str:
        formatted_transcript = transcript.replace("\n", "<br>")
        settings = get_settings()
        dashboard_url = f"{settings.app_url}/dashboard/calls/{call_id}"

        return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Call Summary</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f9fafb;
        }}
        .container {{
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }}
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }}
        .header h1 {{
            margin: 0 0 10px 0;
            font-size: 28px;
            font-weight: 600;
        }}
        .header p {{
            margin: 0;
            opacity: 0.9;
            font-size: 16px;
        }}
        .content {{
            padding: 40px 30px;
        }}
        .section {{
            background: #f9fafb;
            padding: 24px;
            margin: 24px 0;
            border-radius: 12px;
            border: 1px solid #e5e7eb;
        }}
        .section h2 {{
            margin: 0 0 16px 0;
            font-size: 20px;
            font-weight: 600;
            color: #111827;
        }}
        .info-row {{
            display: flex;
            margin-bottom: 12px;
        }}
        .info-label {{
            font-weight: 600;
            color: #667eea;
            min-width: 120px;
        }}
        .info-value {{
            color: #374151;
        }}
        .transcript {{
            background: #ffffff;
            padding: 20px;
            border-left: 4px solid #667eea;
            border-radius: 8px;
            font-size: 15px;
            line-height: 1.6;
            color: #374151;
            white-space: pre-wrap;
            word-wrap: break-word;
        }}
        .cta-button {{
            display: inline-block;
            background: #667eea;
            color: white !important;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            text-align: center;
            transition: background 0.3s ease;
        }}
        .cta-button:hover {{
            background: #5568d3;
        }}
        .footer {{
            text-align: center;
            padding: 30px;
            color: #6b7280;
            font-size: 14px;
        }}
        .footer a {{
            color: #667eea;
            text-decoration: none;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📞 New Call Received</h1>
            <p>{call_date}</p>
        </div>
        <div class="content">
            <div class="section">
                <h2>Caller Information</h2>
                <div class="info-row">
                    <div class="info-label">Name:</div>
                    <div class="info-value">{caller_name}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Phone:</div>
                    <div class="info-value">{caller_phone}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Duration:</div>
                    <div class="info-value">{duration}</div>
                </div>
            </div>
            <div class="section">
                <h2>Call Transcript</h2>
                <div class="transcript">{formatted_transcript}</div>
            </div>
            <div style="text-align: center; margin-top: 32px;">
                <a href="{dashboard_url}" class="cta-button">
                    View in Dashboard →
                </a>
            </div>
        </div>
        <div class="footer">
            <p>
                This email was sent by <strong>{business_name}</strong><br>
                <a href="{settings.app_url}">Visit Dashboard</a>
            </p>
        </div>
    </div>
</body>
</html>"""


def get_email_service(smtp_config: Optional[SMTPConfig] = None) -> EmailService:
    """Factory preserving legacy signature while enabling SMTP overrides."""
    return EmailService(smtp_config=smtp_config)


__all__ = ["EmailService", "get_email_service"]
