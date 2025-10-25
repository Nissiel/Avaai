#!/bin/bash

# 🔥 DIVINE FORCE UPDATE via REST API

echo "🔥 DIVINE FORCE UPDATE"
echo "=============================================="

# Trigger sync to force update
echo "🔄 Triggering Vapi sync via backend..."
RESULT=$(curl -s -X POST http://localhost:8000/api/v1/studio/sync-vapi)

echo "$RESULT" | python3 -m json.tool

ACTION=$(echo "$RESULT" | python3 -c "import sys, json; print(json.load(sys.stdin).get('action', 'unknown'))")
ASSISTANT_ID=$(echo "$RESULT" | python3 -c "import sys, json; print(json.load(sys.stdin).get('assistantId', 'unknown'))")
MESSAGE=$(echo "$RESULT" | python3 -c "import sys, json; print(json.load(sys.stdin).get('message', 'unknown'))")

echo ""
echo "=============================================="
if [ "$ACTION" = "updated" ]; then
    echo "✅ SUCCESS: Assistant UPDATED"
    echo "   🆔 ID: $ASSISTANT_ID"
    echo "   📝 $MESSAGE"
elif [ "$ACTION" = "created" ]; then
    echo "⚠️  WARNING: New assistant CREATED (should have updated!)"
    echo "   🆔 ID: $ASSISTANT_ID"
else
    echo "❌ FAILED"
fi
echo "=============================================="

echo ""
echo "🧪 TEST NOW:"
echo "   1. Call your Vapi number"
echo "   2. AVA should speak PERFECT French (Charlotte voice)"
echo "   3. She should NOT repeat herself"
echo "   4. She should understand French perfectly"
