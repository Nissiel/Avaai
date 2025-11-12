# ⚡ QUICK FIX — Vercel Auto-Deploy (5 Minutes)

**Problem:** Vercel requires manual "Promote to Production" after each push  
**Solution:** Add missing GitHub secrets to enable automated pipeline

---

## 🎯 THE FIX (Copy-Paste Ready)

### Step 1: Open GitHub Secrets
```
https://github.com/Nissiel/Avaai/settings/secrets/actions
```

### Step 2: Add These 5 Secrets

Click **"New repository secret"** for each:

#### 1. VERCEL_ORG_ID
```
team_XsFNVQMGcTUFWqfeUT58KmRD
```

#### 2. VERCEL_PROJECT_ID
```
prj_g1oIppma1NFiVq2fL1MFRx9PiqmE
```

#### 3. VERCEL_TOKEN
- Go to: https://vercel.com/account/tokens
- Click "Create Token"
- Name: "GitHub Actions"
- Scope: Full Access
- Copy the token
- Paste into GitHub secret

#### 4. RENDER_API_KEY
- Go to: https://dashboard.render.com/account
- Click "API Keys" → "Create API Key"
- Name: "GitHub Actions"
- Copy the key
- Paste into GitHub secret

#### 5. RENDER_SERVICE_ID
- Go to your Render service dashboard
- Look at the URL: `https://dashboard.render.com/web/srv-XXXXXXXXX`
- Copy `srv-XXXXXXXXX` (your service ID)
- Paste into GitHub secret

---

## ✅ Test It

```bash
cd /Users/nissielberrebi/Desktop/Avaai
echo "" >> README.md
git add -A
git commit -m "Test auto-deploy"
git push origin main
```

Watch: https://github.com/Nissiel/Avaai/actions

Should see:
```
✅ Backend deployed to Render
✅ Frontend deployed to Vercel
✅ All smoke tests passed
```

---

## 🎉 DONE!

From now on:
- `git push origin main` → Automatic production deployment
- No more manual "Promote to Production" clicks
- Backend + frontend deploy together

**Full docs:** [`VERCEL_AUTO_DEPLOY_FIX.md`](./VERCEL_AUTO_DEPLOY_FIX.md)
