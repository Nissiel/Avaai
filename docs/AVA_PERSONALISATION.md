# Personnalisation d'Ava par locataire

Ce guide décrit comment configurer la personnalité d’Ava pour chaque client, depuis la collecte des préférences jusqu’à leur application dans une session OpenAI Realtime.

## 1. Modèle de données

Chaque locataire possède un enregistrement `ava_profiles` :

| Champ | Description |
| --- | --- |
| `name` | Nom public d’Ava (ex. “Camille”) |
| `voice` | Identifiant de voix Realtime/TTS (ex. `fr-feminine-calm`) |
| `language` | Langue principale (`fr-FR`, `fr-CA`, `en-GB`, `en-US`) |
| `tone` | Ton général (“chaleureux et professionnel”) |
| `personality` | Traits (“amicale, empathique, posée”) |
| `greeting` | Message d’accueil prononcé en premier |
| `allowed_topics` | Liste des sujets autorisés |
| `forbidden_topics` | Liste des sujets refusés |
| `can_take_notes` | Autorise la prise de notes |
| `can_summarize_live` | Autorise un résumé en direct |
| `fallback_behavior` | Formulation à utiliser hors périmètre |
| `signature_style` | Style de conclusion |
| `custom_rules` | Règles supplémentaires (sécurité, procédures) |

Une migration SQL (`app-api/src/db/migrations/20250111_add_ava_profile.sql`) crée la table et applique des valeurs par défaut.

## 2. API Backend

- `GET /tenant/ava-profile` : renvoie le profil (créé à la volée si absent).
- `PUT /tenant/ava-profile` : met à jour le profil après validation Pydantic.
- `POST /tenant/ava-profile/test-voice` : génère un extrait audio (base64).

Les endpoints exigent un JWT comprenant `tenant_id` + rôle `owner` ou `admin`.

## 3. Frontend

La page Next.js `/settings/ava` permet :

- D’afficher le profil courant (fetch initial).
- D’éditer les champs via React Hook Form + Zod.
- De pré-écouter la voix (bouton “Écouter”).
- De sauvegarder en affichant un toast de confirmation.

## 4. Intégration Realtime

1. **Chargement du profil** : le bridge récupère `ava_profile` selon `tenant_id`.
2. **Construction du prompt** : `build_system_prompt(profile)` assemble les règles.
3. **Configuration Realtime** : `session.update` applique instructions + voix + langue Whisper.
4. **Mise à jour live** (optionnel) : endpoint admin peut renvoyer `session.update` durant l’appel.

## 5. Scénario E2E

1. Seeder ou créer un tenant.
2. Appeler `PUT /tenant/ava-profile` pour personnaliser (ex. Cabinet médical).
3. Depuis l’UI, vérifier que les valeurs apparaissent.
4. Appuyer sur “Écouter” pour tester la voix.
5. Passer un appel Twilio → Ava se présente avec le nouveau greeting et respecte les règles.

## 6. Conseils de rédaction

- Phrases courtes, vocabulaire cohérent.
- Autoriser explicitement les sujets incontournables (prise de message, rendez-vous).
- Interdire les domaines sensibles (politique, santé personnelle, conseil financier).
- Ajouter des règles métiers (“Toujours demander numéro de dossier”).

## 7. Commandes utiles

```bash
# Backend
alembic upgrade head
uvicorn app.main:app --reload

# Frontend
cd web-onboarding && npm install && npm run dev

# Realtime bridge
python realtime-bridge/main.py
```

## 8. Tests recommandés

- **Backend** : validation profil, RBAC, construction du prompt.
- **Frontend** : rendu du formulaire, validation client, toasts de succès/erreur.
- **Bridge** : vérifie que la session utilise les instructions/voix du tenant.

---

En cas de modification du profil en production, privilégiez l’endpoint live update (`session.update`) pour appliquer les changements sans interrompre l’appel.
