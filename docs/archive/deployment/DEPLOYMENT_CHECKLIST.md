# 🚀 Deployment Checklist - Production Ready

## ✅ Phase 1: Verify Deployment

### Frontend (Vercel)
1. **Check Deployment Status**
   - [ ] Aller sur https://vercel.com/nissiel/avaai
   - [ ] Vérifier que le build est "Ready" (vert)
   - [ ] Noter l'URL de production (ex: https://avaai.vercel.app)

2. **Test Basic Pages**
   - [ ] Visiter la home page: `https://YOUR_URL/`
   - [ ] Vérifier redirection vers `/en`
   - [ ] Tester les 3 locales: `/en`, `/fr`, `/he`
   - [ ] Vérifier que les pages chargent sans erreur 404

3. **Test Auth Flow**
   - [ ] `/en/signup` - Créer un nouveau compte
   - [ ] Vérifier email de confirmation
   - [ ] `/en/login` - Se connecter
   - [ ] Vérifier redirection vers `/en/app/home`

### Backend (Render)
1. **Verify API Health**
   ```bash
   curl https://ava-api-production.onrender.com/healthz
   # Should return: {"status":"ok"}
   ```

2. **Test Auth Endpoints**
   ```bash
   # Test signup
   curl -X POST https://ava-api-production.onrender.com/api/v1/auth/signup \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Test123!","full_name":"Test User"}'

   # Test login
   curl -X POST https://ava-api-production.onrender.com/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Test123!"}'
   ```

### Database (Supabase)
1. **Check Tables**
   - [ ] Aller sur https://supabase.com/dashboard/project/zymlhofsintkycruwznc
   - [ ] Table Editor → Vérifier que `users`, `phone_numbers`, `calls` existent
   - [ ] Vérifier qu'il y a au moins 1 user (nissiel@avaai.com)

---

## 🔧 Phase 2: Configure for Best UX

### 1. Environment Variables (Vercel)

**CRITIQUES - À configurer maintenant:**
```bash
# Frontend URL (après déploiement Vercel)
NEXTAUTH_URL=https://YOUR_VERCEL_URL

# Backend API
NEXT_PUBLIC_API_URL=https://ava-api-production.onrender.com

# Auth Secret (déjà fait)
NEXTAUTH_SECRET=your-secret

# Database (Prisma)
DATABASE_URL=postgresql://postgres.zymlhofsintkycruwznc:Bichon55!!??@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres.zymlhofsintkycruwznc:Bichon55!!??@aws-0-eu-west-1.pooler.supabase.com:5432/postgres
```

**OPTIONNELS - Pour features avancées:**
```bash
# Email (Resend)
RESEND_API_KEY=re_...

# Vapi (Voice AI)
VAPI_API_KEY=...
VAPI_PHONE_NUMBER_ID=...
NEXT_PUBLIC_VAPI_PUBLIC_KEY=...

# Twilio (Phone)
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...

# Stripe (Billing)
STRIPE_SECRET_KEY=sk_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=...
NEXT_PUBLIC_POSTHOG_HOST=...
```

### 2. CORS Configuration (Backend)

**Sur Render:**
1. Aller sur https://dashboard.render.com/web/srv-...
2. Environment → Ajouter:
   ```
   FRONTEND_URL=https://YOUR_VERCEL_URL
   CORS_ORIGINS=https://YOUR_VERCEL_URL,https://www.YOUR_DOMAIN.com
   ```
3. Redéployer le backend

**OU modifier api/main.py:**
```python
# Add after app creation
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://YOUR_VERCEL_URL",
        "https://www.YOUR_DOMAIN.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 3. Domain Configuration (Optional but Recommended)

**Custom Domain:**
1. **Acheter domaine:** (ex: avaai.com)
2. **Vercel:**
   - Settings → Domains → Add Domain
   - Suivre les instructions DNS
3. **Backend (Render):**
   - Settings → Custom Domain → Add
   - Ex: api.avaai.com

**Mettre à jour les env vars après:**
```bash
# Vercel
NEXTAUTH_URL=https://avaai.com
NEXT_PUBLIC_API_URL=https://api.avaai.com

# Render
FRONTEND_URL=https://avaai.com
```

---

## 🧪 Phase 3: User Testing

### Test Complet du User Journey

1. **Anonymous User → Signup**
   - [ ] Visiter https://YOUR_URL
   - [ ] Cliquer "Get Started" ou "Sign Up"
   - [ ] Remplir formulaire inscription
   - [ ] Vérifier email reçu
   - [ ] Confirmer email
   - [ ] Se connecter

2. **First-Time User → Onboarding**
   - [ ] `/en/app/onboarding` - Flow d'onboarding
   - [ ] Sélectionner industry
   - [ ] Configurer assistant
   - [ ] Tester phone number setup
   - [ ] Compléter welcome flow

3. **Active User → Core Features**
   - [ ] Dashboard - Voir analytics
   - [ ] Inbox - Lire messages
   - [ ] Calls - Voir historique
   - [ ] Settings - Modifier profil
   - [ ] Analytics - Voir statistiques
   - [ ] Assistants - Créer/éditer

4. **Multi-Language**
   - [ ] Changer langue: EN → FR → HE
   - [ ] Vérifier traductions
   - [ ] Vérifier RTL pour Hebrew

### Performance Testing

**Lighthouse (Chrome DevTools):**
```bash
# Test performance, SEO, accessibility
1. Ouvrir Chrome DevTools (F12)
2. Lighthouse tab
3. Generate report pour:
   - Home page (/)
   - Login page (/en/login)
   - Dashboard (/en/app/home)

Objectifs:
- Performance: >90
- Accessibility: >90
- Best Practices: >90
- SEO: >90
```

**Core Web Vitals:**
- [ ] LCP (Largest Contentful Paint): < 2.5s
- [ ] FID (First Input Delay): < 100ms
- [ ] CLS (Cumulative Layout Shift): < 0.1

---

## 🔒 Phase 4: Security & Monitoring

### 1. Security Headers (Vercel)

**Déjà configuré dans next.config.mjs:**
- ✅ Content-Security-Policy
- ✅ X-Frame-Options
- ✅ X-Content-Type-Options
- ✅ Strict-Transport-Security

**À vérifier:**
```bash
curl -I https://YOUR_URL | grep -E "X-|Content-Security"
```

### 2. Rate Limiting (Backend)

**Ajouter à requirements.txt:**
```
slowapi==0.1.9
```

**Dans api/main.py:**
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

# Sur les routes sensibles
@limiter.limit("5/minute")
async def login(...):
    ...
```

### 3. Monitoring Setup

**Sentry (Error Tracking):**
1. Créer compte https://sentry.io
2. Ajouter à Vercel env vars:
   ```
   NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
   ```

**PostHog (Analytics):**
1. Créer compte https://posthog.com
2. Ajouter à Vercel env vars:
   ```
   NEXT_PUBLIC_POSTHOG_KEY=phc_...
   NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
   ```

**Uptime Monitoring:**
- [ ] https://uptimerobot.com - Monitor API health
- [ ] https://statuspage.io - Status page public

---

## 📊 Phase 5: Analytics & Optimization

### 1. Setup Analytics Events

**Key Events to Track:**
- User signup
- User login
- Onboarding completion
- First assistant created
- First call made
- Feature usage (dashboard, inbox, etc.)

### 2. Database Optimization

**Indexes (déjà dans Alembic):**
```sql
-- Vérifier dans Supabase SQL Editor
SELECT * FROM pg_indexes WHERE tablename IN ('users', 'calls', 'phone_numbers');
```

**Query Optimization:**
- [ ] Enable pgBouncer (déjà fait)
- [ ] Monitor slow queries
- [ ] Add indexes si nécessaire

### 3. CDN & Caching

**Vercel (automatique):**
- ✅ Static assets cached
- ✅ Edge network distribution
- ✅ Image optimization

**Backend Caching:**
```python
# Ajouter redis pour cache
# redis==5.0.1 in requirements.txt

from redis import Redis
cache = Redis.from_url(os.getenv("REDIS_URL"))

@app.get("/api/v1/analytics/overview")
async def analytics_overview():
    cached = cache.get("analytics:overview")
    if cached:
        return json.loads(cached)

    # ... fetch data ...
    cache.setex("analytics:overview", 300, json.dumps(data))
    return data
```

---

## 🎯 Phase 6: Go Live Checklist

### Pre-Launch
- [ ] Tous les tests passent
- [ ] Performance > 90 sur Lighthouse
- [ ] Pas d'erreurs dans Vercel logs
- [ ] Pas d'erreurs dans Render logs
- [ ] Backup database configuré
- [ ] Monitoring actif

### Launch Day
- [ ] Annoncer sur réseaux sociaux
- [ ] Envoyer aux premiers beta testers
- [ ] Monitor logs en temps réel
- [ ] Préparer support email/chat

### Post-Launch (24h)
- [ ] Vérifier analytics: combien d'utilisateurs?
- [ ] Vérifier erreurs Sentry
- [ ] Optimiser si problèmes de performance
- [ ] Collecter feedback utilisateurs

---

## 🔗 Quick Access Links

### Production URLs
- **Frontend:** https://YOUR_VERCEL_URL
- **Backend API:** https://ava-api-production.onrender.com
- **API Docs:** https://ava-api-production.onrender.com/docs
- **Database:** https://supabase.com/dashboard/project/zymlhofsintkycruwznc

### Dashboards
- **Vercel:** https://vercel.com/nissiel/avaai
- **Render:** https://dashboard.render.com
- **Supabase:** https://supabase.com/dashboard

### Health Checks
```bash
# Backend health
curl https://ava-api-production.onrender.com/healthz

# Frontend (should return 200)
curl -I https://YOUR_VERCEL_URL

# Database connection
curl https://ava-api-production.onrender.com/api/v1/health/db
```

---

## 🆘 Troubleshooting

### Frontend Issues
```bash
# Check Vercel logs
vercel logs YOUR_DEPLOYMENT_URL

# Check runtime logs
Browser DevTools → Console
```

### Backend Issues
```bash
# Check Render logs
Render Dashboard → Logs tab

# Test specific endpoint
curl -v https://ava-api-production.onrender.com/api/v1/...
```

### Database Issues
```bash
# Check connections
Supabase Dashboard → Database → Connection Pooling

# Check queries
Supabase Dashboard → Database → Query Performance
```

---

## 📝 Notes

**Coûts estimés (monthly):**
- Vercel: $0 (Hobby plan, gratuit pour petits projets)
- Render: $7/month (Starter plan)
- Supabase: $0 (Free tier jusqu'à 500MB)
- **Total:** ~$7/month pour commencer

**Scaling tips:**
- Vercel auto-scale (illimité sur Pro)
- Render: upgrade vers Standard ($25/mo)
- Supabase: upgrade vers Pro ($25/mo)
- Ajouter Redis cache ($15/mo)

**Next steps after launch:**
1. Collecter feedback users
2. Améliorer features based on usage
3. Optimiser performance
4. Ajouter A/B testing
5. SEO optimization
