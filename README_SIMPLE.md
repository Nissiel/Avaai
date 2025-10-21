# 🤖 Sarah.AI - Assistant Téléphonique IA

> **Assistant téléphonique intelligent utilisant OpenAI Realtime API + Twilio**

Un système complet permettant de recevoir des appels téléphoniques et de converser avec une IA en temps réel.

## 🚀 Setup Ultra-Rapide (1 minute)

### 1️⃣ Setup initial (première fois seulement)
```bash
./setup.sh
```

### 2️⃣ Lancer tous les services
```bash
./start.sh
```

### 3️⃣ Arrêter tous les services
```bash
./stop.sh
```

## 📱 Utilisation

1. **Lancez avec** `./start.sh`
2. **Interface Web** : `http://localhost:3000`
3. **Appelez** : `+19787182628`
4. **Parlez avec l'IA** en temps réel !

## 🎯 Ce qui se lance automatiquement

- 🔗 **Serveur WebSocket** (port 8081) - Pont entre Twilio et OpenAI
- 🌐 **Ngrok** - Exposition publique du serveur
- 📱 **Interface Web** (port 3000) - Configuration et transcriptions
- 🤖 **OpenAI Realtime API** - IA conversationnelle vocale

## ⚙️ Configuration (Déjà configurée)

Les variables d'environnement sont déjà configurées dans :
- `webapp/.env` - Credentials Twilio
- `websocket-server/.env` - Clé OpenAI + URL ngrok

## 📋 Architecture

```
📞 Twilio (+19787182628) 
    ↓
🌐 Ngrok (https://enjambed-roma-scrappily.ngrok-free.dev)
    ↓
🔗 WebSocket Server (localhost:8081)
    ↕️
🤖 OpenAI Realtime API
    ↕️
📱 Interface Web (localhost:3000)
```

## 🎮 Fonctionnalités

- ✅ **Appels entrants automatiques** via Twilio
- ✅ **Conversations vocales intelligentes** avec OpenAI
- ✅ **Transcription en temps réel** sur l'interface web
- ✅ **Function calling** (exemple : API météo)
- ✅ **Configuration de session** dynamique
- ✅ **Monitoring des appels** en live

## 🛠️ Détails Techniques

- **Frontend** : Next.js + React + TailwindCSS
- **Backend** : Express + WebSocket + TypeScript
- **IA** : OpenAI Realtime API (gpt-4o-realtime-preview)
- **Téléphonie** : Twilio Voice API
- **Exposition** : Ngrok tunnel

## 📞 Test de l'Assistant

1. Lancez avec `./start.sh`
2. Ouvrez `http://localhost:3000`
3. Attendez que tout soit "✅ Ready"
4. Appelez `+19787182628`
5. L'IA répondra et vous pourrez converser !

## 🆘 Dépannage

**Problème ngrok ?**
```bash
./stop.sh && ./start.sh
```

**Ports occupés ?**
```bash
lsof -ti:3000,8081 | xargs kill -9
./start.sh
```

**Réinstaller ?**
```bash
./setup.sh
```

---

## 🚀 **C'est prêt ! Lancez simplement `./start.sh` et appelez le numéro !**