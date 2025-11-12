#!/bin/bash
# 🔥 DIVINE FULL-STACK DIAGNOSTIC
# King's Emergency Health Check - Find what's killing the app

set -e

echo "═══════════════════════════════════════════════════════════"
echo "🔥 DIVINE DIAGNOSTIC - Full Stack Health Check"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# 1. GIT STATUS - What's deployed?
# ============================================================================
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${BLUE}1. GIT STATUS - What commits are we on?${NC}"
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Last 5 commits:"
git log --oneline -5
echo ""
echo "Current branch: $(git branch --show-current)"
echo "Uncommitted changes:"
git status --short
echo ""

# ============================================================================
# 2. BACKEND HEALTH - Is Render responding?
# ============================================================================
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${BLUE}2. BACKEND HEALTH - Render API${NC}"
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Health check
echo "Health check:"
if curl -s -w "\n" "https://ava-api-production.onrender.com/healthz" | grep -q "healthy"; then
    echo "${GREEN}✅ Backend is responding${NC}"
else
    echo "${RED}❌ Backend is NOT responding${NC}"
fi
echo ""

# Latest deployment
echo "Latest Render deployments:"
curl -s "https://api.render.com/v1/services/srv-d3vrrns9c44c738skalg/deploys?limit=3" \
  -H "Authorization: Bearer rnd_Il2IDV3qyOkyQYgb0ttLWPikIQJi" | \
  python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    for item in data[:3]:
        d = item.get('deploy', {})
        status = d.get('status', 'unknown')
        commit_id = d.get('commit', {}).get('id', 'unknown')[:7]
        message = d.get('commit', {}).get('message', 'no message').split('\n')[0][:60]
        created = d.get('createdAt', 'unknown')
        color = '\033[0;32m' if status == 'live' else '\033[1;33m' if status == 'building' else '\033[0;31m'
        print(f\"{color}{status:12}{'\033[0m'} | {commit_id} | {message}\")
except Exception as e:
    print(f'Error parsing Render API: {e}')
"
echo ""

# ============================================================================
# 3. FRONTEND HEALTH - Is Vercel responding?
# ============================================================================
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${BLUE}3. FRONTEND HEALTH - Vercel${NC}"
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "Frontend status:"
FRONTEND_STATUS=$(curl -s -I "https://app.avafirstai.com" | head -n 1)
if echo "$FRONTEND_STATUS" | grep -q "200"; then
    echo "${GREEN}✅ Frontend is responding (200 OK)${NC}"
    echo "$FRONTEND_STATUS"
else
    echo "${RED}❌ Frontend issue detected${NC}"
    echo "$FRONTEND_STATUS"
fi
echo ""

# ============================================================================
# 4. DATABASE CONNECTION - Can backend reach Supabase?
# ============================================================================
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${BLUE}4. DATABASE CONNECTION - Supabase${NC}"
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "Checking database session configuration:"
if grep -q "NullPool" api/src/infrastructure/database/session.py; then
    echo "${GREEN}✅ NullPool configured (correct for PgBouncer)${NC}"
else
    echo "${YELLOW}⚠️  Pool type may be misconfigured${NC}"
fi
echo ""

# ============================================================================
# 5. FRONTEND BUILD - Does it compile?
# ============================================================================
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${BLUE}5. FRONTEND BUILD TEST${NC}"
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd webapp
echo "Running TypeScript check..."
if npx tsc --noEmit --pretty false 2>&1 | grep -q "error"; then
    echo "${RED}❌ TypeScript errors found:${NC}"
    npx tsc --noEmit | head -20
else
    echo "${GREEN}✅ No TypeScript errors${NC}"
fi
echo ""

echo "Running ESLint on critical hooks..."
if npx eslint lib/hooks/use-auth-token.ts lib/hooks/use-vapi-status.ts lib/hooks/use-twilio-status.ts --quiet; then
    echo "${GREEN}✅ No ESLint errors in auth hooks${NC}"
else
    echo "${RED}❌ ESLint errors found${NC}"
fi
cd ..
echo ""

# ============================================================================
# 6. REACT QUERY CONFIGURATION - Are hooks correctly set up?
# ============================================================================
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${BLUE}6. REACT QUERY HOOKS AUDIT${NC}"
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "Checking useAuthToken hydration:"
if grep -q "setToken(localStorage.getItem" webapp/lib/hooks/use-auth-token.ts; then
    echo "${GREEN}✅ Token hydration on mount (correct)${NC}"
else
    echo "${RED}❌ Token hydration missing${NC}"
fi
echo ""

echo "Checking query keys (should be simple, no identity keys):"
if grep -q 'queryKey.*identityKey' webapp/lib/hooks/use-vapi-status.ts; then
    echo "${RED}❌ Identity keys found (causes race conditions)${NC}"
else
    echo "${GREEN}✅ Simple query keys (correct)${NC}"
fi
echo ""

echo "Checking enabled conditions:"
if grep -q 'enabled:.*isAuthenticated' webapp/lib/hooks/use-vapi-status.ts; then
    echo "${GREEN}✅ isAuthenticated check present${NC}"
else
    echo "${YELLOW}⚠️  May be using only !!token${NC}"
fi
echo ""

# ============================================================================
# 7. API CLIENT CONFIGURATION - Are fetch calls correct?
# ============================================================================
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${BLUE}7. API CLIENT AUDIT${NC}"
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "Checking if safeJsonParse is used:"
PARSE_COUNT=$(grep -r "safeJsonParse" webapp/lib/api/ --include="*.ts" | wc -l)
echo "safeJsonParse usage: $PARSE_COUNT files"
if [ "$PARSE_COUNT" -gt 3 ]; then
    echo "${GREEN}✅ safeJsonParse widely used${NC}"
else
    echo "${YELLOW}⚠️  Some API clients may use raw response.json()${NC}"
fi
echo ""

echo "Checking for apiFetch usage:"
APIFETCH_COUNT=$(grep -r "apiFetch" webapp/lib/api/ --include="*.ts" | wc -l)
echo "apiFetch usage: $APIFETCH_COUNT files"
if [ "$APIFETCH_COUNT" -gt 3 ]; then
    echo "${GREEN}✅ apiFetch widely used${NC}"
else
    echo "${YELLOW}⚠️  Some API clients may use raw fetch${NC}"
fi
echo ""

# ============================================================================
# 8. BACKEND ROUTES - Do they refresh user before using credentials?
# ============================================================================
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${BLUE}8. BACKEND CREDENTIAL REFRESH AUDIT${NC}"
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "Checking if routes refresh user from DB:"
REFRESH_COUNT=$(grep -r "await.*refresh(user)" api/src/presentation/api/v1/routes/ --include="*.py" | wc -l)
echo "db.refresh(user) calls: $REFRESH_COUNT"
if [ "$REFRESH_COUNT" -gt 5 ]; then
    echo "${GREEN}✅ Multiple routes refresh user (good)${NC}"
else
    echo "${YELLOW}⚠️  Some routes may use stale user object${NC}"
fi
echo ""

# ============================================================================
# 9. PERFORMANCE INDICATORS
# ============================================================================
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${BLUE}9. PERFORMANCE INDICATORS${NC}"
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "Testing backend response time:"
START_TIME=$(date +%s%N)
curl -s "https://ava-api-production.onrender.com/healthz" > /dev/null
END_TIME=$(date +%s%N)
RESPONSE_TIME=$(( ($END_TIME - $START_TIME) / 1000000 ))
if [ "$RESPONSE_TIME" -lt 500 ]; then
    echo "${GREEN}✅ Backend response: ${RESPONSE_TIME}ms (fast)${NC}"
elif [ "$RESPONSE_TIME" -lt 2000 ]; then
    echo "${YELLOW}⚠️  Backend response: ${RESPONSE_TIME}ms (slow)${NC}"
else
    echo "${RED}❌ Backend response: ${RESPONSE_TIME}ms (very slow!)${NC}"
fi
echo ""

echo "Testing frontend response time:"
START_TIME=$(date +%s%N)
curl -s -I "https://app.avafirstai.com" > /dev/null
END_TIME=$(date +%s%N)
RESPONSE_TIME=$(( ($END_TIME - $START_TIME) / 1000000 ))
if [ "$RESPONSE_TIME" -lt 500 ]; then
    echo "${GREEN}✅ Frontend response: ${RESPONSE_TIME}ms (fast)${NC}"
elif [ "$RESPONSE_TIME" -lt 2000 ]; then
    echo "${YELLOW}⚠️  Frontend response: ${RESPONSE_TIME}ms (slow)${NC}"
else
    echo "${RED}❌ Frontend response: ${RESPONSE_TIME}ms (very slow!)${NC}"
fi
echo ""

# ============================================================================
# 10. SUMMARY & RECOMMENDATIONS
# ============================================================================
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${BLUE}10. DIVINE VERDICT${NC}"
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "${YELLOW}Next steps:${NC}"
echo "1. Check browser console for specific errors"
echo "2. Open DevTools → Network tab → See which requests are slow"
echo "3. Check Render logs: https://dashboard.render.com/web/srv-d3vrrns9c44c738skalg/logs"
echo "4. Check Vercel logs: https://vercel.com/nissiel/avaai/logs"
echo ""
echo "${BLUE}If everything above is green, the issue may be:${NC}"
echo "- Browser cache (try hard refresh: Cmd+Shift+R)"
echo "- React Query stale data (clear localStorage)"
echo "- Network issue (check your connection)"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "🔥 DIAGNOSTIC COMPLETE"
echo "═══════════════════════════════════════════════════════════"
