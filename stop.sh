#!/bin/bash
# Script pour arrêter tous les services Sarah.AI

echo "🛑 Arrêt de tous les services Sarah.AI..."

# Tuer tous les processus npm et ngrok
pkill -f "npm run dev"
pkill -f "ngrok"
pkill -f "ts-node"

echo "✅ Tous les services ont été arrêtés."