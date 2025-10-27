#!/bin/bash

# 🔥 ULTRA DIVINE UPDATE: Switch to Azure Neural Voices

echo "🔥 ULTRA DIVINE UPDATE - Switching to Azure Neural Voices"
echo ""
echo "Azure Neural = Most natural French voices available!"
echo ""

# Get backend URL
BACKEND_URL="http://localhost:8000"

# Test if backend is running
if ! curl -s "$BACKEND_URL/api/v1/studio/config" > /dev/null 2>&1; then
    echo "❌ Backend not running on port 8000"
    echo "   Start it with: cd api && python3.11 -m uvicorn main:app --reload --port 8000"
    exit 1
fi

# Sync config with Azure Neural Voices
echo "📡 Syncing assistant with Azure Neural Voice (Denise)..."
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
    echo "🎤 Voice configured:"
    echo "   Provider: Azure"
    echo "   Voice: fr-FR-DeniseNeural (Denise - Ultra naturelle)"
    echo "   Speed: 1.0x (natural flow)"
    echo ""
    echo "🎧 Transcriber:"
    echo "   Provider: Deepgram"
    echo "   Model: nova-2"
    echo "   Language: French"
    echo ""
    echo "💬 Messages:"
    echo "   First: Bonjour, ici Ava. Ravie de vous parler aujourd'hui..."
    echo "   Prompt: Ton chaleureux, fluide et sans accent"
    echo ""
    echo "🎯 AVA parle maintenant avec une voix ULTRA NATURELLE!"
    echo "   Coût: ~$0.078/min (vs $0.362/min avec ElevenLabs) 💰"
else
    echo ""
    echo "❌ FAILED"
    echo "Response: $RESPONSE"
    exit 1
fi
