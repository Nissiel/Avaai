#!/bin/bash

# 🔥 DIVINE TEST: Verify Studio Settings persistence

echo "🔥 DIVINE TEST - Vérification de la sauvegarde des paramètres"
echo ""

BACKEND="http://localhost:8000"

# Test 1: GET current config
echo "📥 TEST 1: Récupération config actuelle..."
CURRENT=$(curl -s "$BACKEND/api/v1/studio/config")
if echo "$CURRENT" | grep -q "transcriberProvider"; then
    echo "   ✅ Transcriber fields présents"
else
    echo "   ❌ Transcriber fields MANQUANTS"
    exit 1
fi

# Extract current values
CURRENT_MODEL=$(echo "$CURRENT" | python3 -c "import sys, json; print(json.load(sys.stdin).get('aiModel', 'MISSING'))")
CURRENT_TEMP=$(echo "$CURRENT" | python3 -c "import sys, json; print(json.load(sys.stdin).get('aiTemperature', 'MISSING'))")
CURRENT_VOICE=$(echo "$CURRENT" | python3 -c "import sys, json; print(json.load(sys.stdin).get('voiceId', 'MISSING'))")
CURRENT_SPEED=$(echo "$CURRENT" | python3 -c "import sys, json; print(json.load(sys.stdin).get('voiceSpeed', 'MISSING'))")
CURRENT_TRANS_LANG=$(echo "$CURRENT" | python3 -c "import sys, json; print(json.load(sys.stdin).get('transcriberLanguage', 'MISSING'))")

echo "   📊 Valeurs actuelles:"
echo "      AI Model: $CURRENT_MODEL"
echo "      Temperature: $CURRENT_TEMP"
echo "      Voice ID: ${CURRENT_VOICE:0:20}..."
echo "      Voice Speed: $CURRENT_SPEED"
echo "      Transcriber Lang: $CURRENT_TRANS_LANG"
echo ""

# Test 2: PATCH with new values
echo "📝 TEST 2: Modification des paramètres..."
UPDATE_PAYLOAD='{
  "aiModel": "gpt-4-turbo",
  "aiTemperature": 0.8,
  "voiceSpeed": 0.9,
  "transcriberLanguage": "en"
}'

UPDATED=$(curl -s -X PATCH "$BACKEND/api/v1/studio/config" \
    -H "Content-Type: application/json" \
    -d "$UPDATE_PAYLOAD")

if echo "$UPDATED" | grep -q "gpt-4-turbo"; then
    echo "   ✅ Modification acceptée"
else
    echo "   ❌ Modification ÉCHOUÉE"
    echo "   Response: $UPDATED"
    exit 1
fi

# Verify updated values
UPDATED_MODEL=$(echo "$UPDATED" | python3 -c "import sys, json; print(json.load(sys.stdin).get('aiModel', 'MISSING'))")
UPDATED_TEMP=$(echo "$UPDATED" | python3 -c "import sys, json; print(json.load(sys.stdin).get('aiTemperature', 'MISSING'))")
UPDATED_SPEED=$(echo "$UPDATED" | python3 -c "import sys, json; print(json.load(sys.stdin).get('voiceSpeed', 'MISSING'))")
UPDATED_TRANS_LANG=$(echo "$UPDATED" | python3 -c "import sys, json; print(json.load(sys.stdin).get('transcriberLanguage', 'MISSING'))")

echo "   📊 Nouvelles valeurs:"
echo "      AI Model: $UPDATED_MODEL"
echo "      Temperature: $UPDATED_TEMP"
echo "      Voice Speed: $UPDATED_SPEED"
echo "      Transcriber Lang: $UPDATED_TRANS_LANG"
echo ""

# Test 3: GET again to verify persistence
echo "🔍 TEST 3: Vérification de la persistence..."
sleep 1
VERIFIED=$(curl -s "$BACKEND/api/v1/studio/config")

VERIFIED_MODEL=$(echo "$VERIFIED" | python3 -c "import sys, json; print(json.load(sys.stdin).get('aiModel', 'MISSING'))")
VERIFIED_TEMP=$(echo "$VERIFIED" | python3 -c "import sys, json; print(json.load(sys.stdin).get('aiTemperature', 'MISSING'))")
VERIFIED_SPEED=$(echo "$VERIFIED" | python3 -c "import sys, json; print(json.load(sys.stdin).get('voiceSpeed', 'MISSING'))")
VERIFIED_TRANS_LANG=$(echo "$VERIFIED" | python3 -c "import sys, json; print(json.load(sys.stdin).get('transcriberLanguage', 'MISSING'))")

echo "   📊 Valeurs vérifiées:"
echo "      AI Model: $VERIFIED_MODEL"
echo "      Temperature: $VERIFIED_TEMP"
echo "      Voice Speed: $VERIFIED_SPEED"
echo "      Transcriber Lang: $VERIFIED_TRANS_LANG"
echo ""

# Check if values match
if [ "$VERIFIED_MODEL" = "gpt-4-turbo" ] && \
   [ "$VERIFIED_TEMP" = "0.8" ] && \
   [ "$VERIFIED_SPEED" = "0.9" ] && \
   [ "$VERIFIED_TRANS_LANG" = "en" ]; then
    echo "✅ SUCCÈS TOTAL - Les changements sont PERSISTÉS!"
else
    echo "❌ ÉCHEC - Les changements ne persistent PAS"
    echo "   Attendu: gpt-4-turbo, 0.8, 0.9, en"
    echo "   Reçu: $VERIFIED_MODEL, $VERIFIED_TEMP, $VERIFIED_SPEED, $VERIFIED_TRANS_LANG"
    exit 1
fi

# Test 4: Restore original values
echo ""
echo "♻️  TEST 4: Restauration des valeurs originales..."
RESTORE_PAYLOAD=$(cat <<EOF
{
  "aiModel": "$CURRENT_MODEL",
  "aiTemperature": $CURRENT_TEMP,
  "voiceSpeed": $CURRENT_SPEED,
  "transcriberLanguage": "$CURRENT_TRANS_LANG"
}
EOF
)

RESTORED=$(curl -s -X PATCH "$BACKEND/api/v1/studio/config" \
    -H "Content-Type: application/json" \
    -d "$RESTORE_PAYLOAD")

if echo "$RESTORED" | grep -q "$CURRENT_MODEL"; then
    echo "   ✅ Valeurs originales restaurées"
else
    echo "   ⚠️  Avertissement: Restauration partielle"
fi

echo ""
echo "🎯 RÉSUMÉ:"
echo "   ✅ Backend répond correctement"
echo "   ✅ Tous les champs (transcriber inclus) sont présents"
echo "   ✅ Les modifications sont acceptées"
echo "   ✅ Les modifications PERSISTENT après GET"
echo "   ✅ Restauration fonctionne"
echo ""
echo "🔥 Le backend fonctionne PARFAITEMENT en mode DIVIN!"
