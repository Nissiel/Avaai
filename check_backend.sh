#!/bin/bash
# 🔥 DIVINE - Quick Backend Health Check

API_URL="https://ava-api-production.onrender.com"

echo "🔍 Checking AVA Backend Status..."
echo "=================================="
echo ""

# Test 1: Status endpoint
echo "📡 Test 1: Status Endpoint"
RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/api/v1/runtime/status")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ Status: $BODY"
    echo "   ✅ HTTP: $HTTP_CODE"
else
    echo "   ❌ Failed - HTTP: $HTTP_CODE"
    exit 1
fi

echo ""

# Test 2: Response time
echo "⚡ Test 2: Response Time"
TIME=$(curl -s -o /dev/null -w "%{time_total}" "$API_URL/api/v1/runtime/status")
echo "   ✅ Response: ${TIME}s"

echo ""
echo "=================================="
echo "✅ Backend is UP and RUNNING! 🚀"
echo "=================================="
