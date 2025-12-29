#!/bin/bash

# Twenty CRM API Test Runner
# This script helps run the API tests

echo "=== Twenty CRM API Test Runner ==="
echo ""

# Check if token is provided
if [ -z "$TWENTY_TEST_TOKEN" ]; then
  echo "⚠️  TWENTY_TEST_TOKEN not set"
  echo ""
  echo "Option 1: Get token from login"
  echo "  TWENTY_TEST_EMAIL=your@email.com TWENTY_TEST_PASSWORD=yourpassword npx ts-node scripts/get-token-from-login.ts"
  echo ""
  echo "Option 2: Set token directly"
  echo "  export TWENTY_TEST_TOKEN=your_token_here"
  echo ""
  echo "Option 3: Get token from browser"
  echo "  1. Login to Twenty CRM at http://localhost:3000"
  echo "  2. Open browser DevTools > Application > Local Storage"
  echo "  3. Find the token key (usually 'token' or 'accessToken')"
  echo "  4. Copy the value and set: export TWENTY_TEST_TOKEN=your_token"
  echo ""
  exit 1
fi

# Run the test script
echo "Running API tests..."
echo "API URL: ${TWENTY_API_URL:-http://localhost:3000/graphql}"
echo ""

cd fenghua-backend
npx ts-node ../scripts/test-twenty-user-api.ts
