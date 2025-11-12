# 🚀 Phase 1 Migration Runbook

## 📋 Overview

**What:** Deploy Phase 1 (unified HTTP client, dead code removal, centralized config) to production safely.

**Risk Level:** Medium (structural changes, no data migration)

**Estimated Downtime:** Zero (rolling deployment)

**Rollback Time:** <5 minutes (feature flag toggle)

---

## ⏱️ Timeline

**Preparation:** 30 minutes  
**Deployment:** 15 minutes  
**Validation:** 30 minutes  
**Monitoring:** 24 hours  
**Total:** ~2 hours active + 24h monitoring

---

## 🔍 Pre-Deployment Checklist

### 1. Environment Verification

- [ ] **Python 3.11** installed on all production servers
  ```bash
  python3.11 --version  # Must be 3.11+
  ```

- [ ] **Environment variables** configured
  ```bash
  # Required new variables:
  BACKEND_API_URL=https://api.yourdomain.com
  FRONTEND_URL=https://app.yourdomain.com
  
  # Verify in production:
  echo $BACKEND_API_URL
  ```

- [ ] **Dependencies** up to date
  ```bash
  # Backend
  cd api && pip install -r requirements.txt
  
  # Frontend
  cd webapp && npm install
  ```

### 2. Testing Validation

- [ ] **All tests passing** in staging
  ```bash
  # Backend smoke tests
  python3.11 -m pytest api/tests/test_smoke.py -v
  
  # Backend integration tests
  python3.11 -m pytest api/tests/test_phase1_integration.py -v
  
  # Frontend tests
  npm test
  ```

- [ ] **Build successful**
  ```bash
  npm run build  # No errors
  ```

- [ ] **Bundle analysis** complete
  ```bash
  npm run analyze-bundle
  # Verify no server secrets in client bundle
  ```

### 3. Backup Procedures

- [ ] **Database backup** created
  ```bash
  # PostgreSQL example
  pg_dump -U postgres -d yourdb > backup_phase1_$(date +%Y%m%d).sql
  ```

- [ ] **Git tag** created
  ```bash
  git tag -a phase1-pre-deploy -m "Phase 1 pre-deployment snapshot"
  git push origin phase1-pre-deploy
  ```

- [ ] **Rollback branch** prepared
  ```bash
  git checkout -b phase1-rollback
  git push origin phase1-rollback
  ```

### 4. Monitoring Setup

- [ ] **Alerting** configured
  ```yaml
  # Example alert rules
  - name: High Error Rate
    condition: error_rate > 5% for 5 minutes
    notify: team-slack
  
  - name: Slow API Response
    condition: p95_latency > 500ms for 10 minutes
    notify: team-slack
  
  - name: Failed Deployments
    condition: deployment_failures > 0
    notify: team-slack
  ```

- [ ] **Dashboard** ready
  - Request rate graph
  - Error rate graph
  - P95 latency graph
  - Active user count

- [ ] **Log aggregation** working
  ```bash
  # Verify logs flowing
  tail -f /var/log/app/backend.log | grep "requestId"
  ```

### 5. Team Coordination

- [ ] **Deployment window** scheduled (low-traffic period)
- [ ] **On-call engineer** identified
- [ ] **Rollback authority** confirmed
- [ ] **Communication channel** active (Slack #deployments)
- [ ] **Stakeholders** notified

---

## 🚀 Deployment Steps

### Phase A: Backend Deployment (5 min)

**Goal:** Deploy FastAPI changes (no structural changes, just dependencies)

```bash
# 1. SSH to production backend
ssh production-backend

# 2. Pull latest code
cd /app/api
git fetch origin
git checkout main
git pull origin main

# 3. Install dependencies (if changed)
pip install -r requirements.txt

# 4. Run smoke test locally
python3.11 -m pytest tests/test_smoke.py -v

# 5. Restart service (zero-downtime with gunicorn)
sudo systemctl reload gunicorn  # Graceful reload

# 6. Verify health
curl http://localhost:8000/healthz
# Should return: {"status": "healthy"}
```

**Validation:**
- [ ] Health check returns 200
- [ ] No errors in logs: `tail -f /var/log/gunicorn/error.log`
- [ ] Metrics dashboard shows normal traffic

---

### Phase B: Frontend Deployment (10 min)

**Goal:** Deploy Next.js with unified HTTP client and config

```bash
# 1. SSH to production frontend
ssh production-frontend

# 2. Pull latest code
cd /app/webapp
git fetch origin
git checkout main
git pull origin main

# 3. Install dependencies (Prisma removed, etc.)
npm install

# 4. Build production bundle
npm run build

# 5. Verify build output
ls -lh .next/static/chunks/
# Confirm no huge unexpected chunks

# 6. Restart Next.js (zero-downtime with PM2)
pm2 reload webapp --update-env

# 7. Verify frontend health
curl http://localhost:3000/
# Should return HTML, not error
```

**Validation:**
- [ ] Homepage loads successfully
- [ ] Dashboard accessible (authenticated check)
- [ ] No console errors in browser DevTools
- [ ] Settings page loads (critical path)

---

### Phase C: Feature Flag Activation (Progressive Rollout)

**Strategy:** Use gradual rollout to minimize risk

```typescript
// In webapp/lib/config/feature-flags.ts (if exists)
export const PHASE_1_ENABLED = 
  process.env.PHASE_1_ROLLOUT_PERCENTAGE || '0';

// Or use environment-based toggle:
export const useUnifiedClient = () => {
  return process.env.NEXT_PUBLIC_UNIFIED_CLIENT === 'true';
};
```

**Rollout Schedule:**
```bash
# Step 1: Internal testing (0% public traffic)
# Set PHASE_1_ROLLOUT_PERCENTAGE=0
# Test with team accounts only

# Step 2: Canary (10% traffic, 15 minutes)
# Set PHASE_1_ROLLOUT_PERCENTAGE=10
pm2 reload webapp --update-env

# Monitor for 15 minutes:
# - Error rate should be <5%
# - P95 latency should be <300ms
# - No user complaints

# Step 3: Expand (50% traffic, 30 minutes)
# Set PHASE_1_ROLLOUT_PERCENTAGE=50
pm2 reload webapp --update-env

# Monitor for 30 minutes

# Step 4: Full rollout (100% traffic)
# Set PHASE_1_ROLLOUT_PERCENTAGE=100
pm2 reload webapp --update-env
```

**Note:** If no feature flag exists, this is a full deployment (higher risk).

---

## ✅ Validation Checklist

### Immediate Validation (0-5 min after deploy)

- [ ] **Health endpoints** responding
  ```bash
  curl https://api.yourdomain.com/healthz
  curl https://app.yourdomain.com/
  ```

- [ ] **No 500 errors** in logs
  ```bash
  # Backend
  tail -n 100 /var/log/gunicorn/error.log | grep "500"
  
  # Frontend
  tail -n 100 /var/log/nextjs/error.log | grep "ERROR"
  ```

- [ ] **Metrics dashboard** shows normal traffic
  - Request rate: Similar to pre-deploy
  - Error rate: <5%
  - Latency: Within acceptable range

### Functional Validation (5-15 min after deploy)

- [ ] **Authentication flow** works
  ```bash
  # Test login
  curl -X POST https://api.yourdomain.com/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"test123"}'
  ```

- [ ] **Settings page** loads and saves
  - Navigate to /dashboard/settings
  - Change a setting
  - Verify save succeeds
  - Check network tab for correlation IDs

- [ ] **Twilio isolation** verified
  - Open DevTools > Network
  - Navigate to Twilio settings
  - Verify all requests go to `api.yourdomain.com/api/v1/twilio-*`
  - Confirm no requests to `app.yourdomain.com/api/twilio/*`

- [ ] **Bundle verification**
  - View page source of any page
  - Search for "VAPI_API_KEY" — should NOT appear
  - Search for "process.env" — should be minimal

### Performance Validation (15-30 min after deploy)

- [ ] **Response times** acceptable
  ```bash
  # Backend API
  ab -n 100 -c 10 https://api.yourdomain.com/healthz
  # P95 should be <100ms
  
  # Settings endpoint (requires auth)
  curl -w "@curl-timing.txt" \
    -H "Authorization: Bearer $TOKEN" \
    https://api.yourdomain.com/api/v1/twilio-settings
  # Total time should be <300ms
  ```

- [ ] **Lighthouse score** maintained or improved
  ```bash
  lighthouse https://app.yourdomain.com/dashboard/settings \
    --output html \
    --output-path ./lighthouse-post-deploy.html
  ```

- [ ] **User-reported issues** = 0
  - Check support channel
  - Check error tracking (Sentry/etc)

---

## 🔄 Rollback Procedure

### Trigger Conditions

Rollback immediately if:
- ❌ Error rate >10% for 5 minutes
- ❌ Critical functionality broken (auth, settings, calls)
- ❌ P95 latency >1000ms for 10 minutes
- ❌ User complaints spike
- ❌ Database corruption detected

### Rollback Steps (< 5 min)

**Option 1: Feature Flag Toggle (Fastest)**
```bash
# If feature flag exists:
# Set PHASE_1_ROLLOUT_PERCENTAGE=0
pm2 reload webapp --update-env

# Verify old behavior restored
curl https://app.yourdomain.com/
```

**Option 2: Git Revert**
```bash
# Backend
ssh production-backend
cd /app/api
git revert HEAD  # Or git checkout phase1-pre-deploy
sudo systemctl reload gunicorn

# Frontend
ssh production-frontend
cd /app/webapp
git revert HEAD  # Or git checkout phase1-pre-deploy
npm run build
pm2 reload webapp

# Verify rollback successful
curl https://api.yourdomain.com/healthz
curl https://app.yourdomain.com/
```

**Option 3: Redeploy Previous Version**
```bash
# Use your CI/CD to redeploy last known good build
# e.g., if using GitHub Actions:
gh workflow run deploy.yml --ref phase1-pre-deploy
```

### Post-Rollback Actions

- [ ] Notify team of rollback
- [ ] Create incident report
- [ ] Identify root cause
- [ ] Fix issues in separate branch
- [ ] Re-test in staging
- [ ] Schedule new deployment window

---

## 📊 Post-Deployment Monitoring (24 hours)

### Hour 1: Active Monitoring
- Monitor dashboard every 5 minutes
- Check error logs every 10 minutes
- Respond to alerts immediately
- Have team on standby

### Hours 2-4: Frequent Checks
- Monitor dashboard every 15 minutes
- Check error logs every 30 minutes
- Review user feedback channels

### Hours 5-24: Passive Monitoring
- Dashboard alerts configured
- On-call engineer available
- Daily summary report generated

### Metrics to Watch

| Metric | Normal Range | Alert Threshold | Critical Threshold |
|--------|-------------|-----------------|-------------------|
| Error Rate | <2% | >5% | >10% |
| P95 Latency | <200ms | >300ms | >500ms |
| Request Rate | Varies | -50% | -80% |
| Active Users | Varies | -30% | -50% |

---

## 📝 Post-Deployment Report Template

### Deployment Summary
- **Date:** [YYYY-MM-DD HH:MM]
- **Duration:** [X minutes]
- **Rollout:** [Canary / Full]
- **Issues:** [None / List]
- **Rollback:** [No / Yes - Reason]

### Metrics Comparison

| Metric | Pre-Deploy | Post-Deploy | Change |
|--------|-----------|-------------|--------|
| Error Rate | X% | Y% | ±Z% |
| P95 Latency | Xms | Yms | ±Zms |
| Bundle Size | XKB | YKB | ±ZKB |
| User Satisfaction | N/A | [Survey] | - |

### Lessons Learned
- What went well:
- What could be improved:
- Action items for next deployment:

---

## 🆘 Emergency Contacts

- **On-Call Engineer:** [Name, Phone, Slack]
- **DevOps Lead:** [Name, Phone, Slack]
- **Product Owner:** [Name, Phone, Slack]
- **Escalation:** [Manager/CTO]

---

## 📚 Related Documentation

- [Phase 1 Enhancement Plan](./AUDIT.md)
- [Performance Benchmarks](./PHASE1_BENCHMARKS.md)
- [Architecture Overview](./ARCHITECTURE.md)
- [Error Handling Guide](./ERROR_HANDLING.md) (see below)

---

**Last Updated:** November 12, 2025  
**Version:** 1.0  
**Status:** Ready for Production
