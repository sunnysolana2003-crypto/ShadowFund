#!/bin/bash

# USD1 Balance Checker Script
# This script helps diagnose USD1 balance detection issues

echo "=================================="
echo "USD1 Balance Detection Checker"
echo "=================================="
echo ""

# Check if wallet address is provided
if [ -z "$1" ]; then
    echo "Usage: ./check-usd1.sh <WALLET_ADDRESS>"
    echo ""
    echo "Example:"
    echo "  ./check-usd1.sh DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK"
    echo ""
    exit 1
fi

WALLET=$1

echo "Testing wallet: $WALLET"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi

echo "✓ Node.js found: $(node --version)"
echo ""

# Run the test script
cd backend
echo "Running USD1 balance test..."
echo ""
node scripts/test-usd1-balance.js "$WALLET"

echo ""
echo "=================================="
echo "Next Steps:"
echo "=================================="
echo ""
echo "If no USD1 found:"
echo "  1. Get USD1 on Jupiter: https://jup.ag/swap/USDC-USD1"
echo "  2. Or transfer from another wallet"
echo ""
echo "If balance shows correctly:"
echo "  1. Start backend: cd backend && npm run dev"
echo "  2. Start frontend: npm run dev (in another terminal)"
echo "  3. Connect your wallet in the app"
echo ""
