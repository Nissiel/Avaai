#!/bin/bash
set -e

echo "🚀 AVA - Démarrage en mode développement DIVINE"
echo "================================================="

# Ajouter homebrew au PATH
export PATH="/opt/homebrew/bin:$PATH"

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js non installé. Installation..."
    brew install node
fi

# Vérifier Python 3.11
if ! command -v python3.11 &> /dev/null; then
    echo "❌ Python 3.11 non installé. Installation..."
    brew install python@3.11
fi

# Vérifier et installer dépendances backend
echo "📦 Vérification dépendances backend (Python 3.11)..."
python3.11 -m pip install --user -q -r requirements.txt

# Installer dépendances frontend
echo "📦 Installation dépendances frontend..."
cd webapp && npm install --silent && cd ..

# Vérifier .env backend
if [ ! -f "api/.env" ]; then
    echo "⚠️  Fichier api/.env manquant!"
    echo "Copie .env.example vers api/.env et configure-le."
    exit 1
fi

# Vérifier Resend API key configurée
if ! grep -q "AVA_API_RESEND_API_KEY=re_" api/.env; then
    echo "⚠️  Resend API key non configurée dans api/.env!"
    echo "Ajoute: AVA_API_RESEND_API_KEY=ta_clé_resend"
    exit 1
fi

# Vérifier .env frontend
if [ ! -f "webapp/.env.local" ]; then
    echo "⚠️  Fichier webapp/.env.local manquant!"
    echo "Copie webapp/.env.example vers webapp/.env.local et configure-le."
    exit 1
fi

# Vérifier que les migrations Alembic sont appliquées
echo "🗄️  Vérification des migrations database..."
if ! python3.11 -m alembic current | grep -q "head"; then
    echo "⚠️  Migrations database pas à jour. Application..."
    python3.11 -m alembic upgrade head
    echo "✅ Migrations appliquées"
fi

# Nettoyage graceful des processus existants
echo "🧹 Nettoyage des processus existants..."
if lsof -ti:8000 > /dev/null 2>&1; then
    echo "  ⏹️  Arrêt du backend (port 8000)..."
    kill $(lsof -ti:8000) 2>/dev/null || true
    sleep 2
fi
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "  ⏹️  Arrêt du frontend (port 3000)..."
    kill $(lsof -ti:3000) 2>/dev/null || true
    sleep 2
fi

# Démarrer backend avec Python 3.11
echo "🔧 Démarrage du backend (port 8000)..."
python3.11 -m uvicorn api.main:app --reload --port 8000 --host 0.0.0.0 &
BACKEND_PID=$!

# Attendre que le backend démarre
echo "⏳ Attente du backend..."
for i in {1..15}; do
    if curl -s http://localhost:8000/docs > /dev/null 2>&1; then
        echo "✅ Backend actif (FastAPI docs chargées)"
        break
    fi
    if [ $i -eq 15 ]; then
        echo "⚠️  Backend lent à démarrer, mais continue..."
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
echo "✨ AVA est lancée en mode DIVINE! ✨"
echo "===================================="
echo "🔧 Backend API:  http://localhost:8000/docs"
echo "🎨 Frontend:     http://localhost:3000"
echo "📧 Resend:       Configuré (email notifications actives)"
echo "🗄️  Database:     PostgreSQL (migrations à jour)"
echo ""
echo "💡 Appuie sur Ctrl+C pour arrêter proprement"

# Attendre et cleanup
trap "echo '\n🛑 Arrêt graceful...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; sleep 2; echo '✅ Arrêt complet'; exit 0" SIGINT SIGTERM
wait
