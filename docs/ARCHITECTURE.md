# 🏛️ Architecture AVA

## Vue d'ensemble

AVA est une plateforme SaaS multi-tenant pour créer et gérer des assistants vocaux AI personnalisés.

## Stack Technique

- **Frontend:** Next.js 14.2.5 + React + TypeScript + Tailwind CSS
- **Backend:** FastAPI + Python 3.12 + SQLAlchemy (async)
- **Voice AI:** Vapi.ai (gestion des appels vocaux)
- **LLM:** OpenAI GPT-4
- **Email:** SMTP (Gmail)
- **Database:** SQLite (dev) / PostgreSQL (prod)
- **Auth:** NextAuth.js + JWT

## Flux de Données

```
┌─────────────────┐
│   Utilisateur   │
│   (Webapp)      │
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────┐
│ FastAPI Backend │
│ (Multi-tenant)  │
└────────┬────────┘
         │
         ├─────► SQLite/PostgreSQL (Profiles, Tenants, Users)
         ├─────► Vapi.ai API (Voice Calls Management)
         ├─────► OpenAI API (GPT-4 Intelligence)
         └─────► SMTP (Email Notifications)
```

## Structure du Projet

```
Avaai/
├── webapp/          # Frontend Next.js
│   ├── app/         # Pages Next.js (App Router)
│   ├── components/  # Composants React réutilisables
│   ├── lib/         # Utilitaires frontend (API clients, hooks, stores)
│
├── api/             # Backend FastAPI
│   ├── src/
│   │   ├── core/            # Configuration, app factory
│   │   ├── domain/          # Modèles métier
│   │   ├── infrastructure/  # DB, services externes
│   │   └── presentation/    # Routes API
│   ├── tests/       # Tests backend
│   └── main.py      # Entry point FastAPI
│
├── docs/            # Documentation
├── scripts/         # Scripts utilitaires (dev.sh, clean.sh)
└── .venv/           # Environnement Python
```

## Composants

### Frontend (Next.js)
- **Auth:** NextAuth.js (credentials + JWT)
- **UI:** Tailwind CSS + shadcn/ui components
- **État:** React hooks + Server Components
- **Data Access:** REST calls vers FastAPI (plus de Prisma embarqué)
- **Routing:** App Router (Next.js 14)

### Backend (FastAPI)
- **Architecture:** Clean Architecture (Domain-Driven Design)
- **DB:** SQLAlchemy async (SQLite dev, PostgreSQL prod)
- **Auth:** JWT tokens
- **Multi-tenant:** Isolation par `tenant_id`
- **API:** REST (auto-documentation Swagger/OpenAPI)
- **Vapi Gateway:** `/api/v1/vapi/settings` (key/value) + `/api/v1/assistants` délèguent directement au Vapi client tout en respectant les clés utilisateur.
- **Twilio Service:** `api/src/application/services/twilio.py` résout les identifiants (user → fallback env), alimente `/api/v1/twilio/*` et sécurise les webhooks via signature.
- **Email/Calendar Stubs:** `/api/v1/integrations/email/test` et `/api/v1/integrations/calendar/{provider}/events` offrent des endpoints prêts à brancher pour Phase 4 (validation payload + TODO OAuth).

### Services Externes
- **Vapi.ai:** Gestion complète des appels vocaux
- **OpenAI:** GPT-4 pour intelligence conversationnelle
- **SMTP:** Envoi d'emails de notification (résumés d'appels)

## Modèle de Données

### Entités Principales
- **Tenant (Org):** Organisation cliente (multi-tenant)
- **User:** Utilisateur de la plateforme
- **AvaProfile:** Configuration d'un assistant AVA
  - Personnalité, voix, langues
  - Prompts système
  - Règles de conversation
  - Intégrations activées
- **Call:** Enregistrement d'un appel
  - Transcript complet
  - Résumé AI
  - URL d'enregistrement
  - Métadonnées (durée, résultat, etc.)
- **PhoneNumber:** Numéro de téléphone configuré
  - Routing vers AVA
  - Heures d'ouverture
  - Messages vocaux

## Flux Utilisateur

### Onboarding
1. Création de compte (email/password)
2. Création d'organisation (tenant)
3. Configuration AVA via wizard:
   - Détails organisation
   - Personnalité de l'assistant
   - Choix de la voix
   - Configuration du numéro
4. Lancement AVA (création via Vapi API)

### Appel Vocal
1. Client appelle le numéro configuré
2. Vapi.ai reçoit l'appel
3. AVA (configurée via profil) répond
4. Conversation avec GPT-4
5. Fin d'appel → Webhook vers backend
6. Backend génère résumé et envoie email via SMTP

## Sécurité

- **Authentication:** JWT tokens (backend) + NextAuth sessions (frontend)
- **Authorization:** Multi-tenant isolation (tenant_id filter)
- **Secrets:** Stored in .env files (not committed)
- **API Keys:** Vapi + OpenAI + SMTP credentials secured
- **CORS:** Configured for localhost (dev) / domain (prod)

## Déploiement

Voir [DEPLOYMENT.md](DEPLOYMENT.md) pour les instructions de déploiement en production.
