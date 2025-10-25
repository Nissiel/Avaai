#!/bin/bash

# 🔥 DIVINE TEST SCRIPT - Test Vapi Assistant Update

echo "🔥 DIVINE TEST: Testing Vapi Assistant Update"
echo "=============================================="
echo ""

# 1. Get current config
echo "📋 Step 1: Getting current configuration..."
CONFIG=$(curl -s http://localhost:8000/api/v1/studio/config)
echo "$CONFIG" | jq '.'
echo ""

ASSISTANT_ID=$(echo "$CONFIG" | jq -r '.vapiAssistantId')
echo "🆔 Current Assistant ID: $ASSISTANT_ID"
echo ""

# 2. Trigger sync
echo "🔄 Step 2: Triggering Vapi sync..."
SYNC_RESULT=$(curl -s -X POST http://localhost:8000/api/v1/studio/sync-vapi)
echo "$SYNC_RESULT" | jq '.'
echo ""

ACTION=$(echo "$SYNC_RESULT" | jq -r '.action')
NEW_ASSISTANT_ID=$(echo "$SYNC_RESULT" | jq -r '.assistantId')

echo ""
echo "=============================================="
if [ "$ACTION" = "updated" ]; then
    echo "✅ SUCCESS: Assistant UPDATED (not created)"
    echo "   🆔 Assistant ID: $NEW_ASSISTANT_ID"
    if [ "$ASSISTANT_ID" = "$NEW_ASSISTANT_ID" ]; then
        echo "   ✅ Same ID confirmed - UPDATE successful!"
    else
        echo "   ⚠️  WARNING: ID changed - this should be an update!"
    fi
elif [ "$ACTION" = "created" ]; then
    echo "🆕 INFO: New assistant CREATED"
    echo "   🆔 New Assistant ID: $NEW_ASSISTANT_ID"
else
    echo "❌ FAILED: Sync did not complete"
fi
echo "=============================================="
