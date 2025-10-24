# 🤖 AVA - AI Voice Assistant Platform

> **Plateforme SaaS multi-tenant pour créer et gérer des assistants vocaux AI personnalisés**

[![Next.js](https://img.shields.io/badge/Next.js-14.2.5-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.12-blue)](https://www.python.org/)
[![Vapi.ai](https://img.shields.io/badge/Vapi.ai-Integrated-purple)](https://vapi.ai/)

---

## 🚀 Démarrage Rapide

**Une seule commande pour tout lancer:**

```bash
./scripts/dev.sh
```

Puis ouvre **http://localhost:3000**

---

## ✨ Fonctionnalités

- 🎙️ **Assistants Vocaux AI** - Créez des assistants personnalisés avec Vapi.ai
- 🧠 **Intelligence GPT-4** - Conversations naturelles propulsées par OpenAI
- 🎨 **Interface Intuitive** - Dashboard moderne avec Next.js 14 et Tailwind CSS
- 📊 **Analytics** - Tableaux de bord et métriques des appels
- 📞 **Gestion des Appels** - Console complète pour suivre tous les appels
- ⚙️ **Studio de Configuration** - Prompt designer, function builder, voice settings
- 📧 **Notifications Email** - Résumés d'appels automatiques par email
- 🏢 **Multi-tenant** - Architecture SaaS pour plusieurs organisations
- 🔐 **Sécurité** - Authentication JWT + NextAuth

---

## 📦 Stack Technique

### Frontend
- **Framework:** Next.js 14.2.5 (App Router)
- **UI:** React + TypeScript + Tailwind CSS
- **Components:** shadcn/ui
- **Auth:** NextAuth.js
- **DB Client:** Prisma

### Backend
- **Framework:** FastAPI + Python 3.12
- **DB:** SQLAlchemy (async) + SQLite/PostgreSQL
- **Auth:** JWT tokens
- **Architecture:** Clean Architecture (DDD)

### Services
- **Voice AI:** Vapi.ai
- **LLM:** OpenAI GPT-4
- **Email:** SMTP (Gmail)

---

## 📖 Documentation

- **[Architecture](docs/ARCHITECTURE.md)** - Vue d'ensemble du système
- **[Installation](docs/SETUP.md)** - Guide d'installation détaillé
- **[API Documentation](http://localhost:8000/docs)** - Swagger UI (après lancement)

---

## 🛠️ Installation

### Prérequis

- Node.js 18+
- Python 3.12+
- Comptes: [Vapi.ai](https://vapi.ai), [OpenAI](https://platform.openai.com)

### Étapes

1. **Cloner le repo**
   ```bash
   git clone https://github.com/Nissiel/Avaai.git
   cd Avaai
   ```

2. **Configurer les variables d'environnement**
   ```bash
   # Backend
   cp .env.example api/.env
   nano api/.env  # Ajouter vos clés API
   
   # Frontend
   cp webapp/.env.example webapp/.env.local
   nano webapp/.env.local  # Ajouter vos clés
   ```

3. **Lancer l'application**
   ```bash
   ./scripts/dev.sh
   ```

4. **Accéder à l'app**
   - Frontend: http://localhost:3000
   - API Docs: http://localhost:8000/docs

**[Guide complet →](docs/SETUP.md)**

---

## 🎯 Utilisation

### 1. Créer un Compte
- Aller sur http://localhost:3000
- Cliquer sur "Sign Up"
- Remplir le formulaire

### 2. Onboarding
- Suivre l'assistant d'onboarding
- Configurer votre organisation
- Personnaliser votre assistant AVA
- Choisir la voix et la langue

### 3. Configurer un Numéro
- Ajouter un numéro de téléphone (via Vapi)
- Configurer les heures d'ouverture
- Définir le routing

### 4. Tester
- Appeler le numéro configuré
- Parler avec votre assistant AVA
- Consulter le transcript dans le dashboard
- Recevoir le résumé par email

---

## 🗂️ Structure du Projet

```
Avaai/
├── webapp/          # Frontend Next.js
├── api/             # Backend FastAPI
├── docs/            # Documentation
├── scripts/         # Scripts utilitaires
│   ├── dev.sh       # Lancer en dev
│   └── clean.sh     # Nettoyer les caches
├── .venv/           # Environnement Python
└── requirements.txt # Dépendances Python
```

---

## 🔧 Scripts Disponibles

```bash
# Lancer l'app (backend + frontend)
./scripts/dev.sh

# Nettoyer les caches et processus
./scripts/clean.sh

# Backend uniquement
source .venv/bin/activate
uvicorn api.main:app --reload --port 8000

# Frontend uniquement
cd webapp && npm run dev
```

---

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à:
- Ouvrir une issue pour reporter un bug
- Proposer une feature
- Soumettre une pull request

---

## 📝 License

Ce projet est sous licence MIT. Voir [LICENSE](LICENSE) pour plus de détails.

---

## 🙏 Remerciements

- [Vapi.ai](https://vapi.ai) - Voice AI Platform
- [OpenAI](https://openai.com) - GPT-4 API
- [Next.js](https://nextjs.org) - React Framework
- [FastAPI](https://fastapi.tiangolo.com) - Python Framework
- [shadcn/ui](https://ui.shadcn.com) - UI Components

---

**Créé avec ❤️ pour simplifier la création d'assistants vocaux AI**
