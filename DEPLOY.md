# 🚀 AVA.AI - GUIDE DE DÉPLOIEMENT PRODUCTION

### 2.1 Créer le Web Service

1. Aller sur https://dashboard.render.com
2. **New** → **Web Service**
3. **Connect Repository** → Sélectionner `Nissiel/Avaai`
4. Configuration:
   - **Name**: `ava-api-production`
   - **Region**: Frankfurt (EU Central)
   - **Branch**: `cleanup-divine`
   - **Root Directory**: `api`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r ../requirements.txt`
   - **Start Command**: `### ✏️ **Start Command**  
```bash
bash -c "export MIGRATION_URL=\$(echo \$AVA_API_DATABASE_URL | sed 's/+asyncpg//g') && cd .. && AVA_API_DATABASE_URL=\$MIGRATION_URL alembic upgrade head && cd api && uvicorn src.presentation.api.main:app --host 0.0.0.0 --port \$PORT"
````
   - **Instance Type**: `Starter ($7/month)` ou `Free`

> **Note** : Les migrations sont maintenant faites au **START**, pas au BUILD, car Render isole le réseau pendant le build. [ ] Compte [Netlify](https://netlify.com) ✅ (Frontend - TU AS DÉJÀ !)
- [ ] Compte [Render](https://render.com) ou [Railway](https://railway.app) (Backend)
- [ ] Compte [Supabase](https://supabase.com) (Database PostgreSQL)
- [ ] Clés API : OpenAI, Vapi.ai, Twilio, Resend
- [ ] Domaines : `app.avaai.com` + `api.avaai.com`

---

## ✅ ÉTAPE 1: BASE DE DONNÉES (Supabase)

### 1.1 Créer le projet Supabase

1. Aller sur https://supabase.com/dashboard
2. Créer un **nouveau projet** :
   - **Name** : `ava-prod`
   - **Database Password** : `[NOTER_LE_MOT_DE_PASSE]`
   - **Region** : Europe (eu-central-1 - Frankfurt)
   - **Pricing** : Free tier (jusqu'à 500 MB)

3. **Récupérer la connection string** :
   - Project Settings → Database
   - **Connection String** → **URI**
   - Format : `postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres`

4. **Modifier pour asyncpg** :
   ```
   postgresql+asyncpg://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```

### 1.2 Tables Alembic

**Les tables seront créées AUTOMATIQUEMENT au déploiement sur Render !**

Pas besoin de faire `alembic upgrade head` localement. Les migrations s'exécutent automatiquement au START du service Render.

**Pourquoi au START et pas au BUILD ?**
- ✅ Render isole le réseau pendant BUILD (sécurité)
- ✅ La base de données n'est accessible que pendant START
- ✅ L'architecture est configurée pour gérer cela automatiquement :
  - `env.py` lit `AVA_API_DATABASE_URL` automatiquement
  - `env.py` strip `+asyncpg` et utilise `psycopg2` (sync) pour migrations
  - L'app runtime utilise `asyncpg` (async) pour la performance

**C'est la best practice DevOps moderne !**

---

## 🔥 ÉTAPE 2: BACKEND (Render.com)

### 2.1 Créer le Web Service

1. Aller sur https://dashboard.render.com
2. **New** → **Web Service**
3. **Connect Repository** → Sélectionner `Nissiel/Avaai`
4. Configuration:
   - **Name**: `ava-api-production`
   - **Region**: Frankfurt (EU Central)
   - **Branch**: `cleanup-divine`
   - **Root Directory**: `api`
   - **Runtime**: `Python 3.13`
   - **Build Command**: `pip install -r ../requirements.txt`
   - **Start Command**: `bash -c "cd .. && alembic upgrade head && cd api && uvicorn src.presentation.api.main:app --host 0.0.0.0 --port $PORT"`
   - **Instance Type**: `Starter ($7/month)` ou `Free`

> **Note** : Le start command fait 3 choses :
> 1. Va au root du projet (`cd ..`)
> 2. Exécute les migrations Alembic (`alembic upgrade head`)
> 3. Démarre l'API FastAPI (`uvicorn`)
> 
> **Pourquoi au START et pas au BUILD ?**
> - Render isole le réseau pendant la phase BUILD (sécurité)
> - La DB n'est accessible que pendant la phase START
> - `env.py` gère automatiquement la conversion asyncpg→psycopg2 pour les migrations

### 2.2 Variables d'environnement

Ajouter dans **Environment** :

```bash
# Database
AVA_API_DATABASE_URL=postgresql+asyncpg://[SUPABASE_CONNECTION_STRING]

# CORS
AVA_API_ALLOWED_ORIGINS=https://app.avaai.com

# Security
AVA_API_SECRET_KEY=[GÉNÉRER_32_CHARS_RANDOM]
AVA_API_JWT_SECRET=[GÉNÉRER_32_CHARS_RANDOM]
AVA_API_JWT_ALGORITHM=HS256
AVA_API_ACCESS_TOKEN_EXPIRE_MINUTES=30

# OpenAI
OPENAI_API_KEY=sk-proj-XXXXX

# Vapi.ai
AVA_API_VAPI_API_KEY=sk_live_XXXXX
VAPI_ASSISTANT_ID=98d71a30-c55c-43dd-8d64-1af9cf8b57cb
VAPI_PUBLIC_KEY=pk_live_XXXXX

# Twilio (si téléphone)
TWILIO_ACCOUNT_SID=ACXXXXX
TWILIO_AUTH_TOKEN=XXXXX
TWILIO_PHONE_NUMBER=+33XXXXXXXXX

# Email (Resend)
RESEND_API_KEY=re_XXXXX
SMTP_SENDER=noreply@avaai.com
SUMMARY_EMAIL=contact@avaai.com

# Environment
ENVIRONMENT=production
PORT=8000
```

### 2.3 Health Check

- **Health Check Path**: `/health`
- Sauvegarder et déployer

### 2.4 Récupérer l'URL

Une fois déployé : `https://ava-api-production.onrender.com`
Tester : `curl https://ava-api-production.onrender.com/health`

---

## ✨ ÉTAPE 3: FRONTEND (Vercel)

### 3.1 Importer le projet

1. Aller sur https://vercel.com/dashboard
2. **Add New** → **Project**
3. **Import Git Repository** → Sélectionner `Nissiel/Avaai`
4. Configuration:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `webapp`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

### 3.2 Variables d'environnement

Ajouter dans **Environment Variables** (pour Production) :

```bash
# Backend API
NEXT_PUBLIC_API_URL=https://api.avaai.com

# NextAuth
NEXTAUTH_SECRET=[GÉNÉRER_32_CHARS_RANDOM]
NEXTAUTH_URL=https://app.avaai.com

# Vapi Public Key
VAPI_PUBLIC_KEY=pk_live_XXXXX

# Database (Prisma - si utilisé)
DATABASE_URL=postgresql://[SUPABASE_CONNECTION_STRING]

# Optional: Analytics
NEXT_PUBLIC_POSTHOG_KEY=phc_XXXXX
NEXT_PUBLIC_POSTHOG_HOST=https://eu.posthog.com
```

### 3.3 Déployer

- **Deploy** → Attendre 2-3 minutes
- URL temporaire : `https://avaai-webapp-xxxx.vercel.app`
- Tester : Ouvrir l'URL, vérifier que ça charge

---

## 🌐 ÉTAPE 4: DOMAINES & DNS

### 4.1 Backend (`api.avaai.com`)

**Render** :
1. **Settings** → **Custom Domain** → `api.avaai.com`
2. Ajouter un **CNAME** chez votre registrar :
   ```
   Type: CNAME
   Name: api
   Value: ava-api-production.onrender.com
   TTL: 3600
   ```
3. Attendre propagation (5-30 min)
4. SSL automatique (Let's Encrypt)

### 4.2 Frontend (`app.avaai.com`)

**Vercel** :
1. **Settings** → **Domains** → `app.avaai.com`
2. Ajouter un **CNAME** chez votre registrar :
   ```
   Type: CNAME
   Name: app
   Value: cname.vercel-dns.com
   TTL: 3600
   ```
3. Attendre propagation
4. SSL automatique

### 4.3 Vérifier SSL

```bash
curl -I https://api.avaai.com/health
curl -I https://app.avaai.com
```

Les deux doivent retourner `200` avec `https://`.

---

## 🔗 ÉTAPE 5: WEBHOOKS & INTÉGRATIONS

### 5.1 Vapi.ai Webhooks

1. Aller sur https://dashboard.vapi.ai
2. **Settings** → **Webhooks**
3. **Event Webhook URL**: `https://api.avaai.com/api/v1/vapi/events`
4. Sauvegarder

### 5.2 Twilio Voice Webhook

1. Aller sur https://console.twilio.com
2. **Phone Numbers** → Votre numéro
3. **Voice Configuration** :
   - **A CALL COMES IN**: `https://api.avaai.com/api/v1/voice/incoming`
   - **HTTP POST**
4. Sauvegarder

### 5.3 Stripe Webhook (si paiements)

1. Aller sur https://dashboard.stripe.com/webhooks
2. **Add endpoint**:
   - **URL**: `https://api.avaai.com/api/v1/stripe/webhook`
   - **Events**: `checkout.session.completed`, `invoice.paid`
3. Récupérer `STRIPE_WEBHOOK_SECRET`
4. Ajouter dans les env vars backend

---

## ✅ ÉTAPE 6: SMOKE TESTS

### 6.1 Backend Health

```bash
curl https://api.avaai.com/health
# Expected: {"status":"healthy"}
```

### 6.2 OpenAI

```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
# Expected: 200 + liste de modèles
```

### 6.3 Vapi.ai

```bash
curl https://api.vapi.ai/v1/assistants \
  -H "Authorization: Bearer $AVA_API_VAPI_API_KEY"
# Expected: 200 + liste d'assistants
```

### 6.4 Frontend → Backend

1. Ouvrir https://app.avaai.com
2. **DevTools** → **Network** → Vérifier les requêtes vers `api.avaai.com`
3. **Console** → Pas d'erreurs CORS

### 6.5 Premier Appel Test

1. Dashboard → **Phone** → Appeler votre numéro Twilio
2. Parler avec AVA
3. Vérifier que l'appel apparaît dans **Recent Calls**

---

## 🛡️ ÉTAPE 7: SÉCURITÉ & MONITORING

### 7.1 Rate Limiting

Render ajoute automatiquement un rate limit basique. Pour plus :
- Ajouter middleware FastAPI `slowapi`
- Configurer Cloudflare devant Render

### 7.2 Logs

**Render** :
- **Logs** → Voir les logs en temps réel
- Chercher les erreurs : `Error`, `Exception`, `Failed`

**Vercel** :
- **Deployments** → Cliquer sur le dernier → **Logs**

### 7.3 Monitoring

**UptimeRobot** (gratuit) :
1. Créer un compte sur https://uptimerobot.com
2. **Add New Monitor** :
   - Type: `HTTP(s)`
   - URL: `https://api.avaai.com/health`
   - Interval: `5 minutes`
3. Ajouter votre email pour les alertes

---

## 🔄 ROLLBACK (si problème)

### Backend (Render)

1. **Manual Deploy** → Sélectionner un commit précédent
2. Ou : `git revert` localement, puis push

### Frontend (Vercel)

1. **Deployments** → Cliquer sur un deployment précédent
2. **...** → **Promote to Production**

---

## 📊 CHECKLIST POST-DÉPLOIEMENT

- [ ] Backend health check : `https://api.avaai.com/health` → 200
- [ ] Frontend charge : `https://app.avaai.com` → Page d'accueil
- [ ] SSL activé (cadenas vert) sur les deux domaines
- [ ] Login/Signup fonctionne
- [ ] Dashboard affiche les données
- [ ] AVA Profile settings sauvegardent
- [ ] Appel test avec Twilio réussi
- [ ] Webhook Vapi reçoit les events
- [ ] Email transcript envoyé après appel
- [ ] Monitoring UptimeRobot configuré
- [ ] Backup database configuré (Supabase auto-backup)

---

## 🆘 TROUBLESHOOTING

### CORS Error (Browser)

**Symptôme** : `Access-Control-Allow-Origin` error dans console
**Solution** : Vérifier `AVA_API_ALLOWED_ORIGINS=https://app.avaai.com` (EXACT, avec `https://`, sans `/` final)

### 500 Error Backend

**Symptôme** : Backend crash au démarrage
**Solution** : 
1. Render Logs → Chercher la variable manquante
2. Ajouter la variable dans **Environment**
3. Redéployer

### Frontend appelle `localhost`

**Symptôme** : `fetch failed` vers `http://localhost:8000`
**Solution** : Vérifier `NEXT_PUBLIC_API_URL=https://api.avaai.com` dans Vercel env vars

### Database connection failed

**Symptôme** : `could not connect to server`
**Solution** : 
1. Vérifier connection string Supabase
2. Ajouter `?sslmode=require` à la fin
3. Format : `postgresql+asyncpg://...?sslmode=require`

### Webhook 401/403

**Symptôme** : Vapi/Twilio webhook rejoint
**Solution** :
1. Vérifier signature (si activée)
2. Désactiver auth sur routes webhook (public)
3. Logs backend → voir détails erreur

---

## 📞 SUPPORT

- **GitHub** : https://github.com/Nissiel/Avaai
- **Email** : contact@avaai.com
- **Docs** : Voir `README.md` et `DIVINE_CODEX.md`

---

**Dernière mise à jour** : 27 Octobre 2025  
**Version** : Production v1.0 (commit `cebe4c5`)
