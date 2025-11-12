#!/bin/bash
# ⚔️ DIVINE FRONTEND DEPLOYMENT SCRIPT ⚔️
# Deploy webapp to Vercel with automated tests

set -e  # Exit on error

echo "════════════════════════════════════════════════════════════════"
echo "⚔️  DIVINE FRONTEND DEPLOYMENT TO VERCEL"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Navigate to webapp directory
cd "$(dirname "$0")/../webapp" || exit 1

echo "📁 Current directory: $(pwd)"
echo ""

# Step 1: Check if Vercel CLI is installed
echo "🔍 Checking Vercel CLI installation..."
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not found${NC}"
    echo "📦 Installing Vercel CLI globally..."
    npm install -g vercel
    echo -e "${GREEN}✅ Vercel CLI installed${NC}"
else
    echo -e "${GREEN}✅ Vercel CLI found${NC}"
fi
echo ""

# Step 2: Build frontend locally (verify no errors)
echo "🏗️  Building frontend locally..."
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed - aborting deployment${NC}"
    exit 1
fi
echo ""

# Step 3: Deploy to Vercel
echo "🚀 Deploying to Vercel production..."
echo "   (This will use your Vercel token from 'vercel login')"
echo ""
vercel --prod

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Deployment successful!${NC}"
else
    echo ""
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi
echo ""

# Step 4: Wait for deployment to propagate
echo "⏳ Waiting 10 seconds for deployment to propagate..."
sleep 10
echo ""

# Step 5: Run smoke tests
echo "🧪 Running smoke tests..."
echo ""

# Test 1: Homepage loads
echo "Test 1: Homepage accessibility"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://app.avafirstai.com)
if [ "$STATUS" = "200" ]; then
    echo -e "  ${GREEN}✅ Homepage loads (200)${NC}"
else
    echo -e "  ${RED}❌ Homepage failed (${STATUS})${NC}"
fi

# Test 2: API config route exists
echo "Test 2: API config route"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://app.avafirstai.com/api/config -H "Cookie: access_token=test")
if [ "$STATUS" = "200" ] || [ "$STATUS" = "401" ] || [ "$STATUS" = "403" ]; then
    echo -e "  ${GREEN}✅ Config route exists (${STATUS})${NC}"
else
    echo -e "  ${YELLOW}⚠️  Config route returned ${STATUS} (expected 200/401/403)${NC}"
fi

# Test 3: Vapi settings proxy
echo "Test 3: Vapi settings proxy"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://app.avafirstai.com/api/vapi-settings -H "Cookie: access_token=test")
if [ "$STATUS" = "200" ] || [ "$STATUS" = "401" ] || [ "$STATUS" = "403" ]; then
    echo -e "  ${GREEN}✅ Vapi proxy exists (${STATUS})${NC}"
else
    echo -e "  ${YELLOW}⚠️  Vapi proxy returned ${STATUS} (expected 200/401/403)${NC}"
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo -e "${GREEN}🎉 FRONTEND DEPLOYMENT COMPLETE!${NC}"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "1. Open https://app.avafirstai.com in browser"
echo "2. Check DevTools console for errors"
echo "3. Test Settings page: /studio/configuration"
echo "4. Verify no CORS errors in Network tab"
echo ""
