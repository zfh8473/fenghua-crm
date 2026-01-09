#!/bin/bash

# Test script for export fields functionality
# This script tests the field definition API endpoint

BASE_URL="http://localhost:3001/api/export"
TOKEN="${1:-}"

if [ -z "$TOKEN" ]; then
  echo "❌ Error: Please provide authentication token as first argument"
  echo "Usage: $0 <token>"
  exit 1
fi

echo "🧪 Testing Export Fields API"
echo "================================"
echo ""

# Test 1: Get customer fields
echo "📋 Test 1: Get customer fields"
echo "GET ${BASE_URL}/fields/customer"
response=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/fields/customer" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ]; then
  echo "✅ Status: $http_code"
  field_count=$(echo "$body" | jq '. | length' 2>/dev/null || echo "N/A")
  echo "   Fields returned: $field_count"
  echo "   Sample fields:"
  echo "$body" | jq '.[0:3] | .[] | "   - \(.fieldName): \(.displayName) (\(.category))"' 2>/dev/null || echo "   (Unable to parse JSON)"
else
  echo "❌ Status: $http_code"
  echo "   Response: $body"
fi
echo ""

# Test 2: Get product fields
echo "📋 Test 2: Get product fields"
echo "GET ${BASE_URL}/fields/product"
response=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/fields/product" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ]; then
  echo "✅ Status: $http_code"
  field_count=$(echo "$body" | jq '. | length' 2>/dev/null || echo "N/A")
  echo "   Fields returned: $field_count"
else
  echo "❌ Status: $http_code"
  echo "   Response: $body"
fi
echo ""

# Test 3: Get interaction fields
echo "📋 Test 3: Get interaction fields"
echo "GET ${BASE_URL}/fields/interaction"
response=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/fields/interaction" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ]; then
  echo "✅ Status: $http_code"
  field_count=$(echo "$body" | jq '. | length' 2>/dev/null || echo "N/A")
  echo "   Fields returned: $field_count"
else
  echo "❌ Status: $http_code"
  echo "   Response: $body"
fi
echo ""

# Test 4: Invalid data type
echo "📋 Test 4: Invalid data type (should return 400)"
echo "GET ${BASE_URL}/fields/invalid"
response=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/fields/invalid" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 400 ]; then
  echo "✅ Status: $http_code (Expected error)"
else
  echo "⚠️  Status: $http_code (Expected 400)"
  echo "   Response: $body"
fi
echo ""

echo "================================"
echo "✅ Field definition API tests completed"


