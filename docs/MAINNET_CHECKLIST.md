# Mainnet & Real Funds Checklist

**Short answer:** The project **can** run on mainnet with real funds **after** you complete the required steps below. A few caveats remain (withdraw simulation, in-memory positions) that you should understand before going live.

---

## Required: Set These for Mainnet + Real Funds

| Variable | Purpose | Where |
|----------|---------|--------|
| `SHADOWWIRE_MOCK=false` | Use real ShadowWire SDK (no in-memory mock). | Backend env |
| `SOLANA_RPC_URL` | Mainnet RPC (paid recommended). | Backend env |
| `SHADOWWIRE_CLUSTER=mainnet-beta` | ShadowWire mainnet. | Backend env |
| `SHADOWWIRE_API_KEY` | Relayer API key (if required by ShadowWire). | Backend env |
| `SERVER_WALLET_SECRET` | **Funded** server keypair (base64). Signs Jupiter swaps and can hold vault executor funds. | Backend env (secret) |
| `CORS_ORIGINS` | Your frontend origin(s), e.g. `https://yourapp.vercel.app`. | Backend env |
| `RADR_MINT`, `ORE_MINT`, `ANON_MINT`, `JIM_MINT`, `POKI_MINT` | Real Solana mints for Growth/Degen tokens (RADR Labs shielded). Without these, fallbacks may point to wrong tokens. | Backend env |
| `KAMINO_WALLET_KEYPAIR_PATH` or `KAMINO_WALLET_PRIVATE_KEY` | **Funded** wallet for Yield vault Kamino deposits/withdrawals. | Backend env (secret) |
| `GEMINI_API_KEY` | For AI allocation (optional but recommended). | Backend env |

---

## What Works on Mainnet Today

- **Reserve vault:** USD1 only; balance from ShadowWire PDA. ✅
- **Transfer API:** Deposit/withdraw USD1 via ShadowWire; signature verification. ✅
- **Rebalance:** Moves USD1 between vault PDAs via ShadowWire (real when `SHADOWWIRE_MOCK=false`). ✅
- **Growth vault:** USD1 → SOL, RADR, ORE, ANON via Jupiter when server wallet is set and RPC is mainnet. ✅
- **Degen vault:** USD1 → SOL, BONK, RADR, JIM, POKI via Jupiter when server wallet is set and mainnet. ✅
- **Yield vault:** Kamino lend/redeem when Kamino wallet is configured and funded. ✅
- **Non-logging policy:** No wallets, amounts, or tx hashes in logs. ✅

---

## Caveats (Before Going Live with Real Funds)

1. **Growth/Degen withdraw**  
   Withdraw (token → USD1) is **simulated**: in-memory positions are reduced and a success response is returned, but **no Jupiter sell** is executed. So you cannot actually “withdraw” Growth/Degen back to USD1 on-chain yet. For real withdraws, the Jupiter layer would need token→USD1 swaps with correct token decimals.

2. **In-memory positions**  
   Growth and Degen store positions in process memory. They are **lost on restart**. Balances come from ShadowWire/Kamino where real; Growth/Degen “positions” are for display and allocation logic only until persisted (DB or on-chain).

3. **Yield vault vs PDA**  
   Rebalance credits the yield **vault PDA** with USD1 via ShadowWire, but Kamino is called with the **Kamino wallet** (or user wallet). So the “yield vault” balance in the app is the Kamino position for that wallet, not the PDA balance. Ensure your ops model matches this (e.g. one funded Kamino wallet per deployment).

4. **Rate limit**  
   In-memory rate limiter is fine for a **single** backend instance. For multiple instances, use Redis (or similar) and wire it in.

5. **Token mints**  
   If you don’t set `ORE_MINT`, `ANON_MINT`, etc., the code uses fallbacks (e.g. SOL mint). That would be wrong for real ORE/ANON swaps. Set all RADR token mints you use.

---

## Go/No-Go Summary

| Question | Answer |
|----------|--------|
| Can I point the app at mainnet and real RPC? | Yes, once env is set (see table above). |
| Will USD1 deposit/withdraw (Transfer API) be real? | Yes, if `SHADOWWIRE_MOCK=false` and ShadowWire relayer is configured. |
| Will rebalance move real USD1 between vaults? | Yes, same condition. |
| Will Growth/Degen **deposit** (USD1 → tokens) be real? | Yes, if `SERVER_WALLET_SECRET` is set and funded, and RPC is mainnet. |
| Will Growth/Degen **withdraw** (tokens → USD1) be real? | **No.** Withdraw is simulated only. |
| Are Growth/Degen positions persisted across restarts? | **No.** In-memory only. |
| Is the project “ready for mainnet and real funds”? | **Yes, with the checklist above and acceptance of the caveats.** |

---

## Minimal Mainnet Env Example

```env
NODE_ENV=production
SOLANA_RPC_URL=https://your-mainnet-rpc.com
SHADOWWIRE_CLUSTER=mainnet-beta
SHADOWWIRE_MOCK=false
SHADOWWIRE_API_KEY=your_key
SERVER_WALLET_SECRET=base64_encoded_funded_keypair
CORS_ORIGINS=https://your-frontend.vercel.app
RADR_MINT=...
ORE_MINT=...
ANON_MINT=...
# Optional: JIM_MINT=... POKI_MINT=... for Degen
# Optional: KAMINO_WALLET_KEYPAIR_PATH=... or KAMINO_WALLET_PRIVATE_KEY=... for Yield
GEMINI_API_KEY=...
```

After setting these and deploying, the app can run on mainnet with real funds, with the understanding that Growth/Degen withdraws are simulated and positions are in-memory until you add persistence and token→USD1 swaps.
