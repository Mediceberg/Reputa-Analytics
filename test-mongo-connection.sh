#!/usr/bin/env bash

# Test MongoDB Connection

set -e

echo ""
echo "🔍 Testing MongoDB Connection..."
echo ""

# Check if MONGODB_URI is set
if [ -z "$MONGODB_URI" ]; then
  echo "⚠️  MONGODB_URI not set. Using default: mongodb://localhost:27017"
  export MONGODB_URI="mongodb://localhost:27017"
fi

if [ -z "$MONGODB_DB_NAME" ]; then
  echo "⚠️  MONGODB_DB_NAME not set. Using default: reputa-v3"
  export MONGODB_DB_NAME="reputa-v3"
fi

echo "📊 Connection Details:"
echo "  URI: $MONGODB_URI"
echo "  DB: $MONGODB_DB_NAME"
echo ""

# Try to connect using mongosh
if command -v mongosh &> /dev/null; then
  echo "✓ mongosh found"
  mongosh "$MONGODB_URI" --eval "db.adminCommand('ping')" --quiet && \
  echo "✅ MongoDB connection successful!" || \
  echo "❌ MongoDB connection failed!"
else
  echo "⚠️  mongosh not installed, skipping connection test"
  echo "ℹ️  Install MongoDB tools to test connection"
fi

echo ""
echo "Running migration..."
npx ts-node scripts/migrateToV3.ts
