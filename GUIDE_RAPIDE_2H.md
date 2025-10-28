# 🚀 GUIDE RAPIDE - Finalisation MVP en 2h

## ⚡ TL;DR
MVP est à **85%** ✅ - Il reste **2-3h de travail** pour le mode fusées!

---

## 🎯 LES 4 TÂCHES CRITIQUES

### 1️⃣ CHIFFREMENT (30min) 🔐

**Pourquoi**: Clés API Vapi + Twilio stockées en clair = risque sécurité

**Comment**:
```bash
# 1. Générer clé de chiffrement
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

# 2. Ajouter au .env
echo "ENCRYPTION_KEY=<ta_clé_générée>" >> api/.env
```

**Puis modifier 2 fichiers**:

**Fichier 1**: `api/src/presentation/api/v1/routes/vapi_settings.py`
```python
# Ajouter en haut
from cryptography.fernet import Fernet
from api.src.core.settings import get_settings

settings = get_settings()
cipher = Fernet(settings.encryption_key.encode())

# Ligne ~70 - Dans update_vapi_key()
# AVANT:
user.vapi_api_key = request.vapi_api_key

# APRÈS:
encrypted = cipher.encrypt(request.vapi_api_key.encode()).decode()
user.vapi_api_key = encrypted

# Ligne ~50 - Dans get_vapi_settings()
# AVANT:
preview = user.vapi_api_key[:8] + "..."

# APRÈS:
decrypted = cipher.decrypt(user.vapi_api_key.encode()).decode()
preview = decrypted[:8] + "..."
```

**Fichier 2**: `api/src/presentation/api/v1/routes/twilio_settings.py` (même logique)

---

### 2️⃣ ENDPOINT PROFILE (15min) 📝

**Créer**: `api/src/presentation/api/v1/routes/user_profile.py`

```python
"""User profile management routes."""
from typing import Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from api.src.infrastructure.persistence.models.user import User
from api.src.presentation.dependencies.auth import get_current_user
from api.src.infrastructure.database.session import get_session

router = APIRouter()

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    organization_name: Optional[str] = None
    industry: Optional[str] = None
    timezone: Optional[str] = None
    locale: Optional[str] = None
    marketing_opt_in: Optional[bool] = None
    accept_terms: Optional[bool] = None

@router.patch("/user/profile")
async def update_profile(
    payload: UserProfileUpdate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Update user profile from onboarding."""
    if payload.full_name:
        user.name = payload.full_name
    if payload.organization_name:
        # Ajouter colonne si nécessaire
        pass
    if payload.timezone:
        # Ajouter colonne si nécessaire
        pass
    if payload.locale:
        user.locale = payload.locale
    if payload.marketing_opt_in is not None:
        # Ajouter colonne si nécessaire
        pass
    if payload.accept_terms is not None:
        # Ajouter colonne si nécessaire
        pass
    
    await session.commit()
    await session.refresh(user)
    return {"message": "Profile updated"}
```

**Puis enregistrer** dans `api/src/presentation/api/v1/router.py`:
```python
from api.src.presentation.api.v1.routes import user_profile

# Ajouter ligne ~35
api_v1_router.include_router(user_profile.router)
```

---

### 3️⃣ STUDIO CONFIG PERSISTENCE (20min) 💾

**Modifier**: `api/src/presentation/api/v1/routes/studio_config.py`

**Option Simple** - Utiliser table User (colonnes déjà là):

```python
# Ligne ~45 - update_studio_config()
@router.patch("/config", response_model=StudioConfig)
async def update_studio_config(
    payload: StudioConfigUpdate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> StudioConfig:
    """Update studio config and save to DB."""
    
    # Update user fields
    if payload.persona:
        user.persona = payload.persona
    if payload.job_to_be_done:
        user.job_to_be_done = payload.job_to_be_done
    if payload.languages:
        user.languages = payload.languages  # JSONB column
    if payload.tone:
        user.tone = payload.tone
    if payload.guidelines:
        user.guidelines = payload.guidelines
    
    # Telephony
    if payload.strategy:
        user.strategy = payload.strategy
    if payload.number:
        user.number = payload.number
    if payload.business_hours:
        user.business_hours = payload.business_hours
    if payload.fallback_email:
        user.fallback_email = payload.fallback_email
    
    # Integrations
    if payload.calendar:
        user.calendar = payload.calendar
    if payload.workspace_apps:
        user.workspace_apps = payload.workspace_apps  # JSONB
    if payload.crm:
        user.crm = payload.crm
    
    # Plan
    if payload.plan:
        user.plan = payload.plan
    if payload.seats:
        user.seats = payload.seats
    
    await session.commit()
    await session.refresh(user)
    
    # Return as StudioConfig
    return StudioConfig(
        persona=user.persona,
        tone=user.tone,
        # ... etc
    )
```

**Note**: Vérifier que colonnes existent dans User model, sinon créer migration

---

### 4️⃣ COMPLETE ONBOARDING (5min) ✅

**Ajouter** dans `api/src/presentation/api/v1/routes/user_onboarding.py`:

```python
from datetime import datetime

@router.post("/user/complete-onboarding")
async def complete_onboarding(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark onboarding as completed."""
    current_user.onboarding_completed = True
    # Si colonne existe:
    # current_user.onboarding_completed_at = datetime.now()
    
    await db.commit()
    await db.refresh(current_user)
    
    return {
        "message": "Onboarding completed successfully",
        "completed": True
    }
```

---

## 🗄️ MIGRATIONS (10min)

```bash
cd api

# 1. Vérifier migrations existantes
alembic history

# 2. Voir migration actuelle
alembic current

# 3. Appliquer toutes les migrations
alembic upgrade head

# 4. Si erreur, vérifier détails
alembic upgrade head --sql  # Voir le SQL généré
```

**Si colonnes manquent** dans User:
```bash
# Créer nouvelle migration
alembic revision -m "add_onboarding_fields_to_users"

# Éditer le fichier généré dans api/alembic/versions/
# Ajouter:
def upgrade():
    op.add_column('users', sa.Column('organization_name', sa.String(255)))
    op.add_column('users', sa.Column('industry', sa.String(100)))
    # ... etc

def downgrade():
    op.drop_column('users', 'organization_name')
    op.drop_column('users', 'industry')
    # ... etc

# Appliquer
alembic upgrade head
```

---

## 🧪 TEST COMPLET (30min)

### 1. Backend (10min)
```bash
cd api
uvicorn main:app --reload

# Dans un autre terminal
curl http://localhost:8000/healthz
# Devrait répondre: {"status":"ok"}
```

### 2. Frontend (10min)
```bash
cd webapp
npm run dev

# Ouvrir http://localhost:3000
```

### 3. Test manuel Flow (10min)
1. Créer compte (signup)
2. Compléter Profile → Continue
3. Skip Vapi → Continue
4. Skip Ava → Continue
5. Skip Twilio → Continue
6. Remplir Telephony → Continue
7. Skip Integrations → Continue
8. Skip Assistant → Continue
9. Plan (Free auto-sélectionné) → Continue
10. Done → Launch Ava

**Vérifier dans DB**:
```sql
SELECT 
    id, 
    email, 
    name,
    onboarding_completed,
    onboarding_vapi_skipped,
    onboarding_twilio_skipped
FROM users 
ORDER BY created_at DESC 
LIMIT 1;
```

---

## 🚀 DEPLOY (30min)

### Backend
```bash
# 1. Ajouter ENCRYPTION_KEY dans variables d'env (Railway/Render/Fly)

# 2. Push code
git add .
git commit -m "feat: onboarding MVP with encryption"
git push

# 3. Run migrations automatiquement (ajouter au Procfile/start script)
web: alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Frontend
```bash
# 1. Vercel - auto-deploy sur push
git push

# 2. Vérifier variables d'env Vercel:
NEXT_PUBLIC_API_URL=https://your-api.com
```

### Smoke Tests
```bash
# 1. Health check
curl https://your-api.com/healthz

# 2. Test signup
curl -X POST https://your-api.com/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'

# 3. Ouvrir frontend
open https://your-app.vercel.app
```

---

## 📊 CHECKLIST FINALE

Avant de dire "MODE FUSÉES":

- [ ] ✅ ENCRYPTION_KEY généré et ajouté au .env
- [ ] ✅ Chiffrement implémenté (vapi_settings.py + twilio_settings.py)
- [ ] ✅ Endpoint /user/profile créé et enregistré
- [ ] ✅ Studio config persiste en DB
- [ ] ✅ Endpoint /user/complete-onboarding créé
- [ ] ✅ Migrations appliquées (`alembic upgrade head`)
- [ ] ✅ Test manuel 1-9 steps OK
- [ ] ✅ Données en DB vérifiées
- [ ] ✅ Backend déployé
- [ ] ✅ Frontend déployé
- [ ] ✅ Smoke tests production OK

---

## 🎯 SI PROBLÈME

### "Colonne X n'existe pas"
→ Créer migration pour ajouter colonne

### "ENCRYPTION_KEY not found"
→ Vérifier .env et restart backend

### "Auto-save ne marche pas"
→ Vérifier endpoints /user/profile et /studio/config

### "404 sur Settings"
→ Déjà fixé! Locale dans URL

### "Assistant création fail"
→ Vérifier Vapi key déchiffrée correctement

---

## 📞 AIDE RAPIDE

**Documents créés**:
1. `MVP_AUDIT_COMPLET.md` - Architecture complète
2. `CHECKLIST_PRE_PRODUCTION.md` - Checklist détaillée
3. `RESUME_FINAL_MVP.md` - Scoring et status
4. `ONBOARDING_STEPS_EXPLAINED.md` - Explications étapes
5. `test_mvp_connections.sh` - Script de test

**Commandes utiles**:
```bash
# Générer ENCRYPTION_KEY
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

# Migrations
cd api && alembic upgrade head

# Run backend
cd api && uvicorn main:app --reload

# Run frontend
cd webapp && npm run dev

# Tests
cd api && pytest
cd webapp && npm run test

# DB check
psql -d avaai -c "SELECT id, email, onboarding_completed FROM users;"
```

---

## 🎉 RÉSUMÉ

**Ce qui marche déjà** (85%):
✅ 9 étapes complètes
✅ Navigation fluide
✅ Skip système
✅ Auto-save
✅ Traductions
✅ Backend routes
✅ Settings integration

**Ce qu'il reste** (15%):
⚠️ Chiffrement (30min)
⚠️ Profile endpoint (15min)
⚠️ Studio persistence (20min)
⚠️ Complete endpoint (5min)
⚠️ Tests (30min)

**Temps total**: 2h

**Après ça**: 🚀 **MODE FUSÉES ACTIVÉ!** 🔥

Tu veux que je t'aide à implémenter un des 4 points critiques maintenant?
