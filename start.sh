#!/bin/bash
# Script pour lancer AVA - Assistant téléphonique intelligent

echo "🤖 Démarrage d'AVA - Assistante Personnelle..."
echo "=============================================="

# Fonction pour gérer l'arrêt propre
cleanup() {
    echo ""
    echo "🛑 Arrêt d'AVA et de tous les services..."
    pkill -f "uvicorn.*main:app" 2>/dev/null
    pkill -f "ngrok" 2>/dev/null
    echo "✅ Services arrêtés proprement"
    exit 0
}

# Capturer Ctrl+C pour arrêter proprement
trap cleanup SIGINT

# Vérifier que l'environnement virtuel existe
if [ ! -d ".venv" ]; then
    echo "❌ Environnement virtuel non trouvé. Exécutez setup.sh d'abord."
    exit 1
fi

# Vérifier que ngrok existe
if [ ! -f "/opt/homebrew/bin/ngrok" ]; then
    echo "❌ ngrok non trouvé. Installation..."
    brew install ngrok/ngrok/ngrok
fi

# Arrêter les services existants
echo "🧹 Nettoyage des services existants..."
pkill -f "uvicorn.*main:app" 2>/dev/null
pkill -f "ngrok" 2>/dev/null
sleep 2

echo "� Vérification de la configuration AVA..."
.venv/bin/python -c "
from ava_backend.config import get_settings
settings = get_settings()
print(f'✅ AVA configurée: {settings.greeting_message[:30]}...')
print(f'✅ Email configuré: {settings.summary_email_recipient}')
print(f'✅ Voice: {settings.realtime_voice}')
" || exit 1

echo "🚀 Démarrage du serveur AVA (port 8081)..."
.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8081 --reload &
UVICORN_PID=$!

# Attendre que le serveur démarre
echo "⏳ Attente du démarrage du serveur..."
for i in {1..10}; do
    if curl -s http://localhost:8081/healthz > /dev/null 2>&1; then
        echo "✅ Serveur AVA actif"
        break
    fi
    sleep 1
done

echo "🌐 Démarrage du tunnel ngrok..."
/opt/homebrew/bin/ngrok http 8081 &
NGROK_PID=$!

# Attendre que ngrok démarre
echo "⏳ Attente du démarrage de ngrok..."
sleep 5

echo "📞 Configuration du webhook Twilio..."
.venv/bin/python -c "
from twilio.rest import Client
import os
from dotenv import load_dotenv

load_dotenv()
client = Client(os.getenv('TWILIO_ACCOUNT_SID'), os.getenv('TWILIO_AUTH_TOKEN'))
phone_number = '+19787182628'
webhook_url = 'https://enjambed-roma-scrappily.ngrok-free.dev/twiml'

try:
    incoming_phone_number = client.incoming_phone_numbers.list(phone_number=phone_number)[0]
    incoming_phone_number.update(voice_url=webhook_url)
    print(f'✅ Webhook configuré pour {phone_number}')
    print(f'🔗 URL: {webhook_url}')
except Exception as e:
    print(f'❌ Erreur webhook: {e}')
"

echo ""
echo "🎉 AVA est maintenant ACTIVE !"
echo "=============================="
echo "🤖 Serveur AVA: http://localhost:8081"
echo "🌐 Ngrok Dashboard: http://127.0.0.1:4040"
echo "📞 Numéro à appeler: +19787182628"
echo "📧 Résumés envoyés à: $(grep SUMMARY_EMAIL .env | cut -d'=' -f2)"
echo ""
echo "💡 AVA va se présenter en français et envoyer un résumé par email"
echo "🎯 Appelez maintenant le numéro pour tester !"
echo ""
echo "Appuyez sur Ctrl+C pour arrêter AVA..."

# Attendre indéfiniment
wait