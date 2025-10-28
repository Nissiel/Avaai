# 🔗 Connexion Backend ↔ Frontend - Guide Complet

## 🎯 Problème Actuel

- ✅ Frontend déployé : https://avaai.vercel.app
- ✅ Backend déployé : https://ava-api-production.onrender.com
- ❌ **Ils ne communiquent pas !**

### Erreur Observable
```
Failed to fetch
→ CORS policy bloque la requête
→ Frontend ne peut pas appeler le backend
```

---

## 🔧 Solution en 3 Étapes

### Étape 1️⃣ : Configure CORS sur Backend (Render)

**Temps : 3 minutes**

1. **Ouvre Render Dashboard**
   ```
   https://dashboard.render.com
   ```

2. **Sélectionne le service**
   - Click sur `ava-api-production`

3. **Va dans "Environment"**
   - Menu de gauche → Environment

4. **Ajoute cette variable d'environnement :**
   ```
   Key: ALLOWED_ORIGINS
   
   Value: https://avaai.vercel.app,https://avaai-git-main-nissiel-thomas-projects.vercel.app,https://avaai-*.vercel.app
   ```
   
   ⚠️ **Important** : Pas d'espaces, juste des virgules entre les URLs !

5. **Sauvegarde**
   - Click "Save Changes"
   - Render va redéployer automatiquement (~2 minutes)
   - Attends que le status passe à "Live"

---

### Étape 2️⃣ : Configure API URL sur Frontend (Vercel)

**Temps : 2 minutes**

1. **Ouvre Vercel Settings**
   ```
   https://vercel.com/nissiel-thomas-projects/avaai/settings/environment-variables
   ```

2. **Ajoute cette variable :**
   ```
   Key: NEXT_PUBLIC_API_URL
   
   Value: https://ava-api-production.onrender.com
   ```

3. **Sélectionne tous les environments**
   - ☑️ Production
   - ☑️ Preview  
   - ☑️ Development

4. **Sauvegarde**
   - Click "Save"

5. **Redéploie**
   - Va dans "Deployments"
   - Click sur le dernier deployment
   - Click "⋯" (trois points) → "Redeploy"
   - Attends ~1 minute

---

### Étape 3️⃣ : Vérifie que ça Marche

**Temps : 2 minutes**

#### Test 1 : Health Check
```bash
curl https://ava-api-production.onrender.com/healthz
```
**Attendu :** `{"status":"ok"}`

#### Test 2 : CORS Check
```bash
curl -X OPTIONS \
  https://ava-api-production.onrender.com/api/v1/auth/signup \
  -H "Origin: https://avaai.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -v
```
**Attendu :** Tu dois voir dans les headers :
```
Access-Control-Allow-Origin: https://avaai.vercel.app
Access-Control-Allow-Methods: *
```

#### Test 3 : Frontend API Call
1. Ouvre https://avaai.vercel.app/en
2. Ouvre la console browser (F12)
3. Tape :
   ```javascript
   fetch('https://ava-api-production.onrender.com/healthz')
     .then(r => r.json())
     .then(console.log)
   ```
4. **Attendu :** `{status: "ok"}` sans erreur CORS

#### Test 4 : Signup Complet 🎯
1. Va sur https://avaai.vercel.app/fr/signup
2. Remplis le formulaire :
   - Nom : Test User
   - Email : test@example.com
   - Mot de passe : TestPass123!
3. Click "Créer mon compte"
4. **Attendu :** 
   - ✅ Pas de "Failed to fetch"
   - ✅ Redirect vers dashboard
   - ✅ Message de succès

---

## 🐛 Troubleshooting

### Problème : "Failed to fetch" persiste

**Solutions :**

1. **Hard refresh le browser**
   ```
   Mac : Cmd + Shift + R
   Windows : Ctrl + F5
   ```

2. **Vérifie que Vercel a redéployé**
   ```
   https://vercel.com/nissiel-thomas-projects/avaai/deployments
   → Check que le dernier deployment est "Ready"
   ```

3. **Vérifie que Render a redéployé**
   ```
   https://dashboard.render.com
   → Check que le service est "Live"
   → Check les logs pour "Allowed origins: ['https://avaai.vercel.app']"
   ```

4. **Vérifie la variable API_URL dans Vercel**
   ```
   https://vercel.com/nissiel-thomas-projects/avaai/settings/environment-variables
   → Check que NEXT_PUBLIC_API_URL existe
   → Check la valeur : https://ava-api-production.onrender.com (pas de trailing slash)
   ```

---

### Problème : CORS error persiste

**Check la config CORS :**

1. **Dans Render logs**
   ```
   Tu dois voir au démarrage :
   "Allowed origins: ['https://avaai.vercel.app', ...]"
   ```

2. **Test manuel CORS**
   ```bash
   curl -X OPTIONS \
     https://ava-api-production.onrender.com/api/v1/auth/signup \
     -H "Origin: https://avaai.vercel.app" \
     -v | grep -i "access-control"
   ```

3. **Si pas de headers CORS :**
   - Vérifie que ALLOWED_ORIGINS est bien set sur Render
   - Vérifie qu'il n'y a pas d'espaces dans la valeur
   - Redémarre le service sur Render

---

### Problème : Backend ne répond pas

**Check backend status :**

1. **Health check direct**
   ```bash
   curl https://ava-api-production.onrender.com/healthz
   ```
   Si timeout : Le backend est down, check Render logs

2. **Check Render logs**
   ```
   https://dashboard.render.com → ava-api-production → Logs
   ```
   Cherche les erreurs (en rouge)

3. **Vérifie DATABASE_URL**
   ```
   Render → Environment → Check que DATABASE_URL existe
   ```

---

## 📋 Checklist Finale

Avant de dire "C'est bon !" :

- [ ] ✅ Render : ALLOWED_ORIGINS ajouté
- [ ] ✅ Render : Service status = "Live"
- [ ] ✅ Render : Logs montrent "Allowed origins: [...]"
- [ ] ✅ Vercel : NEXT_PUBLIC_API_URL ajouté
- [ ] ✅ Vercel : Dernier deployment = "Ready"
- [ ] ✅ Health check curl fonctionne
- [ ] ✅ CORS check curl fonctionne
- [ ] ✅ Frontend console test fonctionne
- [ ] ✅ Signup page fonctionne sans erreur

---

## 🎉 Une Fois que Tout Marche

### Test le Flow Complet

1. **Signup**
   - https://avaai.vercel.app/fr/signup
   - Crée un compte
   - ✅ Devrait marcher !

2. **Login**
   - https://avaai.vercel.app/fr/login
   - Connecte-toi avec le compte créé
   - ✅ Devrait marcher !

3. **Dashboard**
   - Après login, tu arrives sur /fr/app/home
   - ✅ Devrait afficher le dashboard !

---

## ⚡ Quick Commands

```bash
# Test backend health
curl https://ava-api-production.onrender.com/healthz

# Test CORS
curl -X OPTIONS \
  https://ava-api-production.onrender.com/api/v1/auth/signup \
  -H "Origin: https://avaai.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -v

# Test signup API direct
curl -X POST https://ava-api-production.onrender.com/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -H "Origin: https://avaai.vercel.app" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!",
    "full_name": "Test User"
  }'
```

---

## 📊 Variables d'Environnement Complètes

### Backend (Render)
```bash
DATABASE_URL=postgresql+asyncpg://user:pass@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
ALLOWED_ORIGINS=https://avaai.vercel.app,https://avaai-git-main-nissiel-thomas-projects.vercel.app
JWT_SECRET_KEY=ton-secret-super-securise-change-moi
ENVIRONMENT=production
```

### Frontend (Vercel)
```bash
NEXT_PUBLIC_API_URL=https://ava-api-production.onrender.com
NEXTAUTH_URL=https://avaai.vercel.app
NEXTAUTH_SECRET=ton-nextauth-secret-change-moi
DATABASE_URL=postgresql://user:pass@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

---

## 🚀 Temps Total Estimé

- Configuration Render : 3 min
- Configuration Vercel : 2 min
- Attente redéploiements : 3 min
- Tests : 2 min

**TOTAL : ~10 minutes** ⚡

---

## 💡 Pro Tips

1. **Cache browser** : Toujours faire hard refresh après changement
2. **Logs** : Check toujours les logs après changement de config
3. **Variables** : Pas d'espaces dans ALLOWED_ORIGINS !
4. **HTTPS** : Toujours HTTPS en prod, jamais HTTP
5. **Trailing slash** : Pas de "/" à la fin des URLs

---

## 🎯 Success!

Quand tu vois :
- ✅ Signup fonctionne sans "Failed to fetch"
- ✅ Login fonctionne
- ✅ Dashboard s'affiche

**→ TU AS GAGNÉ ! 🎉**

C'est le moment d'inviter tes premiers clients ! 🚀

---

**Built with 🧠 Precision + 💙 Care + ✨ Divine Connection**

*Now go connect everything!* 🔗✨
