# 🔍 USD1 Balance Detection - Quick Start Guide

## Problem
Your Shadow Fund app wasn't detecting USD1 token balances for connected wallets on mainnet.

## What Was Fixed
✅ Enhanced error logging in balance detection
✅ Created diagnostic test script  
✅ Added detailed debugging information

## Quick Test (3 Steps)

### 1️⃣ Test Your Wallet
```bash
./check-usd1.sh YOUR_WALLET_ADDRESS
```

Replace `YOUR_WALLET_ADDRESS` with your actual Solana wallet address.

### 2️⃣ Get USD1 (if needed)
If the test shows "No USD1 token account found":
- Go to https://jup.ag/swap/USDC-USD1
- Swap some USDC to USD1 (minimum 0.01 USD1)

### 3️⃣ Run the App
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
npm run dev
```

Then connect your wallet and check if the balance appears.

## What to Look For

### ✅ Success Indicators
- Script shows: "Found 1 USD1 token accounts"
- Script shows: "Balance: X.XX USD1"
- Backend logs show: "USD1 balance retrieved: X.XX"
- Dashboard displays your USD1 balance

### ⚠️ Common Issues

**"No USD1 token account found"**
- You don't have USD1 yet
- Get some from Jupiter: https://jup.ag/swap/USDC-USD1

**RPC Connection Errors**
- Free RPC is rate limited
- Consider using Helius or Alchemy RPC
- Update `SOLANA_RPC_URL` in `backend/.env.local`

**Wrong Balance Showing**
- Clear browser cache
- Refresh the page
- Check backend logs for errors

## Key Files Modified

1. **`backend/lib/shadowwire.ts`** - Enhanced error logging
2. **`backend/scripts/test-usd1-balance.js`** - Diagnostic script
3. **`check-usd1.sh`** - Quick test wrapper
4. **`docs/USD1_BALANCE_FIX.md`** - Full documentation

## Need Help?

1. Read full docs: `docs/USD1_BALANCE_FIX.md`
2. Check backend logs while running the app
3. Run the diagnostic: `./check-usd1.sh YOUR_WALLET`
4. Verify mainnet configuration in `backend/.env.local`

## USD1 Info
- **Mint**: `USD1ttGY1N17NEEHLmELoaybftRBUSErhqYiQzvEmuB`
- **Network**: Solana Mainnet Beta
- **Decimals**: 6
- **Get it**: https://jup.ag/swap/USDC-USD1

---

**Next**: Test with your wallet address and verify the balance detection works! 🚀
