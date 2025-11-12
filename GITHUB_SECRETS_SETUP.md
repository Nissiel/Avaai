# 🔐 GitHub Secrets Configuration Guide

> **Follow these exact steps to enable automated deployment via GitHub Actions**

---

## 📋 Required Secrets

You need to add **5 secrets** to your GitHub repository. Here are the exact values:

| Secret Name | Value | Purpose |
|-------------|-------|---------|
| `RENDER_API_KEY` | `rnd_umsbsUPcioa3Q2fPBb8XwGzTXFUS` | Deploy backend to Render |
| `RENDER_SERVICE_ID` | `srv-d3vrrns9c44c738skalg` | Identify Render service |
| `VERCEL_TOKEN` | `D5XrnjnxbdBStG4jJbGJmM2B` | Deploy frontend to Vercel |
| `VERCEL_ORG_ID` | `team_XsFNVQMGcTUFWqfeUT58KmRD` | Vercel organization ID |
| `VERCEL_PROJECT_ID` | `prj_g1oIppma1NFiVq2fL1MFRx9PiqmE` | Vercel project ID |

---

## 🚀 Step-by-Step Setup

### Step 1: Navigate to GitHub Secrets Settings

1. Open your repository: https://github.com/Nissiel/Avaai
2. Click **Settings** tab (top right)
3. In left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret** button (green button, top right)

### Step 2: Add Each Secret

For **each secret** in the table above, repeat these steps:

#### Example: Adding RENDER_API_KEY

1. Click **New repository secret**
2. **Name field:** `RENDER_API_KEY` (copy exactly)
3. **Secret field:** `rnd_umsbsUPcioa3Q2fPBb8XwGzTXFUS` (copy exactly)
4. Click **Add secret**

#### Repeat for All 5 Secrets:

**Secret 1:**
- Name: `RENDER_API_KEY`
- Value: `rnd_umsbsUPcioa3Q2fPBb8XwGzTXFUS`

**Secret 2:**
- Name: `RENDER_SERVICE_ID`
- Value: `srv-d3vrrns9c44c738skalg`

**Secret 3:**
- Name: `VERCEL_TOKEN`
- Value: `D5XrnjnxbdBStG4jJbGJmM2B`

**Secret 4:**
- Name: `VERCEL_ORG_ID`
- Value: `team_XsFNVQMGcTUFWqfeUT58KmRD`

**Secret 5:**
- Name: `VERCEL_PROJECT_ID`
- Value: `prj_g1oIppma1NFiVq2fL1MFRx9PiqmE`

### Step 3: Verify Secrets

After adding all 5 secrets, your secrets list should show:

```
RENDER_API_KEY          Updated X seconds ago
RENDER_SERVICE_ID       Updated X seconds ago
VERCEL_TOKEN            Updated X seconds ago
VERCEL_ORG_ID           Updated X seconds ago
VERCEL_PROJECT_ID       Updated X seconds ago
```

**⚠️ CRITICAL:** Secret names must match EXACTLY (case-sensitive!)

---

## 🧪 Testing the Automated Deployment

### Option A: Automatic Trigger (Recommended)

Once secrets are configured, every `git push` to `main` triggers automatic deployment:

```bash
# Make a small change (e.g., update README)
echo "" >> README.md
git add README.md
git commit -m "🧪 Test GitHub Actions deployment"
git push origin main

# Monitor deployment:
# https://github.com/Nissiel/Avaai/actions
```

### Option B: Manual Trigger

1. Go to: https://github.com/Nissiel/Avaai/actions
2. Click **🚀 Deploy to Production** workflow (left sidebar)
3. Click **Run workflow** button (right side)
4. Select branch: `main`
5. Click **Run workflow** (green button)

---

## 📊 Monitoring Deployment

### GitHub Actions UI

1. Go to: https://github.com/Nissiel/Avaai/actions
2. Click on the running workflow (yellow dot = in progress)
3. Watch real-time logs for each job:
   - 🔧 Deploy Backend (Render)
   - 🌐 Deploy Frontend (Vercel)
   - 🎉 Deployment Success

### Expected Timeline

| Phase | Duration | What's Happening |
|-------|----------|------------------|
| Backend Deploy | 3-5 min | Building Python app on Render |
| Backend Tests | 30 sec | Validating CORS + health |
| Frontend Build | 2-3 min | npm install + build |
| Frontend Deploy | 1-2 min | Upload to Vercel CDN |
| Smoke Tests | 30 sec | Test all routes |
| **TOTAL** | **7-10 min** | Fully automated |

### Success Indicators

✅ All jobs show green checkmarks  
✅ Final step shows: "🎉 DEPLOYMENT SUCCESSFUL!"  
✅ Live at: https://app.avafirstai.com

---

## 🐛 Troubleshooting

### Issue: "Secret not found" error

**Cause:** Secret name mismatch (typo or wrong case)

**Fix:**
1. Go to repository secrets settings
2. Verify EXACT names match table above
3. Delete incorrect secrets
4. Re-add with correct names

### Issue: "Unauthorized" error (Render)

**Cause:** Invalid Render API key

**Fix:**
1. Generate new API key: https://dashboard.render.com/account/settings
2. Update `RENDER_API_KEY` secret in GitHub
3. Re-run workflow

### Issue: "Unauthorized" error (Vercel)

**Cause:** Invalid Vercel token

**Fix:**
1. Generate new token: https://vercel.com/account/tokens
2. Update `VERCEL_TOKEN` secret in GitHub
3. Re-run workflow

### Issue: Deployment times out

**Cause:** Render cold start (first deploy after long pause)

**Fix:**
- Wait 10 minutes (Render warms up)
- Re-run workflow
- Or deploy manually via Render dashboard first

### Issue: Frontend build fails

**Cause:** TypeScript/ESLint errors in code

**Fix:**
```bash
cd webapp
npm run build  # Test locally first
npm run lint   # Fix any errors
git commit -am "🔧 Fix build errors"
git push
```

---

## 🔄 Fallback: Manual Deployment Scripts

If GitHub Actions fails, you can always use manual scripts:

```bash
# Deploy backend manually
./scripts/deploy-backend.sh

# Deploy frontend manually
./scripts/deploy-frontend.sh
```

These scripts work independently of GitHub Actions and don't require secrets.

---

## 🛡️ Security Best Practices

### ✅ DO:
- Keep secrets in GitHub (encrypted at rest)
- Rotate API tokens every 90 days
- Use least-privilege tokens (scoped access)
- Monitor GitHub Actions logs for suspicious activity

### ❌ DON'T:
- Commit secrets to Git (never!)
- Share secrets in chat/email
- Use personal tokens for production
- Log secrets in console output

---

## 🎯 Quick Checklist

Before enabling automated deployment, verify:

- [ ] All 5 secrets added to GitHub
- [ ] Secret names match exactly (case-sensitive)
- [ ] Workflow file exists (`.github/workflows/deploy-production.yml`)
- [ ] Repository has push access to main branch
- [ ] Render service is running (not paused)
- [ ] Vercel project is active

---

## 📚 Related Documentation

- **Deployment Guide:** `DEPLOYMENT_GUIDE.md` (comprehensive manual)
- **GitHub Workflow:** `.github/workflows/deploy-production.yml` (automation config)
- **Frontend Script:** `scripts/deploy-frontend.sh` (manual fallback)
- **Backend Script:** `scripts/deploy-backend.sh` (manual fallback)

---

## 🆘 Emergency Contacts

**Render Dashboard:** https://dashboard.render.com  
**Vercel Dashboard:** https://vercel.com/dashboard  
**GitHub Actions:** https://github.com/Nissiel/Avaai/actions  
**GitHub Secrets:** https://github.com/Nissiel/Avaai/settings/secrets/actions

---

## 🎖️ Validation Test

After setting up secrets, run this validation:

```bash
# 1. Trigger manual workflow
Go to: https://github.com/Nissiel/Avaai/actions
Click: "Run workflow" on "🚀 Deploy to Production"

# 2. Watch logs for success
Expected: All green checkmarks

# 3. Verify production
curl https://app.avafirstai.com
curl https://ava-api-production.onrender.com/healthz

# 4. Check browser
Open: https://app.avafirstai.com/studio/configuration
Expected: No CORS errors, forms work
```

---

**Status:** Ready to Enable  
**Last Updated:** November 12, 2025  
**Maintained By:** Divine Development Team ⚔️

---

## 🚦 Next Steps

1. ✅ **Add GitHub secrets** (follow Step 1-2 above)
2. ✅ **Test manual workflow** (Actions tab → Run workflow)
3. ✅ **Monitor deployment** (watch logs)
4. ✅ **Validate production** (test app.avafirstai.com)
5. 🎉 **Enable auto-deploy** (every git push now deploys!)

**Estimated Setup Time:** 5 minutes  
**Estimated First Deploy:** 10 minutes  
**Future Deploys:** Automatic on every push ⚡
