# USD1 Balance Detection - Issue Analysis & Fix

## Problem Summary
The Shadow Fund application was not detecting USD1 token balances for connected wallets on Solana mainnet-beta.

## Root Cause Analysis

### The Flow
1. **Wallet Connection** → User connects wallet via Phantom/Solflare
2. **Treasury Fetch** → Frontend calls `/api/treasury?wallet=<address>&risk=<level>`
3. **Balance Check** → Backend calls `getPublicUSD1Balance(wallet)` in `backend/lib/treasury.ts`
4. **Token Account Query** → `getPublicBalance()` in `backend/lib/shadowwire.ts` queries for USD1 token accounts
5. **Display** → Balance shown in Dashboard

### The Issue
The `getPublicBalance` function in `backend/lib/shadowwire.ts` was:
- Silently catching errors without detailed logging
- Not providing feedback about why balances weren't detected
- Not differentiating between "no USD1 tokens" vs "network error"

## Changes Made

### 1. Enhanced Logging in `shadowwire.ts`
**File**: `backend/lib/shadowwire.ts`

Added detailed logging to track:
- When balance fetching starts
- The USD1 mint address being used
- The network (devnet vs mainnet)
- Number of token accounts found
- The actual balance retrieved
- Detailed error information with context

### 2. Created Diagnostic Script
**File**: `backend/scripts/test-usd1-balance.js`

A standalone test script that:
- Tests RPC connection to mainnet
- Validates wallet addresses
- Checks SOL balance
- Queries for USD1 token accounts
- Provides clear feedback about what's found or missing
- Suggests next steps if no USD1 is found

## How to Test

### Step 1: Test Your Wallet Address
```bash
cd backend
node scripts/test-usd1-balance.js <YOUR_WALLET_ADDRESS>
```

Example:
```bash
node scripts/test-usd1-balance.js DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK
```

### Step 2: Check the Output
The script will tell you:
- ✓ If connection to mainnet is working
- ✓ Your SOL balance
- ✓ Number of USD1 token accounts found
- ✓ USD1 balance in each account

### Step 3: Get USD1 (if needed)
If you don't have USD1, you can:
1. **Swap on Jupiter**: https://jup.ag/swap/USDC-USD1
2. **Transfer from another wallet** that has USD1

### Step 4: Run the Application
```bash
# Start backend
cd backend
npm run dev

# In another terminal, start frontend
npm run dev
```

### Step 5: Check Backend Logs
When you connect your wallet, you should see logs like:
```
[ShadowWire] Fetching USD1 balance for wallet
[ShadowWire] USD1 Mint: USD1ttGY1N17NEEHLmELoaybftRBUSErhqYiQzvEmuB
[ShadowWire] Network: mainnet
[ShadowWire] Found 1 USD1 token accounts
[ShadowWire] USD1 balance retrieved: 10.50
```

## Common Issues & Solutions

### Issue 1: "No USD1 token account found"
**Cause**: Wallet has never held USD1 before
**Solution**: 
- Get USD1 from Jupiter swap
- Or have someone send you USD1 first

### Issue 2: RPC Connection Errors
**Cause**: Free RPC endpoints rate limiting
**Solution**:
- Use a dedicated RPC like Helius or Alchemy
- Update `SOLANA_RPC_URL` in `backend/.env.local`

### Issue 3: Wrong Network
**Cause**: Backend using devnet but wallet on mainnet
**Solution**: 
- Ensure `backend/.env.local` has:
  ```
  SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
  SHADOWWIRE_CLUSTER=mainnet-beta
  ```

## Configuration Files

### Frontend: `.env.local`
```env
VITE_API_URL=http://localhost:3001
```

### Backend: `backend/.env.local`
```env
# Gemini AI Configuration
GEMINI_API_KEY=your_key_here

# Node Environment
NODE_ENV=development

# Solana RPC - Mainnet for Production
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SHADOWWIRE_CLUSTER=mainnet-beta

# Testing Mode
TESTING_MODE=true

# Server Wallet (for vault transactions)
SERVER_WALLET_SECRET=your_secret_here
```

## USD1 Token Information

- **Symbol**: USD1
- **Mint Address**: `USD1ttGY1N17NEEHLmELoaybftRBUSErhqYiQzvEmuB`
- **Network**: Solana Mainnet Beta
- **Decimals**: 6
- **Type**: SPL Token (Trusted Asset)

## Architecture Overview

```
┌─────────────────┐
│  Wallet (User)  │
│    Phantom/     │
│   Solflare      │
└────────┬────────┘
         │
         │ Connect
         ▼
┌─────────────────────────┐
│   Frontend (React)      │
│  - WalletProvider       │
│  - ShadowFundContext    │
│  - Dashboard            │
└────────┬────────────────┘
         │
         │ API Call: /api/treasury
         ▼
┌─────────────────────────┐
│   Backend (Next.js)     │
│  - treasury.ts          │
│  - usd1.ts              │
│  - shadowwire.ts        │
└────────┬────────────────┘
         │
         │ RPC Call
         ▼
┌─────────────────────────┐
│  Solana Mainnet RPC     │
│  - Token Accounts       │
│  - USD1 Balance         │
└─────────────────────────┘
```

## Next Steps

1. ✅ **Enhanced logging implemented**
2. ✅ **Diagnostic script created**
3. 🔄 **Test with your wallet address**
4. 🔄 **Verify USD1 balance shows correctly**
5. 🔄 **If no USD1, acquire some via Jupiter**

## Support

If issues persist:
1. Run the diagnostic script and share output
2. Check backend logs for errors
3. Verify wallet is on mainnet (not devnet)
4. Confirm USD1 mint address is correct
5. Try with a different RPC endpoint

## References

- USD1 on Solscan: https://solscan.io/token/USD1ttGY1N17NEEHLmELoaybftRBUSErhqYiQzvEmuB
- Jupiter Swap: https://jup.ag
- ShadowWire Docs: (from RADR Labs)
