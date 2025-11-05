# 🔴 DIAGNOSTIC DIVIN - SESSION INSTABILITY ISSUE

## 🎯 PROBLÈME IDENTIFIÉ

### Symptômes:
- "Quand y a des bugs le backend se déconnecte très rapidement"
- "Comme si il y avait deux chemins quasi identiques"
- "Quand je rafraîchis la page après bugg tout casse"

### ✅ CAUSE RACINE TROUVÉE:

**INCOHÉRENCE dans la gestion des tokens:**

```
PROBLÈME: auth-helper.ts utilise Zustand hook HORS d'un React Component!
```

#### Fichier: `webapp/lib/api/auth-helper.ts`
```typescript
// ❌ MAUVAIS: Ne marche QUE dans React components
import { useSessionStore } from "@/lib/stores/session-store";

export function getAuthToken(): string | undefined {
  const session = useSessionStore.getState().session;  // ❌ getState() peut être vide
  let token = session?.accessToken;

  // Fallback: localStorage
  if (!token && typeof window !== "undefined") {
    token = localStorage.getItem("access_token") || undefined;
  }

  return token;
}
```

**POURQUOI ÇA CASSE:**

1. **Après refresh de page:**
   - Zustand store est VIDE (pas encore hydraté)
   - `useSessionStore.getState().session` = `null`
   - Fallback à localStorage fonctionne

2. **Mais quand Zustand se charge:**
   - Il peut écraser le token localStorage
   - Race condition entre Zustand et localStorage
   - Token perdu → 401 Unauthorized

3. **Symptôme: "Deux chemins":**
   - Path A: Zustand a le token → ✅ Marche
   - Path B: Zustand vide → ❌ 401 (avant fallback localStorage)

4. **Symptôme: "Backend se déconnecte":**
   - Pas le backend qui se déconnecte
   - C'est le **token côté frontend qui disparaît** de Zustand!

---

## 🔥 SOLUTION DIVINE

### PRINCIPE: Single Source of Truth

**localStorage = Source de vérité**
**Zustand = Cache réactif pour UI**

### ARCHITECTURE FIXÉE:

```
Login → localStorage.setItem("access_token", token)
     └→ Zustand.setState({ session })

API Call → TOUJOURS lire localStorage.getItem("access_token")
           └→ Zustand juste pour affichage UI

Page Refresh → SessionProvider.bootstrap()
                └→ Lit localStorage
                └→ Hydrate Zustand
```

---

## 📋 FICHIERS À FIXER

### 1. `webapp/lib/api/auth-helper.ts` - ✅ PRIORITÉ CRITIQUE

**Avant (BUGGY):**
```typescript
export function getAuthToken(): string | undefined {
  const session = useSessionStore.getState().session;  // ❌ Race condition
  let token = session?.accessToken;

  if (!token && typeof window !== "undefined") {
    token = localStorage.getItem("access_token") || undefined;
  }

  return token;
}
```

**Après (DIVINE):**
```typescript
export function getAuthToken(): string | undefined {
  if (typeof window === "undefined") return undefined;

  // ALWAYS read from localStorage (single source of truth)
  const token = localStorage.getItem("access_token");

  // If no token, try refresh
  if (!token) {
    const refreshToken = localStorage.getItem("refresh_token");
    if (refreshToken) {
      // TODO: Trigger refresh flow
      console.warn("No access token but refresh token exists - should refresh");
    }
  }

  return token || undefined;
}

export function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}
```

### 2. `webapp/providers/session-provider.tsx` - Bootstrap améliorer

**S'assurer que:**
- localStorage est TOUJOURS la source de vérité
- Zustand est mis à jour DEPUIS localStorage
- Pas l'inverse!

### 3. Tous les appels API - Utiliser auth-helper CORRECTEMENT

**Pattern actuel (INCOHÉRENT):**
```typescript
// Certains utilisent:
const token = session?.accessToken;  // ❌ Peut être null après refresh

// D'autres utilisent:
const token = localStorage.getItem("access_token");  // ✅ Fiable

// D'autres utilisent:
headers: getAuthHeaders()  // ✅ Mais getAuthHeaders() utilise Zustand!
```

---

## 🎯 PLAN D'ACTION

### ÉTAPE 1: Fixer auth-helper.ts ✅
```bash
# Supprimer dépendance Zustand
# Utiliser UNIQUEMENT localStorage
```

### ÉTAPE 2: Vérifier session-provider.tsx
```bash
# S'assurer que bootstrap() lit localStorage
# Et hydrate Zustand (pas l'inverse)
```

### ÉTAPE 3: Test complet
```bash
1. Login
2. Refresh page → Check console (token présent?)
3. Navigate → Check token stable
4. Error → Refresh → Check token survive
```

---

## ✅ RÉSULTAT ATTENDU

**Avant:**
- ❌ Refresh = token perdu
- ❌ Navigation = token instable
- ❌ Error = session cassée

**Après:**
- ✅ Refresh = token TOUJOURS là (localStorage)
- ✅ Navigation = token stable
- ✅ Error = session survive

---

## 🎨 DIVINE PRINCIPLE APPLIQUÉ

> **"Single Source of Truth"**
>
> Ne JAMAIS avoir deux sources de vérité pour la même donnée.
>
> localStorage = Source (persisté, fiable)
> Zustand = Cache (réactif, UI only)

---

**STATUS:** READY TO FIX 🔥
**PRIORITY:** CRITICAL 🚨
**EFFORT:** 15 minutes
**IMPACT:** Complete session stability ✨
