#!/bin/bash
# 🔥 DIVINE DIAGNOSTIC - Test Twilio Settings Endpoint

echo "🔍 DIVINE CODEX - Diagnostic Twilio Settings"
echo "============================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get user token (you need to replace this with your actual token)
echo "⚠️  IMPORTANT: Tu dois récupérer ton accessToken depuis la console browser:"
echo "   1. Ouvre Console (F12)"
echo "   2. Tape: localStorage.getItem('session') ou sessionStorage"
echo "   3. Copie le accessToken"
echo ""
read -p "Entre ton accessToken: " TOKEN

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Token vide, abandon${NC}"
    exit 1
fi

API_URL="https://ava-api-production.onrender.com/api/v1"

echo ""
echo "📡 Test 1: GET /twilio-settings (Vérifier status actuel)"
echo "-----------------------------------------------------------"
curl -X GET "$API_URL/twilio-settings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  -v

echo ""
echo ""
echo "📡 Test 2: POST /twilio-settings (Sauvegarder credentials)"
echo "-----------------------------------------------------------"
echo "Entre tes credentials Twilio:"
read -p "Account SID (commence par AC): " ACCOUNT_SID
read -p "Auth Token: " AUTH_TOKEN
read -p "Phone Number (+33...): " PHONE_NUMBER

curl -X POST "$API_URL/twilio-settings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"account_sid\": \"$ACCOUNT_SID\",
    \"auth_token\": \"$AUTH_TOKEN\",
    \"phone_number\": \"$PHONE_NUMBER\"
  }" \
  -w "\nHTTP Status: %{http_code}\n" \
  -v

echo ""
echo "✅ Diagnostic terminé!"
