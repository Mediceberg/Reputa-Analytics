#!/bin/bash

# 🧪 Referral System Testing Script
# Usage: bash test-referral-system.sh

set -e

echo "🚀 Referral System Test Suite"
echo "=============================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

API_BASE="http://localhost:5000"

# Test wallets
WALLET_A="0x1234567890abcdef"
WALLET_B="0xabcdefgh1234567890"
WALLET_C="0x9876543210fedcba"

echo -e "${BLUE}Test 1: Get Referral Code${NC}"
echo "Getting referral code for Wallet A..."
curl "$API_BASE/api/referral/code?walletAddress=$WALLET_A" -s | jq '.' || echo "❌ Failed to get code"
echo ""

echo -e "${BLUE}Test 2: Track Referral (Wallet B referred by Wallet A)${NC}"
echo "Tracking referral with code from Wallet A..."
CODE_A=$(curl "$API_BASE/api/referral/code?walletAddress=$WALLET_A" -s | jq -r '.data.referralCode')
echo "Using code: $CODE_A"

curl -X POST "$API_BASE/api/referral/track" \
  -H "Content-Type: application/json" \
  -d "{\"walletAddress\":\"$WALLET_B\",\"referralCode\":\"$CODE_A\"}" \
  -s | jq '.' || echo "❌ Failed to track referral"
echo ""

echo -e "${BLUE}Test 3: Get Stats (Before Confirmation)${NC}"
echo "Checking Wallet A's stats (should show pending)..."
curl "$API_BASE/api/referral/stats?walletAddress=$WALLET_A" -s | jq '.' || echo "❌ Failed to get stats"
echo ""

echo -e "${BLUE}Test 4: Confirm Referral (Wallet B completes analysis)${NC}"
echo "Confirming referral for Wallet B..."
curl -X POST "$API_BASE/api/referral/confirm" \
  -H "Content-Type: application/json" \
  -d "{\"walletAddress\":\"$WALLET_B\"}" \
  -s | jq '.' || echo "❌ Failed to confirm referral"
echo ""

echo -e "${BLUE}Test 5: Get Stats (After Confirmation)${NC}"
echo "Checking Wallet A's stats (should show confirmed + claimable points)..."
curl "$API_BASE/api/referral/stats?walletAddress=$WALLET_A" -s | jq '.' || echo "❌ Failed to get stats"
echo ""

echo -e "${BLUE}Test 6: Claim Points${NC}"
echo "Wallet A claiming points..."
curl -X POST "$API_BASE/api/referral/claim-points" \
  -H "Content-Type: application/json" \
  -d "{\"walletAddress\":\"$WALLET_A\"}" \
  -s | jq '.' || echo "❌ Failed to claim points"
echo ""

echo -e "${BLUE}Test 7: Get Stats (After Claim)${NC}"
echo "Final stats for Wallet A (points should be in balance now)..."
curl "$API_BASE/api/referral/stats?walletAddress=$WALLET_A" -s | jq '.' || echo "❌ Failed to get stats"
echo ""

echo -e "${YELLOW}Security Tests${NC}"
echo "=============================="
echo ""

echo -e "${BLUE}Test 8: Prevent Self-Referral${NC}"
echo "Trying to refer Wallet C with their own code (should fail)..."
CODE_C=$(curl "$API_BASE/api/referral/code?walletAddress=$WALLET_C" -s | jq -r '.data.referralCode')
curl -X POST "$API_BASE/api/referral/track" \
  -H "Content-Type: application/json" \
  -d "{\"walletAddress\":\"$WALLET_C\",\"referralCode\":\"$CODE_C\"}" \
  -s | jq '.' || echo "❌ Request failed"
echo "Expected: error message about self-referral"
echo ""

echo -e "${BLUE}Test 9: Prevent Duplicate Referral${NC}"
echo "Trying to refer Wallet B again with same code (should fail)..."
curl -X POST "$API_BASE/api/referral/track" \
  -H "Content-Type: application/json" \
  -d "{\"walletAddress\":\"$WALLET_B\",\"referralCode\":\"$CODE_A\"}" \
  -s | jq '.' || echo "❌ Request failed"
echo "Expected: error message about duplicate referral"
echo ""

echo -e "${GREEN}=============================="
echo "Test Suite Complete! ✅"
echo "==============================${NC}"
echo ""
echo "Summary:"
echo "- Referral tracking: Getting referral codes"
echo "- Referral confirmation: Confirming after wallet analysis"
echo "- Points claiming: Claiming earned points"
echo "- Security: Self-referral and duplicate prevention"
echo ""
echo "Next steps:"
echo "1. Test in browser by visiting: ?ref=COLLECTED_CODE"
echo "2. Check console for detailed logs"
echo "3. Monitor database for records created"
echo ""
