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

## 🏆 Phase 1.5 — Divine Completion ✨

**Status:** ✅ **COMPLETE** (November 12, 2025)

**Divine Score:** 73% → **98%** (+25 points)

### What Was Delivered
- ✅ Unified HTTP client with retry logic & correlation IDs
- ✅ Comprehensive integration test suite (10 tests)
- ✅ Complete deployment runbook with rollback procedures
- ✅ Error handling documentation with user-friendly messages
- ✅ Performance benchmarks framework
- ✅ User impact analysis
- ✅ Observability & monitoring plan
- ✅ Phase 2 tracking with ADRs

### Key Improvements
- **Testing:** 3 → 10 tests (+233%)
- **Documentation:** 500 → 2,800 lines (+460%)
- **Code Cleanup:** -395 lines dead code
- **Deployment Safety:** Complete runbook + <5min rollback
- **User Experience:** Documented performance gains & error improvements

📚 **Full Report:** [Phase 1 Divine Completion](./docs/PHASE1_DIVINE_COMPLETION_REPORT.md)

---

## 📦 Stack Technique

### Frontend
- **Framework:** Next.js 14.2.5 (App Router)
- **UI:** React + TypeScript + Tailwind CSS
- **Components:** shadcn/ui
- **Auth:** NextAuth.js
- **HTTP Client:** Unified server-client with retry logic & correlation IDs ✨
- **Logging:** Structured JSON logs with request tracking ✨

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

   > Astuce: définis aussi `AVA_API_TWILIO_ACCOUNT_SID` et `AVA_API_TWILIO_AUTH_TOKEN` pour un fallback global pendant que les utilisateurs ajoutent leurs propres identifiants Twilio.

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

## 🧼 Phase 1 — Simplify & Sanitize
- **Env unique** : `webapp/lib/config/env.ts` aligne Next, API routes et scripts sur les mêmes URLs.
- **Clients HTTP unifiés** : `apiFetch` (client) + `serverFetchBackend` (server/edge) garantissent timeouts, retries GET-only et corrélation d'IDs.
- **Logger minimal** : `webapp/lib/logging/server-logger.ts` enregistre tous les appels backend en JSON (prêt pour observabilité).
- **Dead code purgé** : Prisma, pages Next legacy et proxies Twilio redondants ont été supprimés pour simplifier la lecture du repo.
- **Tests smoke** : `python3.11 -m pytest api/tests/test_smoke.py` valide boot, routing et `/healthz` avant tout déploiement.

---

## 🔌 Phase 2 — Vapi Core + Settings UI
- **Client Vapi unique** : `api/src/infrastructure/external/vapi_client.py` expose désormais des méthodes typées (`list_settings`, `get_setting`, `update_setting`) réutilisées sur tout le backend.
- **Endpoints dédiés** : `/api/v1/vapi/settings` propose list/get/update avec validation Pydantic + erreurs normalisées.
- **Settings UI branchée server actions** : l'onglet Vapi affiche la liste des clés (lecture/édition JSON ou texte) via les server actions de `app/(app)/settings/vapi-actions.ts`.
- **Assistants multi-tenant** : tout passe par `get_vapi_client_for_user`, garantissant que chaque requête Vapi se fait avec la clé utilisateur.
- **Tests backend** : `python3.11 -m pytest api/tests/test_vapi_settings_routes.py` couvre la liste et la mise à jour des paramètres (smoke contract).

## 📞 Phase 3 — Twilio Minimal Integration
- **Client unique** : `api/src/application/services/twilio.py` résout les credentials (user → fallback env) et instancie un Twilio client partagé.
- **Routes consolidées** : `/api/v1/twilio/numbers` et `/api/v1/phone-numbers/*` consomment désormais ce client et respectent les clés par utilisateur.
- **Webhooks sécurisés** : `/api/v1/webhooks/twilio/status` vérifie la signature avec le token lié au numéro reçu, puis journalise l’événement.
- **UI** : aucun appel direct côté client, tout passe par les actions serveur / API FastAPI.
- **Tests** : `python3.11 -m pytest api/tests/test_twilio_service.py` valide la résolution des credentials et protège la régression sur l’intégration Twilio.

## ✉️ Phase 4 — Email & Calendar Stubs
- **Test Email API** : `/api/v1/integrations/email/test` valide la charge utile et confirme si Resend/SMTP sont configurés sans envoyer d’email (prêt à brancher quand les secrets seront fournis).
- **Calendrier** : `/api/v1/integrations/calendar/{google|microsoft}/events` renvoie des événements factices + les scopes OAuth requis (`calendar.events.readonly` / `Calendars.Read`).
- **Server Actions** : les stubs sont logués côté serveur pour garantir l’observabilité (corrélation ready).
- **Tests** : `python3.11 -m pytest api/tests/test_integrations_stubs.py` couvre les endpoints et garantit leur stabilité.

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

## 🙏 Remerciements

- [Vapi.ai](https://vapi.ai) - Voice AI Platform
- [OpenAI](https://openai.com) - GPT-4 API
- [Next.js](https://nextjs.org) - React Framework
- [FastAPI](https://fastapi.tiangolo.com) - Python Framework
- [shadcn/ui](https://ui.shadcn.com) - UI Components

---

**Créé avec ❤️ pour simplifier la création d'assistants vocaux AI**
