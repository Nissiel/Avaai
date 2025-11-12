#!/bin/bash
# ⚔️ DIVINE BACKEND DEPLOYMENT SCRIPT ⚔️
# Deploy FastAPI backend to Render with CORS validation

set -e  # Exit on error

echo "════════════════════════════════════════════════════════════════"
echo "⚔️  DIVINE BACKEND DEPLOYMENT TO RENDER"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
RENDER_SERVICE_ID="${RENDER_SERVICE_ID:-}"
RENDER_API_KEY="${RENDER_API_KEY:-}"
BACKEND_URL="https://ava-api-production.onrender.com"

echo "📝 Deployment Configuration:"
echo "   Backend URL: $BACKEND_URL"
echo "   Service ID:  ${RENDER_SERVICE_ID:-'Not set (will use manual deploy)'}"
echo ""

# Check if we can use Render API or need manual deploy
if [ -z "$RENDER_API_KEY" ] || [ -z "$RENDER_SERVICE_ID" ]; then
    echo -e "${YELLOW}⚠️  Render API credentials not found${NC}"
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "📋 MANUAL DEPLOYMENT INSTRUCTIONS:"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    echo "1. Open Render Dashboard:"
    echo "   ${BLUE}https://dashboard.render.com${NC}"
    echo ""
    echo "2. Find your service (e.g., 'ava-api-production')"
    echo ""
    echo "3. Click 'Manual Deploy' button"
    echo ""
    echo "4. Select 'Deploy latest commit' from main branch"
    echo ""
    echo "5. Wait 3-5 minutes for build to complete"
    echo ""
    echo "6. Check logs for: '🔥 CORS ALLOW LIST:'"
    echo ""
    echo "7. Verify 'https://app.avafirstai.com' appears in list"
    echo ""
    echo "8. Come back and press ENTER when deployment is complete"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    read -p "Press ENTER after deploying via Render dashboard..." 
else
    echo "🔑 Using Render API for deployment..."
    echo ""
    
    # Trigger deployment via Render API
    echo "🚀 Triggering deployment..."
    RESPONSE=$(curl -s -X POST \
        "https://api.render.com/v1/services/${RENDER_SERVICE_ID}/deploys" \
        -H "Authorization: Bearer ${RENDER_API_KEY}" \
        -H "Content-Type: application/json")
    
    DEPLOY_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -z "$DEPLOY_ID" ]; then
        echo -e "${RED}❌ Failed to trigger deployment${NC}"
        echo "Response: $RESPONSE"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Deployment triggered (ID: $DEPLOY_ID)${NC}"
    echo "⏳ Waiting for deployment to complete..."
    echo ""
    
    # Poll deployment status
    for i in {1..60}; do
        STATUS=$(curl -s "https://api.render.com/v1/services/${RENDER_SERVICE_ID}/deploys/${DEPLOY_ID}" \
            -H "Authorization: Bearer ${RENDER_API_KEY}" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
        
        echo "   Status: $STATUS (${i}/60)"
        
        if [ "$STATUS" = "live" ]; then
            echo -e "${GREEN}✅ Deployment complete!${NC}"
            break
        elif [ "$STATUS" = "failed" ] || [ "$STATUS" = "canceled" ]; then
            echo -e "${RED}❌ Deployment failed: $STATUS${NC}"
            exit 1
        fi
        
        sleep 5
    done
fi

echo ""
echo "⏳ Waiting 15 seconds for backend to fully start..."
sleep 15
echo ""

# Step 1: Verify backend is accessible
echo "🧪 Running backend validation tests..."
echo ""

echo "Test 1: Health check"
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${BACKEND_URL}/healthz)
if [ "$HEALTH_STATUS" = "200" ]; then
    echo -e "  ${GREEN}✅ Backend is alive (200)${NC}"
else
    echo -e "  ${RED}❌ Backend health check failed (${HEALTH_STATUS})${NC}"
    echo "  Check Render logs for errors"
fi

# Step 2: Test CORS headers (most critical)
echo "Test 2: CORS headers for app.avafirstai.com"
CORS_RESPONSE=$(curl -s -X OPTIONS ${BACKEND_URL}/api/v1/vapi-settings \
    -H "Origin: https://app.avafirstai.com" \
    -H "Access-Control-Request-Method: GET" \
    -i | head -30)

if echo "$CORS_RESPONSE" | grep -q "access-control-allow-origin: https://app.avafirstai.com"; then
    echo -e "  ${GREEN}✅ CORS header correct for app.avafirstai.com${NC}"
else
    echo -e "  ${RED}❌ CORS header missing or incorrect${NC}"
    echo "  Expected: access-control-allow-origin: https://app.avafirstai.com"
    echo ""
    echo "  Full response:"
    echo "$CORS_RESPONSE"
    echo ""
    echo -e "  ${YELLOW}⚠️  Check Render logs - look for '🔥 CORS ALLOW LIST:'${NC}"
fi

# Step 3: Test API endpoint
echo "Test 3: API endpoint accessibility"
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${BACKEND_URL}/api/v1/health)
if [ "$API_STATUS" = "200" ] || [ "$API_STATUS" = "404" ]; then
    echo -e "  ${GREEN}✅ API routing works (${API_STATUS})${NC}"
else
    echo -e "  ${YELLOW}⚠️  API returned ${API_STATUS}${NC}"
fi

# Step 4: Check Render logs (if API available)
if [ -n "$RENDER_API_KEY" ] && [ -n "$RENDER_SERVICE_ID" ]; then
    echo ""
    echo "📋 Recent Render logs (last 50 lines):"
    echo "────────────────────────────────────────────────────────────"
    curl -s "https://api.render.com/v1/services/${RENDER_SERVICE_ID}/logs?limit=50" \
        -H "Authorization: Bearer ${RENDER_API_KEY}" | tail -20
    echo "────────────────────────────────────────────────────────────"
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo -e "${GREEN}🎉 BACKEND DEPLOYMENT COMPLETE!${NC}"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "🔍 Manual verification steps:"
echo ""
echo "1. Open Render dashboard and check logs:"
echo "   ${BLUE}https://dashboard.render.com${NC}"
echo ""
echo "2. Search logs for: '🔥 CORS ALLOW LIST:'"
echo ""
echo "3. Verify this line appears:"
echo "   • https://app.avafirstai.com"
echo ""
echo "4. If CORS list is wrong, check:"
echo "   - Environment variable: AVA_API_ALLOWED_ORIGINS"
echo "   - Code: api/src/core/middleware.py (line 43)"
echo ""
echo "5. Test CORS manually:"
echo "   curl -X OPTIONS ${BACKEND_URL}/api/v1/vapi-settings \\"
echo "     -H 'Origin: https://app.avafirstai.com' \\"
echo "     -H 'Access-Control-Request-Method: GET' -i"
echo ""
