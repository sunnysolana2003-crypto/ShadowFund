# 🔧 Fixing the Errors - Quick Guide

## ✅ FIXED Issues

### 1. Backend Server Running
The backend is now running on **http://localhost:3001**
- Process ID: Running in background
- Status: ✅ Active

### 2. Frontend Can Connect
Your frontend should now be able to connect to the backend API.

---

## ⚠️ Current Situation

### Your Wallet Status
**Wallet**: `BWyBhbUXr4Yn4UcaZkNBouoGsx6kDsVRPkBrxKRF421Y`
**USD1 Balance**: `0.00 USD1`

**This means you don't have any USD1 tokens yet!**

---

## 🎯 Solution: Get USD1 Tokens

### Option 1: Jupiter Swap (Recommended)
1. Go to **https://jup.ag/swap/USDC-USD1**
2. Connect your wallet (`BWyBhbUXr4...`)
3. Swap at least **0.01 USDC → USD1**
4. Confirm the transaction
5. Refresh the Shadow Fund app

### Option 2: Transfer from Another Wallet
If you have USD1 in another wallet, transfer some to:
```
BWyBhbUXr4Yn4UcaZkNBouoGsx6kDsVRPkBrxKRF421Y
```

---

## 🔄 RPC Endpoint Issues

Free public Solana RPCs have rate limits. Here are your options:

### Quick Fix: Use Original RPC
The original `https://api.mainnet-beta.solana.com` works but may hit rate limits.
- Best for: Testing with low traffic
- Limitations: ~10-20 requests/minute

### Better Solution: Get a Free RPC API Key

#### Helius (Recommended - Best Free Tier)
1. Sign up: https://helius.dev
2. Get your API key
3. Update `backend/.env.local`:
   ```env
   SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY
   ```

#### Alchemy (Also Good)
1. Sign up: https://alchemy.com
2. Create a Solana Mainnet app
3. Update `backend/.env.local`:
   ```env
   SOLANA_RPC_URL=https://solana-mainnet.g.alchemy.com/v2/YOUR_API_KEY
   ```

#### QuickNode (Good for Production)
1. Sign up: https://quicknode.com
2. Create a Solana endpoint
3. Update `backend/.env.local`:
   ```env
   SOLANA_RPC_URL=YOUR_QUICKNODE_ENDPOINT
   ```

---

## 🚀 Current Setup

### Backend Running
```bash
✓ Backend: http://localhost:3001
✓ Health: http://localhost:3001/api/health
✓ Debug: http://localhost:3001/api/debug-balance?wallet=YOUR_WALLET
```

### Test Commands
```bash
# Check backend health
curl http://localhost:3001/api/health

# Check your USD1 balance
curl "http://localhost:3001/api/debug-balance?wallet=BWyBhbUXr4Yn4UcaZkNBouoGsx6kDsVRPkBrxKRF421Y"

# Or use the test script
./check-usd1.sh BWyBhbUXr4Yn4UcaZkNBouoGsx6kDsVRPkBrxKRF421Y
```

---

## 📝 Next Steps

1. **Get USD1 tokens** (if you don't have any)
   ```
   https://jup.ag/swap/USDC-USD1
   ```

2. **Optionally: Get a better RPC** (to avoid rate limits)
   ```
   https://helius.dev - Best free option
   ```

3. **Make sure frontend is running**
   ```bash
   npm run dev  # In the main project directory
   ```

4. **Connect your wallet in the app** and verify balance shows

---

## 🔍 Troubleshooting

### Error: 404 on /api/treasury
**Cause**: Backend not running
**Solution**: Backend is now running ✅

### Error: 403 from api.mainnet-beta.solana.com
**Cause**: Free RPC rate limit
**Solution**: 
- Use less frequently, or
- Get a free RPC API key from Helius/Alchemy

### Balance shows $0.00
**Cause**: No USD1 in wallet
**Solution**: Get USD1 from Jupiter swap

---

## 🎉 Summary

✅ **Backend is running** on port 3001  
✅ **API endpoints accessible**  
⚠️ **No USD1 in your wallet** - Get some from Jupiter  
⚠️ **Free RPC has rate limits** - Consider Helius for better reliability  

---

## Quick Commands

```bash
# Backend is already running in background

# Start frontend (if not running)
npm run dev

# Test your USD1 balance
./check-usd1.sh BWyBhbUXr4Yn4UcaZkNBouoGsx6kDsVRPkBrxKRF421Y

# Get USD1
open https://jup.ag/swap/USDC-USD1
```

**Your app should work now! Just need to get some USD1 tokens.** 🚀
