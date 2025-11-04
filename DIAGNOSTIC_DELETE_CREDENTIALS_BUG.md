# 🔴 DIAGNOSTIC DIVIN - DELETE CREDENTIALS BUGS

## 🎯 PROBLÈMES IDENTIFIÉS

### BUG #1: Suppression → Boucle Infinie
**Symptôme:** Après suppression de credentials, impossible de les re-ajouter, ça tourne en rond

### BUG #2: Credentials Fantômes
**Symptôme:** Suppression → Logout → Login → Credentials réapparaissent magiquement!

---

## 🔍 CAUSES RACINES

### 🐛 BUG #1 - React Query Cache Stale

**Fichier:** `webapp/lib/hooks/use-twilio-status.ts` et `use-vapi-status.ts`

```typescript
const { data, isLoading, refetch } = useQuery<TwilioStatusResponse>({
  queryKey: ["twilio-settings", session?.accessToken],  // ❌ PROBLÈME
  queryFn: async () => { /* ... */ },
  staleTime: 5 * 60 * 1000,  // ❌ Cache 5 minutes!
});
```

**PROBLÈME:**
1. User supprime credentials
2. Backend DELETE réussit (credentials = null en DB)
3. Frontend appelle `refetch()`
4. **MAIS:** React Query utilise cached data pendant 5 minutes!
5. UI montre toujours credentials présents
6. Quand user essaie de re-ajouter → Conflit état UI vs DB

**SOLUTION:**
- Invalider le cache après DELETE
- Ou réduire staleTime à 0 pour DELETE operations

### 🐛 BUG #2 - GET /auth/me Ne Rafraîchit Pas Credentials

**Flow actuel:**
```
Login → GET /auth/me
  ↓
  Returns: { id, name, email, locale, onboarding_step }
  ↓
  ❌ MANQUE: vapi_api_key, twilio_account_sid, twilio_auth_token
```

**Code Backend:** `api/src/presentation/api/v1/routes/auth.py`

```python
@router.get("/me")
async def get_current_user_profile(user: User = Depends(get_current_user)):
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "locale": user.locale,
        # ❌ MANQUE les credentials!
        # vapi_api_key pas retourné
        # twilio_* pas retourné
    }
```

**PROBLÈME:**
1. User supprime credentials → DB updated (credentials = null)
2. User logout
3. User login → GET /auth/me
4. **Frontend cache les credentials hooks AVEC query key incluant accessToken**
5. Query key change → React Query refetch
6. **MAIS:** Les hooks re-fetch `/vapi-settings` et `/twilio-settings` séparément
7. Ces endpoints retournent les valeurs DB actuelles
8. Si user n'a pas vidé browser cache → Old cached data peut réapparaître

**VRAIE CAUSE:**
React Query cache persiste entre logout/login si:
- Browser pas fermé
- LocalStorage pas vidé
- Query keys similaires

---

## 🔥 SOLUTIONS DIVINE

### FIX #1: Invalider Cache Après DELETE ✅

**Fichier:** `webapp/components/features/settings/twilio-settings-form.tsx`

```typescript
import { useQueryClient } from "@tanstack/react-query";

export function TwilioSettingsForm() {
  const queryClient = useQueryClient();
  
  const handleDelete = async () => {
    // ... existing delete code ...
    
    // 🔥 DIVINE: Invalider le cache immédiatement
    queryClient.invalidateQueries({ queryKey: ["twilio-settings"] });
    queryClient.removeQueries({ queryKey: ["twilio-settings"] });  // Force removal
    
    toast.success(t("success.credentialsDeleted"));
  };
}
```

**Même fix pour:** `vapi-settings-form.tsx`

### FIX #2: Clear Cache sur Logout ✅

**Fichier:** `webapp/lib/stores/session-store.ts` ou logout handler

```typescript
export function logout() {
  // Clear localStorage
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem(SESSION_STORAGE_KEY);
  
  // 🔥 DIVINE: Clear ALL React Query cache
  const queryClient = useQueryClient();
  queryClient.clear();  // Nuclear option - clear everything
  
  // Clear session
  useSessionStore.getState().setSession(null);
  
  // Redirect to login
  window.location.href = "/login";
}
```

### FIX #3: Réduire staleTime pour Credentials Hooks ✅

**Fichier:** `use-twilio-status.ts` et `use-vapi-status.ts`

```typescript
const { data, isLoading, refetch } = useQuery<TwilioStatusResponse>({
  queryKey: ["twilio-settings", session?.accessToken],
  queryFn: async () => { /* ... */ },
  staleTime: 0,  // 🔥 DIVINE: Always refetch, credentials change frequently
  cacheTime: 1000 * 60,  // Keep in cache 1 minute only
});
```

### FIX #4: Backend - Return Credentials Status in /me ⚠️ OPTIONNEL

**Fichier:** `api/src/presentation/api/v1/routes/auth.py`

```python
@router.get("/me")
async def get_current_user_profile(user: User = Depends(get_current_user)):
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "locale": user.locale,
        "onboarding_completed": user.onboarding_completed,
        "onboarding_step": user.onboarding_step,
        # 🔥 DIVINE: Include credentials status (NOT the actual keys!)
        "has_vapi_key": bool(user.vapi_api_key),
        "has_twilio_credentials": bool(user.twilio_account_sid and user.twilio_auth_token),
    }
```

**Note:** Ne PAS retourner les clés complètes, juste le status!

---

## 📋 PLAN D'ACTION

### PRIORITÉ 1 - Fixes Frontend (15 min) ✅

1. ✅ Add queryClient.invalidateQueries() après DELETE dans:
   - `twilio-settings-form.tsx`
   - `vapi-settings-form.tsx`

2. ✅ Réduire staleTime à 0 dans:
   - `use-twilio-status.ts`
   - `use-vapi-status.ts`

3. ✅ Add queryClient.clear() dans logout handler

### PRIORITÉ 2 - Test Complet (10 min)

1. Add Twilio credentials → Save → ✅ Check saved
2. Delete credentials → ✅ Check UI updates immediately
3. Try to re-add → ✅ Should work without loop
4. Delete again → Logout → Login → ✅ Should NOT reappear

### PRIORITÉ 3 - Backend Enhancement (OPTIONNEL)

- Add credentials status to `/me` endpoint

---

## ✅ RÉSULTAT ATTENDU

**Avant:**
- ❌ Delete → UI freeze ou boucle
- ❌ Delete → Logout → Login → Credentials réapparaissent
- ❌ Cache stale pendant 5 minutes

**Après:**
- ✅ Delete → UI update immédiat
- ✅ Delete → Logout → Login → NO credentials
- ✅ Cache invalidé proprement
- ✅ Re-add fonctionne sans problème

---

## 🎨 DIVINE PRINCIPLE APPLIQUÉ

> **"Cache Invalidation is one of the two hard things in Computer Science"**
> 
> - Phil Karlton

**Solution DIVINE:**
1. **Invalidate early, invalidate often** - Après toute mutation
2. **Short staleTime for critical data** - Credentials = 0 staleTime
3. **Clear on logout** - Nuclear option pour éviter les ghosts
4. **Single source of truth** - DB > Cache > localStorage

---

**STATUS:** READY TO FIX 🔥
**PRIORITY:** HIGH 🚨
**EFFORT:** 15 minutes
**IMPACT:** Stable credentials management ✨
