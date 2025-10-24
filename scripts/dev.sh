#!/bin/bash
set -e

echo "🚀 AVA - Démarrage en mode développement"
echo "========================================"

# Ajouter homebrew au PATH
export PATH="/opt/homebrew/bin:$PATH"

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js non installé. Installation..."
    brew install node
fi

# Vérifier Python
if [ ! -d ".venv" ]; then
    echo "📦 Création de l'environnement Python..."
    python3.12 -m venv .venv
fi

# Installer dépendances backend
echo "📦 Installation dépendances backend..."
.venv/bin/pip install -q -r requirements.txt

# Installer dépendances frontend
echo "📦 Installation dépendances frontend..."
cd webapp && npm install --silent && cd ..

# Vérifier .env
if [ ! -f "api/.env" ]; then
    echo "⚠️  Fichier api/.env manquant!"
    echo "Copie .env.example vers api/.env et configure-le."
    exit 1
fi

if [ ! -f "webapp/.env.local" ]; then
    echo "⚠️  Fichier webapp/.env.local manquant!"
    echo "Copie webapp/.env.example vers webapp/.env.local et configure-le."
    exit 1
fi

# Tuer les processus existants
echo "🧹 Nettoyage des processus existants..."
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Démarrer backend
echo "🔧 Démarrage du backend (port 8000)..."
.venv/bin/uvicorn api.main:app --reload --port 8000 --host 0.0.0.0 &
BACKEND_PID=$!

# Attendre que le backend démarre
echo "⏳ Attente du backend..."
for i in {1..10}; do
    if curl -s http://localhost:8000/healthz > /dev/null 2>&1; then
        echo "✅ Backend actif"
        break
    fi
    sleep 1
done

# Démarrer frontend
echo "🎨 Démarrage du frontend (port 3000)..."
cd webapp
export PATH="/opt/homebrew/bin:$PATH"
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "🎉 AVA est lancée!"
echo "===================="
echo "🔧 Backend API:  http://localhost:8000/docs"
echo "🎨 Frontend:     http://localhost:3000"
echo ""
echo "Appuie sur Ctrl+C pour arrêter"

# Attendre et cleanup
trap "echo '\n🛑 Arrêt...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM
wait
