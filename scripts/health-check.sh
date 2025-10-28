#!/bin/bash

# 🚀 Quick Health Check Script for Ava.ai Production
# Usage: ./scripts/health-check.sh

set -e

echo "🏥 Ava.ai Health Check"
echo "===================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Backend URL
BACKEND_URL="https://ava-api-production.onrender.com"

# Check if frontend URL is provided
if [ -z "$1" ]; then
    echo -e "${YELLOW}⚠️  Frontend URL not provided${NC}"
    echo "Usage: ./scripts/health-check.sh <FRONTEND_URL>"
    echo "Example: ./scripts/health-check.sh https://avaai.vercel.app"
    echo ""
    echo "Checking backend only..."
    echo ""
fi

FRONTEND_URL="${1:-}"

# Function to check endpoint
check_endpoint() {
    local url=$1
    local name=$2
    
    echo -n "Checking $name... "
    
    if curl -s -f -o /dev/null -w "%{http_code}" "$url" | grep -q "200\|301\|302\|307"; then
        echo -e "${GREEN}✅ OK${NC}"
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}"
        return 1
    fi
}

# Function to check JSON response
check_json() {
    local url=$1
    local name=$2
    local expected=$3
    
    echo -n "Checking $name... "
    
    response=$(curl -s "$url")
    
    if echo "$response" | grep -q "$expected"; then
        echo -e "${GREEN}✅ OK${NC}"
        echo "   Response: $response"
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}"
        echo "   Response: $response"
        return 1
    fi
}

echo "📡 Backend API Checks"
echo "---------------------"

# Health check
check_json "$BACKEND_URL/healthz" "Health endpoint" "ok"

# API docs
check_endpoint "$BACKEND_URL/docs" "API documentation"

# Auth endpoints (should return 422 or 400 for missing body, not 500)
echo -n "Checking signup endpoint... "
status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BACKEND_URL/api/v1/auth/signup" -H "Content-Type: application/json")
if [ "$status" == "422" ] || [ "$status" == "400" ]; then
    echo -e "${GREEN}✅ OK${NC} (status: $status)"
else
    echo -e "${RED}❌ FAILED${NC} (status: $status, expected 422 or 400)"
fi

echo -n "Checking login endpoint... "
status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BACKEND_URL/api/v1/auth/login" -H "Content-Type: application/json")
if [ "$status" == "422" ] || [ "$status" == "400" ]; then
    echo -e "${GREEN}✅ OK${NC} (status: $status)"
else
    echo -e "${RED}❌ FAILED${NC} (status: $status, expected 422 or 400)"
fi

echo ""

if [ -n "$FRONTEND_URL" ]; then
    echo "🌐 Frontend Checks"
    echo "------------------"
    
    # Root redirect
    check_endpoint "$FRONTEND_URL/" "Root page"
    
    # Locales
    check_endpoint "$FRONTEND_URL/en" "English locale"
    check_endpoint "$FRONTEND_URL/fr" "French locale"
    check_endpoint "$FRONTEND_URL/he" "Hebrew locale"
    
    # Auth pages
    check_endpoint "$FRONTEND_URL/en/login" "Login page"
    check_endpoint "$FRONTEND_URL/en/signup" "Signup page"
    
    echo ""
fi

echo "🔐 Database Check"
echo "-----------------"
echo -n "Testing database connection... "

# Try to login with a test (should fail with 401 for wrong credentials, not 500)
status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BACKEND_URL/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"nonexistent@test.com","password":"wrong"}')

if [ "$status" == "401" ] || [ "$status" == "422" ]; then
    echo -e "${GREEN}✅ OK${NC} (DB responding, status: $status)"
else
    echo -e "${RED}❌ FAILED${NC} (status: $status, expected 401 or 422)"
fi

echo ""
echo "========================"
echo -e "${GREEN}✅ Health check complete!${NC}"
echo ""

# Display summary
echo "📊 Quick Stats"
echo "--------------"
echo "Backend URL: $BACKEND_URL"
if [ -n "$FRONTEND_URL" ]; then
    echo "Frontend URL: $FRONTEND_URL"
fi
echo ""

# Next steps
echo "🎯 Next Steps:"
echo "1. Visit frontend in browser and test signup flow"
echo "2. Check Vercel deployment: https://vercel.com/nissiel/avaai"
echo "3. Check Render logs: https://dashboard.render.com"
echo "4. Monitor Supabase: https://supabase.com/dashboard"
echo ""
echo "📖 Full checklist: ./DEPLOYMENT_CHECKLIST.md"
