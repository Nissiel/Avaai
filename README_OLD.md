## Ava – Assistante vocale IA (Twilio + OpenAI Realtime)

Ava est une secrétaire téléphonique virtuelle francophone bâtie sur Twilio Media Streams et l’API Realtime d’OpenAI. Elle décroche vos appels, engage une conversation fluide en français, tient compte du contexte, puis rédige et envoie automatiquement un résumé professionnel par email une fois l’appel terminé.

### Fonctionnalités principales
- **Accueil naturel** : message d’ouverture chaleureux dès la prise de ligne.
- **Conversation temps réel** : transcription Whisper + voix française via le modèle Realtime.
- **Mémoire contextuelle** : historique complet des échanges pour guider les réponses.
- **Résumé post-appel** : synthèse professionnelle générée avec GPT et envoyée par email.
- **Fallback robuste** : journalisation automatique en cas d’échec d’envoi.

---

### Prérequis
- Python 3.11 ou plus.
- Compte [OpenAI](https://platform.openai.com/) avec accès à l’API Realtime et aux Chat Completions (clé sauvegardée dans `.env`).
- Compte [Twilio](https://www.twilio.com/) avec un numéro ou la console de test.
- [ngrok](https://ngrok.com/) (ou équivalent) pour exposer le serveur local à Twilio.
- Facultatif : le dossier `webapp/` (Next.js) peut servir de tableau de bord si vous souhaitez visualiser les flux, mais Ava fonctionne sans.

---

### Installation rapide
1. **Cloner le dépôt et créer l’environnement**
   ```bash
   git clone https://github.com/.../avaai.git
   cd avaai
   python -m venv .venv
   source .venv/bin/activate  # ou .venv\Scripts\activate sous Windows
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

2. **Configurer les variables d’environnement**
   ```bash
   cp ava_backend/.env.example ava_backend/.env
   ```
   Ouvrez `ava_backend/.env` et complétez au minimum :
   - `OPENAI_API_KEY` : clé OpenAI
   - `PUBLIC_BASE_URL` : URL publique (ex. ngrok) pour que Twilio atteigne le serveur
   - paramètres SMTP si vous souhaitez l’envoi automatique d’emails (`SUMMARY_EMAIL`, `SMTP_SERVER`, etc.)

3. **Démarrer Ava**
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8081 --reload
   ```

4. **Exposer l’application à Twilio**
   ```bash
   ngrok http 8081
   ```
   Notez l’URL publique `https://xxxx.ngrok.io`. Mettez-la dans `PUBLIC_BASE_URL`.

5. **Configurer le webhook Twilio**
   - Dans la console Twilio, renseignez pour votre numéro :
     - **Voice & Fax → A Call Comes In** : `https://xxxx.ngrok.io/twiml`
   - Twilio initiera alors un Media Stream vers `wss://xxxx.ngrok.io/media-stream`.

6. **Passer un appel**
   - Dès la prise de ligne, Ava déclenche son accueil en français.
   - Parlez-lui naturellement : elle écoute, répond et interrompt sa propre réponse si vous reprenez la parole.
   - À la fin de l’appel, un résumé structuré est généré puis envoyé par email (ou journalisé en fallback).

---

### Architecture
```
Ava (FastAPI)  <——>  Twilio Media Streams
        │                      │
        └────> OpenAI Realtime ─┘

Modules principaux :
  - main.py                 : serveur FastAPI (TwiML + WebSocket)
  - ava_backend/call_session.py  : pont audio Twilio ↔ OpenAI, gestion du flux
  - ava_backend/agent_logic.py    : session Realtime, suivi conversation, résumé
  - ava_backend/email_utils.py    : envoi du résumé et fallback en logs
  - ava_backend/config.py         : chargement des variables d’environnement
```

Le flux audio Twilio (PCM G.711 mu-law) est transmis en temps réel à OpenAI. Le modèle renvoie des deltas audio qui sont immédiatement réexpédiés à Twilio. Avant chaque prise de parole d’Ava, le modèle reçoit le contexte complet (persona + historique). Lorsque Twilio termine le stream, Ava lance la génération de résumé via l’API Chat Completions (`OPENAI_SUMMARY_MODEL`), puis tente l’envoi SMTP.

---

### Variables d’environnement importantes
- `OPENAI_API_KEY` : requis.
- `PUBLIC_BASE_URL` : URL HTTPS accessible par Twilio (souvent l’URL ngrok).
- `OPENAI_REALTIME_MODEL` : par défaut `gpt-4o-realtime-preview-2024-10-01`.
- `OPENAI_SUMMARY_MODEL` : modèle pour la synthèse (par ex. `gpt-4.1-mini`).
- `AVA_GREETING_MESSAGE` / `AVA_SYSTEM_PROMPT` : personnalisation de la voix et de la personnalité.
- `SUMMARY_EMAIL`, `SMTP_SERVER`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_SENDER` : nécessaires pour l’envoi automatique. Sans ces valeurs, Ava journalise le résumé.
- `LOG_LEVEL` : ajustez à `DEBUG` pour du diagnostic avancé.

Consultez `ava_backend/.env.example` pour la liste complète.

---

### Endpoints exposés
- `GET /healthz` : vérifie que l’API répond.
- `GET /public-url` : renvoie l’URL publique configurée (utile côté frontend).
- `GET|POST /twiml` : Twilio récupère ici les instructions de streaming.
- `WS /media-stream` : Twilio Media Streams → pont audio bidirectionnel.

---

### Résumé & email
1. `ava_backend/call_session.py` maintient l’historique (transcriptions Whisper + réponses d’Ava).
2. À la fin de l’appel, `generate_summary` (dans `agent_logic.py`) compose un prompt de synthèse et appelle le modèle `OPENAI_SUMMARY_MODEL`.
3. `send_summary_via_email` envoie le résumé en HTML et texte brut. En cas d’erreur SMTP, le résumé est loggé avec `logger.exception`.

---

### Aller plus loin
- Lancer `webapp/` pour un dashboard en Next.js si vous souhaitez afficher flux et transcripts en direct (`npm install && npm run dev` dans `webapp/`).
- Ajouter des webhooks métier en interceptant les fonctions de `CallSession` (ex. intégration CRM).
- Adapter la voix (`AVA_REALTIME_VOICE`) ou utiliser une synthèse tierce si besoin.
- Renforcer la sécurité (authentification, validation Twilio signatures, rotation des clés).

---

### Dépannage rapide
- **Pas d’audio côté Twilio** : vérifiez que `PUBLIC_BASE_URL` pointe bien vers l’URL HTTPS d’ngrok et que Twilio est configuré sur `/twiml`.
- **Pas de voix d’Ava** : observez les logs ; s’assurer que la clé OpenAI est valide et que le modèle choisi supporte l’audio français.
- **Email non reçu** : activez `LOG_LEVEL=DEBUG` puis vérifiez les logs pour une éventuelle exception SMTP.
- **Résumé vide** : vérifier que les transcriptions Whisper sont activées et que des échanges ont réellement été reçus.

Bon développement avec Ava !
