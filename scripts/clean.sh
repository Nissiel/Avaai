#!/bin/bash

echo "🧹 Nettoyage complet d'AVA..."

# Tuer les processus
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Supprimer les caches
rm -rf webapp/.next
rm -rf webapp/node_modules/.cache
rm -rf api/__pycache__
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find . -type f -name "*.pyc" -delete 2>/dev/null || true

# Supprimer la DB de dev
rm -f ava.db

echo "✅ Nettoyage terminé!"
echo "Exécute './scripts/dev.sh' pour redémarrer"
