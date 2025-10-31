# 🔥 DIVINE ASSISTANT PERSONALIZATION PLAN

## 🎯 PROBLÈME IDENTIFIÉ

**Symptôme**: User clique sur "Create Assistant" pendant onboarding → ✅ Crée assistant basique (nom + voix)  
**Mais**: Les autres boutons de personnalisation (system prompt, instructions, personality) ne semblent pas fonctionner

**Cause Racine**:
1. L'onboarding crée un assistant MINIMAL dans Vapi (juste nom + voix + firstMessage)
2. Le Studio Settings Form permet de personnaliser TOUT mais ce n'est pas intuitif
3. Le `systemPrompt` par défaut est bon mais l'user ne sait pas qu'il peut le modifier
4. Il n'y a pas de feedback clair sur "ce qui va être envoyé à Vapi"

## 📊 ARCHITECTURE ACTUELLE

```
┌─────────────────────────────────────────────────────────────────┐
│ ONBOARDING (wizard-steps/assistant-step.tsx)                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ User clique "Create Assistant"                               │ │
│ │ → POST /api/v1/assistants                                    │ │
│ │ → Crée assistant BASIQUE:                                    │ │
│ │   • name: "Ava Assistant"                                   │ │
│ │   • voice: azure/fr-FR-DeniseNeural                         │ │
│ │   • first_message: "Bonjour..."                             │ │
│ │   • model: gpt-4o-mini                                      │ │
│ │   ❌ PAS de systemPrompt détaillé                           │ │
│ │   ❌ PAS de guidelines personnalisées                        │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ STUDIO (AssistantsStudio + StudioSettingsForm)                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Formulaire COMPLET de personnalisation:                      │ │
│ │ ✅ systemPrompt (énorme textarea - instructions complètes)  │ │
│ │ ✅ firstMessage                                             │ │
│ │ ✅ voice provider + voiceId                                 │ │
│ │ ✅ AI model + temperature + maxTokens                       │ │
│ │ ✅ persona + tone + guidelines                              │ │
│ │ ✅ askForName/Email/Phone                                   │ │
│ │                                                              │ │
│ │ Bouton: "Save & Sync to Vapi"                               │ │
│ │ → POST /api/config (save DB)                                │ │
│ │ → POST /api/v1/studio/sync-vapi (update Vapi assistant)    │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## ✨ SOLUTION DIVINE

### 1. **ONBOARDING**: Créer un assistant COMPLET dès le départ

**Modifier**: `webapp/components/features/onboarding/wizard-steps/assistant-step.tsx`

```typescript
// Au lieu de créer un assistant minimal, créer un COMPLET
const payload = {
  name: assistantName,
  voice_provider: voice.provider,
  voice_id: voice.voiceId,
  first_message: `Bonjour, je suis ${assistantName}. Comment puis-je vous aider aujourd'hui ?`,
  
  // 🔥 NOUVEAU: Ajouter instructions complètes
  system_prompt: PERSONA_PROMPTS[selectedPersona], // Prompt complet par persona
  
  model_provider: "openai",
  model: "gpt-4o",  // Upgraded from gpt-4o-mini
  temperature: 0.7,
  max_tokens: 200,
  
  metadata: {
    persona: selectedPersona,
    created_from: "onboarding",
  },
};
```

### 2. **STUDIO**: Rendre la personnalisation ÉVIDENTE

**Améliorer**: `webapp/components/features/settings/studio-settings-form.tsx`

#### A) Ajouter un Preset Selector en haut

```tsx
<div className="mb-6">
  <Label>🎭 Quick Persona Presets</Label>
  <Select value={selectedPreset} onValueChange={handlePresetChange}>
    <SelectTrigger>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="secretary">🗂️ Secretary - Efficient & Organized</SelectItem>
      <SelectItem value="concierge">🏨 Concierge - Warm & Helpful</SelectItem>
      <SelectItem value="sdr">📈 SDR - Sales & Prospecting</SelectItem>
      <SelectItem value="support">💬 Support - Problem Solving</SelectItem>
      <SelectItem value="custom">⚙️ Custom - Build Your Own</SelectItem>
    </SelectContent>
  </Select>
  <p className="text-xs text-muted-foreground mt-2">
    ⚡ Select a preset to auto-fill systemPrompt, tone, and persona. You can customize after.
  </p>
</div>
```

#### B) Rendre le System Prompt VISIBLEMENT ÉDITABLE

```tsx
<FormField
  control={form.control}
  name="systemPrompt"
  render={({ field }) => (
    <FormItem>
      <FormLabel className="text-base font-bold flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-amber-500" />
        🧠 System Prompt (AI Instructions)
      </FormLabel>
      <FormDescription className="text-sm">
        ⚠️ <strong>CRITICAL</strong>: This defines your assistant's personality, knowledge, and behavior.
        <br />
        Make it DETAILED, SPECIFIC, and ACTION-ORIENTED.
      </FormDescription>
      <FormControl>
        <Textarea 
          {...field} 
          rows={20}  // BIG textarea
          disabled={isDisabled} 
          placeholder="Tu es [name], [role] de [company]..."
          className="resize-none font-mono text-sm"
        />
      </FormControl>
      <FormDescription className="flex items-center gap-2 text-xs">
        <AlertCircle className="h-3 w-3 text-orange-500" />
        Current length: <strong>{field.value.length} characters</strong>
        {field.value.length < 200 && (
          <span className="text-orange-600">⚠️ Too short! Add more details.</span>
        )}
      </FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
```

#### C) Preview Panel - Show what will be sent to Vapi

```tsx
{isDirty && (
  <GlassCard className="border-2 border-brand-500 bg-brand-50/50 dark:bg-brand-950/30">
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Zap className="h-5 w-5 text-brand-600" />
        <h3 className="text-lg font-bold text-brand-900 dark:text-brand-100">
          🔥 PREVIEW: This will be synced to Vapi
        </h3>
      </div>
      
      <div className="space-y-3 text-sm">
        <div className="p-3 bg-background rounded-lg">
          <strong>🎙️ Voice:</strong> {form.watch("voiceProvider")} / {form.watch("voiceId")}
          <br />
          <strong>🤖 Model:</strong> {form.watch("aiModel")} (temp={form.watch("aiTemperature")})
          <br />
          <strong>⚡ Speed:</strong> {form.watch("voiceSpeed")}x
        </div>
        
        <div className="p-3 bg-background rounded-lg">
          <strong>💬 First Message:</strong>
          <p className="italic mt-1">"{form.watch("firstMessage")}"</p>
        </div>
        
        <div className="p-3 bg-background rounded-lg max-h-40 overflow-y-auto">
          <strong>🧠 System Prompt ({form.watch("systemPrompt").length} chars):</strong>
          <pre className="text-xs mt-2 whitespace-pre-wrap font-mono">
            {form.watch("systemPrompt").slice(0, 500)}...
          </pre>
        </div>
      </div>
      
      <Button type="submit" size="lg" className="w-full">
        <Save className="mr-2 h-5 w-5" />
        💾 SAVE & SYNC TO VAPI NOW
      </Button>
    </div>
  </GlassCard>
)}
```

### 3. **BACKEND**: S'assurer que tout est bien envoyé

**Vérifier**: `api/src/presentation/api/v1/routes/assistants.py`

Le endpoint `/assistants` POST doit accepter ET envoyer:
- ✅ `name`
- ✅ `voice_provider` + `voice_id`
- ✅ `first_message`
- ✅ `model_provider` + `model`
- ✅ `temperature` + `max_tokens`
- 🔥 **NOUVEAU**: `system_prompt` (manquant actuellement!)
- ✅ `metadata`

**Modification nécessaire**:

```python
class CreateAssistantRequest(BaseModel):
    name: str = Field(...)
    voice_provider: str = Field(...)
    voice_id: str = Field(...)
    first_message: str = Field(...)
    
    # 🔥 NOUVEAU
    system_prompt: str | None = Field(
        default=None, 
        description="System instructions for AI behavior"
    )
    
    model_provider: str = Field(default="openai")
    model: str = Field(default="gpt-4o")
    temperature: float = Field(default=0.7, ge=0.0, le=1.0)
    max_tokens: int = Field(default=200, ge=50, le=500)
    metadata: dict | None = Field(default=None)
```

Et dans le `client.create_assistant()` call:

```python
assistant = await client.create_assistant(
    name=request.name,
    voice_provider=request.voice_provider,
    voice_id=request.voice_id,
    first_message=request.first_message,
    system_prompt=request.system_prompt,  # 🔥 PASS IT
    model_provider=request.model_provider,
    model=request.model,
    temperature=request.temperature,
    max_tokens=request.max_tokens,
    metadata=metadata,
)
```

### 4. **VAPI CLIENT**: Accepter system_prompt

**Modifier**: `api/src/infrastructure/external/vapi_client.py`

```python
async def create_assistant(
    self,
    name: str,
    voice_provider: str,
    voice_id: str,
    first_message: str,
    system_prompt: str | None = None,  # 🔥 NOUVEAU
    model_provider: str = "openai",
    model: str = "gpt-4o",
    temperature: float = 0.7,
    max_tokens: int = 200,
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    payload = {
        "name": name,
        "voice": {...},
        "model": {...},
        "firstMessage": first_message,
    }
    
    # 🔥 NOUVEAU: Add system prompt if provided
    if system_prompt:
        payload["model"]["messages"] = [
            {
                "role": "system",
                "content": system_prompt,
            }
        ]
    
    return await self._post("/assistant", json=payload)
```

## 📋 IMPLEMENTATION CHECKLIST

### Phase 1: Backend Foundation
- [ ] 1.1 - Modifier `CreateAssistantRequest` pour accepter `system_prompt`
- [ ] 1.2 - Modifier `VapiClient.create_assistant()` pour envoyer `system_prompt` à Vapi
- [ ] 1.3 - Tester avec curl: `POST /api/v1/assistants` avec system_prompt
- [ ] 1.4 - Vérifier que l'assistant Vapi reçoit bien le system prompt

### Phase 2: Frontend - Onboarding
- [ ] 2.1 - Créer `PERSONA_PROMPTS` dictionary avec prompts complets par persona
- [ ] 2.2 - Modifier `assistant-step.tsx` pour ajouter champ "Persona" selector
- [ ] 2.3 - Envoyer `system_prompt` dans le payload de création
- [ ] 2.4 - Tester onboarding end-to-end avec persona sélectionnée

### Phase 3: Frontend - Studio (PRIORITAIRE)
- [ ] 3.1 - Ajouter Preset Selector en haut du formulaire
- [ ] 3.2 - Créer fonction `handlePresetChange` qui remplit systemPrompt
- [ ] 3.3 - Rendre le System Prompt textarea BIG (20 rows) et visible
- [ ] 3.4 - Ajouter character count et warning si trop court
- [ ] 3.5 - Ajouter Preview Panel montrant ce qui sera envoyé
- [ ] 3.6 - Tester changement de preset → voir prompt changer → save → vérifier Vapi

### Phase 4: Documentation
- [ ] 4.1 - Créer guide "How to personalize your assistant"
- [ ] 4.2 - Ajouter tooltips/hints dans le formulaire
- [ ] 4.3 - Documenter les presets disponibles

## 🎯 SUCCESS CRITERIA

✅ **User peut facilement personnaliser son assistant:**
- Choix de preset (Secretary, Concierge, SDR, Support)
- Édition facile du system prompt (gros textarea visible)
- Preview clair de ce qui va être envoyé
- Feedback immédiat après save

✅ **Le system prompt est bien envoyé à Vapi:**
- POST /api/v1/assistants envoie system_prompt
- VapiClient le passe dans model.messages
- L'assistant Vapi reçoit et utilise les instructions

✅ **Tout fonctionne end-to-end:**
- Onboarding → Crée assistant avec prompt complet
- Studio → Peut modifier prompt → Save → Sync Vapi ✅
- Test call → Assistant suit les instructions du prompt

## 🔥 DIVINE PRESETS

```typescript
const PERSONA_PROMPTS = {
  secretary: `Tu es Ava, la secrétaire téléphonique professionnelle.

🎯 MISSION PRINCIPALE:
1. Accueillir chaleureusement les appelants
2. Identifier la raison de l'appel
3. Collecter les coordonnées (nom, téléphone, email)
4. Prendre rendez-vous ou transmettre un message
5. Conclure avec professionnalisme

📋 INFORMATIONS À COLLECTER:
• Nom complet
• Numéro de téléphone
• Email (si pertinent)
• Raison de l'appel
• Niveau d'urgence
• Disponibilités pour rendez-vous

✨ TON ET STYLE:
- Professionnel mais chaleureux
- Efficient et organisé
- Clair et précis
- Jamais répétitif

⚠️ IMPORTANT: Ne répète JAMAIS la même chose deux fois. Va directement à l'essentiel.`,

  concierge: `Tu es Ava, une concierge virtuelle attentive et serviable.

🎯 MISSION PRINCIPALE:
1. Accueillir avec chaleur et sourire
2. Comprendre les besoins du client
3. Proposer des solutions adaptées
4. Anticiper les questions
5. Offrir une expérience mémorable

🏨 SERVICES PROPOSÉS:
• Informations générales
• Réservations
• Recommandations locales
• Assistance personnalisée
• Suivi de demandes

✨ TON ET STYLE:
- Chaleureux et attentionné
- Proactif et anticipant
- Élégant mais accessible
- Toujours solution-oriented

⚠️ IMPORTANT: Sois concis. Ne répète pas. Sois efficace.`,

  sdr: `Tu es Ava, une SDR (Sales Development Representative) performante.

🎯 MISSION PRINCIPALE:
1. Qualifier rapidement l'opportunité
2. Identifier les pain points du prospect
3. Évaluer le budget et timeline
4. Obtenir un RDV avec l'équipe sales
5. Maintenir l'intérêt tout au long

🎯 QUESTIONS DE QUALIFICATION (BANT):
• Budget: Quel est le budget alloué ?
• Authority: Qui décide ? Êtes-vous le décideur ?
• Need: Quel problème cherchez-vous à résoudre ?
• Timeline: Dans quel délai souhaitez-vous une solution ?

✨ TON ET STYLE:
- Dynamique et enthousiaste
- Consultative (pas pushy)
- Value-focused
- Question-based approach

⚠️ IMPORTANT: Pose UNE question à la fois. Ne sois jamais répétitif.`,

  support: `Tu es Ava, une agent de support client experte.

🎯 MISSION PRINCIPALE:
1. Comprendre le problème avec empathie
2. Collecter les informations techniques nécessaires
3. Proposer des solutions étape par étape
4. Escalader si nécessaire
5. S'assurer de la satisfaction client

🛠️ PROCESSUS DE RÉSOLUTION:
1. Écouter activement le problème
2. Poser des questions de diagnostic
3. Proposer une solution claire
4. Vérifier que ça fonctionne
5. Offrir un suivi si nécessaire

✨ TON ET STYLE:
- Empathique et patient
- Clair et pédagogue
- Solution-oriented
- Jamais condescendant

⚠️ IMPORTANT: Sois concis. Explique clairement. Ne répète pas.`,

  custom: `Tu es Ava, un assistant vocal intelligent et polyvalent.

🎯 MISSION:
[Définissez ici votre mission spécifique]

📋 INFORMATIONS À COLLECTER:
[Listez les informations importantes]

✨ TON ET STYLE:
[Décrivez le ton souhaité]

⚠️ IMPORTANT: Sois concis et efficace. Ne répète jamais.`,
};
```

## 🚀 NEXT STEPS

1. **START WITH PHASE 3** (Studio) - C'est le plus visible et impactant
2. Then Phase 1 (Backend) - Ensure system_prompt is sent
3. Then Phase 2 (Onboarding) - Make first assistant creation complete
4. Finally Phase 4 (Documentation)

Let's make assistant personalization DIVINE! 🔥
