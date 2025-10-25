"""
Resend Email Client - Infrastructure Layer
DIVINE Level: 5/5

Handles email sending using Resend.com API.
Beautiful HTML templates for call summaries.
"""

from __future__ import annotations

import resend
from datetime import datetime
from typing import Optional
from api.src.core.settings import get_settings


class EmailService:
    """
    Service for sending emails using Resend.
    
    Features:
    - Beautiful HTML templates
    - Call summary notifications
    - Transcript delivery
    - Error handling
    """

    def __init__(self):
        """Initialize Resend client with API key"""
        settings = get_settings()
        if not settings.resend_api_key:
            raise ValueError("RESEND_API_KEY not configured in settings")
        
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
        business_name: str = "Your Business"
    ) -> bool:
        """
        Send beautiful call summary email.
        
        Args:
            to_email: Recipient email address
            caller_name: Name of the person who called
            caller_phone: Phone number of caller
            transcript: Full conversation transcript
            duration: Call duration in seconds
            call_date: When the call happened
            call_id: Call ID for dashboard link
            business_name: Name of the business
            
        Returns:
            True if email sent successfully
        """
        try:
            # Format duration nicely
            minutes = duration // 60
            seconds = duration % 60
            duration_str = f"{minutes}m {seconds}s" if minutes > 0 else f"{seconds}s"
            
            # Format date nicely
            date_str = call_date.strftime("%B %d, %Y at %H:%M")
            
            # Get settings
            settings = get_settings()
            
            # Build HTML email
            html_content = self._build_call_summary_html(
                caller_name=caller_name,
                caller_phone=caller_phone,
                transcript=transcript,
                duration=duration_str,
                call_date=date_str,
                call_id=call_id,
                business_name=business_name,
                settings=settings
            )
            
            # Send email
            # Using Resend's verified sandbox domain for testing
            params = {
                "from": "AVA <onboarding@resend.dev>",
                "to": [to_email],
                "subject": f"📞 New call from {caller_name}",
                "html": html_content,
            }
            
            result = resend.Emails.send(params)
            
            return bool(result.get("id"))
            
        except Exception as e:
            print(f"❌ Failed to send email: {str(e)}")
            return False

    async def send_email(
        self,
        to: str | list[str],
        subject: str,
        html: str,
        from_email: str = "AVA <onboarding@resend.dev>"
    ) -> dict:
        """
        Send a generic email (DIVINE method for dashboard).
        
        Args:
            to: Recipient email(s)
            subject: Email subject
            html: HTML content
            from_email: Sender email (defaults to verified sandbox)
            
        Returns:
            Resend API response with email ID
            
        Raises:
            Exception: If email sending fails
        """
        try:
            # Normalize to list
            to_list = [to] if isinstance(to, str) else to
            
            params = {
                "from": from_email,
                "to": to_list,
                "subject": subject,
                "html": html,
            }
            
            result = resend.Emails.send(params)
            return result
            
        except Exception as e:
            print(f"❌ Failed to send email: {str(e)}")
            raise

    def _build_call_summary_html(
        self,
        caller_name: str,
        caller_phone: str,
        transcript: str,
        duration: str,
        call_date: str,
        call_id: str,
        business_name: str,
        settings
    ) -> str:
        """
        Build beautiful HTML email template.
        
        Returns:
            HTML string ready to send
        """
        # Format transcript with line breaks
        formatted_transcript = transcript.replace("\n", "<br>")
        
        # Dashboard link
        dashboard_url = f"{settings.app_url}/dashboard/calls/{call_id}"
        
        return f"""
<!DOCTYPE html>
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
        <!-- Header -->
        <div class="header">
            <h1>📞 New Call Received</h1>
            <p>{call_date}</p>
        </div>
        
        <!-- Content -->
        <div class="content">
            <!-- Caller Info -->
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
            
            <!-- Transcript -->
            <div class="section">
                <h2>Call Transcript</h2>
                <div class="transcript">{formatted_transcript}</div>
            </div>
            
            <!-- CTA -->
            <div style="text-align: center; margin-top: 32px;">
                <a href="{dashboard_url}" class="cta-button">
                    View in Dashboard →
                </a>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <p>
                This email was sent by <strong>AVA</strong> - Your AI Receptionist<br>
                <a href="{settings.app_url}">Visit Dashboard</a>
            </p>
        </div>
    </div>
</body>
</html>
        """


# Singleton instance - created lazily
_email_service_instance = None


def get_email_service() -> EmailService:
    """Get or create the email service singleton"""
    global _email_service_instance
    if _email_service_instance is None:
        _email_service_instance = EmailService()
    return _email_service_instance
