# 🛠️ Installation AVA

## Prérequis

- **Node.js** 18+ ([télécharger](https://nodejs.org))
- **Python** 3.12+
- **Git**
- **macOS** (pour ce guide - adaptable Linux/Windows)

## Installation Rapide (1 commande)

```bash
git clone https://github.com/Nissiel/Avaai.git
cd Avaai
./scripts/dev.sh
```

**C'est tout !** Le script installe les dépendances et lance l'app.

---

## Installation Manuelle (pas à pas)

### 1. Cloner le Repository

```bash
git clone https://github.com/Nissiel/Avaai.git
cd Avaai
```

### 2. Configuration Backend

#### Créer le fichier de configuration

```bash
cp .env.example api/.env
```

#### Éditer `api/.env`

```bash
nano api/.env  # ou vim, code, etc.
```

**Configuration minimale:**

```env
# Base de données (SQLite pour développement)
AVA_API_DATABASE_URL=sqlite+aiosqlite:///./ava.db

# Vapi.ai - Obtenir sur https://vapi.ai/dashboard
AVA_API_VAPI_API_KEY=your-vapi-private-key-here

# OpenAI - Obtenir sur https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-proj-your-openai-key-here

# Sécurité - Générer avec: openssl rand -hex 32
AVA_API_SECRET_KEY=your-generated-secret-key-here

# SMTP Email (Gmail)
AVA_API_SMTP_SERVER=smtp.gmail.com
AVA_API_SMTP_PORT=587
AVA_API_SMTP_USERNAME=your-email@gmail.com
AVA_API_SMTP_PASSWORD=your-gmail-app-password
AVA_API_SMTP_FROM_EMAIL=AVA Platform <your-email@gmail.com>
AVA_API_SMTP_USE_TLS=true

# CORS (dev)
AVA_API_ALLOWED_ORIGINS=http://localhost:3000
```

### 3. Configuration Frontend

#### Créer le fichier de configuration

```bash
cp webapp/.env.example webapp/.env.local
```

#### Éditer `webapp/.env.local`

```bash
nano webapp/.env.local
```

**Configuration:**

```env
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000

# Vapi.ai - Clé PUBLIQUE (différente de la privée)
VAPI_PUBLIC_KEY=your-vapi-public-key-here

# NextAuth - Générer avec: openssl rand -base64 32
NEXTAUTH_SECRET=your-generated-nextauth-secret
NEXTAUTH_URL=http://localhost:3000

# Database (optionnel - Prisma)
DATABASE_URL=sqlite:///./ava.db
```

### 4. Installer les Dépendances

#### Backend (Python)

```bash
# Créer environnement virtuel (si pas fait)
python3.12 -m venv .venv

# Activer l'environnement
source .venv/bin/activate

# Installer dépendances
pip install -r requirements.txt
```

#### Frontend (Node.js)

```bash
cd webapp
npm install
cd ..
```

### 5. Lancer l'Application

**Option 1: Script automatique (recommandé)**

```bash
./scripts/dev.sh
```

**Option 2: Manuellement**

Terminal 1 (Backend):
```bash
source .venv/bin/activate
uvicorn api.main:app --reload --port 8000
```

Terminal 2 (Frontend):
```bash
cd webapp
npm run dev
```

### 6. Accéder à l'Application

- **Frontend:** http://localhost:3000
- **Backend API Docs:** http://localhost:8000/docs
- **Backend Health:** http://localhost:8000/healthz

---

## Obtenir les Clés API

### Vapi.ai

1. Créer un compte sur [vapi.ai](https://vapi.ai)
2. Aller dans Dashboard → API Keys
3. Copier:
   - **Private Key** → `AVA_API_VAPI_API_KEY` (backend)
   - **Public Key** → `VAPI_PUBLIC_KEY` (frontend)

### OpenAI

1. Créer un compte sur [platform.openai.com](https://platform.openai.com)
2. Aller dans API Keys → Create new secret key
3. Copier la clé (commence par `sk-proj-`)
4. Mettre dans `OPENAI_API_KEY`

⚠️ **Attention:** Ajouter des crédits sur votre compte OpenAI pour utiliser l'API.

### Gmail SMTP (Mot de Passe d'Application)

1. Activer l'authentification à 2 facteurs sur votre compte Gmail
2. Aller dans Paramètres Google → Sécurité → Mots de passe des applications
3. Créer un nouveau mot de passe d'application (sélectionner "Autre")
4. Copier le mot de passe généré (format: xxxx xxxx xxxx xxxx)
5. Mettre dans `AVA_API_SMTP_PASSWORD` (sans espaces)

### Générer les Secrets

**NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

**AVA_API_SECRET_KEY:**
```bash
openssl rand -hex 32
```

---

## Vérification de l'Installation

### Backend

```bash
curl http://localhost:8000/healthz
# Devrait retourner: {"status":"ok"}
```

### Frontend

Ouvrir http://localhost:3000 dans le navigateur. Vous devriez voir la page d'accueil.

### Base de Données

Le fichier `ava.db` sera créé automatiquement au premier lancement du backend.

---

## Dépannage

### Port déjà utilisé

```bash
# Tuer le processus sur le port 8000
lsof -ti:8000 | xargs kill -9

# Tuer le processus sur le port 3000
lsof -ti:3000 | xargs kill -9
```

### Environnement Python non trouvé

```bash
# Vérifier que .venv existe
ls -la .venv/

# Si absent, créer
python3.12 -m venv .venv
```

### Imports Python ne fonctionnent pas

```bash
# Réinstaller les dépendances
source .venv/bin/activate
pip install --force-reinstall -r requirements.txt
```

### Next.js build errors

```bash
# Nettoyer et réinstaller
cd webapp
rm -rf .next node_modules
npm install
cd ..
```

---

## Prochaines Étapes

1. Créer un compte sur http://localhost:3000
2. Passer par l'assistant d'onboarding
3. Configurer votre premier assistant AVA
4. Tester un appel vocal

Voir [ARCHITECTURE.md](ARCHITECTURE.md) pour comprendre le fonctionnement du système.
