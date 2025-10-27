#!/bin/bash

# 🔧 PLOMBIER UPDATE: Configure Ava as Monsieur Cohen's secretary

echo "🔧 PLOMBIER SETUP - Configuring Ava as plumber secretary"
echo ""
echo "Ava will now be the perfect secretary for a plumber!"
echo ""

# Get backend URL
BACKEND_URL="http://localhost:8000"

# Test if backend is running
if ! curl -s "$BACKEND_URL/api/v1/studio/config" > /dev/null 2>&1; then
    echo "❌ Backend not running on port 8000"
    echo "   Start it with: cd api && python3.11 -m uvicorn main:app --reload --port 8000"
    exit 1
fi

# Sync config with plumber persona
echo "📡 Syncing assistant with plumber secretary persona..."
RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/v1/studio/sync-vapi" \
    -H "Content-Type: application/json")

# Check response
if echo "$RESPONSE" | grep -q "assistantId"; then
    ASSISTANT_ID=$(echo "$RESPONSE" | grep -o '"assistantId":"[^"]*"' | cut -d'"' -f4)
    ACTION=$(echo "$RESPONSE" | grep -o '"action":"[^"]*"' | cut -d'"' -f4)
    
    echo ""
    echo "✅ SUCCESS!"
    echo "   Action: $ACTION"
    echo "   Assistant ID: $ASSISTANT_ID"
    echo ""
    echo "🔧 AVA Configuration:"
    echo "   Role: Secrétaire de Monsieur Cohen (Plombier)"
    echo "   First Message: 'Bonjour, ici Ava, la secrétaire de Monsieur Cohen, plombier...'"
    echo ""
    echo "📋 Services proposés:"
    echo "   • Fuites d'eau"
    echo "   • Réparation robinets/WC"
    echo "   • Installation sanitaire"
    echo "   • Chauffe-eau"
    echo "   • Dépannage urgence 24/7"
    echo ""
    echo "🎤 Voice: Azure Denise (ultra naturelle)"
    echo "🎧 Transcriber: Deepgram Nova-2 (français)"
    echo "🤖 AI: GPT-4o (meilleur pour français)"
    echo ""
    echo "🎯 AVA est maintenant la secrétaire PARFAITE de plombier!"
else
    echo ""
    echo "❌ FAILED"
    echo "Response: $RESPONSE"
    exit 1
fi
