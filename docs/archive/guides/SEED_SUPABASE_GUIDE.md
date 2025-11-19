# 🔥 DIVINE CODEX - Guide de Seed Production Supabase

## 🎯 Objectif

Initialiser la base de données Supabase en production pour que l'app fonctionne immédiatement.

---

## 📋 Que fait ce script?

Le script `seed_supabase_production.py` crée automatiquement:

1. ✅ **User** - Ton compte (nissieltb@gmail.com)
2. ✅ **Assistant** - Assistant AVA par défaut
3. ✅ **Studio Config** - Configuration voix/IA
4. ✅ **Onboarding State** - Onboarding complété

**Résultat:** L'app est prête à utiliser immédiatement!

---

## 🚀 Comment l'exécuter sur Render?

### Option A: Via Shell Render (Recommandé)

1. Va sur **Render Dashboard**
2. Clique sur ton service backend
3. Clique **Shell** (en haut à droite)
4. Exécute:

```bash
python scripts/seed_supabase_production.py
```

5. Tu verras:
```
🔥 DIVINE CODEX - Supabase Production Seed
✅ Connected!
✅ User created: nissieltb@gmail.com
✅ Assistant created: AVA Assistant
✅ Studio config created
✅ Onboarding state created
🎉 SUCCESS! Supabase is ready!
```

---

### Option B: Via Script de démarrage

Ajoute dans ton `Dockerfile` ou script de démarrage:

```bash
# Run seed ONCE on first deploy
python scripts/seed_supabase_production.py || true

# Then start the server
uvicorn api.main:app --host 0.0.0.0 --port $PORT
```

---

## ✅ Vérification

Après le seed, teste:

1. **Login:** https://avaai-olive.vercel.app/en/login
   - Email: nissieltb@gmail.com
   - Password: Bichon55!!

2. **Dashboard:** Tu devrais voir le dashboard directement

3. **Studio Settings:** Configuration déjà prête

4. **Phone Numbers:** Prêt à configurer Twilio

---

## 🔍 Troubleshooting

### Erreur: "DATABASE_URL not set"

**Solution:** Le script doit tourner sur Render où `DATABASE_URL` est configuré.

### Erreur: "User already exists"

**C'est normal!** Le script détecte si les données existent déjà et ne crée pas de doublons.

### Erreur: "Connection failed"

**Vérifier:**
1. Supabase est UP (https://supabase.com/dashboard)
2. DATABASE_URL sur Render est correct
3. Supabase accepte les connexions (pas en pause)

---

## 📊 Données Créées

### User
```json
{
  "email": "nissieltb@gmail.com",
  "name": "Nissiel Thomas",
  "onboarding_completed": true,
  "vapi_api_key": "b3cf0568-fc95-4dcf-b6f4-30a007d80b64"
}
```

### Assistant
```json
{
  "name": "AVA Assistant",
  "model": "gpt-4o",
  "voice_provider": "azure",
  "voice_id": "fr-FR-DeniseNeural",
  "transcriber_provider": "deepgram",
  "transcriber_language": "fr"
}
```

### Studio Config
```json
{
  "ai_model": "gpt-4o",
  "ai_temperature": 0.7,
  "voice_provider": "azure",
  "voice_id": "fr-FR-DeniseNeural",
  "system_prompt": "Tu es AVA, une assistante professionnelle."
}
```

---

## 🎯 Après le Seed

L'utilisateur peut maintenant:

1. ✅ Se connecter à l'app
2. ✅ Voir son dashboard
3. ✅ Configurer son assistant
4. ✅ Ajouter des numéros Twilio
5. ✅ Recevoir des appels
6. ✅ Voir l'historique des calls

**L'APP FONCTIONNE! 🎉**

---

## 🔥 DIVINE CODEX

> **"L'utilisateur est ROI. Son expérience est SACRÉE."**

Ce script assure que l'utilisateur peut utiliser l'app **IMMÉDIATEMENT** après déploiement, sans friction, sans erreur, sans confusion.

**C'est ça, la solution DIVINE.** ✨
