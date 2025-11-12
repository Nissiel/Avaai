# 🔌 Integrations API Reference

**Version:** 1.0  
**Last Updated:** November 12, 2025  
**Status:** Production Ready (Phase 2-4)

---

## 🎯 Overview

This document provides complete API contracts for AVA's external integrations:
- **Vapi Remote Settings** - Configure voice assistant behavior
- **Twilio Integration** - Telephony and SMS services
- **Email Integration** - Transactional email delivery (stub)
- **Calendar Integration** - Event synchronization (stub)

---

## 🔐 Authentication

All endpoints require Bearer token authentication:

```http
Authorization: Bearer <jwt_token>
```

Obtain token via `/api/v1/auth/login` endpoint.

---

## 📡 Correlation IDs

All requests/responses include `X-Correlation-ID` header for distributed tracing:

```http
X-Correlation-ID: 550e8400-e29b-41d4-a716-446655440000
```

Use this ID when reporting issues or debugging.

---

## 🎙️ Vapi Remote Settings

### List All Settings

**Endpoint:** `GET /api/v1/vapi/settings`

**Description:** Retrieve all Vapi configuration key/value pairs for the authenticated user.

**Request:**
```http
GET /api/v1/vapi/settings
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "settings": [
    {
      "key": "greeting_message",
      "value": "Hello! How can I help you today?",
      "updated_at": "2025-11-12T10:00:00Z"
    },
    {
      "key": "max_call_duration",
      "value": 1800,
      "updated_at": "2025-11-12T09:30:00Z"
    },
    {
      "key": "voice_speed",
      "value": 1.0,
      "updated_at": "2025-11-11T15:20:00Z"
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid Vapi API key configured
- `429 Too Many Requests` - Rate limit exceeded (10/min)
- `502 Bad Gateway` - Vapi API unreachable
- `503 Service Unavailable` - Circuit breaker open (retry after 30s)

---

### Get Single Setting

**Endpoint:** `GET /api/v1/vapi/settings/{key}`

**Description:** Retrieve a specific Vapi configuration value.

**Request:**
```http
GET /api/v1/vapi/settings/greeting_message
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "setting": {
    "key": "greeting_message",
    "value": "Hello! How can I help you today?",
    "updated_at": "2025-11-12T10:00:00Z"
  }
}
```

**Error Responses:**
- Same as List endpoint
- `404 Not Found` - Setting key doesn't exist

---

### Update Setting

**Endpoint:** `PUT /api/v1/vapi/settings/{key}`

**Description:** Update or create a Vapi configuration value.

**Request:**
```http
PUT /api/v1/vapi/settings/greeting_message
Authorization: Bearer <token>
Content-Type: application/json

{
  "value": "Hi there! Welcome to AVA. How may I assist you?"
}
```

**Supported Value Types:**
- String: `"hello world"`
- Number: `1800` or `1.5`
- Boolean: `true` or `false`
- Object: `{"key": "value"}`
- Array: `["item1", "item2"]`

**Response (200 OK):**
```json
{
  "setting": {
    "key": "greeting_message",
    "value": "Hi there! Welcome to AVA. How may I assist you?",
    "updated_at": "2025-11-12T14:30:00Z"
  }
}
```

**Error Responses:**
- Same as Get endpoint
- `400 Bad Request` - Invalid JSON value

---

### Standard Vapi Setting Keys

| Key | Type | Default | Description | Constraints |
|-----|------|---------|-------------|-------------|
| `greeting_message` | string | "Hello!" | Initial assistant greeting | 1-200 chars |
| `max_call_duration` | integer | 1800 | Max call seconds | 60-3600 |
| `voice_speed` | float | 1.0 | Speech rate | 0.5-1.2 |
| `temperature` | float | 0.7 | GPT temperature | 0.0-2.0 |
| `max_tokens` | integer | 250 | Max response tokens | 50-1000 |
| `enable_transcription` | boolean | true | Record transcripts | - |

**Custom Keys:**
You can create custom keys for application-specific configuration.

---

## 📞 Twilio Integration

### List Phone Numbers

**Endpoint:** `GET /api/v1/twilio/numbers`

**Description:** List all Twilio phone numbers available to the user.

**Request:**
```http
GET /api/v1/twilio/numbers
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "numbers": [
    {
      "phone_number": "+15551234567",
      "friendly_name": "Main Business Line",
      "capabilities": {
        "voice": true,
        "sms": true,
        "mms": false
      }
    }
  ]
}
```

**Credential Resolution:**
1. User's `twilio_account_sid` / `twilio_auth_token` (if configured)
2. Fallback to `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` env vars
3. Error if neither available

**Error Responses:**
- `503 Service Unavailable` - No Twilio credentials configured

---

## 📧 Email Integration (Stub Mode)

> **⚠️ Development Only:** Requires `INTEGRATIONS_STUB_MODE=true`

### Send Test Email

**Endpoint:** `POST /api/v1/integrations/email/test`

**Description:** Validate email payload (doesn't actually send in stub mode).

**Request:**
```http
POST /api/v1/integrations/email/test
Authorization: Bearer <token>
Content-Type: application/json

{
  "to": "user@example.com",
  "subject": "Test Email",
  "text": "Hello from AVA!"
}
```

**Validation Rules:**
- `to`: Valid email address (RFC 5322)
- `subject`: 1-120 characters
- `text`: 1-2000 characters

**Response (200 OK - Stub):**
```json
{
  "backend": "resend",
  "delivered": false,
  "message": "Email not sent in stub mode. Configure Resend or SMTP in Settings → Email to enable delivery."
}
```

**Production Setup:**

1. **Option A: Resend (Recommended)**
   ```bash
   # Set environment variable
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   INTEGRATIONS_STUB_MODE=false
   ```

2. **Option B: Custom SMTP**
   - Configure in user settings: Settings → Email → SMTP
   - Requires: host, port, username, password

**Error Responses:**
- `403 Forbidden` - Stub mode disabled but not configured
- `400 Bad Request` - Invalid email format

---

## 📅 Calendar Integration (Stub Mode)

> **⚠️ Development Only:** Requires `INTEGRATIONS_STUB_MODE=true`

### List Calendar Events

**Endpoint:** `GET /api/v1/integrations/calendar/{provider}/events`

**Supported Providers:**
- `google` - Google Workspace
- `microsoft` - Microsoft 365

**Request:**
```http
GET /api/v1/integrations/calendar/google/events
Authorization: Bearer <token>
```

**Response (200 OK - Stub):**
```json
{
  "provider": "google",
  "status": "stub",
  "next_steps": "Connect Google Workspace via OAuth (Scopes: calendar.events.readonly).",
  "events": [
    {
      "id": "stub-google-0",
      "title": "Discovery Call #1",
      "start": "2025-11-12T11:00:00Z",
      "end": "2025-11-12T12:00:00Z",
      "location": "Google Meet",
      "attendees": ["user@example.com"]
    }
  ]
}
```

**Production Setup (Coming in Phase 5):**

1. **Google Calendar:**
   - OAuth scopes: `https://www.googleapis.com/auth/calendar.events.readonly`
   - Redirect URI: `https://your-domain.com/auth/google/callback`

2. **Microsoft Calendar:**
   - OAuth scopes: `Calendars.Read`
   - Redirect URI: `https://your-domain.com/auth/microsoft/callback`

**Error Responses:**
- `403 Forbidden` - Stub mode disabled but OAuth not configured

---

## 🚨 Error Handling

### Standard Error Format

```json
{
  "detail": "User-friendly error message",
  "correlation_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 400 | Bad Request | Fix request payload |
| 401 | Unauthorized | Update API credentials |
| 403 | Forbidden | Enable feature or configure service |
| 404 | Not Found | Check resource ID |
| 429 | Rate Limited | Wait 60s and retry |
| 502 | Bad Gateway | External API down - retry later |
| 503 | Service Unavailable | Circuit breaker open - wait 30s |

---

## 🔄 Circuit Breaker Pattern

External APIs (Vapi, Twilio) are protected by circuit breakers:

**States:**
- **CLOSED**: Normal operation, all requests flow through
- **OPEN**: Failing - rejects requests immediately (503 response)
- **HALF_OPEN**: Testing recovery - allows limited requests

**Configuration:**
- Failure threshold: 3 consecutive failures
- Recovery timeout: 30 seconds
- Success threshold: 2 successes to close

**Client Behavior:**
1. If 503 received, wait time indicated in response
2. Retry with exponential backoff
3. Log correlation ID for support

---

## 📊 Rate Limits

| Endpoint | Rate Limit | Window |
|----------|------------|--------|
| `GET /vapi/settings` | 10 requests | 1 minute |
| `PUT /vapi/settings/*` | 10 requests | 1 minute |
| `GET /twilio/numbers` | 10 requests | 1 minute |
| `POST /integrations/email/test` | 5 requests | 1 minute |
| `GET /integrations/calendar/*/events` | 10 requests | 1 minute |

**Rate Limit Headers:**
```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1699876543
```

---

## 🧪 Testing

### Sandbox Credentials

Request sandbox credentials for testing:

- **Vapi Sandbox:** Contact support for `VAPI_SANDBOX_KEY`
- **Twilio Test:** Use Twilio test credentials
- **Email Stub:** Enabled by default in development

### Example cURL Requests

```bash
# List Vapi settings
curl -X GET https://api.ava.ai/api/v1/vapi/settings \
  -H "Authorization: Bearer ${JWT_TOKEN}"

# Update setting
curl -X PUT https://api.ava.ai/api/v1/vapi/settings/greeting_message \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"value": "Hello from AVA!"}'

# Test email (stub)
curl -X POST https://api.ava.ai/api/v1/integrations/email/test \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com", "subject": "Test", "text": "Body"}'
```

---

## 📖 Additional Resources

- **API Documentation:** https://api.ava.ai/api/v1/docs
- **Support:** support@ava.ai
- **Status Page:** https://status.ava.ai
- **Changelog:** See `CHANGELOG.md` in repository

---

**Last Updated:** November 12, 2025  
**API Version:** 1.0.0  
**Maintained by:** AVA Engineering Team
