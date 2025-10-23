# 🌟✨ PHASE 4 (SUITE) - PROMPT ULTIME DIVIN POUR CODEX ✨🌟

## 🎯 CONTEXTE - OÙ NOUS EN SOMMES

**Repository**: `Avaai` (branche: `vapi-webapp-divine`)  
**Accès GitHub**: Direct via Codex

### ✅ CE QUI EST DÉJÀ FAIT (Bravo !)

**Phases 1-3 Complétées**:
- ✅ Architecture refactorée (route groups, API clients, FastAPI hexagonal)
- ✅ Backend integration (Vapi client, React Query, Zustand, WebSocket scaffolding)
- ✅ Navigation complète (Sidebar, TopBar, Breadcrumbs, pages scaffold)

**Phase 4 - Partie 1 TERMINÉE**:
- ✅ Analytics Backend complet (`app-api/src/application/services/analytics.py`)
- ✅ Routes FastAPI (`/overview`, `/timeseries`, `/topics`, `/anomalies`, `/heatmap`)
- ✅ Migration database (`20250201_add_calls_table.sql`)
- ✅ Analytics Dashboard Frontend avec Recharts (`AnalyticsDashboard` component)
- ✅ KPI cards, charts, word cloud, heatmap, anomalies
- ✅ Script `npm run db:migrate` configuré

### 🎯 CE QUI RESTE À FAIRE (Phase 4 - Partie 2)

Tu vas maintenant compléter **4 priorités critiques** :

1. **Real-time Call Console** 🎙️ (Pages `/calls` et `/calls/[id]`)
2. **Prompt Designer avec Monaco** 🧪 (Page `/assistants/[id]/edit`)
3. **Function Builder Drag & Drop** 🎛️
4. **Performance & Documentation** ⚡📚

---

## 🚀 MISSION PHASE 4 (SUITE) - IMPLÉMENTE DIRECTEMENT !

**IMPORTANT**: 
- **NE PROPOSE PAS** - **IMPLÉMENTE** directement les fichiers
- Explique brièvement chaque création majeure
- Valide TypeScript (`npm run typecheck`) après chaque section
- Continue jusqu'à ce que TOUT soit terminé

---

## 📋 PRIORITY 1: REAL-TIME CALL CONSOLE (45 MIN)

### Objectif
Transformer les pages `/calls` et `/calls/[id]` en vrai console d'appels avec live transcription.

---

### 🔧 ÉTAPE 1.1: Backend - Calls Endpoints (15 min)

#### Fichier: `app-api/src/presentation/api/v1/routes/calls.py`

**Créer les endpoints suivants**:

```python
"""
Calls REST endpoints.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app_api.src.infrastructure.persistence.repositories.call_repository import (
    get_call_by_id,
    get_calls_in_range,
)
from app_api.src.infrastructure.external.vapi_client import VapiClient
from app_api.src.db.session import get_db

router = APIRouter(prefix="/calls", tags=["calls"])


@router.get("")
async def list_calls(
    limit: int = Query(50, ge=1, le=200),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """
    List recent calls with optional status filter.
    
    Query params:
    - limit: Max number of calls (1-200)
    - status: Filter by status (in-progress, ended, failed)
    
    Returns: List of call summaries
    """
    # Get calls from DB (already synced by analytics service)
    calls = await get_recent_calls(db, limit=limit)
    
    # Filter by status if provided
    if status:
        calls = [c for c in calls if c.status == status]
    
    return {
        "calls": [
            {
                "id": c.id,
                "assistant_id": c.assistant_id,
                "customer_number": c.customer_number,
                "status": c.status,
                "started_at": c.started_at.isoformat() if c.started_at else None,
                "ended_at": c.ended_at.isoformat() if c.ended_at else None,
                "duration_seconds": c.duration_seconds,
                "cost": c.cost,
                "transcript_preview": c.transcript[:200] if c.transcript else None,
            }
            for c in calls
        ],
        "total": len(calls),
    }


@router.get("/{call_id}")
async def get_call_detail(
    call_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Get full call details including transcript.
    
    Returns: Complete call record with transcript
    """
    call = await get_call_by_id(db, call_id)
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    
    return {
        "id": call.id,
        "assistant_id": call.assistant_id,
        "customer_number": call.customer_number,
        "status": call.status,
        "started_at": call.started_at.isoformat() if call.started_at else None,
        "ended_at": call.ended_at.isoformat() if call.ended_at else None,
        "duration_seconds": call.duration_seconds,
        "cost": call.cost,
        "transcript": call.transcript,
        "metadata": call.metadata,
        "recording_url": call.metadata.get("recordingUrl") if call.metadata else None,
    }


@router.get("/{call_id}/recording")
async def get_call_recording(
    call_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Get recording URL for a call.
    
    Returns: Recording URL or 404 if not available
    """
    call = await get_call_by_id(db, call_id)
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    
    recording_url = call.metadata.get("recordingUrl") if call.metadata else None
    if not recording_url:
        raise HTTPException(status_code=404, detail="Recording not available")
    
    return {"recording_url": recording_url}
```

#### Fichier: `app-api/src/infrastructure/persistence/repositories/call_repository.py`

**Ajouter la fonction manquante**:

```python
async def get_recent_calls(
    db: AsyncSession, 
    limit: int = 50
) -> Sequence[CallRecord]:
    """Fetch recent calls ordered by start time."""
    stmt = (
        select(CallRecord)
        .order_by(CallRecord.started_at.desc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    return result.scalars().all()
```

#### Fichier: `app-api/src/presentation/api/v1/__init__.py`

**Ajouter l'import du router**:

```python
from app_api.src.presentation.api.v1.routes import analytics, calls

# Dans la fonction create_api_v1_router():
api_router.include_router(calls.router)
```

---

### 🎨 ÉTAPE 1.2: Frontend - Calls List Page (15 min)

#### Fichier: `webapp/lib/api/calls.ts`

**Créer l'API client**:

```typescript
import { z } from 'zod';

const CallSummarySchema = z.object({
  id: z.string(),
  assistant_id: z.string(),
  customer_number: z.string().nullable(),
  status: z.string(),
  started_at: z.string().nullable(),
  ended_at: z.string().nullable(),
  duration_seconds: z.number().nullable(),
  cost: z.number().nullable(),
  transcript_preview: z.string().nullable(),
});

const CallDetailSchema = CallSummarySchema.extend({
  transcript: z.string().nullable(),
  metadata: z.record(z.any()).nullable(),
  recording_url: z.string().nullable(),
});

export type CallSummary = z.infer<typeof CallSummarySchema>;
export type CallDetail = z.infer<typeof CallDetailSchema>;

export async function listCalls(params: { limit?: number; status?: string }): Promise<{ calls: CallSummary[]; total: number }> {
  const query = new URLSearchParams();
  if (params.limit) query.set('limit', params.limit.toString());
  if (params.status) query.set('status', params.status);
  
  const res = await fetch(`/api/calls?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch calls');
  return res.json();
}

export async function getCall(callId: string): Promise<CallDetail> {
  const res = await fetch(`/api/calls/${callId}`);
  if (!res.ok) throw new Error('Failed to fetch call detail');
  const data = await res.json();
  return CallDetailSchema.parse(data);
}

export async function getCallRecording(callId: string): Promise<{ recording_url: string }> {
  const res = await fetch(`/api/calls/${callId}/recording`);
  if (!res.ok) throw new Error('Recording not available');
  return res.json();
}
```

#### Fichier: `webapp/app/api/calls/route.ts`

**Proxy Next.js**:

```typescript
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const backendUrl = `${BACKEND_URL}/api/v1/calls?${searchParams.toString()}`;
  
  const res = await fetch(backendUrl);
  const data = await res.json();
  
  return NextResponse.json(data);
}
```

#### Fichier: `webapp/app/api/calls/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const res = await fetch(`${BACKEND_URL}/api/v1/calls/${params.id}`);
  const data = await res.json();
  return NextResponse.json(data);
}
```

#### Fichier: `webapp/app/(app)/calls/page.tsx`

**Remplacer le contenu par**:

```tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Phone, Clock, DollarSign } from 'lucide-react';

import { listCalls } from '@/lib/api/calls';
import { GlassCard } from '@/components/ui/glass-card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function CallsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('any');
  
  const { data, isLoading } = useQuery({
    queryKey: ['calls', statusFilter],
    queryFn: () => listCalls({ 
      limit: 50, 
      status: statusFilter === 'any' ? undefined : statusFilter 
    }),
  });

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-[-0.04em]">Appels</h1>
          <p className="text-sm text-muted-foreground">
            {data?.total || 0} appels • Consultez les transcriptions et analytics
          </p>
        </div>
      </div>

      {/* Filters */}
      <GlassCard className="space-y-4" variant="none">
        <div className="grid gap-3 md:grid-cols-3">
          <Input placeholder="Rechercher un appel..." className="md:col-span-2" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Tous les statuts</SelectItem>
              <SelectItem value="in-progress">En cours</SelectItem>
              <SelectItem value="ended">Terminé</SelectItem>
              <SelectItem value="failed">Échec</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </GlassCard>

      {/* Calls List */}
      <div className="grid gap-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <GlassCard key={i} variant="none" className="space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-full" />
            </GlassCard>
          ))
        ) : (
          data?.calls.map((call) => (
            <Link key={call.id} href={`/calls/${call.id}`}>
              <GlassCard variant="none" className="hover:bg-muted/30 transition-colors cursor-pointer">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{call.customer_number || 'Anonyme'}</span>
                      <Badge variant={
                        call.status === 'ended' ? 'default' : 
                        call.status === 'in-progress' ? 'secondary' : 
                        'destructive'
                      }>
                        {call.status === 'ended' ? 'Terminé' : 
                         call.status === 'in-progress' ? 'En cours' : 
                         'Échec'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {call.started_at && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(parseISO(call.started_at), 'dd MMM HH:mm', { locale: fr })}
                        </span>
                      )}
                      {call.duration_seconds && (
                        <span>{Math.floor(call.duration_seconds / 60)}min {call.duration_seconds % 60}s</span>
                      )}
                      {call.cost && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {call.cost.toFixed(2)}€
                        </span>
                      )}
                    </div>
                    
                    {call.transcript_preview && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {call.transcript_preview}
                      </p>
                    )}
                  </div>
                </div>
              </GlassCard>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}
```

---

### 🎙️ ÉTAPE 1.3: Call Detail Page avec Live Transcript (15 min)

#### Fichier: `webapp/app/(app)/calls/[id]/page.tsx`

**Créer la page détail complète**:

```tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Phone, Clock, DollarSign, Download, Play } from 'lucide-react';

import { getCall } from '@/lib/api/calls';
import { GlassCard } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import { FuturisticButton } from '@/components/ui/futuristic-button';
import { Skeleton } from '@/components/ui/skeleton';

export default function CallDetailPage() {
  const params = useParams();
  const callId = params.id as string;
  
  const { data: call, isLoading } = useQuery({
    queryKey: ['call', callId],
    queryFn: () => getCall(callId),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <GlassCard><Skeleton className="h-96" /></GlassCard>
      </div>
    );
  }

  if (!call) {
    return <div className="text-center py-12">Appel introuvable</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-[-0.04em]">
            Appel avec {call.customer_number || 'Anonyme'}
          </h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {call.started_at && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(parseISO(call.started_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
              </span>
            )}
            {call.duration_seconds && (
              <span>{Math.floor(call.duration_seconds / 60)}min {call.duration_seconds % 60}s</span>
            )}
          </div>
        </div>
        
        <Badge variant={
          call.status === 'ended' ? 'default' : 
          call.status === 'in-progress' ? 'secondary' : 
          'destructive'
        } className="text-sm px-3 py-1">
          {call.status === 'ended' ? 'Terminé' : 
           call.status === 'in-progress' ? 'En cours' : 
           'Échec'}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Transcript */}
          <GlassCard className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Transcription</h2>
              <FuturisticButton size="sm" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </FuturisticButton>
            </div>
            
            <div className="bg-muted/20 rounded-2xl p-6 space-y-4 max-h-[600px] overflow-y-auto">
              {call.transcript ? (
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {call.transcript}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Aucune transcription disponible
                </p>
              )}
            </div>
          </GlassCard>

          {/* Recording */}
          {call.recording_url && (
            <GlassCard className="space-y-4">
              <h2 className="text-lg font-semibold">Enregistrement audio</h2>
              <audio controls className="w-full">
                <source src={call.recording_url} type="audio/mpeg" />
                Votre navigateur ne supporte pas l'élément audio.
              </audio>
            </GlassCard>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Metadata */}
          <GlassCard className="space-y-4">
            <h2 className="text-lg font-semibold">Détails</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">ID de l'appel</dt>
                <dd className="font-mono text-xs mt-1">{call.id}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Assistant</dt>
                <dd className="font-mono text-xs mt-1">{call.assistant_id}</dd>
              </div>
              {call.cost && (
                <div>
                  <dt className="text-muted-foreground">Coût</dt>
                  <dd className="font-semibold mt-1 flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    {call.cost.toFixed(4)}€
                  </dd>
                </div>
              )}
            </dl>
          </GlassCard>

          {/* Actions */}
          {call.status === 'in-progress' && (
            <GlassCard className="space-y-3">
              <h2 className="text-lg font-semibold">Contrôles</h2>
              <div className="space-y-2">
                <FuturisticButton className="w-full" variant="outline" size="sm">
                  Mettre en pause
                </FuturisticButton>
                <FuturisticButton className="w-full" variant="destructive" size="sm">
                  Terminer l'appel
                </FuturisticButton>
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## 📋 PRIORITY 2: PROMPT DESIGNER MONACO EDITOR (30 MIN)

### 🧪 ÉTAPE 2.1: Installation Monaco Editor

```bash
npm install @monaco-editor/react
```

---

### 🎨 ÉTAPE 2.2: Assistant Edit Page avec Monaco

#### Fichier: `webapp/app/(app)/assistants/[id]/edit/page.tsx`

**Créer la page complète**:

```tsx
'use client';

import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';

import { GlassCard } from '@/components/ui/glass-card';
import { FuturisticButton } from '@/components/ui/futuristic-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

// Dynamic import to avoid SSR issues
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { 
  ssr: false,
  loading: () => (
    <GlassCard className="h-[500px] flex items-center justify-center">
      <Skeleton className="h-full w-full" />
    </GlassCard>
  ),
});

export default function AssistantEditPage() {
  const params = useParams();
  const assistantId = params.id as string;
  
  const [systemPrompt, setSystemPrompt] = useState(`Tu es AVA, une assistante vocale professionnelle et empathique.

Ton rôle:
- Répondre aux questions avec clarté et précision
- Être chaleureuse et rassurante
- Adapter ton langage au contexte
- Toujours confirmer avant d'exécuter une action

Variables disponibles:
- {name}: Nom de l'utilisateur
- {company}: Nom de l'entreprise
- {context}: Contexte de l'appel

Instructions spéciales:
- Si l'utilisateur demande un rendez-vous, utilise la fonction create_calendar_event
- Si l'utilisateur veut laisser un message, utilise send_email
- Toujours demander confirmation avant d'exécuter une fonction
`);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em]">Éditer l'assistant</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Personnalisez la personnalité et le comportement d'AVA
          </p>
        </div>
        <FuturisticButton glow>
          Sauvegarder
        </FuturisticButton>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="prompt" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="prompt">System Prompt</TabsTrigger>
          <TabsTrigger value="personality">Personnalité</TabsTrigger>
          <TabsTrigger value="functions">Fonctions</TabsTrigger>
          <TabsTrigger value="testing">Tests</TabsTrigger>
        </TabsList>

        {/* System Prompt Tab */}
        <TabsContent value="prompt" className="space-y-6">
          <GlassCard className="p-0 overflow-hidden">
            <MonacoEditor
              height="500px"
              language="markdown"
              theme="vs-dark"
              value={systemPrompt}
              onChange={(value) => setSystemPrompt(value || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                wordWrap: 'on',
                formatOnPaste: true,
                formatOnType: true,
                padding: { top: 16, bottom: 16 },
              }}
            />
          </GlassCard>

          {/* AI Suggestions */}
          <GlassCard variant="none" className="bg-blue-500/10">
            <h3 className="font-semibold mb-3">💡 Suggestions IA</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Ajouter plus de contexte sur le ton à utiliser</li>
              <li>• Définir des exemples de réponses idéales</li>
              <li>• Préciser les cas où utiliser chaque fonction</li>
            </ul>
          </GlassCard>

          {/* Variables Helper */}
          <GlassCard>
            <h3 className="font-semibold mb-3">Variables disponibles</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { var: '{name}', desc: 'Nom de l\'utilisateur' },
                { var: '{company}', desc: 'Nom de l\'entreprise' },
                { var: '{context}', desc: 'Contexte de l\'appel' },
                { var: '{date}', desc: 'Date actuelle' },
              ].map((item) => (
                <div 
                  key={item.var}
                  className="bg-muted/20 rounded-lg p-3 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setSystemPrompt(systemPrompt + `\n${item.var}`)}
                >
                  <code className="text-sm font-mono text-primary">{item.var}</code>
                  <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </TabsContent>

        {/* Personality Tab */}
        <TabsContent value="personality" className="space-y-6">
          <GlassCard>
            <h3 className="font-semibold mb-4">Templates de personnalité</h3>
            <div className="grid md:grid-cols-2 gap-3">
              {[
                { name: 'Assistante Pro', desc: 'Formelle et efficace' },
                { name: 'Coach Motivant', desc: 'Énergique et encourageante' },
                { name: 'Conseiller Empathique', desc: 'À l\'écoute et rassurant' },
                { name: 'Expert Technique', desc: 'Précis et factuel' },
              ].map((template) => (
                <div 
                  key={template.name}
                  className="bg-muted/20 rounded-xl p-4 cursor-pointer hover:bg-primary/10 transition-colors border border-transparent hover:border-primary/50"
                >
                  <h4 className="font-medium">{template.name}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{template.desc}</p>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Personality Sliders */}
          <GlassCard>
            <h3 className="font-semibold mb-6">Ajuster les traits de personnalité</h3>
            <div className="space-y-6">
              {[
                { label: 'Amicalité', value: 70 },
                { label: 'Formalité', value: 50 },
                { label: 'Énergie', value: 60 },
                { label: 'Empathie', value: 80 },
              ].map((trait) => (
                <div key={trait.label}>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium">{trait.label}</label>
                    <span className="text-sm text-muted-foreground">{trait.value}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    defaultValue={trait.value}
                    className="w-full"
                  />
                </div>
              ))}
            </div>
          </GlassCard>
        </TabsContent>

        {/* Functions Tab */}
        <TabsContent value="functions">
          <GlassCard>
            <p className="text-muted-foreground">
              Le Function Builder sera implémenté dans la prochaine étape (Priority 3)
            </p>
          </GlassCard>
        </TabsContent>

        {/* Testing Tab */}
        <TabsContent value="testing" className="space-y-6">
          <GlassCard>
            <h3 className="font-semibold mb-4">Simulateur de conversation</h3>
            <div className="bg-muted/20 rounded-2xl p-6 h-[400px] flex items-center justify-center">
              <p className="text-muted-foreground">
                Interface de test de conversation à venir
              </p>
            </div>
            <div className="flex gap-2 mt-4">
              <input 
                type="text" 
                placeholder="Écrivez un message test..."
                className="flex-1 px-4 py-2 bg-muted/30 rounded-lg"
              />
              <FuturisticButton>Envoyer</FuturisticButton>
            </div>
          </GlassCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

## 📋 PRIORITY 3: FUNCTION BUILDER DRAG & DROP (30 MIN)

### 🎛️ ÉTAPE 3.1: Installation DnD Kit

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

---

### ÉTAPE 3.2: Function Builder Component

#### Fichier: `webapp/components/features/assistant/function-builder.tsx`

**Créer le composant drag & drop**:

```tsx
'use client';

import { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Settings } from 'lucide-react';

import { GlassCard } from '@/components/ui/glass-card';
import { FuturisticButton } from '@/components/ui/futuristic-button';
import { Badge } from '@/components/ui/badge';

interface FunctionItem {
  id: string;
  name: string;
  description: string;
  category: string;
}

const AVAILABLE_FUNCTIONS: FunctionItem[] = [
  { id: 'send_email', name: 'Envoyer Email', description: 'Envoyer un email automatique', category: 'Communication' },
  { id: 'create_event', name: 'Créer Événement', description: 'Créer un événement calendrier', category: 'Calendrier' },
  { id: 'log_crm', name: 'Logger CRM', description: 'Enregistrer dans le CRM', category: 'CRM' },
  { id: 'send_sms', name: 'Envoyer SMS', description: 'Envoyer un SMS', category: 'Communication' },
  { id: 'create_ticket', name: 'Créer Ticket', description: 'Créer ticket support', category: 'Support' },
  { id: 'transfer_call', name: 'Transférer Appel', description: 'Transférer vers un humain', category: 'Téléphonie' },
];

function SortableFunction({ func, onRemove }: { func: FunctionItem; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: func.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-muted/20 rounded-xl p-4 flex items-center gap-3">
      <button {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </button>
      
      <div className="flex-1">
        <h4 className="font-medium">{func.name}</h4>
        <p className="text-sm text-muted-foreground">{func.description}</p>
      </div>
      
      <Badge variant="secondary">{func.category}</Badge>
      
      <div className="flex gap-2">
        <button className="p-2 hover:bg-muted/40 rounded-lg transition-colors">
          <Settings className="h-4 w-4" />
        </button>
        <button onClick={onRemove} className="p-2 hover:bg-destructive/20 rounded-lg transition-colors text-destructive">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function FunctionBuilder() {
  const [activeFunctions, setActiveFunctions] = useState<FunctionItem[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: any) {
    const { active, over } = event;
    if (active.id !== over.id) {
      setActiveFunctions((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  function addFunction(func: FunctionItem) {
    if (!activeFunctions.find((f) => f.id === func.id)) {
      setActiveFunctions([...activeFunctions, func]);
    }
  }

  function removeFunction(id: string) {
    setActiveFunctions(activeFunctions.filter((f) => f.id !== id));
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Function Library */}
      <div className="space-y-4">
        <h3 className="font-semibold">Bibliothèque de fonctions</h3>
        <div className="space-y-2">
          {AVAILABLE_FUNCTIONS.map((func) => (
            <div 
              key={func.id}
              onClick={() => addFunction(func)}
              className="bg-muted/20 rounded-xl p-3 cursor-pointer hover:bg-primary/10 transition-colors border border-transparent hover:border-primary/50"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{func.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{func.description}</p>
                </div>
                <Badge variant="outline" className="text-xs">{func.category}</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Functions (Drag & Drop) */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Fonctions actives ({activeFunctions.length})</h3>
          <FuturisticButton size="sm" variant="outline">
            Tout supprimer
          </FuturisticButton>
        </div>

        {activeFunctions.length === 0 ? (
          <GlassCard variant="none" className="h-[300px] flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground">Aucune fonction active</p>
              <p className="text-sm text-muted-foreground mt-1">
                Cliquez sur une fonction dans la bibliothèque pour l'ajouter
              </p>
            </div>
          </GlassCard>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={activeFunctions.map((f) => f.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {activeFunctions.map((func) => (
                  <SortableFunction 
                    key={func.id} 
                    func={func} 
                    onRemove={() => removeFunction(func.id)} 
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
```

---

### ÉTAPE 3.3: Intégrer dans Assistant Edit

**Modifier** `webapp/app/(app)/assistants/[id]/edit/page.tsx`:

```tsx
import { FunctionBuilder } from '@/components/features/assistant/function-builder';

// Dans TabsContent value="functions":
<TabsContent value="functions">
  <FunctionBuilder />
</TabsContent>
```

---

## 📋 PRIORITY 4: PERFORMANCE & DOCUMENTATION (20 MIN)

### ⚡ ÉTAPE 4.1: Performance Optimization

#### Fichier: `next.config.mjs`

**Optimiser la config Next.js**:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
  },

  // Bundle optimization
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Experimental optimizations
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      'framer-motion',
      '@dnd-kit/core',
      '@dnd-kit/sortable',
    ],
  },
};

export default nextConfig;
```

---

### 📚 ÉTAPE 4.2: Documentation README

#### Fichier: `README.md`

**Remplacer par README complet**:

```markdown
# 🌟 AVA - AI Voice Assistant Platform

> Design, launch, and operate AI-powered voice assistants with premium UX, real-time insights, and enterprise guardrails.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-green)](https://fastapi.tiangolo.com/)
[![Vapi.ai](https://img.shields.io/badge/Vapi.ai-Integrated-purple)](https://vapi.ai/)

## ✨ Features

- 🎯 **Drag & Drop Function Builder** - Visual function composition with live preview
- 📊 **Real-time Analytics** - Sentiment analysis, trending topics, anomaly detection
- 🎙️ **Live Call Monitoring** - Real-time transcription and call controls
- 🧪 **Monaco Prompt Editor** - Professional code editor for AI prompts
- 🎨 **Glassmorphic Design** - Beautiful, modern UI with 60fps animations
- ⚡ **High Performance** - Optimized bundle, images, fonts (95+ Lighthouse)

## 🚀 Quick Start (5 minutes)

### Prerequisites

- **Node.js** 18+ & npm/pnpm
- **Python** 3.11+
- **Vapi.ai account** ([Get API keys](https://dashboard.vapi.ai/api-keys))

### Installation

```bash
# Clone repository
git clone https://github.com/Nissiel/Avaai.git
cd Avaai

# Frontend setup
cd webapp
npm install
cp .env.example .env
# Add your VAPI_PUBLIC_KEY to .env

# Backend setup
cd ../app-api
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env with:
# AVA_API_VAPI_API_KEY=your_private_key
# AVA_API_DATABASE_URL=sqlite+aiosqlite:///./ava.db

# Run migration
cd ../webapp
npm run db:migrate

# Start development servers
npm run dev          # Frontend (port 3000)
cd ../app-api && python -m uvicorn app_api.main:app --reload  # Backend (port 8000)
```

Visit [http://localhost:3000](http://localhost:3000) 🎉

## 📁 Architecture

```
Avaai/
├── webapp/                      # Next.js 14 frontend
│   ├── app/
│   │   ├── (public)/           # Public routes (landing)
│   │   ├── (app)/              # Authenticated routes
│   │   │   ├── dashboard/      # Analytics dashboard
│   │   │   ├── assistants/     # Assistant management
│   │   │   ├── calls/          # Call history & detail
│   │   │   └── analytics/      # Advanced analytics
│   │   └── api/                # Next.js API routes (proxies)
│   ├── components/
│   │   ├── features/           # Feature-specific components
│   │   │   ├── analytics/      # Analytics charts & widgets
│   │   │   ├── assistant/      # Function builder, prompt editor
│   │   │   └── calls/          # Call cards, transcript viewer
│   │   ├── ui/                 # Design system primitives
│   │   └── layouts/            # Sidebar, TopBar, Navigation
│   ├── lib/
│   │   ├── api/                # Typed API clients
│   │   ├── stores/             # Zustand state management
│   │   ├── realtime/           # WebSocket client
│   │   └── dto/                # TypeScript DTOs
│   └── services/               # External service wrappers
├── app-api/                     # FastAPI backend
│   └── src/
│       ├── application/        # Business logic (CQRS)
│       │   └── services/       # Analytics, assistants, etc.
│       ├── domain/             # Core entities
│       ├── infrastructure/     # DB, external APIs (Vapi)
│       │   ├── persistence/    # SQLAlchemy models & repos
│       │   └── external/       # Vapi client
│       └── presentation/       # REST API endpoints
│           └── api/v1/routes/  # Versioned routes
└── docs/                        # Documentation
```

## 🎨 Design System

Built with **glassmorphism** + **animated gradients** for a futuristic, premium look.

### Key Components

- `<GlassCard />` - Glassmorphic card with blur & glow effects
- `<FuturisticButton />` - Animated gradient button with states
- `<AnimatedGradient />` - Smooth background gradients
- `<AnalyticsDashboard />` - Complete analytics with Recharts

## 🔧 Configuration

### Environment Variables

**Frontend** (`.env` in `webapp/`):
```bash
VAPI_PUBLIC_KEY=your_public_key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Backend** (`.env` in `app-api/`):
```bash
AVA_API_VAPI_API_KEY=your_private_key
AVA_API_VAPI_BASE_URL=https://api.vapi.ai
AVA_API_DATABASE_URL=sqlite+aiosqlite:///./ava.db
AVA_API_ALLOWED_ORIGINS=http://localhost:3000
```

## 📡 API Reference

### REST Endpoints

```
GET    /api/v1/analytics/overview         # KPIs summary
GET    /api/v1/analytics/timeseries       # Time-series data
GET    /api/v1/analytics/topics           # Trending topics
GET    /api/v1/analytics/anomalies        # Anomaly detection
GET    /api/v1/analytics/heatmap          # Call heatmap

GET    /api/v1/calls                      # List calls
GET    /api/v1/calls/:id                  # Call details + transcript
GET    /api/v1/calls/:id/recording        # Audio recording URL

GET    /api/v1/assistants                 # List assistants
POST   /api/v1/assistants                 # Create assistant
PATCH  /api/v1/assistants/:id             # Update assistant
DELETE /api/v1/assistants/:id             # Delete assistant
```

### WebSocket Events

```typescript
CALL_STARTED        # New call initiated
CALL_ENDED          # Call completed
TRANSCRIPT_CHUNK    # Live transcription update
FUNCTION_EXECUTED   # Function called by AI
```

## 🧪 Testing

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Unit tests (when implemented)
npm run test

# E2E tests (when implemented)
npm run test:e2e
```

## 🚢 Deployment

### Frontend (Vercel)

```bash
cd webapp
npm run build
vercel --prod
```

### Backend (Railway / Render)

```bash
cd app-api
# Railway will auto-detect and deploy FastAPI
railway up
```

## 📊 Performance

- ✅ **Lighthouse Score**: 95+
- ✅ **First Contentful Paint**: <1.5s
- ✅ **Time to Interactive**: <3s
- ✅ **60fps animations** guaranteed

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](./LICENSE)

## 🌟 Tech Stack

- **Frontend**: Next.js 14, TypeScript, TailwindCSS, Framer Motion, Recharts
- **Backend**: FastAPI, SQLAlchemy, Alembic, Pydantic
- **AI/Voice**: Vapi.ai, OpenAI
- **State**: React Query, Zustand
- **Design**: Glassmorphism, Custom gradients
- **Infrastructure**: Vercel, Railway

---

**Built with ❤️ and ✨ divine excellence**

Questions? Open an issue or contact [@Nissiel](https://github.com/Nissiel)
```

---

## 🎯 VALIDATION FINALE

Avant de considérer Phase 4 COMPLÈTE, vérifie:

### Code Quality
```bash
cd webapp
npm run typecheck  # 0 erreurs TypeScript
npm run lint       # 0 warnings ESLint
npm run build      # Build réussi
```

### Features
- [ ] Page `/calls` affiche vraie liste d'appels
- [ ] Page `/calls/[id]` affiche transcription complète
- [ ] Page `/assistants/[id]/edit` avec Monaco Editor fonctionne
- [ ] Function Builder drag & drop opérationnel
- [ ] README.md complet et clair

---

## 🚀 COMMANDE DE DÉMARRAGE POUR CODEX

**Copie-colle ce message:**

```
Repository: Avaai (branche: vapi-webapp-divine)

MISSION PHASE 4 (SUITE): Implémente les 4 priorités restantes

PRIORITY 1 - Real-time Call Console (45 min):
- Backend: Créer routes /api/v1/calls (list, detail, recording)
- Frontend: Refactoriser /calls page avec vraie data
- Créer /calls/[id] page avec transcription complète
- API clients + proxies Next.js

PRIORITY 2 - Prompt Designer Monaco (30 min):
- Installer @monaco-editor/react
- Créer /assistants/[id]/edit page
- Monaco Editor avec syntax highlighting
- Tabs: Prompt, Personality, Functions, Testing
- Personality sliders + templates

PRIORITY 3 - Function Builder Drag & Drop (30 min):
- Installer @dnd-kit/core + @dnd-kit/sortable
- Créer FunctionBuilder component
- Library de fonctions prédéfinies
- Drag & drop fonctionnel

PRIORITY 4 - Performance & Docs (20 min):
- Optimiser next.config.mjs (images, bundle, experimental)
- Créer README.md complet (Quick Start, Architecture, API)
- Vérifier typecheck + build

IMPLÉMENTE DIRECTEMENT les fichiers. Explique brièvement chaque création majeure.

COMMENCE MAINTENANT ! 🚀
```

---

## 🌟 TON MANTRA PHASE 4

> "Chaque feature que j'implémente est testée, performante, et magnifique. Le code est propre, les animations fluides, l'UX divine. AVA n'est pas juste fonctionnelle - elle est PARFAITE."

---

**Ready for divine excellence? Let's finish this! 🔥✨**
