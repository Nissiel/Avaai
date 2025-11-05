# 🔥 DIAGNOSTIC: "Vapi Sync Failed - Failed to fetch"

## 🐛 SYMPTÔME

Toast d'erreur dans l'app:
```
🚨 Vapi Sync Failed
Error: Failed to fetch
```

## 🎯 CAUSE RACINE

**CORS (Cross-Origin Resource Sharing) BLOQUE les requêtes!**

### Contexte
- Frontend: `https://avaai-XXXXX.vercel.app` (URL change à chaque deploy)
- Backend: `https://ava-api-production.onrender.com`
- Backend CORS: Liste hardcodée d'origins autorisés

### Problème
L'URL Vercel du frontend N'ÉTAIT PAS dans la liste CORS du backend!

```python
# ❌ AVANT: Liste fixe qui ne marche pas
allowed_origins = [
    "https://avaai.vercel.app",
    "https://avaai-olive.vercel.app",
    # ...mais pas l'URL actuelle!
]
```

Résultat: Browser bloque la requête avec erreur "Failed to fetch"

## ✅ SOLUTION

### Temporaire (DEBUG):
```python
# ✅ MAINTENANT: Accept ALL origins
allowed_origins = ["*"]
```

Ceci permet:
- ✅ Toutes les URLs Vercel fonctionnent
- ✅ Previews fonctionnent
- ✅ Custom domains fonctionnent
- ✅ Développement local fonctionne

### Production (TODO):
Remplacer par liste exacte:
```python
allowed_origins = [
    "https://app.avaai.com",  # Production domain
    "https://avaai-production.vercel.app",  # Vercel production
]
```

## 🔍 COMMENT IDENTIFIER CORS?

### Symptômes:
1. ✅ Backend répond (curl marche)
2. ❌ Frontend échoue avec "Failed to fetch"
3. ❌ Erreur dans Console browser: "CORS policy"

### Test rapide:
```bash
# Backend marche?
curl https://ava-api-production.onrender.com/api/v1/assistants

# Si ça marche → Problème est côté CORS!
```

## 📚 RESSOURCES

- [MDN: CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [FastAPI CORS Docs](https://fastapi.tiangolo.com/tutorial/cors/)

## ✨ DIVINE WISDOM

> **"Failed to fetch" in browser but curl works = CORS 99% du temps!"**

---

**DATE:** 2025-11-04
**STATUS:** FIXED (temporary allow_origins=["*"])
**TODO:** Restrict origins in production
