# 🔥 DIVINE INVESTIGATION — Finding What's Killing the Emerald

King, the app is unstable and slow. Here's the **ROYAL DIAGNOSTIC PROTOCOL** to identify the root cause:

---

## 🧠 PROBABLE CAUSES (Ranked by Likelihood)

### 1️⃣ **REACT QUERY CACHE HELL** ⚠️ **MOST LIKELY**
**Symptoms:** Everything spins forever, settings won't load, app feels "stuck"

**Root Cause Hypothesis:**
- We changed query keys from identity-based to simple
- Old cache entries still exist in browser
- React Query confused by key mismatch
- **Solution:** Clear localStorage + hard refresh

**Test:**
```bash
# Open browser DevTools → Console → Run:
localStorage.clear();
location.reload(true);
```

**Expected Result:** App should load fresh, fast, smooth ✨

---

### 2️⃣ **SSR HYDRATION MISMATCH** 🌊
**Symptoms:** Pages load blank, then suddenly flash content, then re-render

**Root Cause Hypothesis:**
- `useAuthToken` hydrates token on client AFTER server-side render
- `isAuthenticated` changes from `false` → `true` → Triggers re-render cascade
- React Query sees new enabled condition → Cancels/restarts fetches

**Test in Browser DevTools → Console:**
```js
// Check if token exists
localStorage.getItem("access_token")

// Check if userId is loaded
window.sessionStore?.getState()?.session?.user?.id
```

**Expected:** Token should be immediate, userId may be delayed

---

### 3️⃣ **BACKEND CREDENTIAL REFRESH OVERLOAD** 💥
**Symptoms:** Specific endpoints (voices, analytics, assistants) are slow

**Root Cause Hypothesis:**
- We added `await db.refresh(user)` to 11 endpoints
- Each refresh = Extra DB query
- If user hits multiple endpoints at once → DB connection pool exhausted

**Test in Render Logs:**
```
https://dashboard.render.com/web/srv-d3vrrns9c44c738skalg/logs
```

**Look For:**
- `Timeout acquiring connection from pool`
- `Pool exhausted`
- Slow query logs (>500ms)

**Fix If Found:**
- Increase NullPool timeout
- OR cache user object for request lifecycle
- OR reduce number of refresh calls

---

### 4️⃣ **VERCEL DEPLOYMENT STUCK** 🚦
**Symptoms:** Frontend deployed but serving stale code

**Root Cause Hypothesis:**
- Vercel auto-deploy triggered but failed silently
- Browser still loading old bundle with identity keys
- Race conditions still present in production

**Test:**
```bash
# Check what's actually deployed
curl -I "https://app.avafirstai.com/_next/static/chunks/app/layout-*.js" | grep "last-modified"

# Compare to latest commit
git log -1 --format="%H %ci"
```

**Check Vercel Dashboard:**
```
https://vercel.com/nissiel/avaai/deployments
```

**Look For:**
- Latest deployment status (should be "Ready")
- Commit hash matches `9e0e100`
- Build logs for errors

---

### 5️⃣ **DATABASE CONNECTION POOL LEAK** 💧
**Symptoms:** Backend fast at first, then slows down over time

**Root Cause Hypothesis:**
- NullPool + PgBouncer = No pooling
- Each request = New connection
- PgBouncer transaction mode = Max 100 connections
- If connections not closed properly → Pool exhausted

**Test Backend (SSH into Render):**
```python
# Check active connections
from src.infrastructure.database.session import engine
print(f"Pool size: {engine.pool.size()}")
print(f"Checked out: {engine.pool.checkedout()}")
```

**Check Supabase Dashboard:**
```
https://supabase.com/dashboard/project/[project-id]/database/pooler
```

**Look For:**
- Active connections > 90 (danger zone)
- Connection leaks (connections not released)

---

### 6️⃣ **BROWSER EXTENSION INTERFERENCE** 🔌
**Symptoms:** App slow only in specific browser, works fine in others

**Root Cause Hypothesis:**
- Ad blocker, privacy extension, or React DevTools
- Intercepting API calls
- Slowing down requests

**Test:**
```
Open app in Incognito Mode (no extensions)
```

**Expected:** If faster → Extension is the culprit

---

## 🔬 DIVINE DIAGNOSTIC SEQUENCE

**Run these commands IN ORDER:**

### Step 1: Check What's Actually Deployed
```bash
cd /Users/nissielberrebi/Desktop/Avaai

# Latest commit
git log -1 --oneline

# What's live on Render?
curl -s "https://api.render.com/v1/services/srv-d3vrrns9c44c738skalg/deploys?limit=1" \
  -H "Authorization: Bearer rnd_Il2IDV3qyOkyQYgb0ttLWPikIQJi" | \
  python3 -m json.tool | grep -E "status|commit"

# What's live on Vercel?
curl -I "https://app.avafirstai.com" | grep -E "x-vercel-id|age"
```

---

### Step 2: Test Backend Performance
```bash
# Backend health check (should be <500ms)
time curl -s "https://ava-api-production.onrender.com/healthz"

# Test authenticated endpoint (should be <1s)
TOKEN="<your-token-from-localStorage>"
time curl -s "https://ava-api-production.onrender.com/api/v1/vapi/settings" \
  -H "Authorization: Bearer $TOKEN"
```

---

### Step 3: Test Frontend Performance
```bash
# Frontend load time (should be <2s)
time curl -s "https://app.avafirstai.com" > /dev/null

# Check for build errors
curl -s "https://app.avafirstai.com/_next/static/chunks/app/layout-*.js" | grep "error"
```

---

### Step 4: Browser DevTools Investigation
**Open:** `https://app.avafirstai.com`

**DevTools → Console:**
```js
// 1. Check token exists
console.log("Token:", localStorage.getItem("access_token")?.slice(0, 20) + "...");

// 2. Check session state
console.log("Session:", window.sessionStore?.getState()?.session);

// 3. Clear cache and reload
localStorage.clear();
location.reload(true);
```

**DevTools → Network Tab:**
- Filter: `settings` or `vapi` or `twilio`
- Check timing: Should complete in <1s
- Check status: Should be 200 OK
- Look for: 503, 504, or timeout errors

**DevTools → React Query DevTools (if visible):**
- Check query status: Should be "success", not "loading"
- Check query keys: Should be `["vapi-settings"]`, not `["vapi-settings", "token:hash"]`

---

### Step 5: Check Render Logs
```
https://dashboard.render.com/web/srv-d3vrrns9c44c738skalg/logs
```

**Look For:**
- Errors: `ConnectionError`, `PoolTimeout`, `DatabaseError`
- Warnings: `Slow query`, `Deprecated`
- 503 errors: `Service Unavailable`

---

### Step 6: Check Vercel Logs
```
https://vercel.com/nissiel/avaai/logs
```

**Look For:**
- Build errors
- Runtime errors
- API route failures

---

## 🎯 SMART FIXES BY SCENARIO

### If **React Query Cache Hell**:
```ts
// Add to webapp/lib/hooks/use-auth-token.ts (line 56)
// Force cache clear on mount if keys changed
useEffect(() => {
  const cacheVersion = localStorage.getItem("ava-cache-version");
  if (cacheVersion !== "2.0") {
    // Clear React Query cache
    queryClient.clear();
    localStorage.setItem("ava-cache-version", "2.0");
  }
}, []);
```

---

### If **SSR Hydration Mismatch**:
```ts
// Change enabled condition to be stable on initial render
const { data } = useQuery({
  queryKey: ["vapi-settings"],
  queryFn: getVapiSettings,
  enabled: typeof window !== "undefined" && isAuthenticated,
  //      ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ Prevents SSR run
});
```

---

### If **Backend Credential Refresh Overload**:
```python
# Cache user object in request lifecycle
# api/src/presentation/api/v1/deps.py
from functools import lru_cache

@lru_cache(maxsize=1)
async def get_fresh_user(user_id: str, db: AsyncSession):
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one()
```

---

### If **Database Connection Pool Leak**:
```python
# Increase timeout in api/src/infrastructure/database/session.py
engine = create_async_engine(
    settings.database_url,
    poolclass=NullPool,
    connect_args={
        "timeout": 30,  # Increase from default 10s
        "command_timeout": 30,
    },
)
```

---

### If **Vercel Deployment Stuck**:
```bash
# Force re-deploy
cd /Users/nissielberrebi/Desktop/Avaai
git commit --allow-empty -m "Force Vercel re-deploy"
git push origin main
```

---

## 🔥 MOST LIKELY CULPRIT

**MY ROYAL VERDICT:**

**99% sure it's #1: React Query Cache Hell**

**WHY:**
- We changed query keys 2 times in 3 commits
- Old cache entries still in browser
- React Query trying to reconcile old/new keys
- Causing infinite re-fetches

**THE DIVINE FIX:**

1. **Clear browser cache:** `localStorage.clear()` + hard refresh
2. **Force cache version bump:** Add cache version check to hooks
3. **Test again:** Should be instant and smooth

---

## 📋 ROYAL CHECKLIST

King, **do this IN ORDER:**

- [ ] Open browser DevTools → Console
- [ ] Run: `localStorage.clear(); location.reload(true);`
- [ ] Check if app loads fast now
- [ ] If YES → We need to add cache version check
- [ ] If NO → Check Network tab for slow requests
- [ ] If slow requests → Check which endpoint
- [ ] Report back findings → We fix together

---

## 💎 EXPECTED OUTCOME

After clearing cache:
- ✅ Settings page loads in <1s
- ✅ Status cards show immediately (no spinners)
- ✅ Credentials save and work instantly
- ✅ Navigation is smooth and instant
- ✅ No console errors

**If not → Tell me what's still slow → We hunt deeper.**

---

**🔥 DIVINE RULE: We don't stop until the emerald shines. 💎**
