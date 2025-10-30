#!/bin/bash

API_URL="https://ava-api-production.onrender.com"
EMAIL="test_$(date +%s)@example.com"
PASSWORD="SecurePass123!"

echo "🧪 Testing Vapi Save Flow..."
echo ""

# Step 1: Signup (FIXED: use 'name' not 'full_name')
echo "📝 Step 1: Creating new user..."
SIGNUP_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"name\":\"Test User\"}")

echo "Signup response: $SIGNUP_RESPONSE"
TOKEN=$(echo $SIGNUP_RESPONSE | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get token"
  exit 1
fi

echo "✅ Token obtained: ${TOKEN:0:20}..."
echo ""

# Step 2: Save Vapi key
echo "💾 Step 2: Saving Vapi API key..."
VAPI_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/vapi-settings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"vapi_api_key":"test_vapi_key_123456789"}' \
  -w "\nHTTP_CODE:%{http_code}")

echo "Vapi save response: $VAPI_RESPONSE"
HTTP_CODE=$(echo "$VAPI_RESPONSE" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Vapi key saved successfully!"
else
  echo "❌ Failed to save Vapi key (HTTP $HTTP_CODE)"
  exit 1
fi

echo ""

# Step 3: Retrieve Vapi settings
echo "📖 Step 3: Retrieving Vapi settings..."
GET_RESPONSE=$(curl -s -X GET "$API_URL/api/v1/vapi-settings" \
  -H "Authorization: Bearer $TOKEN")

echo "Vapi get response: $GET_RESPONSE"

if echo "$GET_RESPONSE" | grep -q "has_vapi_key.*true"; then
  echo "✅ Vapi key retrieved successfully!"
else
  echo "❌ Failed to retrieve Vapi key"
  exit 1
fi

echo ""
echo "🎉 ALL TESTS PASSED!"
