#!/bin/bash

# 🔥 DIVINE DELETE TEST - Diagnostic complet de suppression d'appel

echo "🔥 DIVINE DELETE TEST - Diagnostic de suppression d'appel"
echo ""

BACKEND="http://localhost:8000"

# Step 1: Get a call ID
echo "📥 Step 1: Récupération d'un call ID..."
CALL_DATA=$(curl -s "$BACKEND/api/v1/calls?limit=1")
CALL_ID=$(echo "$CALL_DATA" | python3 -c "import sys, json; data=json.load(sys.stdin); calls=data.get('calls', []); print(calls[0]['id']) if calls else print('')")

if [ -z "$CALL_ID" ]; then
    echo "   ❌ Aucun appel trouvé dans la base"
    echo "   Crée un appel de test d'abord"
    exit 1
fi

echo "   ✅ Call ID trouvé: $CALL_ID"
echo ""

# Step 2: Test DELETE avec curl (direct backend)
echo "🧪 Step 2: Test DELETE direct backend..."
DELETE_RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "$BACKEND/api/v1/calls/$CALL_ID")
HTTP_CODE=$(echo "$DELETE_RESPONSE" | tail -n1)
BODY=$(echo "$DELETE_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "204" ]; then
    echo "   ✅ DELETE backend SUCCESS (204 No Content)"
elif [ "$HTTP_CODE" = "404" ]; then
    echo "   ❌ DELETE backend FAILED (404 Not Found)"
    echo "   Body: $BODY"
else
    echo "   ⚠️  DELETE backend response: HTTP $HTTP_CODE"
    echo "   Body: $BODY"
fi
echo ""

# Step 3: Get another call for frontend test
echo "📥 Step 3: Récupération d'un autre call pour test frontend..."
CALL_DATA=$(curl -s "$BACKEND/api/v1/calls?limit=1")
CALL_ID2=$(echo "$CALL_DATA" | python3 -c "import sys, json; data=json.load(sys.stdin); calls=data.get('calls', []); print(calls[0]['id']) if calls else print('')")

if [ -z "$CALL_ID2" ]; then
    echo "   ❌ Aucun appel trouvé"
    exit 1
fi

echo "   ✅ Call ID pour test frontend: $CALL_ID2"
echo ""

# Step 4: Instructions pour test frontend
echo "🌐 Step 4: Test FRONTEND (manuel)"
echo ""
echo "   1. Ouvre la console browser (F12)"
echo "   2. Va sur http://localhost:3000/[locale]/app/contacts/[contactId]"
echo "   3. Clique sur le bouton supprimer d'un appel"
echo "   4. Regarde les logs dans la console:"
echo "      - '🗑️ DELETE CALL REQUEST: { callId: ... }'"
echo "      - '🗑️ DELETE CALL RESPONSE: { status: ..., ok: ... }'"
echo "      - Backend logs: '🗑️ DELETE CALL ATTEMPT: ...'"
echo ""
echo "📋 DIAGNOSTIC:"
echo ""
echo "   Si HTTP 204 → ✅ Backend fonctionne"
echo "   Si HTTP 401 → ❌ Problème d'authentification (token manquant)"
echo "   Si HTTP 404 → ❌ Call ID incorrect ou tenant_id mismatch"
echo "   Si HTTP 403 → ❌ Pas les droits (mauvais tenant)"
echo ""
echo "🔍 Check backend logs:"
echo "   tail -f /tmp/backend_delete_fix.log"
echo ""
echo "🎯 RÉSUMÉ:"
if [ "$HTTP_CODE" = "204" ]; then
    echo "   ✅ Backend DELETE fonctionne parfaitement"
    echo "   ⚠️  Si le frontend échoue, c'est un problème d'auth ou de route"
else
    echo "   ❌ Backend DELETE a un problème"
    echo "   Vérifie les logs backend pour plus de détails"
fi
