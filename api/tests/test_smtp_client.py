from unittest.mock import MagicMock, patch

import pytest

from api.src.infrastructure.email.smtp_client import SMTPClient, SMTPConfig


@pytest.mark.asyncio
@patch("api.src.infrastructure.email.smtp_client.smtplib.SMTP")
async def test_smtp_client_sends_email(smtp_cls: MagicMock):
    smtp_instance = smtp_cls.return_value.__enter__.return_value

    client = SMTPClient()
    config = SMTPConfig(server="smtp.test", port=587, username="user@test", password="secret")
    await client.send_email(config, ["dest@test"], "Subject", "<p>Hello</p>")

    smtp_instance.starttls.assert_called_once()
    smtp_instance.login.assert_called_once_with("user@test", "secret")
    smtp_instance.send_message.assert_called_once()


@pytest.mark.asyncio
async def test_smtp_client_validates_configuration():
    client = SMTPClient()
    config = SMTPConfig(server="", port=587, username="", password="")

    with pytest.raises(ValueError):
        await client.send_email(config, ["dest@test"], "Subject", "<p>Hello</p>")
