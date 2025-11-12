# 🏛️ CODEX CLEANUP DIVINE - Architecture & Nettoyage Ultime

## 📋 MISSION DIVINE

**Problème actuel:** Code bordélique, fichiers obsolètes, confusion sur le démarrage, dépendances en double, architecture floue, AI qui galère à comprendre sa propre codebase.

**Objectif:** Architecture DIVINE, code PROPRE, démarrage SMOOTH, documentation CLAIRE, zéro ambiguïté.

---

## 🎯 PHASE 1: AUDIT COMPLET (Comprendre l'existant)

### A. Inventaire des fichiers racine
```bash
# Lister TOUS les fichiers à la racine
ls -la /Users/nissielberrebi/Desktop/openai-realtime-twilio-demo-main/Avaai/

# Identifier:
# ✅ Fichiers utilisés (à garder)
# ❌ Fichiers obsolètes (à supprimer)
# 🔄 Fichiers à renommer/restructurer
```

**Fichiers suspects à vérifier:**
- `main.py` - Utilisé ou obsolète?
- `start.sh` / `stop.sh` / `setup.sh` - Twilio legacy ou utilisé?
- `venv/` ET `.venv/` - Pourquoi deux environnements virtuels?
- `ava_backend/` vs `app-api/` - Quelle est la vraie structure?
- `realtime-bridge/` - Utilisé ou legacy?
- `websocket-server/` - Utilisé ou legacy?
- `web-onboarding/` vs `webapp/` - Redondant?

### B. Cartographie de l'architecture actuelle

**Frontend:**
- Localisation: `/webapp`
- Framework: Next.js 14.2.5
- Package manager: npm
- DB Schema: Prisma
- Port: 3000

**Backend:**
- Localisation: `/app-api` OU `/` (CONFUSION!)
- Framework: FastAPI
- Package manager: pip
- DB ORM: SQLAlchemy
- Port: 8000
- Entry point: `main.py` (lequel?)

**Services obsolètes (à confirmer):**
- Twilio/ngrok (remplacé par Vapi)
- `ava_backend/` (ancienne structure?)
- `realtime-bridge/` (legacy?)
- `websocket-server/` (legacy?)

### C. Analyse des dépendances

**Python:**
```bash
# Lister les packages installés dans .venv
.venv/bin/pip list

# Comparer avec requirements.txt
# Identifier les packages non utilisés
# Vérifier les conflits de versions
```

**Node.js:**
```bash
# Vérifier package.json
cat webapp/package.json

# Identifier les dépendances obsolètes
npm outdated
```

---

## 🗑️ PHASE 2: NETTOYAGE BRUTAL

### A. Supprimer les fichiers obsolètes

**Candidats à la suppression:**
1. **Anciens README multiples:**
   - `README_OLD.md` ❌
   - `README_NEW.md` ❌
   - `README_SIMPLE.md` ❌
   - Garder UNIQUEMENT `README.md` (le mettre à jour)

2. **Scripts legacy Twilio:**
   - Si `start.sh` utilise ngrok/Twilio → ❌ SUPPRIMER
   - Si `setup.sh` obsolète → ❌ SUPPRIMER
   - Créer nouveaux scripts propres pour Vapi

3. **Environnements virtuels en double:**
   - Décision: Garder `.venv/` OU `venv/` (pas les deux!)
   - Supprimer celui qui n'est pas utilisé

4. **Dossiers legacy:**
   - `ava_backend/` - Si remplacé par `app-api/` → ❌
   - `realtime-bridge/` - Si pas utilisé avec Vapi → ❌
   - `websocket-server/` - Si pas utilisé → ❌
   - `web-onboarding/` - Si dupliqué dans `webapp/` → ❌

5. **Fichiers de documentation obsolètes:**
   - `CODEX_PHASE4_DIVINE.md` ❌
   - `CODEX_PHASE4_SUITE_DIVINE.md` ❌
   - `CODEX_PROMPT_DIVINE.md` ❌
   - Garder uniquement les docs pertinents

6. **Fichiers de test/debug:**
   - `test-buttons.js` ❌
   - `test_complete.py` - Si pas utilisé → ❌
   - `server.log` ❌

### B. Commandes de suppression (APRÈS CONFIRMATION)

```bash
cd /Users/nissielberrebi/Desktop/openai-realtime-twilio-demo-main/Avaai

# Sauvegarder avant suppression
git add -A
git commit -m "🗑️ Pre-cleanup snapshot"

# Supprimer les fichiers obsolètes (EXEMPLE - À ADAPTER)
rm -f README_OLD.md README_NEW.md README_SIMPLE.md
rm -f CODEX_PHASE4_DIVINE.md CODEX_PHASE4_SUITE_DIVINE.md
rm -f test-buttons.js server.log
rm -f start.sh stop.sh setup.sh setup_env.sh  # Si legacy Twilio
rm -rf venv/  # Si on garde .venv/
rm -rf ava_backend/  # Si obsolète
rm -rf realtime-bridge/  # Si obsolète
rm -rf websocket-server/  # Si obsolète
rm -rf web-onboarding/  # Si dupliqué
```

---

## 🏗️ PHASE 3: RESTRUCTURATION DIVINE

### A. Architecture cible PROPRE

```
Avaai/
├── 📱 webapp/                    # Frontend Next.js (SEUL frontend)
│   ├── app/                      # Pages Next.js
│   ├── components/               # Composants React
│   ├── lib/                      # Utilitaires frontend
│   ├── prisma/                   # Schema Prisma (ORM frontend)
│   ├── public/                   # Assets statiques
│   ├── .env.local               # Config frontend
│   ├── package.json
│   └── tsconfig.json
│
├── 🔧 api/                       # Backend FastAPI (renommé de app-api)
│   ├── src/                      # Code source
│   │   ├── core/                 # Config, app factory
│   │   ├── domain/               # Modèles métier
│   │   ├── infrastructure/       # DB, services externes
│   │   └── presentation/         # Routes API
│   ├── tests/                    # Tests backend
│   ├── .env                      # Config backend
│   ├── main.py                   # Entry point FastAPI
│   └── requirements.txt          # Dépendances Python
│
├── 📚 docs/                      # Documentation UNIQUEMENT
│   ├── ARCHITECTURE.md           # Vue d'ensemble
│   ├── SETUP.md                  # Installation pas à pas
│   ├── DEPLOYMENT.md             # Production
│   └── API.md                    # Documentation API
│
├── 🔧 scripts/                   # Scripts utilitaires
│   ├── dev.sh                    # Démarrer en dev (1 commande!)
│   ├── build.sh                  # Build production
│   └── clean.sh                  # Nettoyage
│
├── .venv/                        # Environnement Python (UN SEUL)
├── .gitignore                    # Propre et complet
├── README.md                     # Point d'entrée (1 seul!)
└── LICENSE
```

### B. Renommages nécessaires

```bash
# Renommer app-api → api (plus court, plus clair)
mv app-api api

# Mettre à jour les imports Python partout
# app_api.src.* → api.src.*
```

### C. Consolider les configurations

**Un seul .gitignore à la racine:**
```gitignore
# Python
.venv/
__pycache__/
*.pyc
*.pyo
*.egg-info/
.pytest_cache/
*.db

# Node.js
node_modules/
.next/
out/
*.log

# Environnement
.env
.env.local
.env*.local

# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db
```

**Un seul README.md clair:**
```markdown
# 🤖 AVA - AI Voice Assistant Platform

## 🚀 Démarrage rapide (1 commande)

```bash
./scripts/dev.sh
```

Ouvre http://localhost:3000

## 📦 Stack technique

- **Frontend:** Next.js 14 + React + Tailwind
- **Backend:** FastAPI + SQLAlchemy
- **Voice AI:** Vapi.ai
- **LLM:** OpenAI GPT-4
- **Email:** SMTP (Gmail)
- **Database:** SQLite (dev) / PostgreSQL (prod)

## 📖 Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Installation détaillée](docs/SETUP.md)
- [Déploiement](docs/DEPLOYMENT.md)
- [API Documentation](docs/API.md)
```

---

## 🚀 PHASE 4: SCRIPTS DE DÉMARRAGE DIVINS

### A. `scripts/dev.sh` - UN SEUL SCRIPT POUR TOUT

```bash
#!/bin/bash
set -e

echo "🚀 AVA - Démarrage en mode développement"
echo "========================================"

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js non installé. Installation..."
    brew install node
fi

# Vérifier Python
if [ ! -d ".venv" ]; then
    echo "📦 Création de l'environnement Python..."
    python3.12 -m venv .venv
fi

# Installer dépendances backend
echo "📦 Installation dépendances backend..."
.venv/bin/pip install -q -r api/requirements.txt

# Installer dépendances frontend
echo "📦 Installation dépendances frontend..."
cd webapp && npm install --silent && cd ..

# Vérifier .env
if [ ! -f "api/.env" ]; then
    echo "⚠️  Fichier api/.env manquant!"
    echo "Copie api/.env.example vers api/.env et configure-le."
    exit 1
fi

if [ ! -f "webapp/.env.local" ]; then
    echo "⚠️  Fichier webapp/.env.local manquant!"
    echo "Copie webapp/.env.example vers webapp/.env.local et configure-le."
    exit 1
fi

# Tuer les processus existants
echo "🧹 Nettoyage des processus existants..."
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Démarrer backend
echo "🔧 Démarrage du backend (port 8000)..."
.venv/bin/uvicorn api.main:app --reload --port 8000 --host 0.0.0.0 &
BACKEND_PID=$!

# Attendre que le backend démarre
echo "⏳ Attente du backend..."
for i in {1..10}; do
    if curl -s http://localhost:8000/healthz > /dev/null 2>&1; then
        echo "✅ Backend actif"
        break
    fi
    sleep 1
done

# Démarrer frontend
echo "🎨 Démarrage du frontend (port 3000)..."
cd webapp
export PATH="/opt/homebrew/bin:$PATH"
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "🎉 AVA est lancée!"
echo "===================="
echo "🔧 Backend API:  http://localhost:8000/docs"
echo "🎨 Frontend:     http://localhost:3000"
echo ""
echo "Appuie sur Ctrl+C pour arrêter"

# Attendre et cleanup
trap "echo '\n🛑 Arrêt...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM
wait
```

### B. `scripts/clean.sh` - Nettoyage total

```bash
#!/bin/bash

echo "🧹 Nettoyage complet d'AVA..."

# Tuer les processus
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Supprimer les caches
rm -rf webapp/.next
rm -rf webapp/node_modules/.cache
rm -rf api/__pycache__
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find . -type f -name "*.pyc" -delete 2>/dev/null || true

# Supprimer la DB de dev
rm -f ava.db

echo "✅ Nettoyage terminé!"
echo "Exécute './scripts/dev.sh' pour redémarrer"
```

### C. Rendre les scripts exécutables

```bash
chmod +x scripts/dev.sh
chmod +x scripts/clean.sh
chmod +x scripts/build.sh
```

---

## 📚 PHASE 5: DOCUMENTATION DIVINE

### A. `docs/ARCHITECTURE.md` - Vue d'ensemble

```markdown
# 🏛️ Architecture AVA

## Vue d'ensemble

AVA est une plateforme SaaS multi-tenant pour créer et gérer des assistants vocaux AI.

## Flux de données

```
┌─────────────┐
│   Utilisateur│
│  (Webapp)    │
└──────┬───────┘
       │ HTTP/REST
       ▼
┌─────────────────┐
│  FastAPI Backend│
│  (Multi-tenant) │
└──────┬──────────┘
       │
       ├─────► SQLite/PostgreSQL (Profiles, Tenants)
       ├─────► Vapi.ai API (Voice Calls)
       ├─────► OpenAI API (GPT-4)
       └─────► SMTP (Email Notifications)
```

## Composants

### Frontend (Next.js)
- **Auth:** NextAuth.js (credentials + JWT)
- **UI:** Tailwind CSS + shadcn/ui
- **État:** React hooks + Server Components
- **DB:** Prisma (schema uniquement, données via API)

### Backend (FastAPI)
- **Architecture:** Clean Architecture (Domain-Driven Design)
- **DB:** SQLAlchemy async (SQLite dev, PostgreSQL prod)
- **Auth:** JWT tokens
- **Multi-tenant:** Isolation par `tenant_id`

### Services externes
- **Vapi.ai:** Gestion des appels vocaux
- **OpenAI:** GPT-4 pour intelligence conversationnelle
- **SMTP:** Envoi d'emails de notification

## Modèle de données

### Entités principales
- **Tenant:** Organisation cliente (multi-tenant)
- **AvaProfile:** Configuration d'un assistant AVA
- **Call:** Enregistrement d'un appel
- **User:** Utilisateur de la plateforme
```

### B. `docs/SETUP.md` - Installation claire

```markdown
# 🛠️ Installation AVA

## Prérequis

- **Node.js** 18+ (https://nodejs.org)
- **Python** 3.12+
- **Git**

## Installation rapide (macOS)

```bash
# 1. Cloner le repo
git clone https://github.com/Nissiel/Avaai.git
cd Avaai

# 2. Copier les fichiers de config
cp api/.env.example api/.env
cp webapp/.env.example webapp/.env.local

# 3. Configurer les clés API dans api/.env
nano api/.env  # ou vim, code, etc.

# 4. Lancer l'application
./scripts/dev.sh
```

## Configuration manuelle

### Backend (.env)
```env
# Base de données
AVA_API_DATABASE_URL=sqlite+aiosqlite:///./ava.db

# Vapi.ai (https://vapi.ai)
AVA_API_VAPI_API_KEY=your-vapi-private-key

# OpenAI (https://platform.openai.com)
OPENAI_API_KEY=sk-proj-...

# Sécurité (générer avec: openssl rand -hex 32)
AVA_API_SECRET_KEY=your-secret-key-here

# SMTP Email
AVA_API_SMTP_SERVER=smtp.gmail.com
AVA_API_SMTP_PORT=587
AVA_API_SMTP_USERNAME=your-email@gmail.com
AVA_API_SMTP_PASSWORD=your-app-password
AVA_API_SMTP_FROM_EMAIL=AVA <your-email@gmail.com>
AVA_API_SMTP_USE_TLS=true
```

### Frontend (.env.local)
```env
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000

# Vapi.ai (clé publique)
VAPI_PUBLIC_KEY=your-vapi-public-key

# NextAuth (générer avec: openssl rand -base64 32)
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000

# Database (via Prisma - optionnel)
DATABASE_URL=sqlite:///./ava.db
```

## Obtenir les clés API

### Vapi.ai
1. Créer un compte sur https://vapi.ai
2. Dashboard → API Keys
3. Copier la clé publique et privée

### OpenAI
1. Créer un compte sur https://platform.openai.com
2. API Keys → Create new key
3. Copier la clé (commence par `sk-proj-`)

### Gmail SMTP
1. Activer l'authentification à 2 facteurs
2. Générer un mot de passe d'application
3. Utiliser ce mot de passe dans `AVA_API_SMTP_PASSWORD`
```

---

## ✅ PHASE 6: CHECKLIST FINALE

### Avant de commencer
- [ ] Sauvegarder l'état actuel (git commit)
- [ ] Créer une branche `cleanup-divine`
- [ ] Lister tous les fichiers à supprimer
- [ ] Valider avec l'utilisateur

### Nettoyage
- [ ] Supprimer les fichiers obsolètes
- [ ] Supprimer l'environnement virtuel en double
- [ ] Supprimer les anciens README
- [ ] Supprimer les scripts legacy Twilio
- [ ] Nettoyer les dossiers de code legacy

### Restructuration
- [ ] Renommer `app-api/` → `api/`
- [ ] Créer le dossier `docs/`
- [ ] Créer le dossier `scripts/`
- [ ] Déplacer les docs dans `docs/`
- [ ] Mettre à jour tous les imports Python

### Scripts
- [ ] Créer `scripts/dev.sh`
- [ ] Créer `scripts/clean.sh`
- [ ] Créer `scripts/build.sh`
- [ ] Rendre les scripts exécutables

### Documentation
- [ ] Créer `docs/ARCHITECTURE.md`
- [ ] Créer `docs/SETUP.md`
- [ ] Créer `docs/API.md`
- [ ] Mettre à jour `README.md`
- [ ] Créer `.env.example` pour api et webapp

### Tests
- [ ] Tester `./scripts/dev.sh`
- [ ] Vérifier backend sur :8000
- [ ] Vérifier frontend sur :3000
- [ ] Tester le flow complet
- [ ] Commit final

### Git
- [ ] Commit: "🧹 Clean architecture - Remove legacy code"
- [ ] Commit: "📝 Add comprehensive documentation"
- [ ] Commit: "🚀 Add dev.sh startup script"
- [ ] Push vers GitHub
- [ ] Merge dans main

---

## 🎯 RÉSULTAT ATTENDU

**Avant (chaos):**
- 3-4 README différents
- Scripts obsolètes partout
- 2 environnements virtuels
- Confusion sur les entry points
- Legacy code Twilio/ngrok
- AI qui galère à démarrer l'app

**Après (divin):**
- 1 README clair
- 1 commande pour démarrer: `./scripts/dev.sh`
- 1 environnement virtuel propre
- Architecture claire et documentée
- 0 code legacy
- Démarrage en 30 secondes chrono

---

## 💡 COMMANDES CLÉS

```bash
# Audit
ls -la  # Inventaire complet
git status  # Voir les changements

# Nettoyage (APRÈS validation)
rm -rf [fichiers-obsoletes]
git clean -fd  # Supprimer fichiers non trackés

# Restructuration
mkdir -p docs scripts
mv app-api api
find . -name "*.py" -exec sed -i '' 's/app_api/api/g' {} +

# Test
./scripts/dev.sh  # Doit fonctionner du premier coup

# Commit
git add -A
git commit -m "🏛️ Divine architecture cleanup"
git push origin cleanup-divine
```

---

**🔥 PRÊT POUR L'EXÉCUTION?**

Ce nettoyage va transformer ce projet en architecture de DIEU. Chaque fichier aura sa raison d'être. Chaque commande sera évidente. Le démarrage sera instantané.

**Veux-tu que je procède?**
