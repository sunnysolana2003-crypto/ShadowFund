#!/bin/bash

# Test USD1 Balance via Backend API
# This script tests the backend API endpoint directly

API_URL="${API_URL:-http://localhost:3001}"

echo "=================================="
echo "USD1 Balance API Test"
echo "=================================="
echo ""
echo "API URL: $API_URL"
echo ""

if [ -z "$1" ]; then
    echo "Usage: ./test-api-balance.sh <WALLET_ADDRESS>"
    echo ""
    echo "Example:"
    echo "  ./test-api-balance.sh DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK"
    echo ""
    echo "Note: Make sure backend is running on port 3001"
    echo "      Start with: cd backend && npm run dev"
    echo ""
    exit 1
fi

WALLET=$1

echo "Testing wallet: $WALLET"
echo ""

# Check if backend is running
if ! curl -s "$API_URL/api/health" > /dev/null 2>&1; then
    echo "⚠️  Backend doesn't seem to be running on $API_URL"
    echo ""
    echo "Start the backend first:"
    echo "  cd backend"
    echo "  npm run dev"
    echo ""
    exit 1
fi

echo "✓ Backend is running"
echo ""

# Test the debug endpoint
echo "Fetching USD1 balance..."
echo ""

response=$(curl -s "$API_URL/api/debug-balance?wallet=$WALLET")

echo "$response" | jq . 2>/dev/null || echo "$response"

echo ""
echo "=================================="
echo ""

# Parse and display result
if echo "$response" | grep -q '"success":true'; then
    balance=$(echo "$response" | jq -r '.balance' 2>/dev/null)
    echo "✅ Success! USD1 Balance: $balance"
else
    echo "❌ Error fetching balance"
    echo "Check the backend logs for more details"
fi

echo ""
