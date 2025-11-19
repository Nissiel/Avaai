# 🚀 Automated Deployment & Testing Guide

> **TL;DR:** Run `./scripts/deploy-frontend.sh` and `./scripts/deploy-backend.sh` for instant deployment with automated testing.

---

## 📋 Table of Contents

1. [Quick Start](#quick-start) (5 minutes)
2. [Deployment Options](#deployment-options) (3 methods)
3. [Configuration](#configuration) (API tokens)
4. [Troubleshooting](#troubleshooting) (common issues)

---

## 🚀 Quick Start

### Prerequisites

```bash
# 1. Make scripts executable
chmod +x scripts/deploy-frontend.sh
chmod +x scripts/deploy-backend.sh

# 2. Install Vercel CLI (if not already)
npm install -g vercel

# 3. Login to Vercel
vercel login
```

### Deploy Backend First (CRITICAL)

**Why first?** Backend deployment activates CORS fix for `app.avafirstai.com`.

```bash
./scripts/deploy-backend.sh
```

**What it does:**
- ✅ Guides you through Render dashboard deployment
- ✅ Waits for deployment completion
- ✅ Tests backend health
- ✅ **Validates CORS headers** (most critical)
- ✅ Shows recent logs

**Expected output:**
```
✅ Backend is alive (200)
✅ CORS header correct for app.avafirstai.com
✅ API routing works
```

### Deploy Frontend Second

```bash
./scripts/deploy-frontend.sh
```

**What it does:**
- ✅ Checks/installs Vercel CLI
- ✅ Builds locally (catches errors early)
- ✅ Deploys to production
- ✅ Runs 3 smoke tests:
  - Homepage accessibility
  - `/api/config` route (auth fix)
  - `/api/vapi-settings` proxy (CORS test)

**Expected output:**
```
✅ Local build successful
✅ Deployed to production
✅ Homepage test passed
✅ Config API test passed
✅ VAPI proxy test passed
```

---

## 🎯 Deployment Options

### Option 1: Shell Scripts (Recommended for Now)

**Pros:** Immediate, secure (no token storage), interactive
**Cons:** Manual execution required

```bash
# Terminal 1: Deploy backend
./scripts/deploy-backend.sh

# Terminal 2: Deploy frontend (after backend completes)
./scripts/deploy-frontend.sh
```

### Option 2: GitHub Actions (Recommended for Long-Term)

**Pros:** Fully automated, triggered by git push, comprehensive testing
**Cons:** Requires API token setup

#### Setup (One-Time)

1. **Get Render API Key**
   - Go to https://dashboard.render.com/account/settings
   - Click "Create API Key"
   - Copy the key

2. **Get Render Service ID**
   ```bash
   # Visit Render dashboard, find your service URL:
   # https://dashboard.render.com/web/srv-XXXXXXXXXXXXX
   # Copy the "srv-XXXXXXXXXXXXX" part
   ```

3. **Get Vercel Token**
   ```bash
   # Visit https://vercel.com/account/tokens
   # Click "Create Token"
   # Copy the token
   ```

4. **Get Vercel Project IDs**
   ```bash
   cd webapp
   vercel link  # Follow prompts
   cat .vercel/project.json
   # Copy orgId and projectId
   ```

5. **Add Secrets to GitHub**
   - Go to https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions
   - Click "New repository secret"
   - Add these secrets:
     - `RENDER_API_KEY` → Your Render API key
     - `RENDER_SERVICE_ID` → Your service ID (srv-XXX)
     - `VERCEL_TOKEN` → Your Vercel token
     - `VERCEL_ORG_ID` → From .vercel/project.json
     - `VERCEL_PROJECT_ID` → From .vercel/project.json

#### Usage

**Automatic:**
```bash
git push origin main
# GitHub Actions automatically deploys backend → frontend → tests
```

**Manual:**
- Go to https://github.com/YOUR_USERNAME/YOUR_REPO/actions
- Click "🚀 Deploy to Production"
- Click "Run workflow"

### Option 3: Render API + Vercel CLI Scripts

**Pros:** Fully automated like GitHub Actions, but runs locally
**Cons:** Requires storing API keys in environment variables

```bash
# 1. Set environment variables
export RENDER_API_KEY="your_render_api_key"
export RENDER_SERVICE_ID="srv-xxxxxxxxxxxxx"
export VERCEL_TOKEN="your_vercel_token"

# 2. Run scripts (now fully automated)
./scripts/deploy-backend.sh  # No manual steps needed
./scripts/deploy-frontend.sh
```

---

## ⚙️ Configuration

### Environment Variables (Optional)

Create `.env.deployment` (add to `.gitignore`):

```bash
# Render credentials
RENDER_API_KEY=your_render_api_key_here
RENDER_SERVICE_ID=srv-xxxxxxxxxxxxx

# Vercel credentials (optional for scripts)
VERCEL_TOKEN=your_vercel_token_here
VERCEL_ORG_ID=team_xxxxxxxxxxxxx
VERCEL_PROJECT_ID=prj_xxxxxxxxxxxxx
```

Load before deploying:
```bash
source .env.deployment
./scripts/deploy-backend.sh  # Now fully automated
```

### Manual Deploy (No Scripts)

#### Backend (Render Dashboard)

1. Open https://dashboard.render.com
2. Find "ava-api-production" service
3. Click "Manual Deploy" → "Deploy latest commit"
4. Wait 3-5 minutes
5. Check logs for: `🔥 CORS ALLOW LIST:`
6. Verify `https://app.avafirstai.com` appears

#### Frontend (Vercel CLI)

```bash
cd webapp
vercel --prod
```

---

## 🐛 Troubleshooting

### Backend Issues

#### CORS Not Working

**Symptom:** Script shows `❌ CORS header missing or incorrect`

**Diagnosis:**
```bash
# Test CORS manually
curl -X OPTIONS https://ava-api-production.onrender.com/api/v1/vapi-settings \
  -H "Origin: https://app.avafirstai.com" \
  -H "Access-Control-Request-Method: GET" -i

# Look for this header:
# access-control-allow-origin: https://app.avafirstai.com
```

**Fix:**
1. Check Render environment variables:
   - Variable: `AVA_API_ALLOWED_ORIGINS`
   - Should include: `https://app.avafirstai.com`

2. Check code (already fixed in commit b07ce1e):
   ```python
   # api/src/core/middleware.py line 43
   "production": [
       "https://app.ava.ai",
       "https://avaai-olive.vercel.app",
       "https://app.avafirstai.com",  # ← This must be present
   ]
   ```

3. Force redeploy:
   ```bash
   # Option 1: Via dashboard
   Render Dashboard → Manual Deploy → Clear cache and deploy
   
   # Option 2: Via API
   ./scripts/deploy-backend.sh
   ```

#### Backend Returns 502

**Symptom:** Health check fails, service crashes on startup

**Diagnosis:**
```bash
# Check Render logs
# Dashboard → Logs → Look for Python tracebacks
```

**Common causes:**
- Database connection issues (Supabase URL/key wrong)
- Missing environment variables
- Python package conflicts

**Fix:**
```bash
# 1. Verify environment variables in Render dashboard
# 2. Check requirements.txt matches local environment
# 3. Clear build cache and redeploy
```

### Frontend Issues

#### Build Fails Locally

**Symptom:** `npm run build` shows TypeScript errors

**Diagnosis:**
```bash
cd webapp
npm run build 2>&1 | tee build-errors.log
```

**Fix:**
```bash
# 1. Clear cache
rm -rf .next node_modules
npm install
npm run build

# 2. If TypeScript errors persist
npm run type-check  # Shows detailed errors
```

#### Smoke Tests Fail

**Symptom:** Script shows `❌ Homepage test failed (502)`

**Common causes:**
1. **Vercel not deployed yet:** Wait 30 seconds after deploy command
2. **DNS propagation:** Can take 1-5 minutes for new deployments
3. **Backend still deploying:** Ensure backend script completed first

**Fix:**
```bash
# Retry tests manually
curl -I https://app.avafirstai.com
curl -I https://app.avafirstai.com/api/config
curl -I https://app.avafirstai.com/api/vapi-settings

# Expected: 200, 401, or 403 (not 502 or 504)
```

#### CORS Errors in Browser

**Symptom:** DevTools console shows "CORS policy blocked"

**Diagnosis:**
```bash
# 1. Check Network tab
# Look at OPTIONS request (preflight)
# Response headers should include:
#   access-control-allow-origin: https://app.avafirstai.com

# 2. Test backend CORS
curl -X OPTIONS https://ava-api-production.onrender.com/api/v1/vapi-settings \
  -H "Origin: https://app.avafirstai.com" -i
```

**Fix hierarchy:**
1. ✅ Backend deployed? (run `./scripts/deploy-backend.sh`)
2. ✅ CORS validation passed? (check script output)
3. ✅ Cache cleared? (Ctrl+Shift+R in browser)
4. ✅ Try incognito mode (eliminates cache issues)

---

## 📊 Validation Checklist

After deploying both backend and frontend:

### ✅ Backend Validation

```bash
# 1. Health check
curl https://ava-api-production.onrender.com/healthz
# Expected: {"status":"ok"}

# 2. CORS headers
curl -X OPTIONS https://ava-api-production.onrender.com/api/v1/vapi-settings \
  -H "Origin: https://app.avafirstai.com" -i | grep access-control-allow-origin
# Expected: access-control-allow-origin: https://app.avafirstai.com

# 3. API routing
curl https://ava-api-production.onrender.com/api/v1/health
# Expected: 200 or 404 (not 502)
```

### ✅ Frontend Validation

```bash
# 1. Homepage
curl -I https://app.avafirstai.com
# Expected: HTTP/2 200

# 2. Config route
curl -I https://app.avafirstai.com/api/config
# Expected: 401 or 403 (not 502)

# 3. VAPI proxy
curl -I https://app.avafirstai.com/api/vapi-settings
# Expected: 401 or 403 (not 502)
```

### ✅ Browser Validation

1. Open https://app.avafirstai.com/studio/configuration
2. **Check DevTools Console:**
   - ❌ No "CORS policy" errors
   - ❌ No "Failed to fetch" errors
   - ❌ No 502 Bad Gateway errors
3. **Check Network Tab:**
   - `/api/config` → 200 (after login)
   - `/api/vapi-settings` → 200 (after login)
4. **Test Form Inputs:**
   - All fields editable ✅
   - Save button works ✅
   - No accessibility warnings ✅

---

## 🎯 Success Criteria

**Backend deployed successfully when:**
- ✅ Health check returns 200
- ✅ CORS header includes `app.avafirstai.com`
- ✅ Logs show `🔥 CORS ALLOW LIST: [...'https://app.avafirstai.com']`

**Frontend deployed successfully when:**
- ✅ Homepage loads (200)
- ✅ `/api/config` returns 401/403 (not 502)
- ✅ `/api/vapi-settings` proxies to backend (401/403)
- ✅ Browser DevTools shows no CORS errors

**Production ready when:**
- ✅ User can login at https://app.avafirstai.com
- ✅ Studio configuration page loads
- ✅ All form inputs are editable
- ✅ Save configuration works (no 502 errors)
- ✅ No accessibility warnings in console

---

## 📚 Additional Resources

- **Render Dashboard:** https://dashboard.render.com
- **Vercel Dashboard:** https://vercel.com/dashboard
- **GitHub Actions:** `.github/workflows/deploy-production.yml`
- **Backend Logs:** Render Dashboard → Service → Logs tab
- **Frontend Logs:** Vercel Dashboard → Project → Deployments → View Logs

---

## 🆘 Emergency Rollback

If deployment breaks production:

### Backend Rollback (Render)

1. Open Render Dashboard
2. Go to Service → Deploys
3. Find last working deployment
4. Click "⋮" → "Redeploy"

### Frontend Rollback (Vercel)

```bash
# 1. List recent deployments
vercel ls

# 2. Promote previous deployment
vercel promote <deployment-url>

# Or via dashboard:
# Vercel Dashboard → Deployments → Click deployment → Promote to Production
```

---

**Last Updated:** November 12, 2025  
**Maintained By:** Divine Development Team ⚔️
