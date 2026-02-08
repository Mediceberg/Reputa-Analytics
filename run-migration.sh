#!/bin/bash

# 🚀 Quick Migration Runner Script
# This script sets up MongoDB connection and runs the migration

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🚀 REPUTA v3.0 MIGRATION RUNNER${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}\n"

# Check if MongoDB is running
echo -e "${YELLOW}🔍 Checking MongoDB connection...${NC}"

MONGODB_URI="${MONGODB_URI:-mongodb://localhost:27017}"
MONGODB_DB_NAME="${MONGODB_DB_NAME:-reputa-v3}"

if ! mongosh "$MONGODB_URI" --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo -e "${RED}✗ MongoDB not running at $MONGODB_URI${NC}"
    echo ""
    echo -e "${YELLOW}Start MongoDB with one of:${NC}"
    echo "  1. Local: ${BLUE}mongod --dbpath /data/db${NC}"
    echo "  2. Docker: ${BLUE}docker run -d -p 27017:27017 mongo${NC}"
    echo "  3. Cloud: ${BLUE}Use your MongoDB Atlas connection string${NC}"
    exit 1
fi

echo -e "${GREEN}✓ MongoDB is running${NC}\n"

# Set environment variables
export MONGODB_URI="$MONGODB_URI"
export MONGODB_DB_NAME="$MONGODB_DB_NAME"

echo -e "${BLUE}📊 Migration Configuration:${NC}"
echo "  URI:      $MONGODB_URI"
echo "  Database: $MONGODB_DB_NAME"
echo ""

# Run migration
echo -e "${BLUE}▶ Starting migration...${NC}\n"

npx tsx scripts/migrateToV3.ts

MIGRATION_EXIT=$?

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"

if [ $MIGRATION_EXIT -eq 0 ]; then
    echo -e "${GREEN}✅ Migration completed successfully!${NC}"
else
    echo -e "${RED}✗ Migration failed with exit code $MIGRATION_EXIT${NC}"
fi

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}\n"

# Optional verification
if command -v mongosh &> /dev/null; then
    echo -e "${YELLOW}📊 Verifying results...${NC}"
    
    TOTAL=$(mongosh "$MONGODB_URI/$MONGODB_DB_NAME" --eval "db.reputationscores.count()" 2>/dev/null | tail -1)
    V3_USERS=$(mongosh "$MONGODB_URI/$MONGODB_DB_NAME" --eval "db.reputationscores.find({ protocolVersion: '3.0' }).count()" 2>/dev/null | tail -1)
    
    echo "  Total users:     $TOTAL"
    echo "  v3.0 migrated:   $V3_USERS"
    echo ""
fi

exit $MIGRATION_EXIT
