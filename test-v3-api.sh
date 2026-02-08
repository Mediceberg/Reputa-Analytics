#!/usr/bin/env bash

# Test Suite for Reputa Protocol v3.0
# Comprehensive testing of all API endpoints and functionality

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

BASE_URL=${1:-"http://localhost:3000"}
PIONEER_ID="test_$(date +%s)"
USERNAME="testuser_$(date +%s)"
EMAIL="test_$(date +%s)@example.com"

PASS=0
FAIL=0

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     🧪 REPUTA PROTOCOL v3.0 - API TEST SUITE                  ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${BLUE}Base URL: ${BASE_URL}${NC}"
echo -e "${BLUE}Pioneer ID: ${PIONEER_ID}${NC}"
echo ""

# ====================
# HELPER FUNCTIONS
# ====================

function test_endpoint() {
  local name="$1"
  local method="$2"
  local endpoint="$3"
  local data="$4"
  local expected_code="$5"
  
  echo -n "Testing: $name ... "
  
  if [ "$method" = "GET" ]; then
    response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
  else
    response=$(curl -s -w "\n%{http_code}" -X "$method" \
      -H "Content-Type: application/json" \
      -d "$data" \
      "$BASE_URL$endpoint")
  fi
  
  http_code=$(echo "$response" | tail -n 1)
  body=$(echo "$response" | sed '$d')
  
  if [[ "$http_code" == "$expected_code"* ]]; then
    echo -e "${GREEN}✅ PASS${NC} (HTTP $http_code)"
    ((PASS++))
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
  else
    echo -e "${RED}❌ FAIL${NC} (HTTP $http_code, expected $expected_code)"
    ((FAIL++))
    echo "$body"
  fi
  echo ""
}

# ====================
# TEST SUITE
# ====================

echo -e "${YELLOW}1. HEALTH CHECK${NC}"
echo "─────────────────────────────────────"
test_endpoint "Health Check" "GET" "/health" "" "200"

echo -e "${YELLOW}2. PROTOCOL INFO${NC}"
echo "─────────────────────────────────────"
test_endpoint "Get Protocol Info" "GET" "/api/v3/reputation/protocol" "" "200"

echo -e "${YELLOW}3. REPUTATION ENDPOINTS${NC}"
echo "─────────────────────────────────────"

# Get reputation
test_endpoint "Get Reputation (new user)" "GET" \
  "/api/v3/reputation?pioneerId=${PIONEER_ID}&username=${USERNAME}&email=${EMAIL}" \
  "" "200"

# Check if can check-in
test_endpoint "Can Check-in" "GET" \
  "/api/v3/reputation/can-check-in?pioneerId=${PIONEER_ID}&username=${USERNAME}&email=${EMAIL}" \
  "" "200"

echo -e "${YELLOW}4. DAILY CHECK-IN${NC}"
echo "─────────────────────────────────────"

# First check-in
test_endpoint "First Check-in" "POST" \
  "/api/v3/reputation/check-in?pioneerId=${PIONEER_ID}&username=${USERNAME}&email=${EMAIL}" \
  "" "200"

# Check score increased
test_endpoint "Get Reputation (after check-in)" "GET" \
  "/api/v3/reputation?pioneerId=${PIONEER_ID}&username=${USERNAME}&email=${EMAIL}" \
  "" "200"

# Should fail (already checked in)
test_endpoint "Duplicate Check-in (should fail)" "POST" \
  "/api/v3/reputation/check-in?pioneerId=${PIONEER_ID}&username=${USERNAME}&email=${EMAIL}" \
  "" "400"

echo -e "${YELLOW}5. AD BONUS${NC}"
echo "─────────────────────────────────────"

test_endpoint "Add Ad Bonus (5 points)" "POST" \
  "/api/v3/reputation/ad-bonus?pioneerId=${PIONEER_ID}&username=${USERNAME}&email=${EMAIL}" \
  '{"points": 5}' "200"

test_endpoint "Add Ad Bonus (no points specified)" "POST" \
  "/api/v3/reputation/ad-bonus?pioneerId=${PIONEER_ID}&username=${USERNAME}&email=${EMAIL}" \
  '{}' "200"

echo -e "${YELLOW}6. LEADERBOARD${NC}"
echo "─────────────────────────────────────"

test_endpoint "Top 10 Users" "GET" \
  "/api/v3/reputation/leaderboard?limit=10" "" "200"

test_endpoint "Top 100 Users" "GET" \
  "/api/v3/reputation/leaderboard?limit=100" "" "200"

echo -e "${YELLOW}7. HISTORY${NC}"
echo "─────────────────────────────────────"

test_endpoint "Points History" "GET" \
  "/api/v3/reputation/history?pioneerId=${PIONEER_ID}&limit=50" "" "200"

test_endpoint "Check-in History" "GET" \
  "/api/v3/reputation/check-in-history?pioneerId=${PIONEER_ID}&days=7" "" "200"

echo -e "${YELLOW}8. VALIDATION TESTS${NC}"
echo "─────────────────────────────────────"

# Missing parameters
test_endpoint "Missing pioneerId (should fail)" "GET" \
  "/api/v3/reputation?username=${USERNAME}&email=${EMAIL}" "" "400"

test_endpoint "Missing email (should fail)" "GET" \
  "/api/v3/reputation?pioneerId=${PIONEER_ID}&username=${USERNAME}" "" "400"

# Invalid email
test_endpoint "Invalid email (should fail)" "GET" \
  "/api/v3/reputation?pioneerId=${PIONEER_ID}&username=${USERNAME}&email=invalid" "" "400"

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    📊 TEST RESULTS                             ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✅ PASSED: ${PASS}${NC}"
echo -e "${RED}❌ FAILED: ${FAIL}${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
  exit 0
else
  echo -e "${RED}⚠️  SOME TESTS FAILED${NC}"
  exit 1
fi
