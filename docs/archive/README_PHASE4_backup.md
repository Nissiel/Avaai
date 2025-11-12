# 🌟 AVA Platform – Voice AI Assistant Suite

> Futuristic voice experiences powered by **Next.js 14**, **FastAPI**, and the **Vapi.ai** realtime stack. Build, monitor, and refine AI assistants with live analytics, realtime call control, and a pro-grade prompt studio.

---

## ✨ Highlights

- 🎙️ **Realtime Call Console** – Monitor calls as they happen with streaming transcripts, status badges, and recording playback.
- 📊 **Analytics HQ** – KPI cards, heatmaps, anomalies, and word clouds powered by the FastAPI analytics service.
- 🧪 **Prompt Designer** – Monaco-based editor with personality templates, variable helpers, and instant save to Vapi assistants.
- 🎛️ **Function Builder** – Drag-and-drop toolkit to compose function-calling workflows without touching JSON.
- 🔄 **Websocket Layer** – Resilient client with auto-reconnect, transcript streaming, and store-driven updates.
- ⚙️ **Clean Architecture** – Hexagonal backend + feature-first frontend modules, React Query + Zustand for data orchestration.
- 🛡️ **Observability** – Sentry-ready setup, PostHog analytics, and structured API errors across services.

---

## 🚀 Quick Start (Dev Environment)

### 1. Clone & Install
```bash
git clone https://github.com/Nissiel/Avaai.git
cd Avaai

# Frontend
cd webapp
pnpm install

# Backend
cd ../app-api
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment Variables

#### Frontend (`webapp/.env`)
```bash
cp .env.example .env
```
| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | FastAPI base URL (default `http://localhost:8000`) |
| `NEXT_PUBLIC_REALTIME_URL` | WebSocket endpoint for realtime events |
| `VAPI_PUBLIC_KEY` | Public key from Vapi dashboard |
| `POSTHOG_KEY` *(optional)* | PostHog project key for analytics |

#### Backend (`app-api/.env`)
```bash
cp .env.example .env
```
| Variable | Description |
| --- | --- |
| `AVA_API_VAPI_API_KEY` | Vapi private API key |
| `AVA_API_DATABASE_URL` | Database DSN (e.g. `sqlite+aiosqlite:///./ava.db`) |
| `AVA_API_ALLOWED_ORIGINS` | Comma-separated allowed origins (e.g. `http://localhost:3000`) |

### 3. Database Migration
```bash
cd webapp
pnpm db:migrate   # runs alembic upgrade via package script
```

### 4. Run the Stack
```bash
# Frontend
cd webapp
pnpm dev

# Backend
cd ../app-api
uvicorn app_api.main:app --reload
```

Visit **http://localhost:3000** and sign in to the dashboard.

---

## 🗂️ Architecture Overview

```
Avaai/
├── webapp/                     # Next.js 14 App Router
│   ├── app/
│   │   ├── (public)/           # Marketing & auth routes
│   │   ├── (app)/              # Authenticated shell (dashboard, calls, analytics, settings)
│   │   └── api/                # Next API routes (backend proxies, Vapi bridge)
│   ├── components/
│   │   ├── features/           # Feature modules (analytics, assistant, calls, onboarding…)
│   │   ├── layouts/            # Sidebar, TopBar, nav primitives
│   │   └── ui/                 # Design system (glassmorphism, futuristic buttons, skeletons)
│   ├── lib/
│   │   ├── api/                # Typed API clients (React Query friendly)
│   │   ├── dto/                # Shared DTOs (calls, analytics, assistants)
│   │   ├── realtime/           # WebSocket client + event typing + hook
│   │   └── stores/             # Zustand stores (session, calls, assistants, transcripts)
│   ├── providers/              # App providers (RealtimeProvider, QueryClient, Theme)
│   └── services/               # External service facades (backend control, analytics)
│
├── app-api/                    # FastAPI backend (hexagonal architecture)
│   ├── src/application/        # CQRS services & orchestration (analytics, realtime session)
│   ├── src/domain/             # Entities and domain logic
│   ├── src/infrastructure/     # Persistence, external clients (Vapi), messaging
│   └── src/presentation/       # REST routers (analytics, calls, assistants, voices…)
│
├── websocket-server/           # Node websocket bridge (Twilio/OpenAI realtime)
└── docs/                       # Additional guides, security notes, setup scripts
```

---

## 🧠 Core Experiences

### Realtime Call Console
- `/app/calls` – React Query + Zustand list synced with websocket events (`CALL_STARTED`, `CALL_UPDATED`, `CALL_ENDED`).
- `/app/calls/[id]` – Streamed transcript chunks rendered with speaker badges, live status updates, and audio recording playback.
- Transcript cache handled via `useCallTranscriptsStore` with automatic cleanup on unmount.

### Prompt & Personality Studio
- Monaco editor with variable helpers and AI suggestions.
- Personality templates toggle metadata (`metadata.personality`) persisted through FastAPI ↔️ Vapi.
- Function Builder drag & drop integrated with assistant update flow – definitions stored as proper JSON schema objects.

### Analytics Dashboard
- KPI grid, timeseries, heatmap, anomalies, and topics from `/api/v1/analytics/*`.
- Dashboard data hydrates the calls store to keep realtime pages in sync.
- Uses Recharts, animated gradients, and glass panels for the futuristic look.

---

## 🔌 API & Data Flow

### Frontend → Backend (Next.js API routes)
- `/api/calls` → `app-api` `/api/v1/calls`
- `/api/analytics/*` → `app-api` analytics routers
- `/api/vapi/assistants` → Vapi SDK wrapper (create/update/delete)

### Backend Responsibilities
- **Analytics**: Aggregates call metrics, sentiment, anomalies, exposure through typed DTOs.
- **Calls**: Persists Vapi call snapshots in SQLAlchemy, exposes query endpoints, streams transcripts.
- **External Clients**: `VapiClient` (async httpx wrapper), Text-to-speech helpers, Twilio number management.

---

## 🛡️ Monitoring & Observability

- **Sentry**: `@sentry/nextjs` wired; set `SENTRY_DSN` to enable error collection.
- **PostHog**: Frontend instrumentation via `posthog-js` (toggle with `POSTHOG_KEY`).
- **Structured Logging**: FastAPI uses standard logging; adapt `app-api/src/core/logging.py` to forward to your sink.
- **Health Checks**: Backend `GET /healthz` + runtime controller via `/api/backend` route in Next.js.

---

## 🧰 Useful Scripts

### Frontend (`webapp`)
| Command | Description |
| --- | --- |
| `pnpm dev` | Start Next.js dev server |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint with zero warnings tolerated |
| `pnpm typecheck` | TypeScript `--noEmit` |
| `pnpm test` | Vitest unit tests |
| `pnpm storybook` | Storybook (design system playground) |
| `pnpm db:migrate` | Apply Alembic migrations from the frontend workspace |

### Backend (`app-api`)
| Command | Description |
| --- | --- |
| `uvicorn app_api.main:app --reload` | Development server |
| `alembic upgrade head` | Run latest migrations |
| `pytest` | Backend tests (when added) |

---

## 🔒 Production Notes

- Configure `NEXT_PUBLIC_REALTIME_URL` to point to the websocket bridge deployed alongside Twilio/OpenAI realtime services.
- Harden CSP headers in `webapp/next.config.mjs` as needed (template included).
- For Vercel + Railway deployment, replicate env vars across platforms and enable HTTPS for the FastAPI origin.
- Enable Sentry/PostHog via environment flags before deploying.

---

## 🤝 Contributing

1. Fork & branch (`git checkout -b feat/your-feature`)
2. Run lint + typecheck (`pnpm lint && pnpm typecheck`)
3. Write/update tests where appropriate
4. Open a PR describing changes & screenshots (especially for UI work)

---

Built with ❤️ to deliver a **divine**, performant, and maintainable voice assistant platform. Enjoy shipping! 🚀
