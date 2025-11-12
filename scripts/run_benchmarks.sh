#!/bin/bash

# ⚔️ DIVINE BENCHMARKING SCRIPT — Phase 1 Performance Validation
# 
# Purpose: Measure frontend and backend performance to validate Phase 1 improvements
# Usage: ./scripts/run_benchmarks.sh
# 
# Requirements:
# - Frontend server running on localhost:3000
# - Backend server running on localhost:8000
# - Node.js with npm/yarn installed
# - Apache Bench (ab) installed (brew install ab on macOS)

set -e

RESULTS_DIR="./benchmark_results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RESULTS_FILE="${RESULTS_DIR}/benchmark_${TIMESTAMP}.md"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}⚔️ DIVINE BENCHMARKING — Phase 1 Performance Validation${NC}"
echo ""

# Create results directory
mkdir -p "${RESULTS_DIR}"

# Initialize results file
cat > "${RESULTS_FILE}" << 'EOF'
# 📊 Phase 1 Performance Benchmark Results

**Date:** $(date +"%B %d, %Y %H:%M:%S")
**Divine Standard:** World-class performance for production deployment

---

## 🎯 Benchmark Scope

### Frontend Performance
- Page load timing (Time to Interactive)
- Bundle size analysis
- Lighthouse scores (mobile & desktop)

### Backend Performance  
- API endpoint latency (P50/P95/P99)
- Concurrent request handling
- Error rate under load

### Success Criteria
- ✅ TTI <800ms on mobile 3G
- ✅ Bundle reduction ≥120KB
- ✅ API P95 latency <300ms
- ✅ Error rate <2%

---

EOF

echo -e "${GREEN}✅ Results directory created: ${RESULTS_DIR}${NC}"
echo ""

# ============================================================================
# FRONTEND BENCHMARKS
# ============================================================================

echo -e "${BLUE}📦 Running Frontend Benchmarks...${NC}"
echo ""

# Check if frontend is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo -e "${YELLOW}⚠️  Frontend not running on localhost:3000${NC}"
    echo -e "${YELLOW}   Start frontend with: cd webapp && npm run dev${NC}"
    echo ""
else
    echo -e "${GREEN}✅ Frontend detected on localhost:3000${NC}"
    
    # Bundle size analysis
    echo "## 📦 Bundle Size Analysis" >> "${RESULTS_FILE}"
    echo "" >> "${RESULTS_FILE}"
    
    if [ -d "webapp/.next" ]; then
        echo "### Build Output" >> "${RESULTS_FILE}"
        echo '```' >> "${RESULTS_FILE}"
        
        # Find JS bundles
        find webapp/.next/static/chunks -name "*.js" -type f -exec ls -lh {} \; | \
            awk '{print $9, $5}' | sort -k2 -h -r | head -20 >> "${RESULTS_FILE}"
        
        echo '```' >> "${RESULTS_FILE}"
        echo "" >> "${RESULTS_FILE}"
        
        # Total size
        TOTAL_SIZE=$(find webapp/.next/static/chunks -name "*.js" -type f -exec stat -f%z {} \; | awk '{s+=$1} END {print s/1024/1024 " MB"}')
        echo "**Total JS Bundle Size:** ${TOTAL_SIZE}" >> "${RESULTS_FILE}"
        echo "" >> "${RESULTS_FILE}"
    else
        echo "⚠️  Run 'npm run build' in webapp/ first" >> "${RESULTS_FILE}"
        echo "" >> "${RESULTS_FILE}"
    fi
    
    # Lighthouse audit (if available)
    if command -v lighthouse &> /dev/null; then
        echo -e "${BLUE}🔍 Running Lighthouse audit...${NC}"
        
        lighthouse http://localhost:3000 \
            --output=json \
            --output-path="${RESULTS_DIR}/lighthouse_${TIMESTAMP}.json" \
            --chrome-flags="--headless" \
            --only-categories=performance,accessibility \
            --quiet
        
        echo "### Lighthouse Scores" >> "${RESULTS_FILE}"
        echo "" >> "${RESULTS_FILE}"
        
        # Parse Lighthouse results
        PERF_SCORE=$(jq '.categories.performance.score * 100' "${RESULTS_DIR}/lighthouse_${TIMESTAMP}.json")
        TTI=$(jq '.audits.interactive.numericValue / 1000' "${RESULTS_DIR}/lighthouse_${TIMESTAMP}.json")
        FCP=$(jq '.audits["first-contentful-paint"].numericValue / 1000' "${RESULTS_DIR}/lighthouse_${TIMESTAMP}.json")
        
        echo "- **Performance Score:** ${PERF_SCORE}/100" >> "${RESULTS_FILE}"
        echo "- **Time to Interactive:** ${TTI}s" >> "${RESULTS_FILE}"
        echo "- **First Contentful Paint:** ${FCP}s" >> "${RESULTS_FILE}"
        echo "" >> "${RESULTS_FILE}"
        
        echo -e "${GREEN}✅ Lighthouse audit complete${NC}"
    else
        echo "⚠️  Lighthouse not installed. Install with: npm install -g lighthouse" >> "${RESULTS_FILE}"
        echo "" >> "${RESULTS_FILE}"
    fi
fi

echo ""

# ============================================================================
# BACKEND BENCHMARKS
# ============================================================================

echo -e "${BLUE}⚡ Running Backend Benchmarks...${NC}"
echo ""

# Check if backend is running
if ! curl -s http://localhost:8000/healthz > /dev/null; then
    echo -e "${YELLOW}⚠️  Backend not running on localhost:8000${NC}"
    echo -e "${YELLOW}   Start backend with: cd api && uvicorn src.core.app:app --reload${NC}"
    echo ""
else
    echo -e "${GREEN}✅ Backend detected on localhost:8000${NC}"
    
    echo "## ⚡ API Performance" >> "${RESULTS_FILE}"
    echo "" >> "${RESULTS_FILE}"
    
    # Health endpoint benchmark
    echo "### /healthz Endpoint" >> "${RESULTS_FILE}"
    echo '```' >> "${RESULTS_FILE}"
    
    ab -n 1000 -c 10 -q http://localhost:8000/healthz 2>&1 | \
        grep -E "Requests per second|Time per request|50%|95%|99%" >> "${RESULTS_FILE}"
    
    echo '```' >> "${RESULTS_FILE}"
    echo "" >> "${RESULTS_FILE}"
    
    # Auth endpoint benchmark (if login works without DB)
    echo "### /api/v1/auth/login Endpoint (POST)" >> "${RESULTS_FILE}"
    echo '```' >> "${RESULTS_FILE}"
    
    # Create temp JSON file
    echo '{"email":"test@example.com","password":"test123"}' > /tmp/login_payload.json
    
    ab -n 100 -c 5 -p /tmp/login_payload.json -T application/json \
        http://localhost:8000/api/v1/auth/login 2>&1 | \
        grep -E "Requests per second|Time per request|50%|95%|99%" >> "${RESULTS_FILE}"
    
    rm /tmp/login_payload.json
    
    echo '```' >> "${RESULTS_FILE}"
    echo "" >> "${RESULTS_FILE}"
    
    # Concurrent requests stability test
    echo "### Concurrent Request Stability" >> "${RESULTS_FILE}"
    echo '```' >> "${RESULTS_FILE}"
    
    ab -n 500 -c 50 -q http://localhost:8000/healthz 2>&1 | \
        grep -E "Failed requests|Non-2xx responses" >> "${RESULTS_FILE}"
    
    echo '```' >> "${RESULTS_FILE}"
    echo "" >> "${RESULTS_FILE}"
    
    echo -e "${GREEN}✅ Backend benchmarks complete${NC}"
fi

echo ""

# ============================================================================
# INTEGRATION TESTS PERFORMANCE
# ============================================================================

echo -e "${BLUE}🧪 Running Integration Tests with Timing...${NC}"
echo ""

if [ -d "api" ]; then
    echo "## 🧪 Integration Tests Performance" >> "${RESULTS_FILE}"
    echo "" >> "${RESULTS_FILE}"
    echo '```' >> "${RESULTS_FILE}"
    
    cd api
    python3.11 -m pytest tests/test_phase1_integration.py -v --durations=10 2>&1 | \
        tee -a "../${RESULTS_FILE}"
    cd ..
    
    echo '```' >> "${RESULTS_FILE}"
    echo "" >> "${RESULTS_FILE}"
    
    echo -e "${GREEN}✅ Integration tests complete${NC}"
fi

echo ""

# ============================================================================
# SUMMARY & RECOMMENDATIONS
# ============================================================================

echo "---" >> "${RESULTS_FILE}"
echo "" >> "${RESULTS_FILE}"
echo "## 🎯 Divine Assessment" >> "${RESULTS_FILE}"
echo "" >> "${RESULTS_FILE}"
echo "### Success Criteria Evaluation" >> "${RESULTS_FILE}"
echo "" >> "${RESULTS_FILE}"
echo "- [ ] **TTI <800ms on mobile 3G** - [MEASURE]" >> "${RESULTS_FILE}"
echo "- [ ] **Bundle reduction ≥120KB** - [MEASURE]" >> "${RESULTS_FILE}"
echo "- [ ] **API P95 latency <300ms** - [MEASURE]" >> "${RESULTS_FILE}"
echo "- [ ] **Error rate <2%** - [MEASURE]" >> "${RESULTS_FILE}"
echo "" >> "${RESULTS_FILE}"
echo "### Recommendations" >> "${RESULTS_FILE}"
echo "" >> "${RESULTS_FILE}"
echo "1. **If all criteria met:** ✅ Ready for production deployment" >> "${RESULTS_FILE}"
echo "2. **If performance gaps:** Document optimization path in Phase 2" >> "${RESULTS_FILE}"
echo "3. **Document baseline:** These measurements establish pre-optimization baseline" >> "${RESULTS_FILE}"
echo "" >> "${RESULTS_FILE}"
echo "### Next Steps" >> "${RESULTS_FILE}"
echo "" >> "${RESULTS_FILE}"
echo "1. Review benchmark results" >> "${RESULTS_FILE}"
echo "2. Update PHASE1_BENCHMARKS.md with actual measurements" >> "${RESULTS_FILE}"
echo "3. Update PHASE1_USER_IMPACT.md with quantified improvements" >> "${RESULTS_FILE}"
echo "4. Proceed to deployment using PHASE1_MIGRATION_RUNBOOK.md" >> "${RESULTS_FILE}"
echo "" >> "${RESULTS_FILE}"

# ============================================================================
# FINALIZE
# ============================================================================

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Benchmark Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📊 Results saved to: ${RESULTS_FILE}${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "1. Review benchmark results: cat ${RESULTS_FILE}"
echo -e "2. Update docs with measurements"
echo -e "3. Commit results: git add ${RESULTS_DIR} && git commit -m 'Add Phase 1 benchmark results'"
echo -e "4. Deploy using runbook: docs/PHASE1_MIGRATION_RUNBOOK.md"
echo ""
