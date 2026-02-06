# Production Readiness Checklist

**Short answer: No.** The app is **hackathon/demo-ready** (deploys, runs in simulation/mock mode, UI and flows work). It is **not** production-ready for real capital without the gaps below being addressed.

---

## ✅ What Is Production-Ready

| Area | Status | Notes |
|------|--------|--------|
| **ShadowWire integration** | ✅ | Real SDK wired; mock toggle via `SHADOWWIRE_MOCK`; mainnet-ready config. |
| **Rebalance vault addresses** | ✅ | Fixed: `moveUSD1` uses vault PDAs via `getVaultAddress(wallet, vault.id)`, not display names. |
| **CORS** | ✅ | Configurable allowlist (`CORS_ORIGINS`); no wildcard in production. |
| **Rate limiting** | ✅ | In-memory rate limiter present (see caveat below). |
| **Env config** | ✅ | Central `config.ts`; `SHADOWWIRE_MOCK`, cluster, API keys. |
| **Deployment** | ✅ | Vercel build, React/Buffer polyfills, backend API routes. |
| **Reserve vault** | ✅ | USD1-only; balance from ShadowWire PDA; no swap. |
| **Transfer API** | ✅ | Deposit/withdraw with signature verification; fallback to simulation on SDK error. |

---

## ❌ Gaps for Production

### 1. **Growth / Degen: Real Swaps (Deposit) — Done**

- **Growth** and **Degen** now call `jupiter.executeSwap()` on **deposit** (USD1 → token). When server wallet is configured and not on devnet, real swaps execute; otherwise simulated.
- **Withdraw** (token → USD1) remains simulated: Jupiter layer uses 6-decimal amount; token→USD1 would need amount in token smallest units.
- **Positions:** Growth/Degen positions are now persisted on-chain via Memo transactions (no DB).

### 2. **Growth Vault: Type / Config — Fixed**

- `growth.ts` now uses only **SOL / WETH / WBTC** from `types.ts` (`GROWTH_ALLOCATION` and `TOKENS`). RADR/ORE/ANON references removed; no runtime error.

### 3. **Yield Vault: User-Signed Kamino**

- Rebalance moves USD1 to the **yield vault PDA** via `moveUSD1`.
- Kamino deposits/withdrawals are returned as **unsigned transactions** and signed by the **user wallet** in the frontend.
- This removes the requirement for a funded server/Kamino wallet per deployment.

### 4. **Kamino: Server Wallet Optional**

- Kamino now supports **user-signed** transactions (no funded server wallet required).
- If you prefer server-signed ops, you can still configure `KAMINO_WALLET_*` and keep keys in a secrets manager.

### 5. **Jupiter: Demo / Devnet = No Real Swap**

- `jupiter.executeSwap()` only runs a **real** swap when **not** in demo mode and **not** on devnet (`!isDemoMode() && !getRpcUrl().includes('devnet')`).
- Demo mode = no server wallet configured (`getWalletInfo().isConfigured === false`).
- **Production need:** Mainnet RPC + configured server (or user-signed) wallet so Jupiter executes real swaps when Growth/Degen are wired to it.

### 6. **Persistence**

- **ShadowWire mock:** In-memory balances; lost on restart.
- **Growth/Degen/Yield:** Positions are written on-chain via Memo transactions; no DB required.
- **Kamino:** Cache is restored from memo history on startup.
- **Rate limit:** In-memory; does not survive multi-instance scaling.
- **Production need:** For production, either (a) rely on on-chain + ShadowWire state only (no in-memory position maps), or (b) add a DB/cache (e.g. Redis/DB) for positions and rate limits; replace mock with real ShadowWire so balances are on-chain.

### 7. **Operational / Security**

- **CORS:** Set `CORS_ORIGINS` in production to your frontend origin(s).
- **Secrets:** `GEMINI_API_KEY`, `SHADOWWIRE_API_KEY`, Kamino/Jupiter wallet keys must be in env/secrets manager, not in repo.
- **Rate limit:** In-memory is fine for single instance; for multi-instance, use Redis (or similar) and wire `checkRateLimit` to it.
- **Logging:** Reduce or redact sensitive data in production logs (wallet addresses, amounts if required by policy).

---

## Summary Table

| Component | Demo/Hackathon | Production |
|-----------|----------------|------------|
| ShadowWire | Mock or real (configurable) | Real only; `SHADOWWIRE_MOCK=false` |
| Reserve | ✅ | ✅ |
| Yield | ✅ (Kamino + user wallet) | ✅ User-signed Kamino txs; no server wallet required |
| Growth | Real swap on deposit (SOL/WETH/WBTC); on-chain memo positions | Real withdraw (token→USD1) if needed |
| Degen | Real swap on deposit (SOL/BONK/RADR); on-chain memo positions | Real withdraw if needed |
| Rebalance USD1 moves | ✅ (PDA fix applied) | ✅ |
| Kamino | Works if wallet configured | User-signed by default; server wallet optional |
| Jupiter | Quote + simulated swap | Real swap on mainnet with wallet |
| Rate limit | In-memory | Redis for multi-instance |
| Positions / mock state | On-chain memos (Growth/Degen/Yield) | On-chain memos (no DB) |

---

## Recommended Order to Reach Production

1. **Fix Growth types** — Align `growth.ts` with `types.ts` (SOL/WETH/WBTC) or add RADR/ORE/ANON and allocation.
2. **Wire real Jupiter in Growth/Degen** — Call `executeSwap()` in deposit/withdraw; use a funded signer (server or user-delegated).
3. **Remove or replace in-memory state** — Use real ShadowWire (no mock) so balances are on-chain.
5. **Production env** — Mainnet RPC, `SHADOWWIRE_MOCK=false`, `CORS_ORIGINS`, all API keys and wallet keys in secrets.
6. **Rate limit** — Move to Redis (or equivalent) if running multiple backend instances.

After these, the stack can be considered production-ready for real capital, with ongoing monitoring and security hardening.
