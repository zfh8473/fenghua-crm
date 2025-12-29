#!/bin/bash

# Quick API Test - tries to get token and run tests

echo "=== Twenty CRM API Quick Test ==="
echo ""

# Check if we can get token from login
if [ -n "$TWENTY_TEST_EMAIL" ] && [ -n "$TWENTY_TEST_PASSWORD" ]; then
  echo "📝 Attempting to get token from login..."
  cd fenghua-backend
  TOKEN=$(TWENTY_TEST_EMAIL="$TWENTY_TEST_EMAIL" TWENTY_TEST_PASSWORD="$TWENTY_TEST_PASSWORD" npx ts-node ../scripts/get-token-from-login.ts 2>&1 | grep -A 1 "Access Token" | tail -1 | tr -d ' ')
  
  if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
    echo "✅ Got token, running tests..."
    export TWENTY_TEST_TOKEN="$TOKEN"
    npx ts-node ../scripts/test-twenty-user-api.ts
  else
    echo "❌ Failed to get token from login"
    echo "Please set TWENTY_TEST_TOKEN manually"
  fi
elif [ -n "$TWENTY_TEST_TOKEN" ]; then
  echo "✅ Using provided token, running tests..."
  cd fenghua-backend
  npx ts-node ../scripts/test-twenty-user-api.ts
else
  echo "❌ No token available"
  echo ""
  echo "Please provide either:"
  echo "1. Login credentials:"
  echo "   TWENTY_TEST_EMAIL=your@email.com TWENTY_TEST_PASSWORD=yourpassword ./scripts/quick-test-api.sh"
  echo ""
  echo "2. Or set token directly:"
  echo "   export TWENTY_TEST_TOKEN=your_token"
  echo "   ./scripts/quick-test-api.sh"
  exit 1
fi
