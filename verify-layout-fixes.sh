#!/bin/bash
# Layout Fixes Verification Test
# Run this script to verify all layout fixes are correctly applied

echo "🔍 Verifying Layout & Scrolling Fixes..."
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS=0
FAIL=0

# Test function
test_file() {
    local file=$1
    local pattern=$2
    local should_exist=$3
    
    if grep -q "$pattern" "$file" 2>/dev/null; then
        if [ "$should_exist" = "true" ]; then
            echo -e "${GREEN}✓${NC} Found: $pattern in $(basename $file)"
            ((PASS++))
        else
            echo -e "${RED}✗${NC} Should NOT find: $pattern in $(basename $file)"
            ((FAIL++))
        fi
    else
        if [ "$should_exist" = "false" ]; then
            echo -e "${GREEN}✓${NC} Not found: $pattern in $(basename $file)"
            ((PASS++))
        else
            echo -e "${RED}✗${NC} Missing: $pattern in $(basename $file)"
            ((FAIL++))
        fi
    fi
}

echo "📝 Checking CSS files..."
test_file "src/styles/layout.css" "overflow-y: auto" "true"
test_file "src/styles/futuristic.css" "overflow-y: auto" "true"
test_file "src/styles/index.css" "@import './layout.css'" "true"

echo ""
echo "📄 Checking index.html..."
test_file "index.html" "#root" "true"
test_file "index.html" "display: flex" "true"
test_file "index.html" "flex-direction: column" "true"

echo ""
echo "📱 Checking App.tsx..."
test_file "src/app/App.tsx" "w-full min-h-screen" "true"
test_file "src/app/App.tsx" "overflow-y-auto" "true"

echo ""
echo "📑 Checking UnifiedDashboard.tsx..."
test_file "src/app/pages/UnifiedDashboard.tsx" "flex flex-col" "true"
test_file "src/app/pages/UnifiedDashboard.tsx" "overflow-y-auto" "true"

echo ""
echo "🧩 Checking Components..."
grep -q 'min-h-\[90vh\]' "src/app/components/ReputaDashboard.tsx" && echo -e "${GREEN}✓${NC} ReputaDashboard: min-h-[90vh]" && ((PASS++)) || (echo -e "${RED}✗${NC} ReputaDashboard: missing min-h-[90vh]" && ((FAIL++)))
test_file "src/app/components/AccessUpgradeModal.tsx" "min-h-" "true"
test_file "src/app/components/PiDexSection.tsx" "min-h-" "true"
test_file "src/app/components/AtomicScoreBreakdown.tsx" "min-h-" "true"
test_file "src/app/components/charts/TokenPortfolio.tsx" "min-h-" "true"

echo ""
echo "❌ OLD PATTERNS (should not exist)..."
test_file "src/app/App.tsx" "max-h-" "false"
test_file "src/app/pages/UnifiedDashboard.tsx" "min-h-screen futuristic-bg flex\"" "false"

echo ""
echo "📚 Checking Documentation..."
test_file "LAYOUT_FIXES.md" "qawataha" "false"
test_file "LAYOUT_IMPLEMENTATION_GUIDE.md" "overflow" "true"
test_file "IMPLEMENTATION_COMPLETE.md" "إصلاح" "true"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}✓ PASSED: $PASS${NC}"
echo -e "${RED}✗ FAILED: $FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}🎉 All layout fixes verified successfully!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some checks failed. Please review the output above.${NC}"
    exit 1
fi
