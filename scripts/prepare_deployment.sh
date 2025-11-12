#!/bin/bash

# ⚔️ DIVINE DEPLOYMENT PREPARATION — Phase 1 Pre-Deployment Checklist
#
# Purpose: Automate pre-deployment validation from PHASE1_MIGRATION_RUNBOOK.md
# Usage: ./scripts/prepare_deployment.sh
#
# This script validates all 30 checklist items before deployment

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

CHECKLIST_RESULTS="./deployment_checklist_$(date +%Y%m%d_%H%M%S).md"

echo -e "${BLUE}⚔️ DIVINE DEPLOYMENT PREPARATION${NC}"
echo -e "${BLUE}Pre-Deployment Checklist Validation${NC}"
echo ""

# Initialize checklist file
cat > "${CHECKLIST_RESULTS}" << 'EOF'
# 🚀 Pre-Deployment Checklist Results

**Date:** $(date +"%B %d, %Y %H:%M:%S")
**Phase:** 1 - HTTP Unification & Error Handling

---

## ✅ Validation Results

EOF

PASS_COUNT=0
FAIL_COUNT=0

check_item() {
    local item="$1"
    local command="$2"
    local expected="$3"
    
    echo -ne "${YELLOW}Checking: ${item}...${NC} "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
        echo "- [x] **${item}** ✅" >> "${CHECKLIST_RESULTS}"
        ((PASS_COUNT++))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        echo "- [ ] **${item}** ❌ - ${expected}" >> "${CHECKLIST_RESULTS}"
        ((FAIL_COUNT++))
        return 1
    fi
}

check_manual() {
    local item="$1"
    echo "- [ ] **${item}** ⚠️ - Manual verification required" >> "${CHECKLIST_RESULTS}"
    echo -e "${YELLOW}⚠️  Manual check: ${item}${NC}"
}

# ============================================================================
# ENVIRONMENT VALIDATION
# ============================================================================

echo -e "${BLUE}📋 1. Environment Validation${NC}"
echo "" >> "${CHECKLIST_RESULTS}"
echo "### Environment" >> "${CHECKLIST_RESULTS}"
echo "" >> "${CHECKLIST_RESULTS}"

check_item "Python 3.11+ installed" "python3.11 --version" "Install Python 3.11"
check_item "Node.js 18+ installed" "node --version | grep -E 'v(1[8-9]|2[0-9])'" "Install Node.js 18+"
check_item "npm/yarn available" "command -v npm" "Install npm"
check_item "Git repository clean" "git diff-index --quiet HEAD --" "Commit all changes"

echo ""

# ============================================================================
# BACKEND VALIDATION
# ============================================================================

echo -e "${BLUE}📋 2. Backend Validation${NC}"
echo "" >> "${CHECKLIST_RESULTS}"
echo "### Backend" >> "${CHECKLIST_RESULTS}"
echo "" >> "${CHECKLIST_RESULTS}"

if [ -f "api/requirements.txt" ]; then
    check_item "Backend dependencies file exists" "test -f api/requirements.txt" "Create requirements.txt"
    check_manual "All Python packages installed (pip install -r requirements.txt)"
else
    echo -e "${RED}❌ api/requirements.txt not found${NC}"
    ((FAIL_COUNT++))
fi

if [ -f "api/.env" ]; then
    check_item "Backend .env file exists" "test -f api/.env" "Create .env from .env.example"
    check_manual "Environment variables validated (DATABASE_URL, JWT_SECRET, etc.)"
else
    echo -e "${YELLOW}⚠️  api/.env not found - using defaults${NC}"
    check_manual "Backend .env file configuration"
fi

check_manual "Database migrations applied (alembic upgrade head)"
check_manual "API server starts successfully (uvicorn src.core.app:app)"

echo ""

# ============================================================================
# FRONTEND VALIDATION
# ============================================================================

echo -e "${BLUE}📋 3. Frontend Validation${NC}"
echo "" >> "${CHECKLIST_RESULTS}"
echo "### Frontend" >> "${CHECKLIST_RESULTS}"
echo "" >> "${CHECKLIST_RESULTS}"

if [ -f "webapp/package.json" ]; then
    check_item "Frontend package.json exists" "test -f webapp/package.json" "Navigate to webapp directory"
    check_item "node_modules installed" "test -d webapp/node_modules" "Run npm install"
else
    echo -e "${RED}❌ webapp/package.json not found${NC}"
    ((FAIL_COUNT++))
fi

if [ -f "webapp/.env.local" ]; then
    check_item "Frontend .env.local exists" "test -f webapp/.env.local" "Create .env.local"
else
    echo -e "${YELLOW}⚠️  webapp/.env.local not found${NC}"
    check_manual "Frontend environment variables configured"
fi

check_manual "Frontend builds successfully (npm run build)"
check_manual "TypeScript compiles without errors (npm run type-check)"

echo ""

# ============================================================================
# TESTING VALIDATION
# ============================================================================

echo -e "${BLUE}📋 4. Testing Validation${NC}"
echo "" >> "${CHECKLIST_RESULTS}"
echo "### Testing" >> "${CHECKLIST_RESULTS}"
echo "" >> "${CHECKLIST_RESULTS}"

if [ -f "api/tests/test_phase1_integration.py" ]; then
    check_item "Integration tests exist" "test -f api/tests/test_phase1_integration.py" "Tests not found"
    check_manual "All tests passing (pytest api/tests/test_phase1_integration.py)"
else
    echo -e "${YELLOW}⚠️  Integration tests not found${NC}"
fi

check_manual "Smoke tests passed in staging environment"
check_manual "Critical user flows verified (auth, settings save, etc.)"

echo ""

# ============================================================================
# DOCUMENTATION VALIDATION
# ============================================================================

echo -e "${BLUE}📋 5. Documentation Validation${NC}"
echo "" >> "${CHECKLIST_RESULTS}"
echo "### Documentation" >> "${CHECKLIST_RESULTS}"
echo "" >> "${CHECKLIST_RESULTS}"

check_item "Phase 1 benchmarks documented" "test -f docs/PHASE1_BENCHMARKS.md" "Run benchmarks"
check_item "Migration runbook exists" "test -f docs/PHASE1_MIGRATION_RUNBOOK.md" "Runbook missing"
check_item "Error handling docs exist" "test -f docs/ERROR_HANDLING.md" "Documentation missing"
check_item "Divine completion report exists" "test -f docs/PHASE1_DIVINE_COMPLETION_REPORT.md" "Report missing"

echo ""

# ============================================================================
# BACKUP & ROLLBACK VALIDATION
# ============================================================================

echo -e "${BLUE}📋 6. Backup & Rollback${NC}"
echo "" >> "${CHECKLIST_RESULTS}"
echo "### Backup & Rollback" >> "${CHECKLIST_RESULTS}"
echo "" >> "${CHECKLIST_RESULTS}"

check_manual "Database backup created and verified"
check_manual "Current production version tagged in git"
check_manual "Rollback procedure documented and understood"
check_manual "Team notified of deployment window"

echo ""

# ============================================================================
# MONITORING & OBSERVABILITY
# ============================================================================

echo -e "${BLUE}📋 7. Monitoring & Observability${NC}"
echo "" >> "${CHECKLIST_RESULTS}"
echo "### Monitoring" >> "${CHECKLIST_RESULTS}"
echo "" >> "${CHECKLIST_RESULTS}"

check_manual "Logging configured (correlation IDs in all requests)"
check_manual "Error tracking set up (Sentry/similar)"
check_manual "Monitoring dashboards prepared"
check_manual "Alert rules configured for P0/P1 issues"

echo ""

# ============================================================================
# SECURITY VALIDATION
# ============================================================================

echo -e "${BLUE}📋 8. Security${NC}"
echo "" >> "${CHECKLIST_RESULTS}"
echo "### Security" >> "${CHECKLIST_RESULTS}"
echo "" >> "${CHECKLIST_RESULTS}"

check_manual "No secrets in code (API keys, passwords, tokens)"
check_manual "Environment variables secured"
check_manual "CORS configured correctly"
check_manual "Rate limiting enabled"
check_manual "SQL injection protection verified"

echo ""

# ============================================================================
# SUMMARY
# ============================================================================

echo "" >> "${CHECKLIST_RESULTS}"
echo "---" >> "${CHECKLIST_RESULTS}"
echo "" >> "${CHECKLIST_RESULTS}"
echo "## 📊 Summary" >> "${CHECKLIST_RESULTS}"
echo "" >> "${CHECKLIST_RESULTS}"
echo "- **Automated Checks Passed:** ${PASS_COUNT}" >> "${CHECKLIST_RESULTS}"
echo "- **Automated Checks Failed:** ${FAIL_COUNT}" >> "${CHECKLIST_RESULTS}"
echo "- **Manual Verification Required:** See items marked ⚠️ above" >> "${CHECKLIST_RESULTS}"
echo "" >> "${CHECKLIST_RESULTS}"

if [ $FAIL_COUNT -eq 0 ]; then
    echo "### ✅ Deployment Status: READY (pending manual verifications)" >> "${CHECKLIST_RESULTS}"
    echo "" >> "${CHECKLIST_RESULTS}"
    echo "Proceed with deployment following PHASE1_MIGRATION_RUNBOOK.md" >> "${CHECKLIST_RESULTS}"
    echo "" >> "${CHECKLIST_RESULTS}"
    
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ Automated Checks Passed!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  Complete manual verifications before deployment${NC}"
    echo ""
else
    echo "### ⚠️ Deployment Status: NOT READY" >> "${CHECKLIST_RESULTS}"
    echo "" >> "${CHECKLIST_RESULTS}"
    echo "Fix failed checks before proceeding with deployment." >> "${CHECKLIST_RESULTS}"
    echo "" >> "${CHECKLIST_RESULTS}"
    
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}⚠️  ${FAIL_COUNT} Automated Checks Failed${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}Fix issues before deployment${NC}"
    echo ""
fi

echo -e "${BLUE}📋 Full checklist saved to: ${CHECKLIST_RESULTS}${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "1. Review checklist: cat ${CHECKLIST_RESULTS}"
echo -e "2. Complete manual verifications"
echo -e "3. Run benchmarks: ./scripts/run_benchmarks.sh"
echo -e "4. Deploy: Follow docs/PHASE1_MIGRATION_RUNBOOK.md"
echo ""

# Exit with error if checks failed
[ $FAIL_COUNT -eq 0 ] && exit 0 || exit 1
