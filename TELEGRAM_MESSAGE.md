# Telegram Message to RADR Team

---

**Subject: ShadowFund — Solo-Built AI Treasury on ShadowWire (Request for Production Support)**

---

Hey RADR Team! 👋

I'm reaching out about **ShadowFund** — a project I've been building solo for the hackathon. Before you evaluate it, I wanted to share some context and make a genuine request.

---

## What I Built

ShadowFund is an **AI-managed, privacy-preserving hedge fund** built entirely on the ShadowWire SDK. Here's the full stack:

---

### 🏆 USD1 INTEGRATION — THE CORE OF EVERYTHING

**USD1 isn't just "supported" — it's the foundation of the entire fund architecture:**

1. **USD1 as the Universal Unit of Account**
   - All 4 vaults denominate in USD1
   - User deposits USD1 → AI allocates USD1 across vaults → Withdrawals return USD1
   - No stablecoin fragmentation — one privacy-first primitive for everything

2. **USD1-Native Treasury Operations**
   - Reserve Vault: Holds pure USD1 (no swaps, maximum safety)
   - Yield Vault: USD1 deployed to Kamino lending
   - Growth Vault: USD1 → SOL/WETH/WBTC via Jupiter, profits returned as USD1
   - Degen Vault: USD1 → meme tokens, gains consolidated back to USD1

3. **ZK-Private USD1 Transfers**
   - Every rebalance moves USD1 between vault PDAs via ShadowWire
   - Amounts are ZK-hidden — competitors can't front-run allocation changes
   - 1% fee model respected throughout

4. **Non-Logging USD1 Policy**
   - Zero USD1 amounts in logs
   - Zero wallet addresses in logs
   - Zero transaction hashes in logs
   - Institutional-grade privacy from app layer to blockchain

**Why this matters:** Most DeFi apps treat stablecoins as interchangeable. ShadowFund treats USD1 as a **first-class citizen** — the privacy-preserving backbone that makes AI-managed treasury possible without exposing strategy to the world.

---

**Privacy Layer (Your Tech)**
- Full integration with `@radr/shadowwire` v1.1.15
- USD1 as the core primitive for all fund operations
- Deterministic PDA-based vaults ("Ghost Architecture")
- ZK-shielded transfers between 4 treasury vaults

**AI Layer**
- Google Gemini 2.0 Flash for real-time market analysis
- Live signals from CoinGecko + DexScreener (SOL RSI, volatility, meme hype)
- Risk-adjusted allocation (Low/Medium/High profiles with hard caps)
- Transparent reasoning — users see WHY the AI chose an allocation

**DeFi Integrations**
- **Kamino Finance** — Yield vault deposits via Klend SDK
- **Jupiter Aggregator** — Best-price swaps for Growth/Degen vaults
- Real wallet signatures with Ed25519 verification
- Non-logging policy — zero sensitive data in logs

**Full Stack**
- React + Vite frontend with Solana Wallet Adapter
- Next.js API backend with rate limiting + CORS
- TypeScript throughout
- Deployed on Vercel

---

## The Current Situation

The entire codebase is **production-architecture ready**:
- Wallet signature verification ✅
- PDA-based vault addresses ✅
- Real Kamino integration ✅
- Real Jupiter swaps ✅
- AI strategy with fallbacks ✅

**But I'm running in simulation mode** for the demo because of one blocker:

The ShadowWire devnet relayer doesn't recognize the standard devnet USDC mint (`4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`). When I send `token_mint`, it treats it as an unknown asset (10,000 unit minimum). When I force `token: 'USDC'`, it defaults to SOL validation rules.

This isn't a code issue — my SDK integration is correct. It's a relayer configuration issue that I can't solve on my own.

---

## My Request

I built this entire project solo — frontend, backend, AI integration, wallet flows, everything. I'm genuinely proud of it, but I don't want it to be evaluated as "just another demo."

**What I'm asking:**

1. **Devnet support** — If possible, whitelist the standard devnet USDC mint on your relayer so I can demonstrate real ZK transfers

2. **Technical guidance** — Any documentation or examples for token→USD1 reverse swaps (for withdrawals)

3. **Production path** — If ShadowFund shows potential, I'd love guidance on taking it to mainnet properly

**What I bring:**

- A **real use case** for ShadowWire — AI-managed treasury with privacy
- **Clean, documented code** — README, API docs, production checklist all included
- **Commitment** — I'm not abandoning this after the hackathon; I want to see it live
- **Showcase potential** — ShadowFund can demonstrate what ShadowWire enables for DeFi

---

## Links

- **GitHub:** https://github.com/sunnysolana2003-crypto/ShadowFund
- **Live Demo:** [Vercel deployment URL]
- **Docs:** See `/docs/MAINNET_CHECKLIST.md` and `/docs/PRODUCTION_READINESS.md`

---

## TL;DR

I solo-built an AI hedge fund on ShadowWire. The architecture is production-ready, but I need team support to move past the devnet relayer blocker. I'm not looking for a participation trophy — I want to build something real on your platform.

Happy to jump on a call, share my screen, walk through the code, whatever helps.

Thanks for reading this far. 🙏

— [Your Name]

---

*P.S. The codebase includes a full judge presentation script (`HACKATHON_JUDGE_SCRIPT.md`) if you want to see how I'm positioning this. I'm being completely transparent about what works and what's simulated.*
