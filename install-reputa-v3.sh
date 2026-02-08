#!/usr/bin/env bash

# Installation and Setup Script for Reputa Protocol v3.0

set -e

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║      🚀 REPUTA PROTOCOL v3.0 - INSTALLATION SCRIPT            ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check Node.js
echo -e "${BLUE}📋 Checking prerequisites...${NC}"
if ! command -v node &> /dev/null; then
  echo -e "${RED}❌ Node.js is not installed${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Node.js $(node -v)${NC}"

# Install dependencies
echo ""
echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install --legacy-peer-deps
echo -e "${GREEN}✅ Dependencies installed${NC}"

# Create .env file if not exists
echo ""
echo -e "${BLUE}⚙️  Setting up environment variables...${NC}"
if [ ! -f .env.local ]; then
  cat > .env.local << 'EOF'
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=reputa-v3

# Redis/Upstash (Optional, for caching)
KV_REST_API_URL=
KV_REST_API_TOKEN=

# Server
PORT=3000
NODE_ENV=development

# Protocol
PROTOCOL_VERSION=3.0
EOF
  echo -e "${GREEN}✅ Created .env.local (edit with your values)${NC}"
else
  echo -e "${YELLOW}⚠️  .env.local already exists${NC}"
fi

# Create necessary directories
echo ""
echo -e "${BLUE}📁 Creating directories...${NC}"
mkdir -p server/config
mkdir -p server/db
mkdir -p server/services
mkdir -p server/middleware
mkdir -p scripts
mkdir -p logs
echo -e "${GREEN}✅ Directories created${NC}"

# Summary
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║           ✅ SETUP COMPLETE - NEXT STEPS                      ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${YELLOW}1. Update MongoDB Connection:${NC}"
echo "   • Edit .env.local with your MONGODB_URI"
echo "   • Ensure MongoDB is running"
echo ""
echo -e "${YELLOW}2. (Optional) Setup Redis Caching:${NC}"
echo "   • Add KV_REST_API_URL and KV_REST_API_TOKEN"
echo "   • Or skip if running without caching"
echo ""
echo -e "${YELLOW}3. Start the server:${NC}"
echo "   npm run dev"
echo ""
echo -e "${YELLOW}4. Migrate from v2 (if needed):${NC}"
echo "   npx ts-node scripts/migrateToV3.ts"
echo ""
echo -e "${YELLOW}5. Test the API:${NC}"
echo "   curl 'http://localhost:3000/health'"
echo ""
echo -e "${BLUE}📚 Documentation:${NC}"
echo "   • Read: PROTOCOL_V3_IMPLEMENTATION.md"
echo "   • API: http://localhost:3000/api/v3/reputation"
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║              🎉 Ready to go!                                   ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
