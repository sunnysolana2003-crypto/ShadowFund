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
- **Withdraw** (token → USD1) remains simulated: Jupiter layer uses 6-decimal amount; token→USD1 would need amount in token smallest units. Positions still in-memory (lost on restart).
- **Remaining:** Persist positions (DB/chain) and/or wire token→USD1 withdraw with correct decimals if desired.

### 2. **Growth Vault: Type / Config — Fixed**

- `growth.ts` now uses only **SOL / WETH / WBTC** from `types.ts` (`GROWTH_ALLOCATION` and `TOKENS`). RADR/ORE/ANON references removed; no runtime error.

### 3. **Yield Vault: Wallet vs Vault PDA** (documented)

- Rebalance moves USD1 to the **yield vault PDA** via `moveUSD1`.
- Kamino is called with the **user wallet** (`kamino.deposit(walletAddress, ...)`), not the vault PDA.
- So ShadowWire “yield vault” balance and Kamino position are **different** (PDA vs user wallet). Yield strategy balance is Kamino-by-user-wallet only.
- **Production need:** Decide model: either (a) lend from user wallet only and treat “yield vault” as that Kamino position, or (b) support vault PDA as Kamino depositor (programmatic signer / custody) and wire it.

### 4. **Kamino: Server Wallet Required**

- Kamino builds and sends **signed** transactions. It uses a server-side keypair (`KAMINO_WALLET_KEYPAIR_PATH` or `KAMINO_WALLET_PRIVATE_KEY`).
- If missing, code uses an **ephemeral** keypair — deposits/withdrawals are not tied to a persistent funded wallet.
- **Production need:** Configure a dedicated, funded server wallet for Kamino and secure the key material (e.g. secrets manager).

### 5. **Jupiter: Demo / Devnet = No Real Swap**

- `jupiter.executeSwap()` only runs a **real** swap when **not** in demo mode and **not** on devnet (`!isDemoMode() && !getRpcUrl().includes('devnet')`).
- Demo mode = no server wallet configured (`getWalletInfo().isConfigured === false`).
- **Production need:** Mainnet RPC + configured server (or user-signed) wallet so Jupiter executes real swaps when Growth/Degen are wired to it.

### 6. **Persistence**

- **ShadowWire mock:** In-memory balances; lost on restart.
- **Growth/Degen:** In-memory positions; lost on restart.
- **Kamino:** In-memory position cache; reload from chain on startup.
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
| Yield | ✅ (Kamino + user wallet) | ⚠️ Wallet vs PDA model + server wallet |
| Growth | Real swap on deposit (SOL/WETH/WBTC); in-memory positions | Persist positions; real withdraw (token→USD1) if needed |
| Degen | Real swap on deposit (SOL/BONK/RADR); in-memory positions | Persist positions; real withdraw if needed |
| Rebalance USD1 moves | ✅ (PDA fix applied) | ✅ |
| Kamino | Works if wallet configured | Funded server wallet required |
| Jupiter | Quote + simulated swap | Real swap on mainnet with wallet |
| Rate limit | In-memory | Redis for multi-instance |
| Positions / mock state | In-memory | On-chain or DB |

---

## Recommended Order to Reach Production

1. **Fix Growth types** — Align `growth.ts` with `types.ts` (SOL/WETH/WBTC) or add RADR/ORE/ANON and allocation.
2. **Decide Yield model** — Document whether yield = user-wallet Kamino only or vault-PDA custody; configure server wallet for Kamino.
3. **Wire real Jupiter in Growth/Degen** — Call `executeSwap()` in deposit/withdraw; use a funded signer (server or user-delegated).
4. **Remove or replace in-memory state** — Use real ShadowWire (no mock) so balances are on-chain; persist Growth/Degen positions in DB or derive from chain if possible.
5. **Production env** — Mainnet RPC, `SHADOWWIRE_MOCK=false`, `CORS_ORIGINS`, all API keys and wallet keys in secrets.
6. **Rate limit** — Move to Redis (or equivalent) if running multiple backend instances.

After these, the stack can be considered production-ready for real capital, with ongoing monitoring and security hardening.
