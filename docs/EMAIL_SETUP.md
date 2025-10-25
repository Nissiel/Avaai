# 📧 Email Notifications Setup Guide

## Overview

AVA uses **Resend.com** to send beautiful email notifications after each call.

## Features

✅ **Automatic call summaries** sent to business owner  
✅ **Full transcript** included in email  
✅ **Caller information** (name, phone, duration)  
✅ **Beautiful HTML templates** built with React Email  
✅ **Direct link to dashboard** for full call details

---

## 🚀 Setup Instructions

### 1. Create Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up for free (3,000 emails/month included)
3. Verify your email address

### 2. Get API Key

1. Log in to Resend dashboard
2. Go to **API Keys** section
3. Click "Create API Key"
4. Copy the key (starts with `re_`)

### 3. Configure Environment Variables

Add to `api/.env`:

```bash
# Email - Resend.com
AVA_API_RESEND_API_KEY=re_your_actual_api_key_here
AVA_API_RESEND_DOMAIN=avaai.app  # Or your verified domain
AVA_API_APP_URL=http://localhost:3000  # Or production URL
```

### 4. Verify Domain (Optional but Recommended)

**For production:**
1. Go to Resend dashboard → Domains
2. Click "Add Domain"
3. Enter your domain (e.g., `avaai.app`)
4. Add the provided DNS records to your domain provider
5. Wait for verification (usually < 1 hour)

**For development:**
- You can use the default Resend domain (`resend.dev`)
- Emails will show "via resend.dev" in recipient inbox

---

## 📧 Email Template

Emails include:

```
┌─────────────────────────────────────────┐
│   📞 New Call Received                  │
│   October 24, 2025 at 14:30            │
├─────────────────────────────────────────┤
│                                         │
│   Caller Information                    │
│   Name: John Doe                        │
│   Phone: +1 555-123-4567                │
│   Duration: 3m 45s                      │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│   Call Transcript                       │
│                                         │
│   AVA: Hello! This is AVA. May I have  │
│   your first name please?               │
│                                         │
│   Caller: Hi, it's John.                │
│                                         │
│   AVA: Thank you John. And your last   │
│   name?                                 │
│                                         │
│   ...                                   │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│   [View in Dashboard →]                 │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🧪 Testing

### Test Email Sending

```bash
# Start backend server
cd api
../.venv/bin/uvicorn main:app --reload

# Trigger test webhook (simulate Vapi call.ended event)
curl -X POST http://localhost:8000/api/v1/webhooks/vapi \
  -H "Content-Type: application/json" \
  -d '{
    "type": "call.ended",
    "call": {
      "id": "test-call-123",
      "duration": 180,
      "customer": {
        "number": "+15551234567",
        "name": "Test User"
      },
      "transcript": [
        {"role": "assistant", "message": "Hello!"},
        {"role": "user", "message": "Hi!"}
      ],
      "endedAt": "2025-10-24T14:30:00Z"
    }
  }'
```

**Expected result:**
- Email sent to `admin@avaai.app` (or configured org email)
- Check terminal for: `✅ Email sent to admin@avaai.app`

---

## 🎨 Customizing Email Templates

Edit: `api/src/infrastructure/email/resend_client.py`

```python
def _build_call_summary_html(...):
    # Modify HTML structure
    # Change colors, layout, content
    return """
    <!DOCTYPE html>
    <html>
      ... your custom template ...
    </html>
    """
```

---

## 🔧 Troubleshooting

### "Invalid API key" Error

✅ Check `AVA_API_RESEND_API_KEY` is set correctly  
✅ API key should start with `re_`  
✅ No extra spaces or quotes

### Emails Not Sending

✅ Check Resend dashboard → Logs  
✅ Verify email address format  
✅ Check spam folder  
✅ Ensure you're within free tier limits (3k/month)

### "Failed to send email" in Logs

✅ Check network connectivity  
✅ Verify Resend API is accessible  
✅ Check API key hasn't expired

---

## 📊 Monitoring

### Resend Dashboard

- **Sent Emails**: See all emails sent
- **Delivery Status**: Track opens, clicks
- **Error Logs**: Debug failed sends
- **Usage**: Monitor API quota

### Backend Logs

```bash
# Watch for email events
tail -f logs/app.log | grep "Email"
```

---

## 🚀 Production Checklist

- [ ] Verify custom domain in Resend
- [ ] Use production API key (not test key)
- [ ] Set `AVA_API_APP_URL` to production URL
- [ ] Configure DMARC/SPF/DKIM for deliverability
- [ ] Set up email monitoring/alerts
- [ ] Test with real user email addresses

---

## 💡 Tips

**High Volume (>3k emails/month)?**
- Upgrade to Resend Pro ($20/month for 50k emails)
- Or switch to AWS SES (cheaper at scale)

**Want Reply-To functionality?**
```python
params = {
    "from": "AVA <noreply@avaai.app>",
    "reply_to": ["support@avaai.app"],  # Add this
    "to": [to_email],
    ...
}
```

**Want attachments?**
```python
params = {
    ...
    "attachments": [{
        "filename": "call_transcript.pdf",
        "content": base64_pdf_content
    }]
}
```

---

## 🆘 Support

- Resend Docs: https://resend.com/docs
- Resend Discord: https://discord.gg/resend
- AVA Support: Open GitHub issue

---

**Happy Emailing! 📧✨**
