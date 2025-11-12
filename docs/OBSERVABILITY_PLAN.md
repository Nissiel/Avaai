# 📈 Phase 1 Observability & Monitoring Plan

## Overview

**Purpose:** Define what to monitor, how to alert, and how to visualize Phase 1 success.

**Scope:** Unified HTTP client, API performance, error rates, user experience.

**Tools:** Server logs, APM (if available), metrics dashboard, alerting system.

---

## 🎯 Key Metrics to Track

### 1. HTTP Client Performance

#### Request Duration (Latency)
```
Metric: http_request_duration_ms
Labels: {method, endpoint, status}
Aggregations: P50, P95, P99, Max
```

**Thresholds:**
- P50 < 100ms (typical)
- P95 < 300ms (acceptable)
- P99 < 500ms (concerning)
- Max < 1000ms (critical)

**Alert:**
```yaml
- name: Slow API Responses
  condition: p95(http_request_duration_ms) > 300ms for 10 minutes
  severity: warning
  notify: team-slack

- name: Very Slow API Responses
  condition: p95(http_request_duration_ms) > 500ms for 5 minutes
  severity: critical
  notify: team-slack, on-call-pager
```

---

#### Request Success Rate
```
Metric: http_request_total
Labels: {method, endpoint, status}
Calculation: (2xx + 3xx) / total * 100
```

**Thresholds:**
- > 98% (healthy)
- 95-98% (degraded)
- < 95% (critical)

**Alert:**
```yaml
- name: High Error Rate
  condition: success_rate < 95% for 5 minutes
  severity: critical
  notify: team-slack, on-call-pager

- name: Elevated Error Rate
  condition: success_rate < 98% for 10 minutes
  severity: warning
  notify: team-slack
```

---

#### Retry Rate
```
Metric: http_request_retries_total
Labels: {endpoint, retry_count}
Calculation: retries / total_requests * 100
```

**Thresholds:**
- < 5% (healthy — few transient failures)
- 5-20% (elevated — investigate backend)
- > 20% (critical — backend unstable)

**Alert:**
```yaml
- name: High Retry Rate
  condition: retry_rate > 20% for 10 minutes
  severity: warning
  notify: team-slack
  message: "Many requests requiring retries. Check backend health."
```

---

### 2. API Endpoint Health

#### Per-Endpoint Metrics
```
Endpoints to track:
- /api/v1/auth/login
- /api/v1/auth/refresh
- /api/v1/twilio-settings (GET, POST)
- /api/v1/vapi/settings (GET, POST)
- /api/v1/assistants
- /healthz
```

**For each endpoint, track:**
- Request count
- Error rate
- P95 latency
- Timeout rate

**Dashboard View:**
```
┌─────────────────────┬──────────┬───────────┬─────────┬──────────┐
│ Endpoint            │ RPS      │ Error %   │ P95 ms  │ Timeout %│
├─────────────────────┼──────────┼───────────┼─────────┼──────────┤
│ /auth/login         │ 5.2      │ 0.1%      │ 85ms    │ 0%       │
│ /auth/refresh       │ 12.8     │ 0.5%      │ 120ms   │ 0%       │
│ /twilio-settings    │ 3.1      │ 1.2%      │ 180ms   │ 0.1%     │
│ /vapi/settings      │ 2.4      │ 0.8%      │ 150ms   │ 0%       │
│ /healthz            │ 60.0     │ 0%        │ 15ms    │ 0%       │
└─────────────────────┴──────────┴───────────┴─────────┴──────────┘
```

---

### 3. User Experience Metrics

#### Frontend Performance
```
Metric: page_load_time_ms
Labels: {page, network_type}
```

**Track:**
- Settings page: Time to Interactive (TTI)
- Dashboard page: First Contentful Paint (FCP)
- Mobile vs. Desktop
- 4G vs. 3G

**Thresholds:**
- Settings page TTI < 800ms (mobile 3G)
- Dashboard FCP < 1000ms (mobile 3G)

---

#### User Actions
```
Metric: user_action_total
Labels: {action, status}
```

**Track:**
- Settings save (success/failure)
- Login (success/failure)
- Call initiation (success/failure)

**Alert:**
```yaml
- name: High Settings Save Failure Rate
  condition: save_failure_rate > 5% for 10 minutes
  severity: warning
  notify: team-slack
```

---

### 4. Error Tracking

#### Error Types
```
Metric: error_total
Labels: {error_type, endpoint}
```

**Categories:**
- Network errors (ECONNREFUSED, ETIMEDOUT, etc.)
- Auth errors (401, 403)
- Validation errors (422)
- Server errors (500, 502, 503, 504)
- Timeout errors (AbortError)

**Dashboard:**
```
┌───────────────────┬─────────┬────────────┐
│ Error Type        │ Count   │ % of Total │
├───────────────────┼─────────┼────────────┤
│ Network timeout   │ 45      │ 35%        │
│ 500 Server Error  │ 30      │ 23%        │
│ 401 Unauthorized  │ 25      │ 19%        │
│ 422 Validation    │ 20      │ 15%        │
│ Other             │ 10      │ 8%         │
└───────────────────┴─────────┴────────────┘
```

---

### 5. Correlation ID Coverage

#### Request Tracking
```
Metric: correlation_id_present
Calculation: requests_with_id / total_requests * 100
```

**Target:** 100% (every request should have ID)

**Alert:**
```yaml
- name: Missing Correlation IDs
  condition: correlation_id_coverage < 100% for 30 minutes
  severity: warning
  notify: team-slack
  message: "Some requests missing request IDs. Check logging middleware."
```

---

## 📊 Dashboard Specifications

### Dashboard 1: HTTP Client Health

**Panels:**
1. **Request Rate** (line graph)
   - Total requests per second
   - Broken down by endpoint

2. **Success Rate** (gauge)
   - Current: 98.5%
   - Target: >98%

3. **Latency Distribution** (histogram)
   - P50, P95, P99, Max
   - Color-coded by threshold

4. **Error Rate** (line graph)
   - Errors per minute
   - Broken down by type

5. **Retry Rate** (line graph)
   - Retries per minute
   - Success vs. failure

---

### Dashboard 2: User Experience

**Panels:**
1. **Page Load Times** (line graph)
   - Settings page TTI
   - Dashboard page FCP
   - Mobile vs. Desktop

2. **User Action Success Rate** (gauge)
   - Settings save: 98.2%
   - Login: 99.5%
   - Call initiation: 96.8%

3. **Failed User Actions** (table)
   - Timestamp, User ID, Action, Error

4. **Support Ticket Volume** (line graph)
   - Settings-related tickets over time

---

### Dashboard 3: Error Analysis

**Panels:**
1. **Error Distribution** (pie chart)
   - By error type

2. **Top 10 Failing Endpoints** (table)
   - Endpoint, Error count, Error rate

3. **Error Timeline** (line graph)
   - Errors per hour, stacked by type

4. **Recent Errors** (log stream)
   - Live feed of error logs with request IDs

---

## 🔔 Alerting Strategy

### Alert Severity Levels

#### P0 - Critical (Page Immediately)
- API success rate < 90%
- P95 latency > 1000ms
- Error rate > 20%
- System completely down

**Action:** Page on-call engineer immediately

---

#### P1 - High (Notify within 5 minutes)
- API success rate 90-95%
- P95 latency 500-1000ms
- Error rate 10-20%
- Key endpoint (auth, settings) failing

**Action:** Alert in Slack with urgent notification

---

#### P2 - Medium (Notify within 15 minutes)
- API success rate 95-98%
- P95 latency 300-500ms
- Error rate 5-10%
- Elevated retry rate

**Action:** Alert in Slack, review during business hours

---

#### P3 - Low (Log only, review daily)
- Minor performance degradation
- Isolated errors
- Non-critical metrics outside range

**Action:** Log for trend analysis

---

### Alert Routing

```yaml
# Example Alertmanager config

routes:
  - match:
      severity: critical
    receiver: pagerduty
    continue: true  # Also send to Slack
  
  - match:
      severity: critical
    receiver: slack-critical
  
  - match:
      severity: warning
    receiver: slack-warnings
  
  - match:
      severity: info
    receiver: slack-info

receivers:
  - name: pagerduty
    pagerduty_configs:
      - service_key: <PD_KEY>
  
  - name: slack-critical
    slack_configs:
      - api_url: <WEBHOOK>
        channel: '#alerts-critical'
        title: '🚨 CRITICAL: {{ .CommonLabels.alertname }}'
  
  - name: slack-warnings
    slack_configs:
      - api_url: <WEBHOOK>
        channel: '#alerts-warnings'
        title: '⚠️ WARNING: {{ .CommonLabels.alertname }}'
```

---

## 🔍 Log Aggregation

### Log Structure

**Every log line should be JSON:**
```json
{
  "timestamp": "2025-11-12T10:30:45.123Z",
  "level": "info|warn|error",
  "requestId": "abc-123-def-456",
  "userId": "user-789",
  "service": "webapp|api",
  "method": "GET",
  "endpoint": "/api/v1/twilio-settings",
  "status": 200,
  "duration": 145,
  "message": "Request completed"
}
```

**For errors, add:**
```json
{
  "error": {
    "message": "Database connection failed",
    "code": "ECONNREFUSED",
    "stack": "Error: ...\n  at ..."
  }
}
```

---

### Log Queries (Examples)

**Find all requests for a specific request ID:**
```
requestId:"abc-123-def-456"
```

**Find slow requests (>500ms):**
```
duration:>500 level:info
```

**Find errors from a specific user:**
```
userId:"user-789" level:error
```

**Find failed settings saves:**
```
endpoint:"/api/v1/twilio-settings" status:>=400
```

**Find retry events:**
```
message:"Retrying request"
```

---

## 📈 Success Metrics (Observability)

### Week 1 Post-Deployment
- [ ] All dashboards populated with data
- [ ] Alerts firing correctly (test with simulated failures)
- [ ] Correlation IDs appearing in 100% of requests
- [ ] No gaps in metrics collection

### Week 2-4 Post-Deployment
- [ ] Latency trends analyzed
- [ ] Error patterns identified
- [ ] User experience metrics correlated with performance
- [ ] At least one optimization identified from data

---

## 🛠️ Implementation Checklist

### Logging
- [ ] JSON structured logs implemented (backend + frontend)
- [ ] Correlation IDs generated and propagated
- [ ] Log levels appropriate (debug/info/warn/error)
- [ ] Sensitive data excluded from logs (no passwords, tokens)

### Metrics
- [ ] HTTP client instrumented (request duration, status, retries)
- [ ] API endpoints instrumented (per-endpoint metrics)
- [ ] User actions tracked (saves, logins, calls)
- [ ] Error events captured and labeled

### Dashboards
- [ ] HTTP Client Health dashboard created
- [ ] User Experience dashboard created
- [ ] Error Analysis dashboard created
- [ ] Shared with team (read access)

### Alerting
- [ ] Alert rules defined (P0, P1, P2)
- [ ] Alert routing configured (Slack, PagerDuty)
- [ ] On-call rotation established
- [ ] Runbooks created for common alerts

### Testing
- [ ] Simulate high latency → verify alert fires
- [ ] Simulate high error rate → verify alert fires
- [ ] Verify correlation IDs in logs
- [ ] Verify dashboards update in real-time

---

## 🔄 Continuous Improvement

### Weekly Review
- Review dashboards for trends
- Identify slowest endpoints
- Check error patterns
- Adjust alert thresholds if needed

### Monthly Review
- Compare to previous month
- Calculate improvement %
- Identify optimization opportunities
- Update this document with learnings

---

## 📚 Related Documentation

- [Error Handling Guide](./ERROR_HANDLING.md) — How errors are logged
- [Server Logger](../webapp/lib/logging/server-logger.ts) — Logging implementation
- [Server Client](../webapp/lib/http/server-client.ts) — HTTP client instrumentation
- [Migration Runbook](./PHASE1_MIGRATION_RUNBOOK.md) — Deployment monitoring

---

**Last Updated:** November 12, 2025  
**Version:** 1.0  
**Maintained By:** DevOps + Engineering
