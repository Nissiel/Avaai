#!/bin/bash
# Script pour lancer tous les services Sarah.AI en parallèle

echo "🎯 Démarrage de Sarah.AI Assistant Téléphonique..."
echo "================================================="

# Fonction pour gérer l'arrêt propre
cleanup() {
    echo ""
    echo "🛑 Arrêt de tous les services..."
    kill $(jobs -p) 2>/dev/null
    exit 0
}

# Capturer Ctrl+C pour arrêter proprement
trap cleanup SIGINT

# Configurer l'environnement
eval "$(/opt/homebrew/bin/brew shellenv)" 2>/dev/null

echo "🔗 Démarrage du serveur websocket (port 8081)..."
(cd websocket-server && npm run dev) &
WEBSOCKET_PID=$!

# Attendre un peu pour que le serveur websocket démarre
sleep 3

echo "🌐 Démarrage de ngrok (exposition publique)..."
# Tuer ngrok existant d'abord
pkill -f "ngrok" 2>/dev/null
sleep 1
ngrok http 8081 &
NGROK_PID=$!

# Attendre un peu pour que ngrok démarre
sleep 5

echo "📱 Démarrage de l'application web (port 3000)..."
(cd webapp && npm run dev) &
WEBAPP_PID=$!

echo ""
echo "✅ Tous les services sont démarrés !"
echo "📱 Interface Web: http://localhost:3000"
echo "🔗 Serveur WebSocket: http://localhost:8081"
echo "🌐 Ngrok Dashboard: http://127.0.0.1:4040"
echo "📞 Numéro Twilio: +19787182628"
echo ""
echo "Appuyez sur Ctrl+C pour arrêter tous les services..."

# Attendre indéfiniment
wait