#!/bin/bash
# Script de setup automatique pour Sarah.AI Assistant Téléphonique

echo "🚀 Setup automatique de Sarah.AI..."
echo "=================================="

# Vérifier si Homebrew est installé
if ! command -v brew &> /dev/null; then
    echo "📦 Installation de Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    eval "$(/opt/homebrew/bin/brew shellenv)"
fi

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo "📦 Installation de Node.js..."
    brew install node
fi

# Vérifier si ngrok est installé
if ! command -v ngrok &> /dev/null; then
    echo "🌐 Installation de ngrok..."
    brew install ngrok/ngrok/ngrok
fi

# Installer les dépendances du webapp
echo "📱 Installation des dépendances webapp..."
cd webapp
npm install
cd ..

# Installer les dépendances du websocket-server
echo "🔗 Installation des dépendances websocket-server..."
cd websocket-server
npm install
cd ..

echo "✅ Setup terminé! Utilisez './start.sh' pour lancer tous les services."