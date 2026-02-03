# Vault Flows: USD1 Input, Swapping, Withdrawal

Inspection of each vault’s **input (USD1)**, **swapping (if any)**, and **withdrawal (output to USD1)**.

---

## 1. Reserve Vault

| Phase | Implementation |
|-------|----------------|
| **Input (USD1)** | Rebalance moves USD1 via `moveUSD1(from, to, amount)`. Reserve balance is the **vault PDA** private balance: `getUSD1Balance(vaultAddress)` with `vaultAddress = getVaultAddress(wallet, "reserve")`. No separate “deposit” call; the strategy’s `deposit()` only logs and returns success (no transfer). |
| **Swapping** | None. Reserve holds USD1 only. |
| **Withdrawal (→ USD1)** | Strategy `withdraw()` checks balance via `getBalance(walletAddress)` (same PDA) and returns success; actual movement out of reserve is done in rebalance via `moveUSD1(vault, reserveVault, amount)`. |

**Summary:** Reserve is a **USD1-only** buffer. In/out is driven by rebalance’s `moveUSD1`; strategy deposit/withdraw are no-ops for moving funds. Balance is the ShadowWire private balance of the reserve vault PDA.

---

## 2. Yield Vault

| Phase | Implementation |
|-------|----------------|
| **Input (USD1)** | Rebalance moves USD1 to the yield vault PDA via `moveUSD1`. Strategy then calls `kamino.deposit(walletAddress, amount, "USD1-LENDING")` — **uses user `walletAddress`**, not the yield vault PDA. So the protocol-side deposit is from the **user wallet** into Kamino; the “vault” balance in our app is the Kamino position for that wallet. |
| **Swapping** | None. Kamino lending is **USD1 → lending position** (same asset, no swap). |
| **Withdrawal (→ USD1)** | `kamino.withdraw(walletAddress, amount, "USD1-LENDING")` — redeems to **user wallet** as USD1. Balance/value from `kamino.getPosition(walletAddress)` and `kamino.getTotalValue(walletAddress)`. |

**Summary:** Yield = **Kamino lending** in USD1. No swap; deposit/withdraw are lend/redeem. **Note:** Rebalance credits the yield vault PDA with USD1 via `moveUSD1`, but Kamino is called with the **user wallet**; vault PDA is not used as the Kamino depositor.

---

## 3. Growth Vault

| Phase | Implementation |
|-------|----------------|
| **Input (USD1)** | Rebalance moves USD1 to growth vault PDA via `moveUSD1`. Strategy `deposit(walletAddress, amount)` splits `amount` by `GROWTH_ALLOCATION` (SOL, RADR, ORE, ANON in code; `types.ts` only defines SOL/WETH/WBTC). Uses **Jupiter for price only**: `jupiter.getTokenPrice(alloc.token)` → `tokenAmount = investAmount / price`. **No `executeSwap()`**; positions are stored in-memory and logged as “Shielding” for the vault PDA. |
| **Swapping** | **Simulated only.** No Jupiter swap execution in the strategy. Growth strategy records “positions” and tx signatures like `shadowwire_shield_sol_...` but does not call `jupiter.executeSwap()`. Real swaps would require USD1 → SOL/wETH/wBTC (or RADR/ORE/ANON) via Jupiter. |
| **Withdrawal (→ USD1)** | `withdraw(walletAddress, amount)` reduces in-memory positions by a proportional `sellPercent`, logs “Unshielding”, and returns success. **No actual swap** (no Jupiter sell). Value is computed as `getPrivateBalance(vaultAddress)` (cash) + sum(position amounts × Jupiter prices). |

**Summary:** Growth uses **RADR Labs shielded tokens only**: SOL, RADR, ORE, ANON (see `RADR_SUPPORTED_TOKENS` in types). Real USD1→token when server wallet + mainnet. Set `ORE_MINT`, `ANON_MINT`, `RADR_MINT` for real mints.
---

## 4. Degen Vault

| Phase | Implementation |
|-------|----------------|
| **Input (USD1)** | Rebalance moves USD1 to degen vault PDA via `moveUSD1`. Strategy `deposit(walletAddress, amount)` splits across `DEGEN_TOKENS` (e.g. SOL, BONK, RADR). Uses **Jupiter for price only**: `jupiter.getTokenPrice(mint)` → `tokenAmount = investAmount / price`. **No `executeSwap()`**; positions stored in-memory and logged as “Shielding” for the vault PDA. |
| **Swapping** | **Simulated only.** No Jupiter swap execution. Would require USD1 → meme tokens via Jupiter for real execution. |
| **Withdrawal (→ USD1)** | `withdraw(walletAddress, amount)` reduces in-memory positions by `sellPercent`, logs “Unshielding”, returns success. **No Jupiter sell.** Value = `getPrivateBalance(vaultAddress)` + sum(positions × Jupiter prices). |

**Summary:** Degen is **price-based allocation + in-memory positions** for meme tokens. No real swap; “shield/unshield” is simulated. Same pattern as Growth.

---

## Rebalance Flow (How USD1 Reaches Each Vault)

1. **Load treasury** → `loadTreasury(wallet, risk)` (vault balances from `getVaultStats` + optional demo simulation).
2. **AI allocation** → Target percentages for reserve / yield / growth / degen.
3. **Move USD1** → For each vault, `moveUSD1(from, to, abs(diff))`:
   - Source when funding: `reserveVault` PDA or **user `wallet`** if sweeping unallocated.
   - Destination when funding: **vault PDA** via `getVaultAddress(wallet, vault.id)` (fixed; was previously display string `vault.address`).
4. **Execute strategies** → `executeAllStrategies(wallet, totalValue, allocation, signals)` runs each vault’s execute (reserve, yield, growth, degen) with **target amounts** derived from allocation; strategies use **user `walletAddress`** (and vault PDA only where they explicitly call `getVaultAddress` for balance/display).

---

## Summary Table

| Vault   | USD1 input source      | Swap?              | USD1 output / withdrawal        |
|---------|------------------------|--------------------|---------------------------------|
| Reserve | `moveUSD1` → vault PDA | No                 | `moveUSD1` back to reserve/wallet |
| Yield   | `moveUSD1` → vault PDA; Kamino uses **user wallet** | No (lend/redeem) | Kamino withdraw → user wallet   |
| Growth  | `moveUSD1` → vault PDA | Real when server wallet + mainnet (SOL, RADR, ORE, ANON) | Simulated withdraw |
| Degen   | `moveUSD1` → vault PDA | Real when server wallet + mainnet (SOL, BONK, RADR, JIM, POKI) | Simulated withdraw |

---

## RADR Labs supported tokens

Growth and Degen use **only** tokens from the RADR Labs shielded list. The canonical list (symbol, decimals, fee) lives in `backend/lib/protocols/types.ts` as `RADR_SUPPORTED_TOKENS`:

| Token     | Decimals | Fee   |
|-----------|----------|-------|
| SOL       | 9        | 0.5%  |
| RADR      | 9        | 0.3%  |
| USDC      | 6        | 1%    |
| ORE       | 11       | 0.3%  |
| BONK      | 5        | 1%    |
| JIM       | 9        | 1%    |
| GODL      | 11       | 1%    |
| HUSTLE    | 9        | 0.3%  |
| ZEC       | 9        | 1%    |
| CRT       | 9        | 1%    |
| BLACKCOIN  | 6        | 1%    |
| GIL       | 6        | 1%    |
| ANON      | 9        | 1%    |
| WLFI      | 6        | 1%    |
| USD1      | 6        | 1%    |
| AOL       | 6        | 1%    |
| IQLABS    | 9        | 0.5%  |
| SANA      | 6        | 1%    |
| POKI      | 9        | 1%    |
| RAIN      | 6        | 2%    |
| HOSICO    | 9        | 1%    |
| SKR       | 6        | 0.5%  |

Mint addresses are env-driven (e.g. `ORE_MINT`, `ANON_MINT`, `JIM_MINT`, `POKI_MINT`); see `.env.example`.

---

## Recommendations

1. **Rebalance:** Use PDA addresses for moves: resolve `to` and (when drawing from a vault) `from` with `getVaultAddress(wallet, vault.id)` instead of `vault.address`.
2. **Growth:** Either (a) add ORE/ANON (and RADR in allocation) to `protocols/types.ts` and use them, or (b) use only SOL/WETH/WBTC and align growth strategy with `GROWTH_ALLOCATION` in types.
3. **Yield:** If the design is “USD1 in vault PDA → then lend from PDA”, Kamino would need to support the vault PDA as depositor (and signer); currently it uses the user wallet, so the yield “vault” is effectively the user’s Kamino position.
4. **Growth/Degen:** To have real swaps, call `jupiter.executeSwap()` in deposit (USD1 → token) and in withdraw (token → USD1), with a funded signer (e.g. server wallet or vault PDA if supported).
