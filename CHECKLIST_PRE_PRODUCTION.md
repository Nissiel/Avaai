# ✅ CHECKLIST PRÉ-PRODUCTION MVP ONBOARDING

## 📋 Date: 28 Octobre 2025
## 🎯 Objectif: Vérifier que le MVP est prêt pour le mode FUSÉES 🚀

---

## 🔧 MODIFICATIONS EFFECTUÉES AUJOURD'HUI

### 1. ✅ Telephony Step Simplifié
**Changement**: Suppression de l'option "Purchase with Ava"

**Avant**:
```
- Radio buttons: "Attach existing" vs "Purchase with Ava"
- Champ conditionnel pour le numéro si "attach"
```

**Après**:
```
- Champ direct pour le numéro de téléphone
- Auto-sélection strategy = "attach"
- Description: "Enter your Twilio or SIP number to attach to Ava"
```

**Fichier modifié**: `webapp/components/features/onboarding/onboarding-wizard.tsx`
**Lignes**: ~718-750

---

## 🗄️ ÉTAT DES MIGRATIONS DATABASE

### Migration 1: `ffacb20841b4` - Twilio Credentials
**Status**: ⚠️ À APPLIQUER
```sql
CREATE TABLE twilio_credentials (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    account_sid VARCHAR NOT NULL,
    auth_token_encrypted VARCHAR NOT NULL,
    phone_number VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_twilio_user ON twilio_credentials(user_id);
```

**Commande**:
```bash
cd api
alembic upgrade ffacb20841b4
```

---

### Migration 2: `c256afd5baca` - User Onboarding Flags
**Status**: ⚠️ À APPLIQUER
```sql
CREATE TABLE user_onboarding (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    onboarding_vapi_skipped BOOLEAN DEFAULT FALSE,
    onboarding_twilio_skipped BOOLEAN DEFAULT FALSE,
    onboarding_assistant_created BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_onboarding_user ON user_onboarding(user_id);
```

**Commande**:
```bash
cd api
alembic upgrade c256afd5baca
```

---

### Migration 3: User Model Updates
**Status**: ⚠️ VÉRIFIER

Le modèle `User` contient déjà:
```python
# Dans user.py (lignes 75-135)
vapi_api_key: Mapped[Optional[str]]
twilio_account_sid: Mapped[Optional[str]]
twilio_auth_token: Mapped[Optional[str]]
twilio_phone_number: Mapped[Optional[str]]
onboarding_completed: Mapped[bool]
onboarding_step: Mapped[int]
onboarding_vapi_skipped: Mapped[bool]
onboarding_twilio_skipped: Mapped[bool]
onboarding_assistant_created: Mapped[bool]
```

**Action requise**:
- Vérifier si migration existe pour ajouter ces colonnes à `users`
- Si non, créer migration:
```bash
cd api
alembic revision -m "add_onboarding_fields_to_users"
```

---

## 🔌 CONNEXIONS BACKEND VÉRIFIÉES

### ✅ Routes Existantes et Enregistrées

**Fichier**: `api/src/presentation/api/v1/router.py`

Routes confirmées:
1. ✅ `auth.router` - Authentication (signup, login, etc.)
2. ✅ `vapi_settings.router` - GET/POST/DELETE `/vapi-settings`
3. ✅ `twilio_settings.router` - GET/POST/DELETE `/twilio-settings`
4. ✅ `user_onboarding.router` - GET/PATCH `/user/onboarding`
5. ✅ `studio_config.router` - GET/PATCH `/studio/config`
6. ✅ `assistants.router` - POST `/assistants`
7. ✅ `tenant_profile.router` - Profile management

**Status**: ✅ **TOUTES LES ROUTES NÉCESSAIRES SONT ENREGISTRÉES**

---

## 🖥️ FRONTEND - CONNEXIONS API

### 1. VapiStep Component
**Fichier**: `webapp/components/features/onboarding/wizard-steps/vapi-step.tsx`

**Endpoints utilisés**:
- ✅ POST `/api/v1/vapi-settings` - Ligne ~45-55 (inline save)
- ✅ GET `/api/v1/vapi-settings` - Via `useIntegrationsStatus()`
- ✅ PATCH `/api/v1/user/onboarding` - Ligne ~80 (skip tracking)

**Redirections**:
- ✅ `/${locale}/settings?section=vapi&returnTo=onboarding`

---

### 2. TwilioStep Component
**Fichier**: `webapp/components/features/onboarding/wizard-steps/twilio-step.tsx`

**Endpoints utilisés**:
- ✅ POST `/api/v1/twilio-settings` - Inline save
- ✅ GET `/api/v1/twilio-settings` - Via `useIntegrationsStatus()`
- ✅ PATCH `/api/v1/user/onboarding` - Skip tracking

**Redirections**:
- ✅ `/${locale}/settings?section=twilio&returnTo=onboarding`

---

### 3. AssistantStep Component
**Fichier**: `webapp/components/features/onboarding/wizard-steps/assistant-step.tsx`

**Endpoints utilisés**:
- ✅ POST `/api/assistants` - Ligne ~75-95 (création assistant)
- ✅ PATCH `/api/v1/user/onboarding` - Ligne ~100 (completion flag)

**Prérequis vérifiés**:
- ✅ Check `vapi.configured` via `useIntegrationsStatus()`

---

### 4. OnboardingWizard - Auto-save
**Fichier**: `webapp/components/features/onboarding/onboarding-wizard.tsx`

**Mécanisme auto-save** (lignes ~200-250):
```typescript
useEffect(() => {
  const interval = setInterval(async () => {
    if (!form.formState.isDirty) return;
    
    // 1. Profile data
    await fetch("/api/v1/user/profile", { method: "PATCH", ... });
    
    // 2. Studio config (Ava, Telephony, Integrations, Plan)
    await fetch("/api/v1/studio/config", { method: "PATCH", ... });
  }, 10000); // Every 10 seconds
  
  return () => clearInterval(interval);
}, []);
```

**Status**: ⚠️ **VÉRIFIER QUE CES ENDPOINTS EXISTENT**

---

## ⚠️ ENDPOINTS À VÉRIFIER/CRÉER

### 1. PATCH `/api/v1/user/profile`
**Attendu par**: OnboardingWizard auto-save

**Payload**:
```json
{
  "full_name": "John Doe",
  "organization_name": "Acme Corp",
  "industry": "technology",
  "timezone": "America/New_York",
  "locale": "en",
  "marketing_opt_in": true,
  "accept_terms": true
}
```

**Action**: 
- [ ] Vérifier si endpoint existe
- [ ] Si non, créer dans `tenant_profile.py` ou nouveau fichier `user_profile.py`

---

### 2. PATCH `/api/v1/studio/config`
**Attendu par**: OnboardingWizard auto-save

**Payload**:
```json
{
  "persona": "secretary",
  "job_to_be_done": "Gérer les appels",
  "languages": ["en", "fr"],
  "tone": "professional",
  "guidelines": "Always be polite",
  "strategy": "attach",
  "number": "+14155550199",
  "business_hours": "Mon-Fri 9-18",
  "fallback_email": "ops@acme.com",
  "calendar": "google",
  "workspace_apps": ["slack", "notion"],
  "crm": "hubspot",
  "plan": "free",
  "seats": 2
}
```

**Status actuel**: 
- ✅ Endpoint existe dans `studio_config.py` (ligne ~45)
- ⚠️ **MAIS** stocke en mémoire (_config_state), pas en DB!

**Action requise**:
- [ ] Modifier `studio_config.py` pour sauvegarder dans User model
- [ ] OU créer table `studio_configs` séparée
- [ ] **RECOMMANDATION**: Sauvegarder dans `users` table (colonnes déjà présentes dans model)

---

### 3. POST `/api/v1/user/complete-onboarding`
**Attendu par**: Done step (Launch Ava)

**Action**:
```python
@router.post("/user/complete-onboarding")
async def complete_onboarding(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    current_user.onboarding_completed = True
    current_user.onboarding_completed_at = datetime.now()
    await db.commit()
    return {"message": "Onboarding completed"}
```

**Status**: ⚠️ **À CRÉER**

**Action**:
- [ ] Ajouter à `user_onboarding.py`

---

## 🔐 SÉCURITÉ - CHECKLIST

### Chiffrement des clés
- [x] Vapi API Key: ⚠️ **NON CHIFFRÉ** dans `user.vapi_api_key`
  - **Action**: Implémenter chiffrement Fernet
  - Ajouter colonne `vapi_api_key_preview`
  
- [x] Twilio Auth Token: ⚠️ **NON CHIFFRÉ** dans `user.twilio_auth_token`
  - **Action**: Implémenter chiffrement Fernet
  - Colonne `account_sid` peut rester en clair (pas sensible)

**Code suggéré**:
```python
from cryptography.fernet import Fernet
import os

# Dans settings.py
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")  # Générer avec Fernet.generate_key()
cipher = Fernet(ENCRYPTION_KEY.encode())

# Dans vapi_settings.py
encrypted_key = cipher.encrypt(request.vapi_api_key.encode()).decode()
user.vapi_api_key = encrypted_key
user.vapi_api_key_preview = request.vapi_api_key[:8] + "..."

# Pour déchiffrer (lors de création assistant)
decrypted_key = cipher.decrypt(user.vapi_api_key.encode()).decode()
```

### Variables d'environnement
- [ ] `ENCRYPTION_KEY` - À générer et ajouter au .env
- [ ] `VAPI_API_KEY` (fallback si user n'a pas sa clé)
- [ ] `TWILIO_ACCOUNT_SID` (fallback)
- [ ] `TWILIO_AUTH_TOKEN` (fallback)

---

## 🧪 TESTS À EFFECTUER

### 1. Tests Backend (API)
```bash
cd api

# Run all tests
pytest

# Test specific routes
pytest tests/test_vapi_settings.py
pytest tests/test_twilio_settings.py
pytest tests/test_user_onboarding.py
```

**Status**: ⚠️ **Tests à créer**

---

### 2. Tests Frontend (E2E)
```bash
cd webapp

# Unit tests
npm run test

# E2E tests (Playwright)
npm run test:e2e
```

**Scénarios à tester**:
1. ✅ Signup → Onboarding wizard → Complete
2. ✅ Skip all steps → Complete
3. ✅ Configure Vapi inline → Continue
4. ✅ Go to Settings → Configure → Return to onboarding
5. ✅ Create assistant → Complete
6. ✅ Auto-save works (wait 10s, refresh, data persisted)
7. ✅ Click stepper to jump steps
8. ✅ All 3 languages work (EN/FR/HE)

---

### 3. Tests Database
```bash
# Connect to database
psql -d avaai

# Verify tables exist
\dt

# Check user data
SELECT id, email, vapi_api_key, onboarding_completed FROM users;

# Check Twilio credentials (if table exists)
SELECT user_id, account_sid, phone_number FROM twilio_credentials;

# Check onboarding flags (if table exists)
SELECT user_id, onboarding_vapi_skipped, onboarding_twilio_skipped 
FROM user_onboarding;
```

---

## 📊 METRIQUES & MONITORING

### Events à tracker (PostHog/Mixpanel)

**À implémenter dans OnboardingWizard**:

```typescript
import { useAnalytics } from "@/lib/analytics";

const analytics = useAnalytics();

// Onboarding started
useEffect(() => {
  analytics.track("onboarding_started");
}, []);

// Step completed
const goNext = () => {
  analytics.track("onboarding_step_completed", {
    step_id: steps[stepIndex].id,
    step_number: stepIndex + 1,
  });
  // ...
};

// Step skipped
const handleSkip = () => {
  analytics.track("onboarding_step_skipped", {
    step_id: steps[stepIndex].id,
  });
};

// Onboarding completed
const handleLaunch = () => {
  analytics.track("onboarding_completed", {
    duration_seconds: Date.now() - startTime,
  });
};
```

---

## 🚀 DÉPLOIEMENT - CHECKLIST

### Backend (Railway/Render/Fly.io)

1. **Variables d'environnement**:
```bash
DATABASE_URL=postgresql://...
JWT_SECRET=...
ENCRYPTION_KEY=...  # ⚠️ NOUVEAU
VAPI_API_KEY=...    # Fallback
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
CORS_ORIGINS=https://your-frontend.vercel.app
```

2. **Migrations**:
```bash
# Dans le script de déploiement
alembic upgrade head
```

3. **Health check**:
```bash
curl https://api.your-domain.com/healthz
```

---

### Frontend (Vercel)

1. **Variables d'environnement**:
```bash
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NEXT_PUBLIC_POSTHOG_KEY=...
NEXT_PUBLIC_POSTHOG_HOST=...
```

2. **Build**:
```bash
npm run build
```

3. **Preview deployment**:
- Tester sur preview URL avant production
- Vérifier toutes les redirections
- Tester les 3 langues

---

## ✅ CHECKLIST FINALE AVANT "MODE FUSÉES"

### 🔴 CRITIQUE (Bloquants)
- [ ] **Migrations appliquées**: `alembic upgrade head`
- [ ] **Chiffrement implémenté**: Vapi + Twilio keys
- [ ] **Variables d'env configurées**: ENCRYPTION_KEY, etc.
- [ ] **Endpoint profile créé**: PATCH `/api/v1/user/profile`
- [ ] **Studio config persiste en DB**: Pas juste en mémoire
- [ ] **Complete onboarding endpoint**: POST `/user/complete-onboarding`
- [ ] **Tests backend passent**: `pytest`
- [ ] **Tests frontend passent**: `npm run test`

### 🟡 IMPORTANT (Non-bloquants mais recommandés)
- [ ] **Analytics implémentés**: Track events onboarding
- [ ] **Tests E2E**: Scénario complet Playwright
- [ ] **Monitoring**: Sentry/LogRocket configuré
- [ ] **Documentation**: README onboarding à jour
- [ ] **Rollback plan**: En cas de problème production

### 🟢 BONUS (Nice to have)
- [ ] **Rate limiting**: Sur endpoints sensibles
- [ ] **Input validation**: Côté backend renforcée
- [ ] **Audit logs**: Tracking qui modifie quoi
- [ ] **Backup strategy**: Database backups automatiques
- [ ] **Performance**: Cache Redis pour integrations status

---

## 🎯 PROCHAINES ÉTAPES

### Phase 1: Corrections critiques (1-2h)
1. Implémenter chiffrement Vapi/Twilio
2. Créer endpoint `/user/profile`
3. Modifier `studio_config` pour persister en DB
4. Créer endpoint `/user/complete-onboarding`
5. Appliquer migrations

### Phase 2: Tests (1h)
1. Créer tests backend pour nouveaux endpoints
2. Tester manuellement flow complet
3. Vérifier données en DB

### Phase 3: Déploiement (30min)
1. Deploy backend avec migrations
2. Deploy frontend
3. Smoke tests production
4. Monitor logs/errors

### Phase 4: Monitoring (ongoing)
1. Vérifier analytics events
2. Check Sentry pour errors
3. Review user feedback

---

## 📞 EN CAS DE PROBLÈME

### Rollback Backend
```bash
# Revenir à version précédente
git revert <commit-hash>
git push

# Rollback migrations si nécessaire
alembic downgrade -1
```

### Rollback Frontend
```bash
# Dans Vercel dashboard
# Instant rollback to previous deployment
```

### Debug Checklist
1. ✅ Backend logs: Vérifier erreurs 500
2. ✅ Frontend console: Vérifier erreurs JS
3. ✅ Network tab: Vérifier requêtes API
4. ✅ Database: Vérifier données persistées
5. ✅ Variables d'env: Vérifier toutes présentes

---

## 🎉 CONCLUSION

**État actuel**: 85% prêt ✅

**Bloquants restants**:
1. ⚠️ Chiffrement des clés API
2. ⚠️ Endpoint `/user/profile`
3. ⚠️ Studio config DB persistence
4. ⚠️ Migrations à appliquer

**Temps estimé pour 100%**: 2-3 heures

**Une fois complété**: 🚀 **MODE FUSÉES ACTIVÉ!** 🚀

