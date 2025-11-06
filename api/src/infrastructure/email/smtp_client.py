"""Lightweight SMTP email client leveraging the Python stdlib."""

from __future__ import annotations

import asyncio
import logging
import smtplib
import time
from dataclasses import dataclass
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Iterable, Optional

logger = logging.getLogger("ava.smtp")


@dataclass(frozen=True)
class SMTPConfig:
    server: str
    port: int = 587
    username: str = ""
    password: str = ""
    use_starttls: bool = True
    sender: Optional[str] = None

    def is_complete(self) -> bool:
        return all([self.server, self.port, self.username, self.password])


class SMTPClient:
    """Blocking SMTP client executed inside a thread pool."""

    async def send_email(
        self,
        config: SMTPConfig,
        recipients: Iterable[str],
        subject: str,
        html: str,
    ) -> str:
        if not config.is_complete():
            raise ValueError("Incomplete SMTP configuration.")

        message_id = await asyncio.to_thread(
            self._send_email_sync,
            config,
            list(recipients),
            subject,
            html,
        )
        return message_id

    def _send_email_sync(
        self,
        config: SMTPConfig,
        recipients: list[str],
        subject: str,
        html: str,
    ) -> str:
        sender = config.sender or config.username

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = sender
        msg["To"] = ", ".join(recipients)

        msg.attach(MIMEText(html, "html"))

        try:
            started_at = time.perf_counter()
            with smtplib.SMTP(config.server, config.port, timeout=10) as smtp:
                smtp.ehlo()
                if config.use_starttls:
                    smtp.starttls()
                    smtp.ehlo()
                smtp.login(config.username, config.password)
                smtp.send_message(msg)
            duration_ms = (time.perf_counter() - started_at) * 1000
            logger.info(
                "SMTP email dispatched",
                extra={
                    "recipients": recipients,
                    "sender": sender,
                    "server": config.server,
                    "duration_ms": round(duration_ms, 2),
                },
            )
        except smtplib.SMTPAuthenticationError as exc:
            logger.error("SMTP authentication failed.", exc_info=exc)
            raise
        except smtplib.SMTPException as exc:
            logger.error("SMTP send failed.", exc_info=exc)
            raise

        return msg.get("Message-ID", "")


__all__ = ["SMTPClient", "SMTPConfig"]
