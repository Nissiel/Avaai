# 🚀 PHASE 2-4 DIVINE DEPLOYMENT GUIDE

**Target:** Production deployment of circuit breakers, correlation IDs, and resilience improvements  
**Time to Deploy:** 15 minutes  
**Risk Level:** LOW (backward compatible, feature-flagged)

---

## ✅ PRE-DEPLOYMENT CHECKLIST

### 1. Environment Variables (CRITICAL)
```bash
# Production .env
INTEGRATIONS_STUB_MODE=false  # ⚠️ MUST be false in production
AVA_API_VAPI_API_KEY=<your_production_vapi_key>
TWILIO_ACCOUNT_SID=<your_production_sid>
TWILIO_AUTH_TOKEN=<your_production_token>
```

### 2. Dependencies Installed
```bash
cd /Users/nissielberrebi/Desktop/Avaai
python3.11 -m pip install -r requirements.txt
# Verify: slowapi, tenacity should be installed
python3.11 -c "import slowapi, tenacity; print('✅ Dependencies OK')"
```

### 3. Tests Passing
```bash
python3.11 -m pytest api/tests/test_smoke.py \
                     api/tests/test_vapi_settings_routes.py \
                     api/tests/test_twilio_service.py -v

# Expected: 8/8 tests PASSED
```

---

## 🔄 DEPLOYMENT STEPS

### Step 1: Deploy Backend (5 minutes)

```bash
# 1. Pull latest code
git pull origin main

# 2. Install dependencies
pip install -r requirements.txt

# 3. Set environment variables
export INTEGRATIONS_STUB_MODE=false  # Production only

# 4. Restart backend service
# Option A: Render/Railway/Fly.io
#   (Automatic deployment on git push)

# Option B: Manual restart
uvicorn api.src.core.app:app --host 0.0.0.0 --port 8000 --reload
```

### Step 2: Verify Circuit Breakers (2 minutes)

```bash
# Test Vapi endpoint with correlation ID
curl -X GET https://api.ava.ai/api/v1/vapi/settings \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -v | grep "X-Correlation-ID"

# Expected output:
# X-Correlation-ID: 550e8400-e29b-41d4-a716-446655440000

# Check logs for circuit breaker initialization
grep "Circuit breaker" /var/log/ava/api.log | tail -5
```

### Step 3: Test Feature Flags (1 minute)

```bash
# Verify stubs are disabled in production
curl -X POST https://api.ava.ai/api/v1/integrations/email/test \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com", "subject": "Test", "text": "Body"}'

# Expected: 403 Forbidden
# "Stub integrations are disabled in production"
```

### Step 4: Monitor Correlation IDs (2 minutes)

```bash
# Send request and capture correlation ID
RESPONSE=$(curl -X GET https://api.ava.ai/api/v1/vapi/settings \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "X-Correlation-ID: test-12345" \
  -v 2>&1)

# Verify correlation ID echoed back
echo "$RESPONSE" | grep "X-Correlation-ID: test-12345"

# Check logs have correlation ID
grep "test-12345" /var/log/ava/api.log
```

### Step 5: Test Rate Limiting (2 minutes)

```bash
# Send 15 requests rapidly (limit is 10/min)
for i in {1..15}; do
  curl -X GET https://api.ava.ai/api/v1/vapi/settings \
    -H "Authorization: Bearer ${JWT_TOKEN}" \
    -w "\n%{http_code}\n" -s -o /dev/null
done

# Expected: First 10 return 200, next 5 return 429
```

### Step 6: Frontend Verification (3 minutes)

1. **Open AVA Dashboard:** https://app.ava.ai
2. **Navigate to:** Settings → Vapi Remote Settings
3. **Verify:**
   - ✅ Loading skeleton appears while fetching
   - ✅ Settings list loads successfully
   - ✅ Edit a setting → See success toast
   - ✅ Trigger error (invalid API key) → See user-friendly error
   - ✅ Empty state if no settings → "No settings configured"

---

## 📊 POST-DEPLOYMENT MONITORING

### Key Metrics (First 24 Hours)

**1. Circuit Breaker Health**
```bash
# Check circuit breaker state transitions
grep "Circuit breaker.*opening\|closing" /var/log/ava/api.log | wc -l

# Target: <10 state changes (indicates stability)
```

**2. Correlation ID Coverage**
```bash
# Verify all requests have correlation IDs
grep "X-Correlation-ID" /var/log/ava/api.log | wc -l

# Target: 100% of API requests
```

**3. Rate Limit Hits**
```bash
# Count 429 responses
grep "429 Too Many Requests" /var/log/ava/api.log | wc -l

# Target: <0.1% of total requests
```

**4. Connection Pool Efficiency**
```bash
# Check Twilio client cache hits
grep "Twilio.*cached" /var/log/ava/api.log | wc -l

# Target: >90% cache hit rate
```

### Alerting Rules

Set up alerts for:
- ❌ Circuit breaker open >1 minute → Page on-call
- ⚠️ Rate limit hits >100/hour → Warning notification
- ⚠️ Missing correlation IDs >5% → Investigation required
- ❌ Error rate >1% → Critical alert

---

## 🔥 ROLLBACK PROCEDURE

If issues detected, rollback in <5 minutes:

```bash
# 1. Revert to previous commit
git revert HEAD
git push origin main

# 2. Or disable new features via environment
export INTEGRATIONS_STUB_MODE=true  # Emergency fallback

# 3. Restart service
sudo systemctl restart ava-api
# or
kubectl rollout undo deployment/ava-api

# 4. Verify old version running
curl https://api.ava.ai/healthz
```

---

## ✅ SUCCESS CRITERIA

Deployment is successful when:

- [ ] All 8 smoke tests passing in production
- [ ] Circuit breaker metrics visible in logs
- [ ] Correlation IDs present in 100% of requests
- [ ] Rate limiting blocking >10 req/min properly
- [ ] Frontend loading/error states working
- [ ] User-friendly error messages displayed
- [ ] Stub endpoints return 403 in production
- [ ] Connection pool showing >90% reuse
- [ ] Zero 5xx errors in first hour
- [ ] Response time P95 <500ms maintained

---

## 📞 SUPPORT

**Issues? Contact:**
- **Slack:** #ava-production-alerts
- **Email:** devops@ava.ai
- **PagerDuty:** Page on-call engineer

**Documentation:**
- API Reference: `docs/INTEGRATIONS.md`
- Architecture: `docs/ARCHITECTURE.md`
- Audit Report: `PHASE2_4_DIVINE_AUDIT.md`

---

**Deployment Approved:** November 12, 2025  
**Estimated Downtime:** 0 seconds (rolling update)  
**Rollback Time:** <5 minutes

⚔️ **Ready for Production** ⚔️
