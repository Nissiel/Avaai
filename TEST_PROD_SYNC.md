# 🔥 TEST DIAGNOSTIC PRODUCTION - SYNC VAPI

## DIVINE CODEX APPLIQUÉ

> **"Diagnostic Avant Action"** - Comprendre POURQUOI ça ne marche pas

---

## ✅ STATUT BACKEND PROD

```bash
curl https://ava-api-production.onrender.com/healthz
# {"status":"ok"} ✅ BACKEND VIVANT
```

---

## 🎯 ROOT CAUSE ANALYSIS

### HYPOTHÈSES POSSIBLES:

1. **L'utilisateur n'est pas authentifié** ❌
   - Token expiré
   - Pas de token dans localStorage
   - → Solution: Se reconnecter

2. **L'utilisateur n'a pas de Vapi API Key** ❌
   - Champ `vapi_api_key` vide dans la DB
   - → Solution: Configurer Vapi Key dans Settings

3. **L'assistant ID est invalide** ❌
   - Assistant supprimé sur Vapi
   - Mauvais ID stocké
   - → Solution: Recréer assistant

4. **Erreur silencieuse dans le code** ❌
   - Exception catchée mais pas loguée
   - Network error
   - → Solution: Ajouter logging verbeux

---

## 🔍 TESTS MANUELS PROD

### 1. Tester Authentication

```bash
# Dans la console browser (après login):
localStorage.getItem("access_token")
# Doit retourner un token JWT
```

### 2. Tester Vapi Settings Endpoint

```bash
TOKEN="eyJ..." # Ton access token

curl -X GET https://ava-api-production.onrender.com/api/v1/vapi-settings \
  -H "Authorization: Bearer $TOKEN"
  
# Devrait retourner:
# {
#   "configured": true,
#   "api_key": "***",
#   "message": "Vapi configured"
# }
```

### 3. Tester Studio Config Endpoint

```bash
curl -X GET https://ava-api-production.onrender.com/api/v1/studio/config \
  -H "Authorization: Bearer $TOKEN"
  
# Devrait retourner la config actuelle
```

### 4. Tester Sync Vapi Endpoint (LE PROBLÈME)

```bash
curl -X POST https://ava-api-production.onrender.com/api/v1/studio/sync-vapi \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
  
# Devrait retourner:
# {
#   "action": "updated",
#   "assistantId": "abc123...",
#   "settings": {...}
# }
```

---

## 🚨 PROBLÈMES IDENTIFIÉS

### Problème #1: Pas de Vapi API Key

**Symptôme:**
```json
{
  "detail": "Vapi API key not configured. Please add your Vapi key in Settings."
}
```

**Solution:**
1. Aller dans Settings → Integrations
2. Ajouter la Vapi API Key
3. Sauvegarder
4. Réessayer

---

### Problème #2: Assistant ID Invalide

**Symptôme:**
```json
{
  "detail": "Vapi assistant not found (404)"
}
```

**Solution:**
1. Supprimer l'ancien assistant ID (mettre à `null`)
2. Cliquer "SAVE & SYNC TO VAPI NOW"
3. Un NOUVEL assistant sera créé automatiquement
4. L'ID sera sauvegardé automatiquement

---

### Problème #3: Token Expiré

**Symptôme:**
```json
{
  "detail": "Not authenticated"
}
```

**Solution:**
1. Se déconnecter
2. Se reconnecter
3. Réessayer

---

## 🔥 SOLUTION DIVINE - FIX IMMÉDIAT

### Option 1: Via l'Interface (RECOMMANDÉ)

```
1. Se connecter sur: https://votre-frontend.vercel.app
2. Aller dans Settings → Integrations
3. Vérifier que Vapi API Key est configurée
4. Aller dans Settings → Assistant (Studio Settings)
5. Sélectionner un Persona Preset (ex: "Secretary")
6. Remplir le System Prompt (minimum 200 caractères)
7. Cliquer "SAVE & SYNC TO VAPI NOW"
8. Observer la console browser (F12)
9. Vérifier les logs:
   - "✅ Studio Config Update Success"
   - "🔄 Auto-syncing to Vapi..."
   - "✅ Vapi Sync Success"
10. Aller sur Vapi Dashboard: https://dashboard.vapi.ai
11. Vérifier que l'assistant est à jour
```

---

### Option 2: Debug Mode (TECHNIQUE)

Ajouter dans `webapp/components/features/settings/studio-settings-form.tsx` ligne 320:

```typescript
const vapiResponse = await fetch(
  `${backendConfig.baseUrl}/api/v1/studio/sync-vapi`,
  {
    method: "POST",
    headers: syncHeaders,
  },
);

// 🔥 AJOUT DEBUG
console.log("🔍 Vapi Sync Response Status:", vapiResponse.status);
const responseText = await vapiResponse.text();
console.log("🔍 Vapi Sync Response Body:", responseText);

if (!vapiResponse.ok) {
  console.error("❌ Vapi Sync FAILED:", responseText);
  toast.error("Vapi Sync Failed", {
    description: responseText
  });
  throw new Error(`Vapi sync failed: ${responseText}`);
}
```

---

## 📊 CHECKLIST DE VÉRIFICATION

### Avant de tester:

- [ ] Backend PROD est up: `curl https://ava-api-production.onrender.com/healthz`
- [ ] Utilisateur est connecté (token valide)
- [ ] Vapi API Key est configurée dans Settings
- [ ] Frontend est déployé avec derniers commits

### Pendant le test:

- [ ] Ouvrir console browser (F12)
- [ ] Activer Network tab
- [ ] Activer Console tab
- [ ] Faire "SAVE & SYNC TO VAPI NOW"
- [ ] Observer les requêtes HTTP:
  - POST /api/config → 200 OK ✅
  - POST /api/v1/studio/sync-vapi → 200 OK ✅

### Après le test:

- [ ] Aller sur Vapi Dashboard
- [ ] Vérifier Assistant → Nom correct
- [ ] Vérifier Voice → Provider + Voice ID
- [ ] Vérifier Model → gpt-4o + temperature
- [ ] Vérifier System Prompt (dans Model → Messages)
- [ ] Vérifier Phone Numbers → Assigned to assistant

---

## 🎯 SI ÇA NE MARCHE TOUJOURS PAS

### Debug Avancé:

1. **Activer les logs backend:**
   
   Dans `api/src/presentation/api/v1/routes/studio_config.py`, ligne 169:
   
   ```python
   @router.post("/sync-vapi")
   async def sync_config_to_vapi(...):
       print("=" * 80)
       print("🔥 DIVINE SYNC DEBUG START")
       print("=" * 80)
       print(f"User ID: {current_user.id}")
       print(f"User Email: {current_user.email}")
       print(f"Vapi Key: {current_user.vapi_api_key[:20]}..." if current_user.vapi_api_key else "❌ NO KEY")
       print(f"Config ID: {config.id}")
       print(f"Assistant ID: {config.vapiAssistantId}")
       print(f"System Prompt Length: {len(enhanced_prompt)}")
       # ... rest of code
   ```

2. **Vérifier les logs Render:**
   
   - Aller sur Render Dashboard
   - Sélectionner le service backend
   - Cliquer "Logs"
   - Chercher "DIVINE SYNC DEBUG"
   - Vérifier les erreurs

3. **Tester directement l'API Vapi:**
   
   ```bash
   curl -X PATCH https://api.vapi.ai/assistant/ASSISTANT_ID \
     -H "Authorization: Bearer YOUR_VAPI_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "model": {
         "provider": "openai",
         "model": "gpt-4o",
         "messages": [
           {
             "role": "system",
             "content": "TEST PROMPT"
           }
         ]
       }
     }'
   ```

---

## 🌟 SOLUTION FINALE DIVINE

**Si RIEN ne marche après tous ces tests, voici le plan:**

### Plan A: Recréer l'assistant de zéro

```python
# Script Python à exécuter localement
import asyncio
from api.src.infrastructure.external.vapi_client import VapiClient

async def recreate_assistant():
    client = VapiClient(token="YOUR_VAPI_KEY")
    
    # Créer nouvel assistant
    assistant = await client.create_assistant(
        name="Test Assistant",
        voice_provider="11labs",
        voice_id="21m00Tcm4TlvDq8ikWAM",
        first_message="Bonjour, je suis Ava!",
        model="gpt-4o",
        system_prompt="Tu es une assistante professionnelle française.",
    )
    
    print(f"✅ Assistant créé: {assistant['id']}")
    print(f"URL: https://dashboard.vapi.ai/assistants/{assistant['id']}")
    
    return assistant['id']

# Exécuter
asyncio.run(recreate_assistant())
```

### Plan B: Bypass frontend et appeler directement l'API

```bash
# Avec un token valide
TOKEN="eyJ..."

# 1. Sauvegarder config
curl -X PATCH https://ava-api-production.onrender.com/api/v1/studio/config \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "systemPrompt": "Tu es une assistante professionnelle.",
    "voiceProvider": "11labs",
    "voiceId": "21m00Tcm4TlvDq8ikWAM",
    "aiModel": "gpt-4o"
  }'

# 2. Sync vers Vapi
curl -X POST https://ava-api-production.onrender.com/api/v1/studio/sync-vapi \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📝 RAPPORT FINAL

**Status Actuel:**
- ✅ Backend PROD fonctionne
- ✅ Healthz répond
- ✅ API endpoints accessibles
- ❓ Sync vers Vapi: **À TESTER**

**Prochaine étape:**
1. Se connecter à l'app en PROD
2. Suivre la checklist ci-dessus
3. Vérifier les logs console
4. Reporter les erreurs exactes

---

**DIVINE CODEX:**
> "Le code ne ment jamais. Seuls les logs disent la vérité."

**Date:** 31 Oct 2025  
**Status:** DIAGNOSTIC COMPLET - EN ATTENTE DE TEST USER
