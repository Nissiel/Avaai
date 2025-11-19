# 🔍 DIAGNOSTIC CORS - Backend ↔ Frontend

## 🎯 Problème identifié

Le backend n'est **toujours pas connecté** au frontend malgré la configuration CORS.

## 🧠 Analyse Divine

### 1. Configuration actuelle

**Frontend (.env.local) :**
```bash
NEXT_PUBLIC_API_URL=https://ava-api-production.onrender.com
```

**Backend (settings.py) :**
```python
env_prefix = "AVA_API_"  # ⚠️ PROBLÈME ICI !
allowed_origins: str = ""
```

**Backend (middleware.py) :**
```python
allowed_origins = settings.allowed_origins if settings.allowed_origins else [
    "http://localhost:3000",
    "http://localhost:3001",
]
```

### 2. 🚨 PROBLÈME CRITIQUE

Sur **Render**, tu as probablement ajouté :
```
ALLOWED_ORIGINS=https://avaai.vercel.app
```

**MAIS** le code utilise `env_prefix = "AVA_API_"` donc il cherche :
```
AVA_API_ALLOWED_ORIGINS=https://avaai.vercel.app
```

## ✅ SOLUTION DIVINE - Étapes précises

### ÉTAPE 1 : Vérifier les variables Render

1. Va sur https://dashboard.render.com
2. Clique sur **ava-api-production**
3. Va dans **Environment**
4. Vérifie si tu as `ALLOWED_ORIGINS` ou `AVA_API_ALLOWED_ORIGINS`

### ÉTAPE 2 : Corriger la variable (Option A - RECOMMANDÉ)

**Supprimer** l'ancienne variable et ajouter :

```bash
Nom: AVA_API_ALLOWED_ORIGINS
Valeur: https://avaai.vercel.app,https://avaai.vercel.app/
```

⚠️ **Note** : J'ai ajouté les deux variantes (avec et sans trailing slash)

### ÉTAPE 3 : Vérifier les autres variables critiques

Assure-toi que ces variables sont bien présentes sur Render :

```bash
AVA_API_DATABASE_URL=postgresql://...  # Ta database Supabase
AVA_API_JWT_SECRET_KEY=ton-secret-jwt
AVA_API_ENVIRONMENT=production
```

### ÉTAPE 4 : Redéployer le service

Après avoir ajouté `AVA_API_ALLOWED_ORIGINS` :

1. Clique sur **"Save Changes"** dans Render
2. Le service va **redémarrer automatiquement**
3. Attends que le status passe à **"Live"** (2-3 minutes)

### ÉTAPE 5 : Tester CORS depuis le browser

1. Ouvre https://avaai.vercel.app/fr
2. Ouvre la console (F12 ou Cmd+Option+C)
3. Copie-colle ce code :

```javascript
fetch('https://ava-api-production.onrender.com/healthz', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('✅ Status:', response.status);
  console.log('✅ CORS Headers:', response.headers.get('access-control-allow-origin'));
  return response.json();
})
.then(data => console.log('✅ SUCCESS:', data))
.catch(error => console.error('❌ ERROR:', error));
```

4. Appuie sur Enter

**Résultat attendu :**
```
✅ Status: 200
✅ CORS Headers: https://avaai.vercel.app
✅ SUCCESS: {status: 'ok'}
```

**Si erreur "Failed to fetch" :**
→ CORS ne fonctionne toujours pas, voir Étape 6

### ÉTAPE 6 : Vérifier les logs Render

Si ça ne marche toujours pas :

1. Va sur Render Dashboard
2. Clique sur **ava-api-production**
3. Va dans **Logs**
4. Cherche cette ligne au démarrage :

```
INFO:     Allowed origins: ['https://avaai.vercel.app']
```

**Si tu vois `[]` ou rien** → La variable n'est pas chargée correctement

### ÉTAPE 7 : Alternative - Modifier le code backend

Si les variables d'environnement ne fonctionnent pas, on peut hardcoder temporairement :

**Fichier : `api/src/core/middleware.py`**

Remplacer :
```python
allowed_origins = settings.allowed_origins if settings.allowed_origins else [
    "http://localhost:3000",
    "http://localhost:3001",
]
```

Par :
```python
allowed_origins = settings.allowed_origins if settings.allowed_origins else [
    "http://localhost:3000",
    "https://avaai.vercel.app",
    "https://avaai.vercel.app/",
]
```

Puis commit + push → Render redéploie automatiquement

## 📊 Checklist de vérification

- [ ] Variable `AVA_API_ALLOWED_ORIGINS` existe sur Render
- [ ] Valeur = `https://avaai.vercel.app,https://avaai.vercel.app/`
- [ ] Service Render redéployé et status = "Live"
- [ ] Logs Render montrent `Allowed origins: [...]` avec l'URL Vercel
- [ ] Test fetch() depuis console réussit (pas d'erreur CORS)
- [ ] Signup fonctionne sans "Failed to fetch"

## 🎯 Prochain test après CORS OK

Une fois CORS résolu, il faudra aussi vérifier :

1. **Schema mismatch** : Backend attend `"name"` mais frontend envoie `"full_name"`
2. **JWT tokens** : Vérifier que le secret est le même frontend/backend
3. **Database connection** : Vérifier que les tables existent sur Supabase

## 💡 Commande de diagnostic rapide

Pour tester CORS depuis le terminal (MacOS/Linux) :

```bash
curl -v -X OPTIONS https://ava-api-production.onrender.com/api/v1/auth/signup \
  -H "Origin: https://avaai.vercel.app" \
  -H "Access-Control-Request-Method: POST"
```

**Réponse attendue :**
```
< access-control-allow-origin: https://avaai.vercel.app
< access-control-allow-credentials: true
< access-control-allow-methods: DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT
```

---

**Dis-moi ce que tu vois dans les logs Render et le résultat du test browser !** 🚀
