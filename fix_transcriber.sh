#!/bin/bash

# 🎧 Fix Transcriber - Ajoute Deepgram STT pour que AVA vous entende

echo "🎧 FIXING TRANSCRIBER - Adding Speech-to-Text..."
echo ""

# Get backend URL
BACKEND_URL="http://localhost:8000"

# Test if backend is running
if ! curl -s "$BACKEND_URL/api/v1/studio/config" > /dev/null 2>&1; then
    echo "❌ Backend not running on port 8000"
    echo "   Start it with: cd api && python3.11 -m uvicorn main:app --reload --port 8000"
    exit 1
fi

# Sync config with transcriber
echo "📡 Syncing assistant with Deepgram transcriber..."
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
    echo "🎧 Transcriber configured:"
    echo "   Provider: Deepgram"
    echo "   Model: nova-2 (best accuracy)"
    echo "   Language: French"
    echo ""
    echo "🎯 AVA devrait maintenant vous entendre parfaitement!"
else
    echo ""
    echo "❌ FAILED"
    echo "Response: $RESPONSE"
    exit 1
fi
