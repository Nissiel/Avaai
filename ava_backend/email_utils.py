"""
Utility helpers for delivering call summaries via email.

The email sending logic is isolated here so it can be reused from background
tasks or alternative execution contexts (e.g. CLI tools). The main entry point
is `send_summary_via_email`, which accepts a summary payload and handles SMTP
delivery with sensible defaults and fallbacks.
"""

from __future__ import annotations

import logging
import smtplib
import ssl
from email.message import EmailMessage
from typing import Optional

from .config import Settings

logger = logging.getLogger(__name__)


def build_summary_email(
    settings: Settings,
    summary_text: str,
    *,
    conversation_id: Optional[str] = None,
) -> EmailMessage:
    """
    Construct an `EmailMessage` containing the call summary.

    Args:
        settings: Application settings containing SMTP configuration.
        summary_text: The formatted summary to embed in the email body.
        conversation_id: Optional identifier used in the subject line.

    Returns:
        A ready-to-send `EmailMessage`.
    """

    if not settings.summary_email_recipient:
        raise ValueError("No SUMMARY_EMAIL configured; cannot build email.")

    subject_suffix = f" – {conversation_id}" if conversation_id else ""
    subject = f"Résumé de votre appel avec Ava{subject_suffix}"

    message = EmailMessage()
    message["Subject"] = subject
    message["To"] = settings.summary_email_recipient
    message["From"] = settings.smtp_sender or settings.smtp_username

    # Provide both plain-text and HTML alternatives for maximum compatibility.
    text_body = summary_text
    html_body = (
        "<html><body>"
        "<h2>Résumé de votre appel avec Ava</h2>"
        f"<p>{summary_text.replace(chr(10), '<br />')}</p>"
        "</body></html>"
    )

    message.set_content(text_body, subtype="plain", charset="utf-8")
    message.add_alternative(html_body, subtype="html", charset="utf-8")

    return message


def send_summary_via_email(
    settings: Settings,
    summary_text: str,
    *,
    conversation_id: Optional[str] = None,
) -> None:
    """
    Send the supplied summary via SMTP, logging a warning if delivery fails.

    Args:
        settings: Application settings containing SMTP credentials.
        summary_text: The summary body to send.
        conversation_id: Optional identifier appended to the subject to disambiguate
            concurrent calls.
    """

    if not settings.summary_email_recipient:
        logger.info(
            "No SUMMARY_EMAIL configured; skipping email delivery. Summary: %s",
            summary_text,
        )
        return

    if not settings.smtp_server:
        logger.warning(
            "SUMMARY_EMAIL configured but SMTP_SERVER missing; logging summary instead."
        )
        logger.info("Résumé de l'appel (%s): %s", conversation_id, summary_text)
        return

    message = build_summary_email(
        settings,
        summary_text,
        conversation_id=conversation_id,
    )

    logger.debug(
        "Attempting to send summary email to %s via %s:%s",
        settings.summary_email_recipient,
        settings.smtp_server,
        settings.smtp_port,
    )

    context = ssl.create_default_context()
    try:
        if settings.smtp_use_tls:
            with smtplib.SMTP(settings.smtp_server, settings.smtp_port) as smtp:
                smtp.starttls(context=context)
                if settings.smtp_username and settings.smtp_password:
                    smtp.login(settings.smtp_username, settings.smtp_password)
                smtp.send_message(message)
        else:
            with smtplib.SMTP_SSL(
                settings.smtp_server,
                settings.smtp_port,
                context=context,
            ) as smtp:
                if settings.smtp_username and settings.smtp_password:
                    smtp.login(settings.smtp_username, settings.smtp_password)
                smtp.send_message(message)

        logger.info(
            "Résumé envoyé à %s pour l'appel %s",
            settings.summary_email_recipient,
            conversation_id or "inconnu",
        )
    except Exception:
        logger.exception(
            "Échec de l'envoi du résumé à %s. Résumé complet : %s",
            settings.summary_email_recipient,
            summary_text,
        )

