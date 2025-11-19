# 🧹 ONBOARDING CLEANUP REPORT

## Date: 28 October 2025

### ✅ PAGES SUPPRIMÉES (Ancien système obsolète)

Les anciennes pages d'onboarding séparées ont été supprimées :

- ❌ `/onboarding/industry/page.tsx` - Sélection industrie (obsolète)
- ❌ `/onboarding/phone/page.tsx` - Configuration téléphone (obsolète)
- ❌ `/onboarding/customize/page.tsx` - Personnalisation assistant (obsolète)
- ❌ `/onboarding/test/page.tsx` - Test call (obsolète)

### ✅ NOUVEAU SYSTÈME ACTIF

**Page active:**
- ✅ `/onboarding/welcome/page.tsx` → Utilise `OnboardingWizard`

**Structure du nouveau wizard (9 steps):**
1. **Profile** - Infos organisation
2. **🆕 Vapi** - Configuration API Vapi (3 options: rapide/settings/skip)
3. **Ava** - Personnalisation assistant
4. **🆕 Twilio** - Configuration téléphonie (settings/skip)
5. **Telephony** - Configuration numéros
6. **Integrations** - Calendriers, CRM, etc.
7. **🆕 Assistant** - Création premier assistant (valide Vapi)
8. **Plan** - Choix forfait
9. **Done** - Résumé et lancement

### 📦 FICHIERS CONSERVÉS

**Stores (au cas où):**
- `/lib/stores/onboarding-store.ts` - Conservé mais non utilisé

**Services (utilisés ailleurs):**
- `/services/phone-numbers-service.ts` - Conservé (utilisé par d'autres parties)
- `/services/assistants-service.ts` - Conservé (utilisé par le wizard)

### 🎯 POINTS D'ENTRÉE

**URL principale:**
```
http://localhost:3000/fr/onboarding/welcome
```

**Redirections:**
- `/onboarding` → `/onboarding/welcome` (via page.tsx)

### 🔗 INTÉGRATIONS

**Settings → Onboarding (Redirect & Resume):**
- Vapi Settings → `returnTo=onboarding` ✅
- Twilio Settings → `returnTo=onboarding` ✅

**Backend endpoints:**
- `POST /api/v1/vapi-settings` - Sauvegarde clé Vapi
- `POST /api/v1/twilio-settings` - Sauvegarde credentials Twilio
- `PATCH /api/v1/user/onboarding` - Flags onboarding (skip, completed)

### 🌐 TRADUCTIONS

Complètes pour 3 langues:
- ✅ EN (English)
- ✅ FR (Français)
- ✅ HE (עברית)

Clés: `onboarding.vapi.*`, `onboarding.twilio.*`, `onboarding.assistant.*`

### ⚠️ MIGRATIONS À EXÉCUTER

```bash
cd api
alembic upgrade head
```

Migrations:
1. `ffacb20841b4` - Add Twilio credentials to users
2. `c256afd5baca` - Add onboarding integration flags

---

**Status:** ✅ Cleanup completed - Old onboarding system removed, new wizard active
