# 📋 PLAN D'IMPLÉMENTATION AVA - DIVINE & CONCRET

> **Objectif** : Transformer AVA en une app concrète, fluide et intuitive avec login personnalisé et onboarding ultra-optimisé

---

## 🎯 VISION PRODUIT

**AVA** = Réceptionniste IA pour TPE/PME/Indépendants  
**Promesse** : Remplacer le standard téléphonique, automatiser RDV, gérer SAV client  
**Différenciation** : "Vapi is an API. AVA is your receptionist."

---

## 🏗️ ARCHITECTURE ACTUELLE (Ce qu'on a déjà)

### ✅ Backend (FastAPI + SQLAlchemy)
- **Database** : SQLite (dev), PostgreSQL (prod)
- **Auth** : Pas encore implémenté (TODO)
- **API** : Routes pour calls, analytics, AVA profiles
- **Intégrations** : Vapi.ai configuré, Twilio setup partiel

### ✅ Frontend (Next.js 14 + TypeScript)
- **Database** : Prisma avec schema complet
  - Models : `User`, `Org`, `OrgUser`, `Ava`, `PhoneNumber`, `Call`, `Integration`, `PlanSubscription`
  - User : `email`, `name`, `locale`, `twoFAEnabled`
- **Auth UI** : Composant `SignInForm` avec magic link + OAuth (Google/Microsoft)
- **Onboarding** : Dossier vide (`/app/onboarding/`)
- **Intégrations** : 
  - Vapi SDK client (`lib/vapi/client.ts`)
  - Twilio client (`lib/twilio.ts`)

---

## 🚀 CE QU'ON VA CONSTRUIRE

### 1️⃣ **SYSTÈME D'AUTHENTIFICATION COMPLET**

#### A. Page de Login (`/login`)
```typescript
// Fonctionnalités
- Login avec EMAIL ou NUMÉRO DE TÉLÉPHONE
- Option 1 : Magic Link (email)
- Option 2 : Password (pour les 2)
- Option 3 : OAuth (Google/Microsoft)
- "Remember me" checkbox
- Validation en temps réel
- Messages d'erreur clairs
```

**User Flow Login** :
```
1. User entre email OU phone number
2. Système détecte le format (email vs phone)
3. Options proposées selon le format :
   - Email → Magic Link OU Password
   - Phone → SMS code OU Password
4. User choisit méthode
5. Validation et redirection vers /onboarding (première connexion) OU /dashboard
```

**Implémentation** :
- Fichier : `/webapp/app/(public)/[locale]/(auth)/login/page.tsx`
- Composant : `/webapp/components/auth/login-form.tsx`
- Backend : `/api/src/presentation/api/v1/routes/auth.py`
- Database : Ajouter `phone` field dans `User` model (Prisma + SQLAlchemy)

#### B. Page de Signup (`/signup`)
```typescript
// Champs du formulaire
- Email (required)
- Phone number (optional mais recommandé)
- Name (required)
- Password (required)
- Confirm password (required)
- Acceptation CGU/Privacy (required)
- Newsletter opt-in (optional)
```

**User Flow Signup** :
```
1. User remplit formulaire
2. Validation côté client (Zod schema)
3. POST /api/v1/auth/signup
4. Backend crée User + Org (automatique)
5. Email de vérification envoyé
6. Redirection vers /onboarding
```

---

### 2️⃣ **ONBOARDING WIZARD OPTIMISÉ (5 ÉTAPES MAX)**

**Objectif** : Time-to-First-Call < 10 minutes

#### Étape 1 : 👋 Welcome
```typescript
// Content
- Animation de bienvenue
- "Bonjour {name}, configurons votre réceptionniste IA en 5 minutes"
- Prévisualisation du résultat final (screenshot dashboard)
- CTA : "Commencer" → Go to Step 2
```

#### Étape 2 : 📞 Phone Number Setup (CRITIQUE)

**IMPORTANT** : Vapi ne fournit de numéros gratuits QUE pour les US. Pour FR/IL et international, import Twilio obligatoire.

```typescript
// Détection automatique du pays user (basé sur locale ou IP)
const userCountry = detectUserCountry(); // "FR", "IL", "US", etc.

// Options proposées selon le pays
if (userCountry === "US") {
  // OPTION A : Numéro gratuit Vapi (1 clic)
  Option A : "Obtenir un numéro US gratuit" (Recommandé - USA uniquement)
    → Via Vapi /phone-numbers endpoint
    → Gratuit (max 10 numéros par compte)
    → Preview du numéro avant création
    → Setup automatique avec AVA
    
  // OPTION B : Import Twilio (pour plus de contrôle)
  Option B : "Importer mon numéro Twilio"
    → Guide ci-dessous
    
} else {
  // FRANCE, ISRAËL, INTERNATIONAL : Twilio obligatoire
  Option A : "Configurer avec Twilio" (Obligatoire pour {country})
    → Guide step-by-step détaillé :
       1. Créez un compte sur twilio.com/try-twilio
       2. Achetez un numéro {country} (Phone Numbers → Buy a Number)
          - France : ~1€/mois
          - Israël : ~1.5$/mois
          - Voice capability required
       3. Copiez votre Account SID
       4. Copiez votre Auth Token  
       5. Copiez le numéro acheté
       6. Collez ici ⬇️
    → AVA va :
       ✓ Tester la connexion Twilio
       ✓ Importer le numéro dans Vapi (/phone-numbers/import)
       ✓ Configurer le webhook automatiquement
       ✓ Lier le numéro à votre assistant AVA
}

Option C : "Je configure plus tard" (Skip)
  → Warning : "Vous ne pourrez pas recevoir d'appels"
  → Permet de tester l'interface
```

**IMPLÉMENTATION TECHNIQUE - OPTION A (VAPI - US UNIQUEMENT)**

⚠️ **Limitation** : Vapi ne fournit des numéros gratuits QUE pour les États-Unis.

```typescript
// Frontend : /webapp/components/onboarding/phone-setup-vapi.tsx
import { vapi } from '@/lib/vapi/client';

async function createFreeUSNumber(areaCode: string, orgId: string) {
  try {
    // ⚠️ Gratuit uniquement pour US, max 10 numéros par compte
    
    // 1. Create a free US number via Vapi
    const created = await vapi.phoneNumbers.create({
      // Vapi assigne automatiquement un numéro US disponible
      assistantId: avaAssistantId // Auto-link à AVA
    });
    
    // 2. Save to database
    await fetch('/api/phone-numbers', {
      method: 'POST',
      body: JSON.stringify({
        orgId,
        provider: 'VAPI',
        e164: created.number, // Format E.164 : +1234567890
        vapiPhoneNumberId: created.id,
        assistantId: avaAssistantId
      })
    });
    
    return created;
  } catch (error) {
    if (error.message.includes('limit reached')) {
      // User a déjà 10 numéros gratuits
      throw new Error('Limite de 10 numéros gratuits atteinte. Utilisez Twilio pour plus de numéros.');
    }
    throw error;
  }
}
```

**Backend API** :
```python
# /api/src/presentation/api/v1/routes/phone_numbers.py
from fastapi import APIRouter, Depends, HTTPException
from api.src.infrastructure.vapi.client import VapiClient

router = APIRouter(prefix="/phone-numbers", tags=["phone"])

@router.post("/create-us")
async def create_free_us_number(
    assistant_id: str,
    org_id: str,
    user=Depends(get_current_user)
):
    """Crée un numéro US gratuit via Vapi (max 10 par compte)"""
    vapi = VapiClient()
    
    try:
        # Create via Vapi (US only, free, max 10)
        created = await vapi.create_phone_number(
            assistant_id=assistant_id
        )
        
        # Save to our DB
        phone = PhoneNumber(
            org_id=org_id,
            provider="VAPI",
            e164=created["number"],
            vapi_phone_number_id=created["id"],
            routing={"assistant_id": assistant_id}
        )
        db.add(phone)
        await db.commit()
        
        return {"success": True, "phone": phone}
    except Exception as e:
        if "limit" in str(e).lower():
            raise HTTPException(
                status_code=400,
                detail="Limite de 10 numéros gratuits atteinte. Utilisez l'import Twilio."
            )
        raise
```

**IMPLÉMENTATION TECHNIQUE - OPTION B (TWILIO + VAPI IMPORT)**

✅ **Solution pour France, Israël et tous les pays hors US**

Workflow :
1. User achète un numéro sur Twilio (FR/IL/etc.)
2. User fournit credentials Twilio + numéro
3. AVA **importe** le numéro dans Vapi via `/phone-numbers/import`
4. Vapi configure automatiquement les webhooks

```typescript
// Frontend : /webapp/components/onboarding/phone-setup-twilio.tsx
async function importTwilioNumber({
  twilioAccountSid,
  twilioAuthToken,
  phoneNumber,
  assistantId,
  orgId
}: {
  twilioAccountSid: string;
  twilioAuthToken: string;
  phoneNumber: string; // Format E.164 : +33612345678 ou +972501234567
  assistantId: string;
  orgId: string;
}) {
  try {
    // 1. Vérifier que le numéro existe dans Twilio
    const verifyRes = await fetch('/api/phone-numbers/twilio/verify', {
      method: 'POST',
      body: JSON.stringify({
        accountSid: twilioAccountSid,
        authToken: twilioAuthToken,
        phoneNumber
      })
    });
    
    const { valid } = await verifyRes.json();
    if (!valid) {
      throw new Error('Numéro non trouvé dans votre compte Twilio');
    }
    
    // 2. Importer dans Vapi
    const importRes = await fetch('/api/phone-numbers/import-twilio', {
      method: 'POST',
      body: JSON.stringify({
        twilioAccountSid,
        twilioAuthToken,
        phoneNumber,
        assistantId,
        orgId
      })
    });
    
    const imported = await importRes.json();
    
    return imported;
  } catch (error) {
    console.error('Import failed:', error);
    throw error;
  }
}
```

**Backend API** :
```python
# /api/src/presentation/api/v1/routes/phone_numbers.py
@router.post("/import-twilio")
async def import_twilio_to_vapi(
    twilio_account_sid: str,
    twilio_auth_token: str,
    phone_number: str,
    assistant_id: str,
    org_id: str,
    user=Depends(get_current_user)
):
    """
    Importe un numéro Twilio dans Vapi
    
    Workflow :
    1. Vérifie que le numéro existe dans Twilio
    2. Appelle Vapi /phone-numbers/import
    3. Vapi configure automatiquement le webhook Twilio → Vapi
    4. Sauvegarde dans notre DB
    """
    from twilio.rest import Client as TwilioClient
    from api.src.infrastructure.vapi.client import VapiClient
    
    # 1. Verify Twilio number exists
    twilio = TwilioClient(twilio_account_sid, twilio_auth_token)
    
    try:
        numbers = twilio.incoming_phone_numbers.list(
            phone_number=phone_number,
            limit=1
        )
        
        if not numbers:
            raise HTTPException(
                status_code=404,
                detail=f"Numéro {phone_number} non trouvé dans votre compte Twilio"
            )
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Erreur Twilio : {str(e)}"
        )
    
    # 2. Import to Vapi
    vapi = VapiClient()
    
    try:
        imported = await vapi.import_phone_number(
            twilio_account_sid=twilio_account_sid,
            twilio_auth_token=twilio_auth_token,
            phone_number=phone_number,
            assistant_id=assistant_id
        )
        
        # 3. Save to our DB
        phone = PhoneNumber(
            org_id=org_id,
            provider="VAPI",  # Managed by Vapi but uses Twilio under the hood
            e164=phone_number,
            vapi_phone_number_id=imported["id"],
            twilio_account_sid=twilio_account_sid,
            routing={"assistant_id": assistant_id}
        )
        db.add(phone)
        await db.commit()
        
        return {
            "success": True,
            "message": "Numéro importé avec succès dans Vapi",
            "phone": phone,
            "vapi_config": imported
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de l'import Vapi : {str(e)}"
        )
```

**Vapi Client Helper** :
```python
# /api/src/infrastructure/vapi/client.py
class VapiClient:
    def __init__(self):
        self.api_key = settings.vapi_api_key
        self.base_url = "https://api.vapi.ai"
    
    async def import_phone_number(
        self,
        twilio_account_sid: str,
        twilio_auth_token: str,
        phone_number: str,
        assistant_id: str
    ):
        """
        Import a Twilio number to Vapi
        
        Vapi will automatically:
        - Configure Twilio webhook to point to Vapi
        - Handle inbound calls using the specified assistant
        
        Doc: https://docs.vapi.ai/api-reference/phone-numbers/import
        """
        import httpx
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/phone-numbers/import",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "twilioAccountSid": twilio_account_sid,
                    "twilioAuthToken": twilio_auth_token,
                    "number": phone_number,
                    "assistantId": assistant_id
                }
            )
            
            if response.status_code != 200:
                raise Exception(f"Vapi import failed: {response.text}")
            
            return response.json()
```
            return response.json()

---

#### Étape 3 : 🏢 Industry & Use Case```typescript
// Frontend : /webapp/components/onboarding/phone-setup-twilio.tsx
function TwilioSetupGuide() {
  return (
    <div className="space-y-6">
      {/* Step-by-step guide avec accordions */}
      <Accordion>
        <AccordionItem value="step1">
          <AccordionTrigger>
            <span className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Étape 1 : Créer un compte Twilio
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <p>1. Allez sur <a href="https://www.twilio.com/try-twilio">twilio.com/try-twilio</a></p>
              <p>2. Créez votre compte (gratuit pour commencer)</p>
              <p>3. Vérifiez votre email</p>
              <img src="/guide/twilio-signup.png" alt="Signup Twilio" />
            </div>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="step2">
          <AccordionTrigger>Étape 2 : Acheter un numéro</AccordionTrigger>
          <AccordionContent>
            <p>1. Dans Twilio Console → Phone Numbers → Buy a Number</p>
            <p>2. Choisissez pays et région</p>
            <p>3. Sélectionnez "Voice" capability</p>
            <p>4. Prix : ~1€/mois</p>
            <img src="/guide/twilio-buy-number.png" alt="Buy number" />
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="step3">
          <AccordionTrigger>Étape 3 : Récupérer vos credentials</AccordionTrigger>
          <AccordionContent>
            <p>1. Twilio Console → Account Info</p>
            <p>2. Copiez "Account SID"</p>
            <p>3. Copiez "Auth Token" (cliquez sur "show")</p>
            <img src="/guide/twilio-credentials.png" alt="Credentials" />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      
      {/* Form pour entrer les credentials */}
      <form className="space-y-4">
        <Input 
          label="Account SID" 
          placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
        />
        <Input 
          label="Auth Token" 
          type="password"
          placeholder="********************************"
        />
        <Input 
          label="Phone Number" 
          placeholder="+33612345678 (France) ou +972501234567 (Israël)"
        />
        <Button type="submit">Tester et Importer dans Vapi</Button>
      </form>
      
      {/* Message de succès */}
      <div className="mt-4 p-4 bg-green-50 rounded">
        <p>✅ Numéro vérifié ! AVA va maintenant l'importer dans Vapi...</p>
        <p className="text-sm text-muted-foreground">
          Vapi configurera automatiquement le webhook Twilio pour recevoir les appels.
        </p>
      </div>
    </div>
  );
}
```

**Backend pour tester la connexion Twilio** :
```python
# /api/src/presentation/api/v1/routes/phone_numbers.py
@router.post("/twilio/verify")
async def verify_twilio_credentials(
    account_sid: str,
    auth_token: str,
    phone_number: str
):
    """Vérifie que les credentials Twilio sont valides et que le numéro existe"""
    try:
        from twilio.rest import Client
        client = Client(account_sid, auth_token)
        
        # Test : vérifie que le numéro existe dans ce compte
        numbers = client.incoming_phone_numbers.list(
            phone_number=phone_number,
            limit=1
        )
        
        if not numbers:
            return {"valid": False, "error": "Numéro non trouvé dans votre compte Twilio"}
        
        return {
            "valid": True, 
            "number": numbers[0].phone_number,
            "country": numbers[0].iso_country  # FR, IL, US, etc.
        }
    except Exception as e:
        return {"valid": False, "error": str(e)}
```

---

### 3️⃣ **DASHBOARD POST-ONBOARDING**
```typescript
// Quick selection (1 clic)
const industries = [
  { id: 'health', label: 'Santé (médecins, kinés, dentistes)', icon: '🏥' },
  { id: 'beauty', label: 'Beauté (coiffeurs, esthéticiennes)', icon: '💇' },
  { id: 'legal', label: 'Juridique (avocats, notaires)', icon: '⚖️' },
  { id: 'consulting', label: 'Conseil & Services', icon: '💼' },
  { id: 'ecommerce', label: 'E-commerce & Retail', icon: '🛍️' },
  { id: 'real-estate', label: 'Immobilier', icon: '🏠' },
  { id: 'other', label: 'Autre', icon: '✨' }
];

// Basé sur le choix, on charge un preset AVA
// Preset = prompts + rules + voice + first message
```

**Presets AVA par industrie** :
```typescript
// /webapp/lib/ava-presets.ts
export const AVA_PRESETS = {
  health: {
    name: "AVA Santé",
    voice: "playht-female-fr",
    firstMessage: "Bonjour, cabinet du Dr. {name}, je suis AVA votre assistante. Comment puis-je vous aider ?",
    systemPrompt: `Tu es AVA, assistante d'un cabinet médical.
    - Prends les RDV avec gentillesse et professionnalisme
    - Demande : nom, prénom, motif, date souhaitée
    - Si urgence → proposer consultation rapide
    - Ne donne JAMAIS de conseil médical`,
    rules: {
      bookingEnabled: true,
      urgencyDetection: true,
      medicalAdviceBlocked: true
    }
  },
  beauty: {
    name: "AVA Beauté",
    voice: "playht-female-fr",
    firstMessage: "Bonjour {salon_name}, je suis AVA. Un rendez-vous coiffure ou beauté ?",
    systemPrompt: `Tu es AVA, assistante d'un salon de beauté.
    - Prends les RDV avec sourire et enthousiasme
    - Propose les prestations : coupe, couleur, soin, etc.
    - Demande les préférences (styliste préféré)`,
    rules: {
      bookingEnabled: true,
      serviceSelection: true
    }
  }
  // ... autres presets
};
```

#### Étape 4 : 🎤 Personnalisation AVA (Optionnel)
```typescript
// Si user veut customiser
- Nom de l'assistante (défaut : "AVA")
- Voix (preview audio pour chaque voix)
- Ton : Professionnel | Chaleureux | Dynamique
- Message d'accueil personnalisé
```

#### Étape 5 : 🚀 Test Call = AHA MOMENT
```typescript
// Le moment magique
- "Testez AVA maintenant ! Appelez ce numéro : {phone_number}"
- Gros bouton "Appeler maintenant" (lance un appel via browser si possible)
- Pendant l'appel : animation "AVA is listening..."
- Après l'appel : 
  → Affichage immédiat de la transcription
  → "Bravo ! AVA est prête. Voici votre dashboard →"
  → Redirection automatique vers /dashboard
```

**Implémentation Test Call** :
```typescript
// Frontend : /webapp/components/onboarding/test-call.tsx
import { useVapi } from '@vapi-ai/react';

function TestCallStep({ phoneNumber, assistantId }) {
  const { start, stop, messages, isCallActive } = useVapi();
  
  const startTestCall = async () => {
    // Option 1 : Web call (si navigateur supporte)
    await start(assistantId);
    
    // Option 2 : Afficher le numéro à appeler
    // User appelle avec son téléphone
  };
  
  return (
    <div className="text-center space-y-6">
      <h2>Testez AVA maintenant !</h2>
      
      {/* Si web call supporté */}
      <Button size="lg" onClick={startTestCall}>
        <Phone className="mr-2" />
        Appeler AVA depuis ce navigateur
      </Button>
      
      {/* Sinon */}
      <div className="p-6 bg-muted rounded-lg">
        <p>Appelez ce numéro depuis votre téléphone :</p>
        <p className="text-3xl font-bold my-4">{phoneNumber}</p>
      </div>
      
      {/* Pendant l'appel */}
      {isCallActive && (
        <div className="animate-pulse">
          <Mic className="h-16 w-16 mx-auto" />
          <p>AVA vous écoute...</p>
        </div>
      )}
      
      {/* Après l'appel : afficher transcription en temps réel */}
      {messages.length > 0 && (
        <div className="text-left bg-white p-4 rounded border">
          <h3>Transcription :</h3>
          {messages.map(msg => (
            <p key={msg.id}>
              <strong>{msg.role}:</strong> {msg.content}
            </p>
          ))}
        </div>
      )}
      
      {/* CTA final */}
      <Button size="lg" onClick={() => router.push('/dashboard')}>
        Accéder à mon dashboard →
      </Button>
    </div>
  );
}
```

---

### 3️⃣ **DASHBOARD POST-ONBOARDING**

**Layout recommandé** (selon DIVINE_CODEX) :
```
┌─────────────────────────────────────────────────┐
│  [Logo AVA]  [Dashboard]  [Calls]  [Settings]  │ ← Top Nav
├─────────────────────────────────────────────────┤
│                                                 │
│  📊 Quick Stats (Cards)                         │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐       │
│  │ 24   │  │ 18   │  │ 92%  │  │ 4.2  │       │
│  │Calls │  │ RDV  │  │ Rep. │  │Stars │       │
│  └──────┘  └──────┘  └──────┘  └──────┘       │
│                                                 │
│  📞 Appels récents                              │
│  ┌─────────────────────────────────────────┐   │
│  │ [Avatar] Jean Dupont  +33612... 14:23  │   │
│  │ ✅ RDV pris pour lundi 10h             │   │
│  ├─────────────────────────────────────────┤   │
│  │ [Avatar] Marie Martin +33687... 12:15  │   │
│  │ ℹ️  Question sur horaires               │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  📈 Insights & Trends                           │
│  [Graphique d'évolution des appels]            │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 📦 MODÈLES DE DONNÉES À AJOUTER/MODIFIER

### Prisma Schema Updates
```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  phone         String?  @unique  // ← NOUVEAU
  phoneVerified Boolean  @default(false)  // ← NOUVEAU
  password      String?  // ← NOUVEAU (hashed)
  name          String?
  image         String?
  locale        String   @default("en")
  twoFAEnabled  Boolean  @default(false)
  createdAt     DateTime @default(now())
  orgMemberships OrgUser[]
  
  // Tracking onboarding
  onboardingCompleted Boolean @default(false)  // ← NOUVEAU
  onboardingStep      Int     @default(0)      // ← NOUVEAU
}

model PhoneNumber {
  id                 String   @id @default(cuid())
  orgId              String
  provider           Provider // TWILIO | VAPI
  e164               String   @unique
  
  // Vapi specific
  vapiPhoneNumberId  String?  // ← NOUVEAU
  vapiAssistantId    String?  // ← NOUVEAU
  
  // Twilio specific  
  twilioAccountSid   String?  // ← NOUVEAU
  
  routing            Json
  businessHours      Json
  voicemail          Json
  calls              Call[]
  createdAt          DateTime @default(now())

  org Org @relation(fields: [orgId], references: [id], onDelete: Cascade)
}

enum Provider {
  TWILIO
  VAPI    // ← NOUVEAU
  SIP
}
```

---

## 🛠️ STACK TECHNIQUE

### Frontend
- **Pages** : `/login`, `/signup`, `/onboarding`, `/dashboard`
- **Components** :
  - `<LoginForm />` - Email OU Phone + Password/Magic Link
  - `<SignupForm />` - Formulaire complet
  - `<OnboardingWizard />` - Stepper avec 5 étapes
  - `<PhoneSetupVapi />` - Achat numéro via Vapi
  - `<PhoneSetupTwilio />` - Guide Twilio manuel
  - `<TestCall />` - Appel test avec transcription live
  - `<DashboardHome />` - Vue d'accueil post-onboarding
- **Libs** :
  - `@vapi-ai/react` - Hooks pour appels web
  - `@vapi-ai/server-sdk` - API calls serveur
  - `react-hook-form` + `zod` - Validation forms
  - `next-auth` - Session management

### Backend
- **Routes** :
  - `/api/v1/auth/signup` - Création user
  - `/api/v1/auth/login` - Login email/phone
  - `/api/v1/auth/verify-email` - Vérification email
  - `/api/v1/auth/verify-phone` - Vérification SMS
  - `/api/v1/phone-numbers/available` - Liste numéros Vapi
  - `/api/v1/phone-numbers/purchase` - Achat via Vapi
  - `/api/v1/phone-numbers/twilio/verify` - Test credentials Twilio
  - `/api/v1/phone-numbers/twilio/setup` - Setup webhook Twilio
  - `/api/v1/onboarding/preset` - Get preset AVA par industrie
  - `/api/v1/onboarding/complete` - Marquer onboarding terminé
- **Services** :
  - `VapiService` - Wrapper pour Vapi SDK
  - `TwilioService` - Wrapper pour Twilio SDK
  - `AuthService` - Hash password, generate tokens
  - `OnboardingService` - Logique business onboarding

---

## 📝 CHECKLIST D'IMPLÉMENTATION

### Phase 1 : Auth Foundation (2-3 jours)
- [ ] Ajouter `phone`, `password` fields au User model (Prisma + migration)
- [ ] Backend : routes `/auth/signup`, `/auth/login`
- [ ] Backend : hash password (bcrypt), JWT tokens
- [ ] Frontend : page `/login` avec LoginForm
- [ ] Frontend : page `/signup` avec SignupForm
- [ ] Test : Signup → Login → Session active

### Phase 2 : Onboarding Wizard (3-4 jours)
- [ ] Frontend : layout `/onboarding` avec stepper
- [ ] Step 1 : Welcome screen
- [ ] Step 2 : Phone Setup (Vapi option)
- [ ] Backend : `/phone-numbers/available`, `/purchase`
- [ ] Step 2 : Phone Setup (Twilio option alternative)
- [ ] Backend : `/twilio/verify`, `/twilio/setup`
- [ ] Step 3 : Industry selection + preset loading
- [ ] Step 4 : AVA customization (voice, tone, message)
- [ ] Step 5 : Test call + transcription live
- [ ] Backend : `/onboarding/complete`
- [ ] Test : Full onboarding flow < 10 minutes

### Phase 3 : Dashboard & Polish (2 jours)
- [ ] Dashboard layout (top nav, quick stats, recent calls)
- [ ] Intégrer données réelles (calls depuis DB)
- [ ] Loading states, error handling
- [ ] Responsive mobile
- [ ] Tests E2E (Playwright)

### Phase 4 : Documentation (1 jour)
- [ ] Guide utilisateur phone setup (screenshots)
- [ ] FAQ onboarding
- [ ] Vidéo démo (Loom)
- [ ] Tooltips dans l'app

---

## 🎬 USER JOURNEY COMPLET

```
1. Landing page → "Essayer gratuitement" (CTA)
   ↓
2. /signup → Formulaire (email, phone, name, password)
   ↓
3. Email de vérification → Clic lien
   ↓
4. /onboarding
   ├─ Step 1 : Welcome (30 sec)
   ├─ Step 2 : Phone Setup (2 min)
   │   ├─ Option A : Vapi (1 clic) ✅ Recommandé
   │   └─ Option B : Twilio (guide 5 min)
   ├─ Step 3 : Industry (30 sec)
   ├─ Step 4 : Customization (1 min - optionnel)
   └─ Step 5 : Test Call ⭐ AHA MOMENT (2 min)
   ↓
5. /dashboard → User voit sa première transcription
   ↓
6. Activation ! 🎉
```

**Temps total** : 5-10 minutes (objectif DIVINE_CODEX atteint ✅)

---

## 🔐 SÉCURITÉ & BONNES PRATIQUES

### Auth
- ✅ Password hash avec bcrypt (cost 12)
- ✅ JWT tokens avec expiration (access: 15min, refresh: 7 days)
- ✅ HTTPS only en production
- ✅ Rate limiting sur `/auth/*` routes (5 tentatives/minute)
- ✅ Email verification obligatoire
- ✅ Phone verification optionnelle (recommandée pour 2FA)

### Credentials Twilio
- ❌ JAMAIS stocker `auth_token` en clair
- ✅ Encryption avec `cryptography.fernet` côté backend
- ✅ Stocker uniquement hash en DB
- ✅ Use environment variables pour secrets

### Phone Numbers
- ✅ Valider format E.164 (`+33612345678`)
- ✅ Vérifier unicité (1 numéro = 1 org)
- ✅ Webhook signature verification (Twilio/Vapi)

---

## 📊 MÉTRIQUES DE SUCCÈS

- **Time to First Call** : < 10 minutes ⏱️
- **Onboarding Completion Rate** : > 60% 📈
- **Phone Setup Success** : > 90% (option Vapi) 📞
- **Trial to Paid Conversion** : > 25% 💰
- **User Satisfaction (NPS)** : > 50 😊

---

## 🚧 POINTS D'ATTENTION

### 1. Vapi Phone Numbers - LIMITATION IMPORTANTE ⚠️
- **Numéros gratuits** : US UNIQUEMENT (max 10 par compte)
- **France, Israël, International** : OBLIGATOIREMENT via Twilio + import Vapi
- **Workflow recommandé** :
  - Détecter le pays du user (locale/IP)
  - Si US → Proposer numéro gratuit Vapi
  - Si FR/IL/autre → Guide Twilio + import automatique
- **Documentation** : https://docs.vapi.ai/quickstart/phone-calling

### 2. Twilio → Vapi Import
- Utiliser l'endpoint `/phone-numbers/import` de Vapi
- Vapi configure automatiquement le webhook Twilio
- User garde le billing Twilio (avantage : plus transparent)
- Credentials Twilio doivent être stockés encrypted côté backend

### 3. Test Call
- Fallback si browser ne supporte pas web calling
- Clear instructions pour call depuis mobile
- Timeout si user ne call pas (skip step after 5min)

### 4. Mobile Experience
- Onboarding doit être 100% mobile-friendly
- Test sur iOS Safari (restrictions audio/video)
- Bouton "Call" doit ouvrir l'app téléphone native

---

## 💎 NEXT STEPS

1. **Review ce plan** avec l'équipe
2. **Créer les issues GitHub** (1 issue = 1 checkbox)
3. **Commencer par Phase 1** (Auth Foundation)
4. **Iterate fast** : Ship onboarding v1 en 1 semaine
5. **Mesurer** : Analytics sur chaque step de l'onboarding
6. **Optimiser** : A/B test sur les CTA, wording, order des steps

---

**Ready to build ? Let's make AVA DIVINE ! 🚀**
