# 🔴 DIAGNOSTIC: FAILED TO FETCH + IMPOSSIBLE TO STORE DATA

## 📋 RÉSUMÉ DU CODE ACTUEL:

### ✅ **BACKEND (FastAPI):**
```python
# session.py - CORRECT ✅
engine = create_async_engine(
    settings.database_url,
    pool_pre_ping=True,
    connect_args={
        "statement_cache_size": 0,  # Fix PgBouncer
        "timeout": 10,
        "command_timeout": 60,
        "server_settings": {
            "jit": "off",
            "application_name": "ava-api-production"
        }
    }
)
```

```python
# middleware.py - CORS ULTRA PERMISSIF ✅
allowed_origins = [
    "http://localhost:3000",
    "https://avaai-olive.vercel.app",
    "https://avaai.vercel.app",
    # ... tous les domaines Vercel
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)
```

```python
# auth.py - Routes /login et /signup ✅
@router.post("/login")
async def login(...)

@router.post("/signup")
async def signup(...)
```

### ✅ **FRONTEND (Next.js):**

**login-form.tsx:**
```typescript
const response = await fetch(`${backendBaseUrl}/api/v1/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    identifier: values.identifier,
    password: values.password,
    remember: values.remember,
  }),
});

// Store tokens
localStorage.setItem("access_token", data.access_token);
localStorage.setItem("refresh_token", data.refresh_token);

// Store in Zustand
const sessionPayload = createSessionFromTokenResponse(data);
setSession(sessionPayload);
persistSession(sessionPayload);
```

**session-client.ts:**
```typescript
export function persistSession(session: AvaSession | null) {
  if (typeof window === "undefined") return;
  try {
    if (!session) {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch (error) {
    console.warn("Failed to persist session", error);
  }
}
```

---

## 🔥 LES DEUX PROBLÈMES:

### **1️⃣ FAILED TO FETCH**

**CAUSES POSSIBLES:**

#### A. **Backend n'est pas déployé correctement**
```bash
# VÉRIFIE SUR RENDER:
# 1. Va sur le service "ava-api-production"
# 2. Check les logs récents
# 3. Est-ce que tu vois: "INFO: Started server process"?
```

**SOLUTION:**
- Change `AVA_API_DATABASE_URL` sur Render:
  ```
  postgresql+asyncpg://postgres:Bichon55!!??@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
  ```
- Attends le redeploy (2-3 min)
- Vérifie `/healthz` endpoint:
  ```bash
  curl https://ava-api-production.onrender.com/healthz
  ```

#### B. **NEXT_PUBLIC_API_URL incorrect dans Vercel**

**VÉRIFIE SUR VERCEL:**
```
Settings → Environment Variables → NEXT_PUBLIC_API_URL
```

**DOIT ÊTRE:**
```
https://ava-api-production.onrender.com
```

**PAS:**
- ❌ `http://localhost:8000`
- ❌ Sans `https://`
- ❌ Avec trailing slash `/`

---

### **2️⃣ IMPOSSIBLE TO STORE DATA**

**CAUSES POSSIBLES:**

#### A. **localStorage est bloqué (Privacy Mode / Incognito)**

**SOLUTION - AJOUTE UN FALLBACK:**

```typescript
// webapp/lib/auth/session-client.ts

export function persistSession(session: AvaSession | null) {
  if (typeof window === "undefined") return;

  try {
    if (!session) {
      try {
        window.localStorage.removeItem(SESSION_STORAGE_KEY);
      } catch (e) {
        console.warn("localStorage unavailable, using sessionStorage");
        window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }
      return;
    }

    // Try localStorage first
    try {
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch (storageError) {
      // Fallback to sessionStorage
      console.warn("localStorage failed, using sessionStorage:", storageError);
      try {
        window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      } catch (sessionError) {
        console.error("Both localStorage and sessionStorage failed:", sessionError);
        // Last resort: keep in memory only (Zustand)
      }
    }
  } catch (error) {
    console.error("Failed to persist session", error);
  }
}

export function loadPersistedSession(): AvaSession | null {
  if (typeof window === "undefined") return null;

  try {
    // Try localStorage first
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AvaSession;

    // Fallback to sessionStorage
    const sessionRaw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (sessionRaw) return JSON.parse(sessionRaw) as AvaSession;

    return null;
  } catch (error) {
    console.warn("Failed to read persisted session", error);
    return null;
  }
}
```

#### B. **QuotaExceededError (localStorage plein)**

**SOLUTION - AJOUTE GESTION D'ERREUR:**

```typescript
export function persistSession(session: AvaSession | null) {
  if (typeof window === "undefined") return;

  try {
    if (!session) {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
      return;
    }

    const serialized = JSON.stringify(session);

    // Check size (localStorage limit: ~5-10MB)
    if (serialized.length > 5 * 1024 * 1024) { // 5MB
      console.error("Session data too large:", serialized.length);
      return;
    }

    window.localStorage.setItem(SESSION_STORAGE_KEY, serialized);
  } catch (error) {
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      console.error("localStorage quota exceeded, clearing old data...");
      // Clear old session and retry
      try {
        window.localStorage.clear();
        window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      } catch (retryError) {
        console.error("Failed to store session even after clearing:", retryError);
      }
    } else {
      console.error("Failed to persist session", error);
    }
  }
}
```

---

## 🎯 ACTIONS IMMÉDIATES:

### **ÉTAPE 1: FIXE LE BACKEND** (Render)

```bash
# 1. Va sur Render Dashboard
# 2. Service: ava-api-production
# 3. Environment → Edit AVA_API_DATABASE_URL
# 4. Colle:
postgresql+asyncpg://postgres:Bichon55!!??@aws-0-eu-central-1.pooler.supabase.com:6543/postgres

# 5. Save → Attends redeploy
# 6. Vérifie les logs:
#    - "INFO: Started server process" ✅
#    - Pas d'erreur "Tenant or user not found" ✅
```

### **ÉTAPE 2: VÉRIFIE VERCEL** (Frontend)

```bash
# 1. Vercel Dashboard → Settings → Environment Variables
# 2. Vérifie:
NEXT_PUBLIC_API_URL=https://ava-api-production.onrender.com

# 3. Si modifié → Redeploy frontend
```

### **ÉTAPE 3: TESTE**

```bash
# 1. Test backend health:
curl https://ava-api-production.onrender.com/healthz
# Doit retourner: {"status":"ok"}

# 2. Test CORS:
curl -H "Origin: https://avaai-olive.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://ava-api-production.onrender.com/api/v1/auth/login
# Doit avoir header: Access-Control-Allow-Origin

# 3. Test signup:
# Va sur https://avaai-olive.vercel.app
# Crée un compte
# Ouvre DevTools → Console
# Check erreurs
```

---

## 🚨 SI ÇA NE MARCHE TOUJOURS PAS:

### **ENVOIE-MOI:**

1. **Logs Render** (dernières 50 lignes):
   ```
   Render Dashboard → Logs → Copy
   ```

2. **Console Browser** (F12 → Console):
   ```
   Network tab → Failed request → Headers + Response
   ```

3. **Variables d'environnement**:
   - Render: `AVA_API_DATABASE_URL` (masque le password)
   - Vercel: `NEXT_PUBLIC_API_URL`

---

## ✅ CHECKLIST FINALE:

- [ ] Backend déployé avec nouvelle DATABASE_URL
- [ ] Logs montrent "Started server process"
- [ ] `/healthz` retourne 200 OK
- [ ] `NEXT_PUBLIC_API_URL` correct sur Vercel
- [ ] Frontend redéployé si changé
- [ ] Test signup marche
- [ ] Test login marche
- [ ] localStorage stocke le token
- [ ] Pas d'erreur CORS dans console

**SI TOUTES LES CASES COCHÉES → ÇA MARCHE! 🚀**
