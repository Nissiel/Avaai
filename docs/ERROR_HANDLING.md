# 🛡️ Phase 1 Error Handling Guide

## Overview

**Purpose:** Document how the unified HTTP client handles errors, timeouts, and retries.

**Scope:** All API communication from webapp to FastAPI backend.

**Key Files:**
- `webapp/lib/http/server-client.ts` — Server-side HTTP client
- `webapp/lib/api/client.ts` — Browser HTTP client (if separate)
- `webapp/lib/logging/server-logger.ts` — Structured logging

---

## 🎯 Error Handling Philosophy

### Core Principles
1. **Fail gracefully** — Never crash the UI
2. **Retry transient failures** — Network blips shouldn't break UX
3. **Inform users clearly** — "Settings saved!" not "Error 500"
4. **Log everything** — Correlation IDs for debugging
5. **Timeout predictably** — Don't hang forever

---

## ⚙️ Unified HTTP Client Configuration

### Timeout Settings

```typescript
// In webapp/lib/http/server-client.ts

const TIMEOUTS = {
  // Fast endpoints (health, auth)
  short: 5000,    // 5 seconds
  
  // Standard CRUD operations (settings, lists)
  medium: 10000,  // 10 seconds
  
  // Long operations (imports, exports, file uploads)
  long: 30000,    // 30 seconds
};
```

**Why these values?**
- **5s (short):** Health checks and auth should be instant. Longer = backend issue.
- **10s (medium):** Standard API calls. Accounts for database queries + network.
- **30s (long):** Bulk operations need time. User can wait with progress indicator.

**When to override:**
```typescript
// For special cases:
await apiClient.post('/api/v1/twilio/import-all', data, {
  timeout: 60000  // 60s for bulk import
});
```

---

### Retry Logic

```typescript
// In webapp/lib/http/server-client.ts

const RETRY_CONFIG = {
  maxRetries: 3,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'],
  backoff: 'exponential',  // 1s, 2s, 4s
};
```

**Retry Decision Matrix:**

| Status Code | Meaning | Retry? | Why |
|------------|---------|--------|-----|
| 400 | Bad Request | ❌ No | Client error, won't fix itself |
| 401 | Unauthorized | ⚠️ Special | Attempt token refresh first |
| 403 | Forbidden | ❌ No | Permissions issue, retry won't help |
| 404 | Not Found | ❌ No | Endpoint doesn't exist |
| 408 | Timeout | ✅ Yes | Transient, likely to succeed |
| 422 | Validation Error | ❌ No | Invalid data, fix payload |
| 429 | Rate Limited | ✅ Yes | With exponential backoff |
| 500 | Server Error | ✅ Yes | May be transient |
| 502 | Bad Gateway | ✅ Yes | Load balancer issue, retry |
| 503 | Service Unavailable | ✅ Yes | Backend restarting |
| 504 | Gateway Timeout | ✅ Yes | Slow response, retry |

**Exponential Backoff:**
```
Attempt 1: Fail → Wait 1s
Attempt 2: Fail → Wait 2s
Attempt 3: Fail → Wait 4s
Attempt 4: Give up → Show error
```

---

### Auth Refresh Flow

**Problem:** Access token expires → 401 error

**Solution:** Auto-refresh then retry

```typescript
// Pseudocode for auth refresh logic

async function fetchWithAuth(url, options) {
  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });
  
  // If 401 and have refresh token
  if (response.status === 401 && refreshToken) {
    // Try to refresh
    const newTokens = await refreshAccessToken(refreshToken);
    
    if (newTokens) {
      // Retry original request with new token
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${newTokens.accessToken}`,
        },
      });
    } else {
      // Refresh failed → redirect to login
      redirectToLogin();
    }
  }
  
  return response;
}
```

**User Experience:**
- ✅ Seamless: User doesn't notice token refresh
- ✅ No data loss: Original request completes after refresh
- ✅ Secure: Refresh token httpOnly, not in localStorage

---

## 🔍 Error Types & Handling

### 1. Network Errors

**Examples:**
- `ECONNREFUSED` — Backend not running
- `ETIMEDOUT` — Request took too long
- `ENOTFOUND` — DNS resolution failed

**Handling:**
```typescript
try {
  const response = await apiClient.get('/api/v1/settings');
} catch (error) {
  if (error.code === 'ECONNREFUSED') {
    // Backend down
    showError('Cannot connect to server. Please try again later.');
    logError('Backend connection refused', { requestId, url });
  } else if (error.code === 'ETIMEDOUT') {
    // Timeout
    showError('Request timed out. Please check your connection.');
    logError('Request timeout', { requestId, timeout, url });
  }
}
```

**User-Facing Messages:**
- ❌ Bad: "ECONNREFUSED"
- ✅ Good: "Cannot connect to server. Please try again."

---

### 2. Validation Errors (422)

**Example Response:**
```json
{
  "detail": [
    {
      "loc": ["body", "account_sid"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

**Handling:**
```typescript
if (response.status === 422) {
  const errors = await response.json();
  
  // Map to user-friendly messages
  const fieldErrors = errors.detail.map(err => ({
    field: err.loc[err.loc.length - 1],
    message: err.msg,
  }));
  
  // Show in form
  setFormErrors(fieldErrors);
  // e.g., "Account SID is required"
}
```

**User-Facing:**
- Field-level errors highlighted in red
- Clear actionable messages
- No technical jargon

---

### 3. Server Errors (500)

**Handling:**
```typescript
if (response.status === 500) {
  const requestId = response.headers.get('X-Request-ID');
  
  logError('Server error', {
    requestId,
    url,
    status: 500,
    timestamp: new Date().toISOString(),
  });
  
  showError(
    'Something went wrong on our end. ' +
    `Please contact support with ID: ${requestId}`
  );
}
```

**User-Facing:**
- ❌ Bad: "Internal Server Error"
- ✅ Good: "Something went wrong. Please contact support with ID: abc-123"

**Why request ID matters:**
- Support can grep logs: `grep "abc-123" /var/log/app/*.log`
- Finds exact error context
- Speeds up debugging 10x

---

### 4. Rate Limiting (429)

**Handling:**
```typescript
if (response.status === 429) {
  const retryAfter = response.headers.get('Retry-After') || 60;
  
  showWarning(
    `Too many requests. Please wait ${retryAfter} seconds.`
  );
  
  // Auto-retry after delay
  await sleep(retryAfter * 1000);
  return retry();
}
```

**User-Facing:**
- Show countdown timer
- Auto-retry when allowed
- Explain why (rate limit protection)

---

### 5. Timeout Errors

**Scenario:** Request exceeds timeout limit

**Handling:**
```typescript
// In server-client.ts
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), timeout);

try {
  const response = await fetch(url, {
    ...options,
    signal: controller.signal,
  });
  clearTimeout(timeoutId);
  return response;
} catch (error) {
  if (error.name === 'AbortError') {
    // Timeout occurred
    showError('Request took too long. Please try again.');
    logError('Request timeout', { url, timeout, requestId });
    
    // Optionally retry with longer timeout
    if (retryCount < maxRetries) {
      return fetchWithRetry(url, options, retryCount + 1);
    }
  }
  throw error;
}
```

**User-Facing:**
- ❌ Bad: "AbortError"
- ✅ Good: "Request took too long. Retrying..."

---

## 📊 Logging & Observability

### Request Logging

**Every request logs:**
```json
{
  "timestamp": "2025-11-12T10:30:45.123Z",
  "level": "info",
  "requestId": "abc-123-def-456",
  "method": "POST",
  "url": "/api/v1/twilio-settings",
  "status": 200,
  "duration": 145,
  "userId": "user-789",
  "userAgent": "Mozilla/5.0..."
}
```

**Error logging:**
```json
{
  "timestamp": "2025-11-12T10:30:45.123Z",
  "level": "error",
  "requestId": "abc-123-def-456",
  "method": "POST",
  "url": "/api/v1/twilio-settings",
  "status": 500,
  "duration": 5000,
  "error": {
    "message": "Database connection failed",
    "stack": "Error: ...\n  at ...",
    "code": "ECONNREFUSED"
  },
  "userId": "user-789"
}
```

### Correlation IDs

**Flow:**
```
Browser → Generates X-Request-ID: abc-123
   ↓
Next.js → Passes X-Request-ID: abc-123 in header
   ↓
FastAPI → Logs all operations with abc-123
   ↓
Database → (if supported) Logs with abc-123
   ↓
Response → Returns X-Request-ID: abc-123 in header
   ↓
Browser → Logs response with abc-123
```

**Debugging:**
```bash
# Find all logs for a request
grep "abc-123" /var/log/app/*.log

# Shows:
# - Frontend request initiated
# - Backend received request
# - Database query executed
# - Response sent
# - Error occurred (if any)
```

---

## 🎨 User Experience Guidelines

### Loading States

**Always show:**
- Spinner or skeleton during request
- "Saving..." text on buttons
- Disable form during submission

```typescript
const [saving, setSaving] = useState(false);

async function handleSave() {
  setSaving(true);
  try {
    await apiClient.post('/api/v1/settings', data);
    showSuccess('Settings saved!');
  } catch (error) {
    showError('Failed to save. Please try again.');
  } finally {
    setSaving(false);
  }
}

return (
  <button disabled={saving}>
    {saving ? 'Saving...' : 'Save Settings'}
  </button>
);
```

---

### Error Messages

**Checklist:**
- ✅ Human-readable (no codes/jargon)
- ✅ Actionable (what can user do?)
- ✅ Include request ID for support
- ✅ Not blame user ("You entered wrong data" → "Please check Account SID")

**Examples:**

| Scenario | ❌ Bad Message | ✅ Good Message |
|----------|---------------|----------------|
| Network error | "ECONNREFUSED" | "Cannot connect to server. Please check your internet connection." |
| Validation error | "Validation failed" | "Account SID is required. Please enter your Twilio Account SID." |
| Server error | "500 Internal Server Error" | "Something went wrong on our end. Support ID: abc-123" |
| Timeout | "Request timeout" | "This is taking longer than usual. We'll keep trying..." |
| Rate limit | "429 Too Many Requests" | "Slow down! Please wait 30 seconds before trying again." |

---

### Success Feedback

**Always confirm success:**
```typescript
// After save succeeds
showSuccess('Settings saved successfully!');

// With undo option (nice-to-have)
showSuccess('Settings saved!', {
  action: {
    label: 'Undo',
    onClick: () => revertSettings(),
  },
});
```

---

## 🧪 Testing Error Scenarios

### Manual Testing

```bash
# Test timeout
# Kill backend, then try to save settings
# Should show: "Request timed out" after 10s

# Test retry logic
# Start backend, make request, kill backend mid-request
# Should retry 3x then show error

# Test validation
curl -X POST http://localhost:8000/api/v1/twilio-settings \
  -H "Content-Type: application/json" \
  -d '{}'
# Should return 422 with field errors

# Test server error
# Trigger a 500 (e.g., break database connection)
# Should show user-friendly message + request ID
```

### Automated Tests

```typescript
// In webapp/lib/http/__tests__/server-client.test.ts

describe('Error Handling', () => {
  test('retries on 500 error', async () => {
    // Mock fetch to return 500 twice, then 200
    // Verify it retried 2x before succeeding
  });
  
  test('does not retry on 400 error', async () => {
    // Mock fetch to return 400
    // Verify it failed immediately (no retries)
  });
  
  test('refreshes token on 401', async () => {
    // Mock fetch to return 401, then 200 after refresh
    // Verify refresh was called
  });
  
  test('times out after 10 seconds', async () => {
    // Mock slow response
    // Verify request aborted at 10s
  });
});
```

---

## 📋 Error Handling Checklist

When adding new API calls:

- [ ] **Timeout configured** (5s/10s/30s based on operation)
- [ ] **Retry logic** appropriate (none for 4xx, yes for 5xx)
- [ ] **Loading state** shown to user
- [ ] **Error message** user-friendly and actionable
- [ ] **Success feedback** clear and immediate
- [ ] **Request ID** logged for debugging
- [ ] **Tests written** for happy path + error paths
- [ ] **Documentation** updated (this file)

---

## 🆘 Troubleshooting

### "Requests keep timing out"

**Possible causes:**
- Backend is slow (check logs for slow queries)
- Network issues (check latency)
- Timeout too short (increase if justified)

**How to debug:**
1. Check backend logs for request ID
2. Measure actual processing time
3. If >10s, optimize backend OR increase timeout
4. If <10s, investigate network

---

### "Retries not working"

**Possible causes:**
- Error not in retryable list
- Max retries exceeded
- Backoff too long

**How to debug:**
1. Check browser console for retry logs
2. Verify error code is in `retryableStatusCodes`
3. Check retry count in logs
4. Adjust `maxRetries` if needed

---

### "Users see '500 error'"

**Fix:**
- Replace raw error with user-friendly message
- Include request ID
- Log full error server-side

```typescript
// Bad
throw new Error('Database query failed');

// Good
logError('Database query failed', { requestId, query });
throw new UserFacingError(
  'Something went wrong. Please contact support with ID: ' + requestId
);
```

---

## 📚 Related Documentation

- [Server Client Implementation](../webapp/lib/http/server-client.ts)
- [Logging Guide](../webapp/lib/logging/server-logger.ts)
- [API Documentation](./API.md)
- [Migration Runbook](./PHASE1_MIGRATION_RUNBOOK.md)

---

**Last Updated:** November 12, 2025  
**Version:** 1.0  
**Maintained By:** Engineering Team
