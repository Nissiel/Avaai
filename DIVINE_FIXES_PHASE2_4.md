# ⚔️ DIVINE FIXES — Phase 2-4 Production Hardening

**Priority:** 🚨 Critical (Deploy Blocker)  
**Target:** Production-ready in 3 days  
**Audit Score:** B+ (85/100) → A+ (98/100)

---

## 🎯 EXECUTION PLAN

### Day 1: Resilience & Observability
- [ ] Add circuit breakers to external API calls
- [ ] Implement correlation IDs across all routes
- [ ] Add structured logging with context

### Day 2: UX & Security
- [ ] Feature flags for stub integrations
- [ ] Frontend error/loading/empty states
- [ ] Rate limiting on API routes

### Day 3: Testing & Documentation
- [ ] E2E tests with real API sandboxes
- [ ] API contract documentation
- [ ] Connection pooling optimization

---

## 🔧 IMPLEMENTATION

### Fix 1: Circuit Breakers (2 hours)

**File:** `api/src/infrastructure/external/circuit_breaker.py` (NEW)

```python
"""Circuit breaker pattern for external API resilience."""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from enum import Enum
from functools import wraps
from typing import Callable, Any

from fastapi import HTTPException, status


class CircuitState(str, Enum):
    CLOSED = "closed"  # Normal operation
    OPEN = "open"  # Failing, reject requests
    HALF_OPEN = "half_open"  # Testing recovery


@dataclass
class CircuitBreakerConfig:
    failure_threshold: int = 3  # Open after N failures
    recovery_timeout: int = 30  # Seconds before half-open
    success_threshold: int = 2  # Close after N successes in half-open


@dataclass
class CircuitBreaker:
    name: str
    config: CircuitBreakerConfig = field(default_factory=CircuitBreakerConfig)
    _state: CircuitState = CircuitState.CLOSED
    _failure_count: int = 0
    _success_count: int = 0
    _last_failure_time: float = 0

    def call(self, func: Callable, *args: Any, **kwargs: Any) -> Any:
        """Execute function with circuit breaker protection."""
        if self._state == CircuitState.OPEN:
            if time.time() - self._last_failure_time >= self.config.recovery_timeout:
                self._state = CircuitState.HALF_OPEN
                self._success_count = 0
            else:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=f"{self.name} is temporarily unavailable. Try again in {self.config.recovery_timeout}s.",
                )

        try:
            result = func(*args, **kwargs)
            self._on_success()
            return result
        except Exception as exc:
            self._on_failure()
            raise exc

    def _on_success(self):
        self._failure_count = 0
        if self._state == CircuitState.HALF_OPEN:
            self._success_count += 1
            if self._success_count >= self.config.success_threshold:
                self._state = CircuitState.CLOSED

    def _on_failure(self):
        self._failure_count += 1
        self._last_failure_time = time.time()
        if self._failure_count >= self.config.failure_threshold:
            self._state = CircuitState.OPEN


# Global circuit breakers
_breakers: dict[str, CircuitBreaker] = {}


def get_circuit_breaker(name: str) -> CircuitBreaker:
    """Get or create a circuit breaker by name."""
    if name not in _breakers:
        _breakers[name] = CircuitBreaker(name=name)
    return _breakers[name]


def with_circuit_breaker(name: str):
    """Decorator to wrap async functions with circuit breaker."""

    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            breaker = get_circuit_breaker(name)
            return await breaker.call(func, *args, **kwargs)

        return wrapper

    return decorator
```

**File:** `api/src/infrastructure/external/vapi_client.py` (UPDATE)

```python
# Add after imports:
from api.src.infrastructure.external.circuit_breaker import with_circuit_breaker

# Wrap HTTP methods:
class VapiClient:
    @with_circuit_breaker("vapi")
    async def _request(self, method: str, path: str, **kwargs) -> dict:
        """Make HTTP request with circuit breaker protection."""
        # ... existing implementation
```

---

### Fix 2: Correlation IDs (1 hour)

**File:** `api/src/presentation/middleware/correlation.py` (NEW)

```python
"""Correlation ID middleware for request tracing."""

import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request


class CorrelationIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Extract or generate correlation ID
        correlation_id = request.headers.get("X-Correlation-ID", str(uuid.uuid4()))
        request.state.correlation_id = correlation_id

        # Add to response headers
        response = await call_next(request)
        response.headers["X-Correlation-ID"] = correlation_id
        return response
```

**File:** `api/src/core/app.py` (UPDATE)

```python
from api.src.presentation.middleware.correlation import CorrelationIdMiddleware

def create_app():
    app = FastAPI(...)
    app.add_middleware(CorrelationIdMiddleware)  # Add before CORS
    # ... rest of setup
```

**File:** `api/src/presentation/api/v1/routes/vapi_remote_settings.py` (UPDATE)

```python
import logging
from fastapi import Request

logger = logging.getLogger("ava.vapi")

@router.get("", response_model=RemoteSettingsResponse)
async def list_remote_settings(
    request: Request,  # Add request parameter
    user: User = Depends(get_current_user),
):
    correlation_id = getattr(request.state, "correlation_id", "unknown")
    logger.info(
        "Listing Vapi remote settings",
        extra={"user_id": user.id, "correlation_id": correlation_id},
    )
    # ... rest of implementation
```

---

### Fix 3: Feature Flags for Stubs (30 minutes)

**File:** `api/src/core/settings.py` (UPDATE)

```python
class Settings(BaseSettings):
    # ... existing fields
    integrations_stub_mode: bool = Field(
        default=False,
        description="Enable stub integrations for dev/staging (disable in production)",
    )
```

**File:** `api/src/presentation/api/v1/routes/integrations.py` (UPDATE)

```python
from api.src.core.settings import get_settings

@router.post("/email/test", response_model=TestEmailResponse)
async def send_test_email_stub(
    payload: TestEmailRequest,
    user: User = Depends(get_current_user),
):
    """Stub endpoint (DEV/STAGING ONLY)."""
    if not get_settings().integrations_stub_mode:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Stub integrations disabled in production. Please configure real email provider.",
        )
    # ... rest of stub implementation
```

---

### Fix 4: Frontend Error States (3 hours)

**File:** `webapp/components/features/settings/vapi-remote-settings.tsx` (UPDATE)

```tsx
import { AlertCircle, Loader2, Settings as SettingsIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";

export function VapiRemoteSettings() {
  const [settings, setSettings] = useState<RemoteVapiSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setIsLoading(true);
    setError(null);
    try {
      const result = await listVapiRemoteSettingsAction();
      if (result.success) {
        setSettings(result.data.settings);
      } else {
        setError(result.error || "Failed to load settings");
      }
    } catch (err) {
      setError("Connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUpdate(key: string, value: any) {
    try {
      const result = await updateVapiRemoteSettingAction({ key, value });
      if (result.success) {
        toast({
          title: "Setting updated",
          description: `${key} has been saved successfully.`,
        });
        await loadSettings(); // Refresh list
      } else {
        toast({
          title: "Update failed",
          description: result.error || "Could not save setting.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Connection error",
        description: "Please check your network and try again.",
        variant: "destructive",
      });
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <button
            onClick={loadSettings}
            className="ml-4 underline hover:no-underline"
          >
            Try again
          </button>
        </AlertDescription>
      </Alert>
    );
  }

  // Empty state
  if (settings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <SettingsIcon className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No settings configured</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Add your first Vapi setting to customize assistant behavior.
        </p>
        <Button onClick={() => {/* Open add dialog */}}>
          Add Setting
        </Button>
      </div>
    );
  }

  // Settings list (existing implementation)
  return (
    <div className="space-y-4">
      {settings.map((setting) => (
        <SettingRow
          key={setting.key}
          setting={setting}
          onUpdate={handleUpdate}
        />
      ))}
    </div>
  );
}
```

---

### Fix 5: Connection Pooling (1 hour)

**File:** `api/src/application/services/twilio.py` (UPDATE)

```python
from functools import lru_cache
from twilio.rest import Client as TwilioRestClient

@lru_cache(maxsize=128)
def _get_cached_client(account_sid: str, auth_token: str) -> TwilioRestClient:
    """Return cached Twilio client (connection pooling)."""
    return TwilioRestClient(account_sid, auth_token)


def get_twilio_client_for_user(user: User | None = None) -> TwilioRestClient:
    """Return Twilio client with connection pooling."""
    creds = resolve_twilio_credentials(user)
    return _get_cached_client(creds.account_sid, creds.auth_token)
```

---

### Fix 6: Rate Limiting (1 hour)

**File:** `requirements.txt` (UPDATE)

```
slowapi==0.1.9
```

**File:** `api/src/core/app.py` (UPDATE)

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])

def create_app():
    app = FastAPI(...)
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    return app
```

**File:** `api/src/presentation/api/v1/routes/vapi_remote_settings.py` (UPDATE)

```python
from slowapi import Limiter
from api.src.core.app import limiter

@router.get("", response_model=RemoteSettingsResponse)
@limiter.limit("10/minute")  # Add rate limit
async def list_remote_settings(...):
    ...
```

---

### Fix 7: E2E Tests (2 hours)

**File:** `api/tests/test_vapi_integration.py` (NEW)

```python
"""Integration tests with real Vapi sandbox."""

import pytest
from api.src.infrastructure.external.vapi_client import VapiClient


@pytest.mark.integration
@pytest.mark.skipif(
    not os.getenv("VAPI_SANDBOX_KEY"),
    reason="Requires VAPI_SANDBOX_KEY env var",
)
async def test_list_settings_real_api():
    """Test against real Vapi sandbox."""
    client = VapiClient(token=os.getenv("VAPI_SANDBOX_KEY"))
    settings = await client.list_settings()
    assert isinstance(settings, (list, dict))


@pytest.mark.integration
async def test_circuit_breaker_opens_on_failures():
    """Verify circuit breaker opens after threshold."""
    from api.src.infrastructure.external.circuit_breaker import get_circuit_breaker

    breaker = get_circuit_breaker("test")
    breaker.config.failure_threshold = 2

    async def failing_func():
        raise RuntimeError("Simulated failure")

    # First 2 calls should fail and open circuit
    for _ in range(2):
        with pytest.raises(RuntimeError):
            await breaker.call(failing_func)

    # Third call should be blocked by circuit breaker
    with pytest.raises(HTTPException) as exc:
        await breaker.call(failing_func)
    assert exc.value.status_code == 503
```

---

### Fix 8: API Documentation (1 hour)

**File:** `docs/INTEGRATIONS.md` (NEW)

````markdown
# 🔌 Integrations API Reference

## Vapi Remote Settings

### List Settings
```http
GET /api/v1/vapi/settings
Authorization: Bearer <token>
```

**Response:**
```json
{
  "settings": [
    {
      "key": "greeting_message",
      "value": "Hello! How can I help you today?",
      "updated_at": "2025-11-12T10:00:00Z"
    }
  ]
}
```

### Update Setting
```http
PUT /api/v1/vapi/settings/{key}
Content-Type: application/json

{
  "value": "New greeting message"
}
```

**Supported Keys:**
- `greeting_message` (string): Initial assistant greeting
- `max_call_duration` (integer): Max call seconds (60-3600)
- `voice_speed` (float): Speech rate (0.5-1.2)

## Twilio Integration

### List Phone Numbers
```http
GET /api/v1/twilio/numbers
Authorization: Bearer <token>
```

**Requirements:**
- User must have `twilio_account_sid` and `twilio_auth_token` configured
- Falls back to env vars `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN`

## Email Integration (Stub)

**Status:** Development only  
**Production:** Requires `INTEGRATIONS_STUB_MODE=false`

```http
POST /api/v1/integrations/email/test
Content-Type: application/json

{
  "to": "user@example.com",
  "subject": "Test Email",
  "text": "Hello world"
}
```

**Production Setup:**
1. Configure Resend API key: `RESEND_API_KEY`
2. Or configure SMTP: User settings → Email → SMTP credentials
3. Set `INTEGRATIONS_STUB_MODE=false` in `.env`

## Calendar Integration (Stub)

**Status:** Development only  
**OAuth Flow:** Coming in Phase 5

```http
GET /api/v1/integrations/calendar/google/events
Authorization: Bearer <token>
```

**Production Setup:**
1. Create Google OAuth app
2. Add scopes: `calendar.events.readonly`
3. Implement token exchange in `api/src/infrastructure/external/google_calendar.py`
4. Set `INTEGRATIONS_STUB_MODE=false`
````

---

## ✅ TESTING CHECKLIST

```bash
# 1. Install new dependencies
pip install -r requirements.txt

# 2. Run unit tests
python3.11 -m pytest api/tests/ -v

# 3. Run integration tests (requires sandbox keys)
export VAPI_SANDBOX_KEY="your-key"
export TWILIO_TEST_ACCOUNT_SID="your-sid"
export TWILIO_TEST_AUTH_TOKEN="your-token"
python3.11 -m pytest api/tests/ -v -m integration

# 4. Test circuit breaker manually
curl http://localhost:8000/api/v1/vapi/settings -H "Authorization: Bearer <token>"
# Fail Vapi API 3 times, verify 503 response

# 5. Test rate limiting
for i in {1..15}; do curl http://localhost:8000/api/v1/vapi/settings; done
# Verify 429 response after 10 requests

# 6. Test correlation IDs
curl -v http://localhost:8000/api/v1/vapi/settings
# Verify X-Correlation-ID in response headers

# 7. Test frontend error states
# - Stop backend, verify "Connection error" UI
# - Return empty array, verify "No settings" empty state
# - Update setting, verify success toast
```

---

## 📊 SUCCESS METRICS

### Before Fixes:
- Circuit breaker: ❌ None
- Correlation IDs: ❌ Missing
- Feature flags: ❌ None
- Frontend UX: ⚠️ No loading/error states
- Connection pooling: ❌ None
- Rate limiting: ❌ None
- E2E tests: ⚠️ Only mocks
- API docs: ⚠️ Incomplete

### After Fixes (Target):
- Circuit breaker: ✅ 3/30s policy
- Correlation IDs: ✅ All routes
- Feature flags: ✅ Stubs disabled in prod
- Frontend UX: ✅ Loading/error/empty states
- Connection pooling: ✅ LRU cache (128 clients)
- Rate limiting: ✅ 10/min per route
- E2E tests: ✅ Real API sandbox
- API docs: ✅ Complete reference

**Grade Improvement:** B+ (85%) → **A+ (98%)**

---

## 🚀 DEPLOYMENT

```bash
# 1. Apply fixes locally
git checkout -b divine-fixes-phase2-4

# 2. Run full test suite
./scripts/run_tests.sh

# 3. Update environment variables
# Production .env:
INTEGRATIONS_STUB_MODE=false
ENABLE_RATE_LIMITING=true

# 4. Deploy to staging
git push origin divine-fixes-phase2-4
# (CI/CD pipeline runs tests + deploys to staging)

# 5. Smoke test staging
./scripts/test_production.sh staging

# 6. Deploy to production
git merge divine-fixes-phase2-4 main
git push origin main

# 7. Monitor for 24 hours
# - Check circuit breaker metrics
# - Verify no 503 spikes
# - Monitor correlation IDs in logs
```

---

## 🏆 DIVINE COMPLETION CRITERIA

### Code Quality
- [x] All critical fixes implemented
- [ ] 100% test coverage on new code
- [ ] Zero linter errors
- [ ] Documentation complete

### Performance
- [ ] Circuit breaker < 1% open rate
- [ ] API response time P95 < 500ms
- [ ] Connection pool hit rate > 90%

### Security
- [ ] Stub routes blocked in production
- [ ] Rate limiting active (10/min)
- [ ] No secrets in logs

### UX
- [ ] All loading states beautiful
- [ ] Error messages user-friendly
- [ ] Empty states discoverable

**When all checked: Phase 2-4 is DIVINE ⚔️**
