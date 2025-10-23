# 🚀 DÉMARRAGE RAPIDE - AVAAI

## ⚡ PROCÉDURE TESTÉE ET APPROUVÉE

### 🎯 **ÉTAPE 1 : WebSocket Server (Port 8081)**
```bash
# Terminal 1 - WebSocket Server
cd /Users/nissielberrebi/Desktop/openai-realtime-twilio-demo-main/Avaai/websocket-server
bash -c "PATH='/opt/homebrew/bin:/opt/homebrew/sbin:$PATH' npm run dev"
```

**✅ Résultat attendu :**
```
Server running on http://localhost:8081
```

### 🎯 **ÉTAPE 2 : Next.js App (Port 3000)**
```bash
# Terminal 2 - Next.js App  
cd /Users/nissielberrebi/Desktop/openai-realtime-twilio-demo-main/Avaai/webapp
bash -c "PATH='/opt/homebrew/bin:/opt/homebrew/sbin:$PATH' npm run dev"
```

**✅ Résultat attendu :**
```
▲ Next.js 14.2.5
- Local:        http://localhost:3000
✓ Ready in 1913ms
```

### 🎯 **ÉTAPE 3 : Ngrok (déjà actif)**
Le tunnel ngrok est déjà configuré : `https://enjambed-roma-scrappily.ngrok-free.dev`

---

## 🔧 **COMMANDES DE VÉRIFICATION**

### Tester WebSocket Server :
```bash
curl -s http://localhost:8081/public-url
# ATTENDU: {"publicUrl":"https://enjambed-roma-scrappily.ngrok-free.dev"}
```

### Tester Next.js App :
```bash
curl -s -I http://localhost:3000 | head -1
# ATTENDU: HTTP/1.1 200 OK
```

### Tester Ngrok :
```bash
curl -H "ngrok-skip-browser-warning: true" https://enjambed-roma-scrappily.ngrok-free.dev/public-url
# ATTENDU: {"publicUrl":"https://enjambed-roma-scrappily.ngrok-free.dev"}
```

---

## 🚨 **DÉPANNAGE EXPRESS**

### ❌ `npm: command not found`
**SOLUTION :** Utiliser le PATH complet Homebrew
```bash
bash -c "PATH='/opt/homebrew/bin:/opt/homebrew/sbin:$PATH' npm run dev"
```

### ❌ `Port 8081 already in use`
**SOLUTION :** Tuer les processus existants
```bash
lsof -ti:8081 | xargs kill -9 2>/dev/null
```

### ❌ Écran blanc sur localhost:3000
**SOLUTION :** Next.js pas démarré - voir ÉTAPE 2

---

## 📋 **CHECKLIST RAPIDE**

- [ ] Terminal 1 : WebSocket Server sur port 8081 ✅
- [ ] Terminal 2 : Next.js App sur port 3000 ✅  
- [ ] Ngrok tunnel actif ✅
- [ ] Interface accessible : http://localhost:3000 ✅
- [ ] Checks verts dans l'interface ✅

---

## 💡 **SCRIPT AUTOMATIQUE**

Pour plus tard, on peut créer un script qui démarre tout :
```bash
#!/bin/bash
# start-all.sh

# Terminal 1 - WebSocket
osascript -e 'tell app "Terminal" to do script "cd /Users/nissielberrebi/Desktop/openai-realtime-twilio-demo-main/Avaai/websocket-server && PATH=\"/opt/homebrew/bin:/opt/homebrew/sbin:$PATH\" npm run dev"'

# Terminal 2 - Next.js  
osascript -e 'tell app "Terminal" to do script "cd /Users/nissielberrebi/Desktop/openai-realtime-twilio-demo-main/Avaai/webapp && PATH=\"/opt/homebrew/bin:/opt/homebrew/sbin:$PATH\" npm run dev"'

echo "🚀 Démarrage en cours..."
echo "✅ WebSocket Server : http://localhost:8081" 
echo "✅ Next.js App : http://localhost:3000"
```

---

## 🎯 **RÉSUMÉ ULTRA-RAPIDE**

**2 terminaux = 2 commandes = 30 secondes = TOUT FONCTIONNE** 

1. `cd websocket-server && PATH='/opt/homebrew/bin:/opt/homebrew/sbin:$PATH' npm run dev`
2. `cd webapp && PATH='/opt/homebrew/bin:/opt/homebrew/sbin:$PATH' npm run dev`
3. Ouvrir http://localhost:3000 ✨