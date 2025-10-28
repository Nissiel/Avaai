# 🎯 Guide Vapi.ai - Configuration Multi-Tenant

## 🌟 Architecture Divine : Chaque User = Sa Propre Clé Vapi

### Pourquoi cette architecture ?

**❌ AVANT (Architecture cassée) :**
- Une seule clé Vapi globale partagée par tous
- Limite : ~100 assistants maximum
- Après 100 users → Service bloqué

**✅ MAINTENANT (Architecture divine) :**
- Chaque user a **sa propre clé Vapi**
- Chaque user créé **ses propres assistants**
- **Infini scalable** ♾️
- **Aucune limite** de croissance

---

## 📖 Guide Utilisateur : Comment Obtenir Votre Clé Vapi

### Étape 1 : Créer un Compte Vapi.ai (Gratuit)

1. Allez sur **https://vapi.ai**
2. Cliquez sur **"Get Started"** ou **"Sign Up"**
3. Créez votre compte avec :
   - Email
   - Mot de passe
   - Ou connectez-vous avec Google/GitHub

### Étape 2 : Obtenir Votre Clé API

1. Une fois connecté, allez dans **Dashboard**
2. Dans le menu de gauche, cliquez sur **Settings** ⚙️
3. Cliquez sur **API Keys**
4. Cliquez sur **"Create New API Key"**
5. Donnez-lui un nom : `Ava.ai Production`
6. **Copiez la clé** (elle commence par `sk_live_...`)
   
   ⚠️ **IMPORTANT** : Sauvegardez cette clé maintenant ! Elle ne sera plus visible après.

### Étape 3 : Configurer la Clé dans Ava.ai

1. Dans Ava.ai, allez dans **Paramètres** → **Intégrations**
2. Section **Vapi.ai Configuration**
3. Collez votre clé API dans le champ
4. Cliquez sur **"Sauvegarder"**

✅ **C'est tout !** Vous pouvez maintenant créer vos assistants !

---

## 🔧 API Endpoints (Pour Développeurs)

### GET `/api/v1/vapi-settings`
Vérifier si l'utilisateur a configuré sa clé Vapi.

**Response:**
```json
{
  "has_vapi_key": true,
  "vapi_api_key_preview": "sk_live_..."
}
```

### POST `/api/v1/vapi-settings`
Sauvegarder la clé Vapi de l'utilisateur.

**Request:**
```json
{
  "vapi_api_key": "votre_clé_vapi_ici"
}
```

**Response:**
```json
{
  "message": "Vapi API key saved successfully",
  "preview": "sk_live_..."
}
```

### DELETE `/api/v1/vapi-settings`
Supprimer la clé Vapi de l'utilisateur.

**Response:**
```json
{
  "message": "Vapi API key deleted successfully"
}
```

---

## 🎨 Frontend : Page Paramètres Vapi

### Wireframe Recommandé

```
┌─────────────────────────────────────────────────┐
│  ⚙️  Paramètres → Intégrations                  │
├─────────────────────────────────────────────────┤
│                                                 │
│  🎙️  Configuration Vapi.ai                     │
│  ────────────────────────────────────────       │
│                                                 │
│  Vapi.ai permet à votre assistant de gérer     │
│  des appels téléphoniques avec une voix AI.    │
│                                                 │
│  📌 Statut : ❌ Non configuré                   │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ Clé API Vapi                              │ │
│  │ sk_live_...                               │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  [💾 Sauvegarder]  [🗑️ Supprimer]             │
│                                                 │
│  ℹ️  Comment obtenir votre clé ?               │
│  1. Allez sur https://vapi.ai                  │
│  2. Settings → API Keys                        │
│  3. Create New API Key                         │
│  4. Copiez la clé ici                          │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Code React/Next.js Exemple

```typescript
// app/[locale]/dashboard/settings/vapi/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export default function VapiSettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [preview, setPreview] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchVapiSettings();
  }, []);

  const fetchVapiSettings = async () => {
    const res = await fetch('/api/vapi-settings', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await res.json();
    setHasKey(data.has_vapi_key);
    setPreview(data.vapi_api_key_preview || '');
  };

  const saveApiKey = async () => {
    const res = await fetch('/api/vapi-settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ vapi_api_key: apiKey })
    });
    
    if (res.ok) {
      toast({ title: 'Clé Vapi sauvegardée ✅' });
      fetchVapiSettings();
      setApiKey('');
    } else {
      toast({ title: 'Erreur', variant: 'destructive' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">⚙️ Configuration Vapi.ai</h1>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Statut : {hasKey ? '✅ Configuré' : '❌ Non configuré'}
          </p>
          {preview && (
            <p className="text-xs text-gray-500">Clé actuelle : {preview}</p>
          )}
        </div>

        <Input
          type="password"
          placeholder="sk_live_..."
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="mb-4"
        />

        <Button onClick={saveApiKey}>💾 Sauvegarder</Button>

        <div className="mt-6 p-4 bg-blue-50 rounded">
          <p className="text-sm font-semibold mb-2">ℹ️ Comment obtenir votre clé ?</p>
          <ol className="text-sm text-gray-700 space-y-1">
            <li>1. Allez sur <a href="https://vapi.ai" target="_blank" className="text-blue-600">https://vapi.ai</a></li>
            <li>2. Settings → API Keys</li>
            <li>3. Create New API Key</li>
            <li>4. Copiez la clé ici</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
```

---

## 🚀 Plan de Déploiement

### 1. Migration Base de Données

```bash
cd api
alembic upgrade head
```

Cela va ajouter la colonne `vapi_api_key` à la table `users`.

### 2. Déployer le Backend

Commit et push sur `main` :

```bash
git add .
git commit -m "✨ Multi-tenant Vapi: chaque user a sa clé API"
git push origin main
```

Render va auto-déployer.

### 3. Déployer le Frontend

Ajouter la page de paramètres Vapi dans `webapp/app/[locale]/dashboard/settings/vapi/page.tsx`.

Commit et push :

```bash
git add .
git commit -m "✨ Frontend: Page paramètres Vapi.ai"
git push origin main
```

Vercel va auto-déployer.

---

## 📊 Communication aux Utilisateurs

### Email de Lancement

**Sujet :** 🎉 Nouvelle Fonctionnalité : Configurez Votre Propre Vapi.ai

**Corps :**

Bonjour [Nom],

Excellente nouvelle ! 🌟

Ava.ai évolue avec une nouvelle architecture **multi-tenant** pour Vapi.ai.

**Qu'est-ce que ça change pour vous ?**

Avant, tous les utilisateurs partageaient une seule clé Vapi (limite de 100 assistants).  
Maintenant, **chaque utilisateur a sa propre clé Vapi** !

**Avantages :**
✅ Aucune limite de croissance  
✅ Contrôle total sur votre compte Vapi  
✅ Meilleure isolation et sécurité  

**Action requise :**

1. Créez votre compte gratuit sur https://vapi.ai
2. Obtenez votre clé API (Settings → API Keys)
3. Configurez-la dans Ava.ai (Paramètres → Intégrations)

**Guide complet :** [lien vers documentation]

L'équipe Ava.ai 🚀

---

## 🎯 Checklist de Validation

- [ ] Migration Alembic exécutée
- [ ] Backend déployé sur Render
- [ ] Frontend déployé sur Vercel
- [ ] Endpoint `/api/v1/vapi-settings` accessible
- [ ] Page paramètres Vapi créée
- [ ] Test complet : Save/Get/Delete clé Vapi
- [ ] Test création assistant avec clé user
- [ ] Documentation publiée
- [ ] Email envoyé aux utilisateurs existants

---

## 🆘 Support & FAQ

### Q: Que se passe-t-il si je ne configure pas ma clé Vapi ?

**R:** Vous verrez le message "Configuration Vapi introuvable. Ajoutez votre clé API Vapi pour synchroniser les assistantes."  
Les fonctionnalités Vapi (assistants téléphoniques) seront désactivées jusqu'à ce que vous configuriez votre clé.

### Q: Ma clé Vapi est-elle sécurisée ?

**R:** Oui ! Elle est stockée de manière chiffrée dans la base de données et n'est jamais exposée publiquement.

### Q: Puis-je changer ma clé Vapi plus tard ?

**R:** Oui ! Allez dans Paramètres → Intégrations, collez votre nouvelle clé et sauvegardez.

### Q: Combien coûte un compte Vapi ?

**R:** Vapi.ai offre un plan gratuit pour commencer. Pour des volumes plus importants, consultez https://vapi.ai/pricing

---

## 🎨 Design System - Composant VapiSettings

### Figma / Design

```
┌─────────────────────────────────────────────────┐
│  Card: Configuration Vapi.ai                    │
├─────────────────────────────────────────────────┤
│                                                 │
│  Icon: 🎙️                                       │
│  Title: Vapi.ai Configuration                   │
│  Description: Configure your personal Vapi key  │
│                                                 │
│  Status Badge:                                  │
│    - Green: "✅ Configured"                     │
│    - Red: "❌ Not Configured"                   │
│                                                 │
│  Input Field:                                   │
│    - Type: password                             │
│    - Placeholder: "sk_live_..."                 │
│    - Icon: 🔑                                   │
│                                                 │
│  Buttons:                                       │
│    - Primary: "Save" (Blue)                     │
│    - Secondary: "Delete" (Red)                  │
│                                                 │
│  Help Section:                                  │
│    - Collapsible accordion                      │
│    - Title: "How to get your API key?"         │
│    - Steps: 1, 2, 3, 4                         │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 🚀 RÉSULTAT FINAL

**Avec cette architecture :**

1. ✅ **Scalabilité infinie** - Pas de limite de users
2. ✅ **Isolation** - Chaque user son compte Vapi
3. ✅ **Sécurité** - Clés stockées de manière sécurisée
4. ✅ **UX simple** - Guide clair pour obtenir la clé
5. ✅ **Prêt production** - Architecture pro pour des milliers de clients

**Ava.ai est maintenant prêt pour des centaines, voire des milliers d'utilisateurs !** 🌟
