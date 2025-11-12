# 📊 Phase 1 Performance Benchmarks

## Executive Summary

**Goal:** Prove Phase 1 improvements deliver measurable user value.

**Method:** Before/after metrics captured across critical paths.

**Result:** [TO BE MEASURED]

---

## 🎯 Benchmark Methodology

### Test Environment
- **Hardware:** [MacBook Pro M1/M2 or production equivalent]
- **Network:** Simulated 3G (750Kbps, 100ms latency) for mobile testing
- **Browser:** Chrome 120+, Safari 17+
- **Backend:** FastAPI on Python 3.11
- **Load:** Single user (baseline), 100 concurrent users (stress)

### Tools
- **Frontend:** Lighthouse, WebPageTest, Chrome DevTools
- **Backend:** Apache Bench (ab), Locust, FastAPI built-in profiling
- **Bundle:** webpack-bundle-analyzer, source-map-explorer
- **Monitoring:** Server logs with timing middleware

---

## 📈 Metrics Tracked

### 1. Settings Page Load Time

**What:** Time from navigation to interactive (TTI)

**Before Phase 1:**
```
Desktop (Fast 4G): ??? ms
Mobile (3G): ??? ms
P50: ??? ms
P95: ??? ms
P99: ??? ms
```

**After Phase 1:**
```
Desktop (Fast 4G): [MEASURE] ms (Target: <200ms)
Mobile (3G): [MEASURE] ms (Target: <800ms)
P50: [MEASURE] ms
P95: [MEASURE] ms
P99: [MEASURE] ms
```

**Command:**
```bash
# Using Lighthouse
npm run benchmark:settings-page

# Manual test
curl -w "@curl-timing.txt" -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/dashboard/settings
```

---

### 2. Bundle Size

**What:** JavaScript bundle delivered to browser

**Before Phase 1:**
```
Total bundle: ??? KB
Main chunk: ??? KB
Settings page: ??? KB
Vendor deps: ??? KB
```

**After Phase 1:**
```
Total bundle: [MEASURE] KB (Target: -120KB minimum)
Main chunk: [MEASURE] KB
Settings page: [MEASURE] KB
Vendor deps: [MEASURE] KB
```

**Command:**
```bash
npm run build
npm run analyze-bundle
```

**Expected:** Vapi SDK removal saves ~120KB

---

### 3. API Latency (Backend)

**What:** FastAPI response time for critical endpoints

**Before Phase 1:**
```
/api/v1/twilio-settings GET: ??? ms
/api/v1/twilio-settings POST: ??? ms
/api/v1/vapi/settings GET: ??? ms
/healthz: ??? ms
```

**After Phase 1:**
```
/api/v1/twilio-settings GET: [MEASURE] ms (Target: <100ms)
/api/v1/twilio-settings POST: [MEASURE] ms (Target: <200ms)
/api/v1/vapi/settings GET: [MEASURE] ms (Target: <150ms)
/healthz: [MEASURE] ms (Target: <50ms)
```

**Command:**
```bash
# Load test with Apache Bench
ab -n 1000 -c 10 http://localhost:8000/healthz

# Detailed profiling
python3.11 -m pytest api/tests/test_phase1_integration.py --durations=10
```

---

### 4. Failed Request Rate

**What:** Percentage of API calls that fail/timeout

**Before Phase 1:**
```
Settings save failures: ~12% (reported in audit)
Twilio call failures: ~15% (reported in audit)
Auth refresh failures: ??? %
```

**After Phase 1:**
```
Settings save failures: [MEASURE] % (Target: <2%)
Twilio call failures: [MEASURE] % (Target: <5%)
Auth refresh failures: [MEASURE] % (Target: <1%)
```

**Command:**
```bash
# Stress test with failures
npm run test:load -- --users 100 --duration 60s
```

---

### 5. Retry Success Rate

**What:** How often retry logic succeeds after initial failure

**New Metric (Phase 1 introduces retry logic):**
```
Transient failures recovered: [MEASURE] %
Average retries per request: [MEASURE]
Retry timeout occurrences: [MEASURE] per hour
```

**Target:** 95%+ of transient failures recovered

**Measurement:** Server logs analysis (correlation ID tracking)

---

### 6. Concurrent User Stability

**What:** System performance under load

**Test:** 100 concurrent users, 60-second duration

**Metrics:**
```
Requests per second: [MEASURE] (Target: >50 RPS)
Error rate: [MEASURE] % (Target: <5%)
P95 latency: [MEASURE] ms (Target: <500ms)
Timeout rate: [MEASURE] % (Target: <1%)
```

**Command:**
```bash
# Using Locust
locust -f api/tests/load_test.py --users 100 --spawn-rate 10 --run-time 60s
```

---

## 🧪 How to Run Benchmarks

### Prerequisites
```bash
# Install dependencies
npm install --save-dev lighthouse webpack-bundle-analyzer
pip install locust pytest-benchmark
```

### Frontend Benchmarks
```bash
# Bundle size analysis
npm run build
npm run analyze-bundle
# Opens webpack analyzer in browser

# Lighthouse score
npm run benchmark:lighthouse
# Generates report in ./benchmarks/lighthouse-report.html

# Manual page load timing
npm run dev
# Open DevTools > Network > Throttle to "Slow 3G"
# Navigate to /dashboard/settings
# Record "Load" time in Performance tab
```

### Backend Benchmarks
```bash
# Start server
python3.11 -m uvicorn api.main:app --reload

# Health check baseline
ab -n 1000 -c 10 http://localhost:8000/healthz

# Settings endpoint (requires auth)
curl -w "@curl-timing.txt" \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/twilio-settings

# Integration tests with timing
python3.11 -m pytest api/tests/test_phase1_integration.py -v --durations=10
```

### Load Testing
```bash
# Create load test file (see api/tests/load_test.py template below)
locust -f api/tests/load_test.py \
  --users 100 \
  --spawn-rate 10 \
  --run-time 60s \
  --host http://localhost:8000

# Open http://localhost:8089 to monitor
```

---

## 📊 Results Template

### Before vs. After Summary

| Metric | Before | After | Improvement | Target | Status |
|--------|--------|-------|-------------|--------|--------|
| Settings page load (mobile) | ??? ms | ??? ms | ???% | <800ms | ⏳ |
| Bundle size | ??? KB | ??? KB | -???KB | -120KB | ⏳ |
| API latency P95 | ??? ms | ??? ms | ???% | <300ms | ⏳ |
| Failed calls | 15% | ???% | ???% | <5% | ⏳ |
| Settings save success | 88% | ???% | +???% | >98% | ⏳ |
| Retry success rate | N/A | ???% | NEW | >95% | ⏳ |

---

## 🎯 Success Criteria

**Phase 1 is successful if:**
- ✅ Settings page loads <800ms on 3G
- ✅ Bundle size reduced by at least 100KB
- ✅ API P95 latency <300ms
- ✅ Failed call rate <5%
- ✅ Settings save success >98%
- ✅ Retry logic recovers 95%+ transient failures
- ✅ System stable under 100 concurrent users

---

## 🔄 How to Update This Document

After running benchmarks:

1. Fill in "???" placeholders with actual measurements
2. Calculate improvement percentages
3. Update Status column (✅ = met target, ⚠️ = close, ❌ = missed)
4. Add interpretation section explaining results
5. Document any surprising findings
6. Create follow-up issues for missed targets

---

## 📝 Benchmark Script Templates

### curl-timing.txt
```
time_namelookup:  %{time_namelookup}s\n
time_connect:  %{time_connect}s\n
time_appconnect:  %{time_appconnect}s\n
time_pretransfer:  %{time_pretransfer}s\n
time_redirect:  %{time_redirect}s\n
time_starttransfer:  %{time_starttransfer}s\n
----------\n
time_total:  %{time_total}s\n
```

### Basic Load Test (api/tests/load_test.py)
```python
from locust import HttpUser, task, between

class PhaseOneUser(HttpUser):
    wait_time = between(1, 3)
    
    @task(3)
    def healthz(self):
        self.client.get("/healthz")
    
    @task(1)
    def settings(self):
        # Requires auth - will fail without token
        self.client.get(
            "/api/v1/twilio-settings",
            headers={"Authorization": "Bearer test"}
        )
```

---

**Last Updated:** [TO BE FILLED]  
**Benchmarked By:** [TO BE FILLED]  
**Environment:** [TO BE FILLED]
