# 🎯 Quick Start Guide - Test Your Deployment

## Step 1: Get Your Vercel URL

1. Va sur: https://vercel.com/nissiel/avaai
2. Copie l'URL de production (exemple: `https://avaai-xyz.vercel.app`)

## Step 2: Run Health Check

```bash
cd /Users/nissielberrebi/Desktop/Avaai
./scripts/health-check.sh https://YOUR_VERCEL_URL
```

Exemple:
```bash
./scripts/health-check.sh https://avaai-xyz.vercel.app
```

## Step 3: Test in Browser

### 1. Home Page
```
https://YOUR_VERCEL_URL/
```
- ✅ Devrait rediriger vers `/en`
- ✅ Afficher la landing page

### 2. Sign Up Flow
```
https://YOUR_VERCEL_URL/en/signup
```
- ✅ Formulaire d'inscription
- ✅ Créer un compte avec ton email
- ✅ Vérifier que ça fonctionne

### 3. Login Flow
```
https://YOUR_VERCEL_URL/en/login
```
- ✅ Se connecter avec le compte créé
- ✅ Devrait rediriger vers `/en/app/home`

### 4. Dashboard
```
https://YOUR_VERCEL_URL/en/app/home
```
- ✅ Voir le dashboard
- ✅ Tester la navigation

### 5. Multi-Language
```
https://YOUR_VERCEL_URL/fr
https://YOUR_VERCEL_URL/he
```
- ✅ Français fonctionne
- ✅ Hebrew fonctionne (RTL)

## Step 4: Configure CORS (Important!)

Une fois que tu as l'URL Vercel, configure le backend:

### Option A: Via Render Dashboard
1. Va sur: https://dashboard.render.com
2. Sélectionne ton service "ava-api-production"
3. Environment → Add Environment Variable:
   ```
   FRONTEND_URL=https://YOUR_VERCEL_URL
   ```
4. Save → Redeploy

### Option B: Modifier le code
Édite `api/src/core/app.py` ou `api/main.py`:

```python
from fastapi.middleware.cors import CORSMiddleware

# Après la création de l'app
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://YOUR_VERCEL_URL",
        "http://localhost:3000",  # pour dev local
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Step 5: Update Environment Variables

### Vercel (Frontend)
```bash
vercel env add NEXTAUTH_URL
# Enter: https://YOUR_VERCEL_URL

vercel env add NEXT_PUBLIC_API_URL  
# Enter: https://ava-api-production.onrender.com
```

OU via dashboard: https://vercel.com/nissiel/avaai/settings/environment-variables

## Step 6: Test Complete User Journey

1. **Nouveau visiteur**
   - [ ] Arrive sur la home
   - [ ] Clique "Get Started"
   - [ ] Crée un compte
   - [ ] Reçoit email de confirmation (si configuré)

2. **Premier login**
   - [ ] Se connecte
   - [ ] Voir le onboarding
   - [ ] Compléter le setup

3. **Utilisation normale**
   - [ ] Dashboard: voir stats
   - [ ] Inbox: messages
   - [ ] Analytics: graphiques
   - [ ] Settings: profil

4. **Performance**
   - [ ] Pages chargent rapidement (< 2s)
   - [ ] Pas de bugs JavaScript (F12 Console)
   - [ ] Responsive mobile fonctionne

## Common Issues & Fixes

### 1. CORS Error
**Symptôme:** Browser console shows "CORS policy blocked"
**Fix:** Configure FRONTEND_URL dans Render (voir Step 4)

### 2. 500 Server Error
**Symptôme:** API calls fail with 500
**Fix:** 
- Check Render logs: https://dashboard.render.com
- Vérifier DATABASE_URL est correct
- Vérifier migrations ont run: `alembic upgrade head`

### 3. Redirect Loop
**Symptôme:** Page reload infiniment
**Fix:**
- Vérifier NEXTAUTH_URL est correct
- Clear browser cookies
- Check NEXTAUTH_SECRET est set

### 4. Missing Translations
**Symptôme:** Certains textes en anglais dans /fr
**Fix:** Édite `webapp/messages/fr.json`

## Monitoring

### Check Logs

**Frontend (Vercel):**
```bash
vercel logs https://YOUR_VERCEL_URL
```

**Backend (Render):**
Dashboard → Logs tab (real-time)

**Database (Supabase):**
Dashboard → Logs → SQL Queries

### Performance

**Lighthouse (Chrome):**
1. F12 → Lighthouse tab
2. Generate report
3. Objectif: Score > 90 partout

**Real User Monitoring:**
- Setup PostHog ou Google Analytics
- Track: signups, page views, errors

## Success Metrics

**Day 1:**
- [ ] 0 errors dans logs
- [ ] Au moins 1 signup de test fonctionne
- [ ] Toutes les pages chargent

**Week 1:**
- [ ] 10+ vrais utilisateurs
- [ ] Pas de bugs critiques
- [ ] Performance stable

**Month 1:**
- [ ] 100+ utilisateurs
- [ ] Analytics tracking actif
- [ ] Feedback loop établi

## Next Actions

✅ **Maintenant:**
1. Run `./scripts/health-check.sh YOUR_URL`
2. Test signup flow
3. Configurer CORS

🎯 **Cette semaine:**
1. Inviter 5 beta testers
2. Collecter feedback
3. Fix bugs prioritaires

🚀 **Ce mois:**
1. SEO optimization
2. Content marketing
3. Scale infrastructure si besoin

---

## Quick Links

- **Vercel Dashboard:** https://vercel.com/nissiel/avaai
- **Render Dashboard:** https://dashboard.render.com
- **Supabase Dashboard:** https://supabase.com/dashboard/project/zymlhofsintkycruwznc
- **API Docs:** https://ava-api-production.onrender.com/docs
- **Full Checklist:** ./DEPLOYMENT_CHECKLIST.md

---

**Questions? Issues?**
- Check logs first
- Review DEPLOYMENT_CHECKLIST.md
- Test endpoints with curl/Postman
- Check browser console for errors

**Tu es prêt! 🚀**
