# 📋 Phase 2 Tracking — Deferred Items

## Overview

**Purpose:** Track work deferred from Phase 1 to Phase 2.

**Status:** Phase 1 Complete (with exceptions) → Phase 2 Planning

**Timeline:** Phase 2 estimated 4 developer-days (see audit)

---

## 🎯 Deferred Items from Phase 1

### 1. studio-settings-form.tsx Cleanup

**File:** `webapp/components/features/settings/studio-settings-form.tsx`

**Status:** 🟡 **Left Untouched** (local edits exist)

**Why Deferred:**
- Local uncommitted changes present
- Risk of merge conflicts
- Non-critical to Phase 1 goals

**Plan for Phase 2:**
1. Review local edits with team
2. Decide: keep, refactor, or discard
3. Integrate with unified HTTP client
4. Test settings form end-to-end

**Estimated Effort:** 2 hours

**Priority:** P2 (Medium)

**Owner:** [TBD]

**Tracking Issue:** [Create in project management tool]

---

### 2. Complete Bundle Analysis

**Status:** ⚠️ **Partially Complete**

**What's Done:**
- Vapi SDK moved server-side
- Dead code removed
- Prisma dependencies cleaned

**What's Missing:**
- Automated bundle size tracking in CI
- Bundle analyzer report generation
- Visual bundle comparison (before/after)

**Plan for Phase 2:**
1. Add `webpack-bundle-analyzer` to CI pipeline
2. Generate reports on every build
3. Set bundle size budget thresholds
4. Alert if bundle grows unexpectedly

**Estimated Effort:** 3 hours

**Priority:** P2 (Medium)

**Owner:** DevOps

---

### 3. Load Testing Suite

**Status:** 📝 **Documented, Not Implemented**

**What's Done:**
- Load test specification in benchmarks doc
- Example Locust script provided

**What's Missing:**
- Actual load test script (`api/tests/load_test.py`)
- CI integration for load testing
- Performance regression detection

**Plan for Phase 2:**
1. Implement Locust load test script
2. Test with 100 concurrent users
3. Add to CI (run on staging)
4. Set performance budgets

**Estimated Effort:** 4 hours

**Priority:** P1 (High)

**Owner:** Backend Team

---

### 4. Frontend Integration Tests

**Status:** ❌ **Not Started**

**What's Missing:**
- Playwright/Cypress E2E tests
- Settings save flow test
- Auth flow test
- Error state tests

**Plan for Phase 2:**
1. Choose E2E framework (Playwright recommended)
2. Implement critical path tests:
   - Login flow
   - Settings save/load
   - Error handling (network failure)
3. Add to CI pipeline

**Estimated Effort:** 8 hours

**Priority:** P1 (High)

**Owner:** Frontend Team

---

### 5. Monitoring Dashboard Implementation

**Status:** 📋 **Specified, Not Built**

**What's Done:**
- Observability plan documented
- Dashboard specifications defined
- Alert rules written

**What's Missing:**
- Actual dashboard creation (Grafana/Datadog/etc.)
- Metrics collection implementation
- Alert routing configuration

**Plan for Phase 2:**
1. Choose monitoring platform
2. Implement metrics collection
3. Build 3 dashboards (HTTP, UX, Errors)
4. Configure alerts
5. Test with simulated failures

**Estimated Effort:** 8 hours

**Priority:** P0 (Critical)

**Owner:** DevOps

---

## 📊 Phase 2 Priority Matrix

| Item | Priority | Effort | Impact | Phase | Owner |
|------|----------|--------|--------|-------|-------|
| Monitoring Dashboard | P0 | 8h | Critical | 2 | DevOps |
| Load Testing | P1 | 4h | High | 2 | Backend |
| E2E Tests | P1 | 8h | High | 2 | Frontend |
| studio-settings-form | P2 | 2h | Medium | 2 | Frontend |
| Bundle Analysis CI | P2 | 3h | Medium | 2 | DevOps |

**Total Phase 2 Effort:** 25 hours (~3.1 developer-days)

---

## 🗺️ Phase 2 Roadmap

### Week 1: Critical Infrastructure
```
Day 1-2: Monitoring Dashboard Implementation
  ├─→ Set up metrics collection
  ├─→ Build 3 core dashboards
  ├─→ Configure alerts
  └─→ Test with simulated failures

Day 3: Load Testing Suite
  ├─→ Implement Locust script
  ├─→ Run baseline tests
  └─→ Add to CI pipeline
```

### Week 2: Testing & Refinement
```
Day 4-5: Frontend E2E Tests
  ├─→ Set up Playwright
  ├─→ Implement critical path tests
  └─→ Add to CI

Day 6: Cleanup & Polish
  ├─→ Fix studio-settings-form
  ├─→ Add bundle analysis to CI
  └─→ Documentation updates
```

---

## 📝 Architecture Decision Records (ADRs)

### ADR-001: Remove Prisma in Favor of SQLAlchemy

**Date:** November 12, 2025

**Status:** Accepted ✅

**Context:**
- Phase 1 audit found Prisma schema unused (0% utilization)
- FastAPI backend uses SQLAlchemy for all DB operations
- Maintaining two ORMs creates confusion and overhead

**Decision:**
- Remove Prisma entirely from webapp
- Consolidate on SQLAlchemy (backend only)
- Delete `webapp/prisma/*` directory
- Remove Prisma dependencies from `package.json`

**Consequences:**
- ✅ Simplified architecture (one ORM)
- ✅ Reduced dependencies (-10 packages)
- ✅ Clearer execution path
- ⚠️ Future: If Next.js needs DB access, use API calls to FastAPI (not direct DB)

**Alternatives Considered:**
1. Keep Prisma for frontend, SQLAlchemy for backend
   - Rejected: Maintains split-brain architecture
2. Migrate everything to Prisma
   - Rejected: FastAPI + SQLAlchemy is working well
3. Use Prisma only for seed scripts
   - Rejected: Overhead not justified

---

### ADR-002: Unified HTTP Client vs. Multiple Clients

**Date:** November 12, 2025

**Status:** Accepted ✅

**Context:**
- Phase 1 audit found 3 divergent HTTP clients
- Each implemented own auth, retries, logging
- Caused inconsistent behavior and maintenance burden

**Decision:**
- Create single unified client (`server-client.ts`)
- All services must use unified client
- Centralize: timeouts, retries, correlation IDs, logging

**Consequences:**
- ✅ Consistent behavior across all API calls
- ✅ Single place to fix bugs
- ✅ Easier to add features (caching, circuit breaker)
- ⚠️ All services now coupled to single client (acceptable trade-off)

**Alternatives Considered:**
1. Keep multiple clients, add shared config
   - Rejected: Still maintains duplication
2. Use third-party library (axios, ky)
   - Rejected: Our needs are specific, custom client lighter
3. Move all API calls to server actions
   - Considered for Phase 3: Requires larger refactor

---

### ADR-003: Exponential Backoff for Retries

**Date:** November 12, 2025

**Status:** Accepted ✅

**Context:**
- Transient failures common (network blips, backend restarts)
- Immediate retries can worsen load on struggling backend
- Need smart retry strategy

**Decision:**
- Implement exponential backoff: 1s, 2s, 4s
- Retry only 5xx and network errors
- Max 3 retries before giving up

**Consequences:**
- ✅ Higher success rate for transient failures
- ✅ Doesn't hammer backend when it's struggling
- ✅ User waits max ~7s (1+2+4) before final failure
- ⚠️ Slower failure for non-transient errors (acceptable)

**Alternatives Considered:**
1. Fixed delay (e.g., 2s each)
   - Rejected: Can worsen backend congestion
2. Jittered exponential backoff
   - Considered for future: More complex, marginal benefit
3. No retries
   - Rejected: Poor UX for transient failures

---

### ADR-004: Correlation IDs via X-Request-ID Header

**Date:** November 12, 2025

**Status:** Accepted ✅

**Context:**
- Debugging distributed systems requires request tracing
- Need to correlate frontend → backend → database logs

**Decision:**
- Generate UUID v4 on frontend for each request
- Pass as `X-Request-ID` header
- Backend extracts and logs with all operations
- Return same ID in response header

**Consequences:**
- ✅ Can trace requests end-to-end
- ✅ Debugging time reduced drastically
- ✅ Support can help users with ID from error message
- ⚠️ Adds small overhead (~10 bytes per request)

**Alternatives Considered:**
1. Backend generates ID
   - Rejected: Can't correlate frontend logs
2. Use session ID
   - Rejected: Multiple requests per session, not unique enough
3. OpenTelemetry tracing
   - Future consideration: More complete but heavier

---

## 🔄 Continuous Tracking

### How to Update This Document

**When deferring work from Phase N to Phase N+1:**
1. Add item to "Deferred Items" section
2. Explain why deferred
3. Estimate effort
4. Assign priority
5. Create tracking issue in project management
6. Link to this document

**When completing deferred work:**
1. Mark item as ✅ Complete
2. Add completion date
3. Link to PR
4. Document any changes to original plan

---

## 📚 Related Documentation

- [Phase 1 Audit](../AUDIT.md)
- [Migration Runbook](./PHASE1_MIGRATION_RUNBOOK.md)
- [Observability Plan](./OBSERVABILITY_PLAN.md)
- [Benchmarks](./PHASE1_BENCHMARKS.md)

---

**Last Updated:** November 12, 2025  
**Version:** 1.0  
**Status:** Phase 2 Planning
