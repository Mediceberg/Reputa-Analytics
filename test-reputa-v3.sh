#!/usr/bin/env bash

# Comprehensive Testing Script for Reputa Protocol v3.0
# Tests all endpoints and validates the system

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BASE_URL="${1:-http://localhost:3000}"
TEST_USER_ID="testuser_$(date +%s)"
TEST_USERNAME="TestUser"
TEST_EMAIL="test+$(date +%s)@example.com"

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  🧪 REPUTA PROTOCOL v3.0 - COMPREHENSIVE TEST SUITE           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Base URL: $BASE_URL"
echo "Test User: $TEST_USER_ID"
echo ""

# Counters
PASSED=0
FAILED=0

# ====================
# TEST UTILITIES
# ====================

function run_test() {
  local name=$1
  local method=$2
  local endpoint=$3
  local data=$4
  local expected_status=$5

  echo -e "${BLUE}→${NC} Testing: $name"
  
  local response
  local status
  
  if [ -z "$data" ]; then
    # GET request
    response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint")
  else
    # POST with data
    response=$(curl -s -w "\n%{http_code}" -X $method \
      -H "Content-Type: application/json" \
      -d "$data" \
      "$BASE_URL$endpoint")
  fi
  
  status=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)
  
  if [ "$status" = "$expected_status" ]; then
    echo -e "${GREEN}  ✅ PASS${NC} (HTTP $status)"
    ((PASSED++))
  else
    echo -e "${RED}  ❌ FAIL${NC} (Expected $expected_status, got $status)"
    echo "  Response: $body"
    ((FAILED++))
  fi
  
  echo ""
}

# ====================
# TEST SUITE
# ====================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  HEALTH & CONFIGURATION TESTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

run_test "Health Check" "GET" "/health" "" "200"
run_test "Protocol Info" "GET" "/api/v3/reputation/protocol" "" "200"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  USER CREATION & REPUTATION TESTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Get initial reputation (creates user)
echo -e "${BLUE}→${NC} Creating test user and fetching initial reputation..."
CURLS=$(curl -s -X GET \
  "$BASE_URL/api/v3/reputation?pioneerId=$TEST_USER_ID&username=$TEST_USERNAME&email=$TEST_EMAIL")

if echo "$CURLS" | grep -q "totalReputationScore"; then
  echo -e "${GREEN}  ✅ PASS${NC} - User created and reputation fetched"
  echo "  User ID: $TEST_USER_ID"
  echo "  Initial Score: $(echo "$CURLS" | grep -o '"totalReputationScore":[0-9]*' | cut -d: -f2)"
  ((PASSED++))
else
  echo -e "${RED}  ❌ FAIL${NC} - Could not create user"
  ((FAILED++))
fi

echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  DAILY CHECK-IN TESTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Can check-in?
echo -e "${BLUE}→${NC} Testing: Can user check-in today?"
CHECKIN_READY=$(curl -s -X GET \
  "$BASE_URL/api/v3/reputation/can-check-in?pioneerId=$TEST_USER_ID&username=$TEST_USERNAME&email=$TEST_EMAIL")

if echo "$CHECKIN_READY" | grep -q '"canCheckIn":true'; then
  echo -e "${GREEN}  ✅ PASS${NC} - User can check-in"
  ((PASSED++))
else
  echo -e "${RED}  ❌ FAIL${NC} - User cannot check-in"
  ((FAILED++))
fi

echo ""

# Perform check-in
echo -e "${BLUE}→${NC} Testing: Perform daily check-in..."
CHECKIN=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  "$BASE_URL/api/v3/reputation/check-in?pioneerId=$TEST_USER_ID&username=$TEST_USERNAME&email=$TEST_EMAIL")

if echo "$CHECKIN" | grep -q '"success":true'; then
  POINTS=$(echo "$CHECKIN" | grep -o '"pointsEarned":[0-9]*' | cut -d: -f2)
  echo -e "${GREEN}  ✅ PASS${NC} - Check-in successful"
  echo "  Points Earned: $POINTS"
  ((PASSED++))
else
  echo -e "${RED}  ❌ FAIL${NC} - Check-in failed"
  echo "  Response: $CHECKIN"
  ((FAILED++))
fi

echo ""

# Cannot check-in twice
echo -e "${BLUE}→${NC} Testing: Cannot check-in twice in same day..."
CHECKIN2=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  "$BASE_URL/api/v3/reputation/check-in?pioneerId=$TEST_USER_ID&username=$TEST_USERNAME&email=$TEST_EMAIL")

if echo "$CHECKIN2" | grep -q '"success":false'; then
  echo -e "${GREEN}  ✅ PASS${NC} - System prevents duplicate check-in"
  ((PASSED++))
else
  echo -e "${RED}  ❌ FAIL${NC} - System allowed duplicate check-in"
  ((FAILED++))
fi

echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  AD BONUS TESTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo -e "${BLUE}→${NC} Testing: Add ad bonus..."
ADBALLS=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"points": 5}' \
  "$BASE_URL/api/v3/reputation/ad-bonus?pioneerId=$TEST_USER_ID&username=$TEST_USERNAME&email=$TEST_EMAIL")

if echo "$ADBALLS" | grep -q '"success":true'; then
  echo -e "${GREEN}  ✅ PASS${NC} - Ad bonus recorded"
  ((PASSED++))
else
  echo -e "${RED}  ❌ FAIL${NC} - Ad bonus failed"
  ((FAILED++))
fi

echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5️⃣  HISTORY & DATA RETRIEVAL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo -e "${BLUE}→${NC} Testing: Get points history..."
HISTORY=$(curl -s -X GET \
  "$BASE_URL/api/v3/reputation/history?pioneerId=$TEST_USER_ID&limit=50")

if echo "$HISTORY" | grep -q '"success":true'; then
  COUNT=$(echo "$HISTORY" | grep -o '"count":[0-9]*' | cut -d: -f2)
  echo -e "${GREEN}  ✅ PASS${NC} - History retrieved"
  echo "  Events: $COUNT"
  ((PASSED++))
else
  echo -e "${RED}  ❌ FAIL${NC} - History retrieval failed"
  ((FAILED++))
fi

echo ""

echo -e "${BLUE}→${NC} Testing: Get check-in history..."
CHECKIN_HIST=$(curl -s -X GET \
  "$BASE_URL/api/v3/reputation/check-in-history?pioneerId=$TEST_USER_ID&days=30")

if echo "$CHECKIN_HIST" | grep -q '"success":true'; then
  COUNT=$(echo "$CHECKIN_HIST" | grep -o '"count":[0-9]*' | cut -d: -f2)
  echo -e "${GREEN}  ✅ PASS${NC} - Check-in history retrieved"
  echo "  Check-ins: $COUNT"
  ((PASSED++))
else
  echo -e "${RED}  ❌ FAIL${NC} - Check-in history failed"
  ((FAILED++))
fi

echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6️⃣  LEADERBOARD TESTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo -e "${BLUE}→${NC} Testing: Get leaderboard (top 100)..."
LEADERBOARD=$(curl -s -X GET \
  "$BASE_URL/api/v3/reputation/leaderboard?limit=100")

if echo "$LEADERBOARD" | grep -q '"success":true'; then
  COUNT=$(echo "$LEADERBOARD" | grep -o '"count":[0-9]*' | cut -d: -f2)
  echo -e "${GREEN}  ✅ PASS${NC} - Leaderboard retrieved"
  echo "  Users shown: $COUNT"
  ((PASSED++))
else
  echo -e "${RED}  ❌ FAIL${NC} - Leaderboard retrieval failed"
  ((FAILED++))
fi

echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7️⃣  FINAL REPUTATION CHECK"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo -e "${BLUE}→${NC} Testing: Get final reputation state..."
FINAL=$(curl -s -X GET \
  "$BASE_URL/api/v3/reputation?pioneerId=$TEST_USER_ID&username=$TEST_USERNAME&email=$TEST_EMAIL")

if echo "$FINAL" | grep -q '"totalReputationScore"'; then
  SCORE=$(echo "$FINAL" | grep -o '"totalReputationScore":[0-9]*' | cut -d: -f2)
  LEVEL=$(echo "$FINAL" | grep -o '"reputationLevel":[0-9]*' | cut -d: -f2)
  STREAK=$(echo "$FINAL" | grep -o '"currentStreak":[0-9]*' | cut -d: -f2)
  
  echo -e "${GREEN}  ✅ PASS${NC} - Final reputation retrieved"
  echo "  Final Score: $SCORE"
  echo "  Level: $LEVEL"
  echo "  Current Streak: $STREAK"
  ((PASSED++))
  
  # Validate ranges
  if [ "$LEVEL" -ge 1 ] && [ "$LEVEL" -le 20 ]; then
    echo -e "${GREEN}  ✅ Level is valid (1-20)${NC}"
    ((PASSED++))
  else
    echo -e "${RED}  ❌ Level out of range${NC}"
    ((FAILED++))
  fi
  
  if [ "$SCORE" -ge 0 ] && [ "$SCORE" -le 100000 ]; then
    echo -e "${GREEN}  ✅ Score is valid (0-100000)${NC}"
    ((PASSED++))
  else
    echo -e "${RED}  ❌ Score out of range${NC}"
    ((FAILED++))
  fi
else
  echo -e "${RED}  ❌ FAIL${NC} - Could not retrieve final reputation"
  ((FAILED++))
fi

echo ""

# ====================
# TEST SUMMARY
# ====================

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    📊 TEST RESULTS                            ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "Total Tests Run: $((PASSED + FAILED))"
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║          🎉 ALL TESTS PASSED - SYSTEM OPERATIONAL! 🎉         ║${NC}"
  echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
  exit 0
else
  echo -e "${RED}╔════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${RED}║                ⚠️  SOME TESTS FAILED ⚠️                        ║${NC}"
  echo -e "${RED}╚════════════════════════════════════════════════════════════════╝${NC}"
  exit 1
fi
