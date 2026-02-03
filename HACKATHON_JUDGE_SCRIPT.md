# ShadowFund - Hackathon Judge Presentation Script

> **Duration:** 5-7 minutes | **Demo Type:** Live walkthrough + Architecture deep-dive

---

## OPENING (30 seconds)

**[Stand confidently, make eye contact]**

"Good [morning/afternoon]. I'm presenting **ShadowFund** — the first AI-managed, privacy-preserving hedge fund built on Solana.

Here's the problem: In DeFi, **transparency is a double-edged sword**. Every transaction, every strategy, every balance is public. Whales front-run you. Competitors copy you. Your alpha becomes worthless the moment it's on-chain.

**ShadowFund fixes this.** We combine Google's **Gemini AI** for intelligent strategy with **RADR Labs' ShadowWire SDK** for zero-knowledge privacy. Transparent reasoning, invisible execution."

---

## PART 1: THE TECH STACK (1.5 minutes)

**[Navigate to the Tech page on the website]**

"Let me walk you through what we built:"

### Frontend
- **React + Vite** — Fast, modern SPA
- **Tailwind CSS v4** — Design system with custom theming
- **Framer Motion + GSAP** — Smooth animations for professional UX
- **Solana Wallet Adapter** — Supports Phantom, Solflare, Ledger, and more

### Backend
- **Next.js API Routes** — Serverless functions on Vercel
- **TypeScript** — Full type safety across the stack

### AI Layer
- **Google Gemini 2.0 Flash** — Real-time market analysis
- **Live market signals** — CoinGecko + DexScreener integration
- **Risk-adjusted allocation** — Low/Medium/High profiles with hard caps

### Privacy Layer (RADR Labs)
- **ShadowWire SDK v1.1.15** — ZK-Bulletproof transfers
- **USD1 Protocol** — Privacy-first stablecoin (6 decimals, 1% fee)
- **Deterministic PDAs** — 'Ghost Architecture' vaults derived from wallet signatures

### DeFi Integrations
- **Jupiter Aggregator** — Best-price swaps for Growth/Degen vaults
- **Kamino Finance (Klend SDK)** — Yield farming via lending protocol

---

## PART 2: THE 4-VAULT ARCHITECTURE (1 minute)

**[Show Dashboard with all 4 vaults visible]**

"ShadowFund uses a **4-vault architecture** inspired by institutional treasury management:"

| Vault | Purpose | Strategy |
|-------|---------|----------|
| **Reserve** | Capital preservation | USD1 only — no swaps, maximum safety |
| **Yield** | Passive income | Deployed to Kamino lending for stable APY |
| **Growth** | Measured risk | SOL, WETH, WBTC via Jupiter swaps |
| **Degen** | High risk/reward | SOL, BONK, RADR, meme tokens |

"The AI allocates across these vaults based on real-time market signals and your risk profile. Conservative users get 60% Reserve. Aggressive users get 30% Degen."

---

## PART 3: THE AI STRATEGY ENGINE (1.5 minutes)

**[Navigate to AI Strategy page]**

"This is the brain of ShadowFund. Watch — I'll trigger a **live call to Gemini**."

**[Click 'Generate Strategy' or refresh]**

"What's happening:
1. We fetch **real market data** — SOL price, RSI, 24h volatility, meme token volume
2. This context is sent to **Gemini 2.0 Flash** with the user's risk profile
3. Gemini returns a **structured JSON response** with allocation percentages and reasoning
4. We apply **hard caps** based on risk profile (e.g., High risk can't put more than 30% in Degen)
5. If Gemini is unavailable, we fall back to a **rule-based strategy**"

**[Point to the AI reasoning section]**

"Notice the transparency — the AI explains *why* it chose this allocation. 'SOL RSI at 42 suggests accumulation opportunity. Low volatility supports yield farming.' Users see the logic while execution remains private."

---

## PART 4: WHAT'S WORKING (1 minute)

**[Refer to the dashboard/tech page]**

"Let me be direct about what's production-ready today:"

### Fully Working ✅
- **Wallet connection** — Real Solana wallets (Phantom, Solflare)
- **USD1 deposits/withdrawals** — Via ShadowWire with signature verification
- **Reserve vault** — USD1 balance from ShadowWire PDA
- **Yield vault** — Real Kamino integration (deposit/withdraw/position tracking)
- **Growth/Degen deposits** — Real Jupiter swaps when server wallet is configured
- **Rebalance** — Moves USD1 between vault PDAs via ShadowWire
- **AI strategy** — Live Gemini calls with market data
- **Non-logging policy** — Zero sensitive data in logs (wallets, amounts, tx hashes)

---

## PART 5: WHAT'S NOT WORKING & WHY (1 minute)

**[Honest, confident tone]**

"For complete transparency, here's what's simulated in the current demo:"

### The ShadowWire Devnet Issue
"The ShadowWire relayer on **devnet** does not recognize the standard devnet USDC mint. When we send `token_mint`, it treats it as an unknown asset with a 10,000 unit minimum. When we force `token: 'USDC'`, it defaults to SOL validation rules.

This is a **relayer configuration issue**, not a code issue. Our SDK integration is complete and correct — we just can't demonstrate it live on devnet without the RADR team whitelisting the mint."

### What We Simulate
| Component | Why Simulated |
|-----------|---------------|
| ZK transfers | Devnet relayer mint whitelist |
| Growth/Degen withdraw | Token→USD1 swaps need decimal handling |
| Position persistence | In-memory (for demo speed); would use DB in production |

**"One environment variable flip — `SHADOWWIRE_MOCK=false` — activates real ZK transfers on mainnet."**

---

## PART 6: HOW RADR TEAM SUPPORT ENABLES PRODUCTION (45 seconds)

**[Direct appeal to judges if RADR team present]**

"With RADR team support, we go from demo to production in days:"

### What We Need
1. **Devnet mint whitelisting** — Add standard devnet USDC to relayer whitelist
2. **Documentation clarification** — Best practices for token→USD1 reverse swaps
3. **Production API keys** — For mainnet relayer access

### What We Bring
- **Complete SDK integration** — Already using `@radr/shadowwire` v1.1.15
- **Production-ready architecture** — PDA-based vaults, signature verification, rate limiting
- **Real use case** — First AI-managed privacy fund on ShadowWire

"This is a **partnership opportunity**. ShadowFund showcases what ShadowWire can do for DeFi treasury management."

---

## PART 7: WHAT'S GREAT ABOUT THIS PROJECT (1 minute)

**[Confident, closing energy]**

### Innovation
- **First AI + ZK Privacy combination** — Transparent reasoning, invisible execution
- **USD1 as core primitive** — Privacy-first stablecoin for institutional DeFi

### Technical Excellence
- **Full-stack implementation** — Frontend, backend, AI, blockchain all integrated
- **Production architecture** — Not a prototype; real wallet signatures, rate limiting, CORS
- **Non-logging policy** — Institutional-grade privacy from app layer to blockchain

### Real-World Utility
- **Solves a real problem** — Front-running costs DeFi users billions annually
- **Accessible** — Any Solana wallet can use it; no special hardware
- **Scalable** — Vercel deployment; Kamino/Jupiter are battle-tested protocols

### Code Quality
- **TypeScript throughout** — Full type safety
- **Clean architecture** — Clear separation of concerns
- **Well-documented** — README, API docs, production checklist

---

## CLOSING (30 seconds)

"ShadowFund is institutional-grade DeFi for the sovereign individual.

**Private.** Your strategy stays yours.
**Intelligent.** AI-powered allocation that explains itself.
**Non-custodial.** Your keys, your funds, your vaults.

The future of DeFi isn't just transparent — it's **selectively transparent**. Show the reasoning, hide the execution.

Thank you. I'm ready for questions."

---

## ANTICIPATED QUESTIONS & ANSWERS

### Q: "Is this just a mock/simulation?"
**A:** "The UI, wallet integration, AI strategy, Kamino yield, and Jupiter swaps are all real. The ZK privacy layer runs in simulation mode for the demo because the devnet relayer doesn't recognize the USDC mint. One config change enables real ZK transfers on mainnet."

### Q: "Why USD1 instead of USDC?"
**A:** "USD1 is RADR's privacy-first stablecoin. It has native ShadowWire support with 1% fees and instant ZK transfers. We could add USDC support, but USD1 aligns better with the privacy thesis."

### Q: "How does the AI know what to allocate?"
**A:** "We fetch real market data — SOL price from CoinGecko, RSI calculated from 14-day returns, volatility from DexScreener. This context goes to Gemini with the user's risk profile. Gemini returns structured JSON. We enforce hard caps so even if Gemini hallucinates, allocations stay within safe bounds."

### Q: "What happens if Gemini is down?"
**A:** "We have a rule-based fallback strategy that uses the same market signals. If both fail, we default to the user's last known allocation or a balanced default."

### Q: "Can this actually run with real money?"
**A:** "Yes, with the mainnet checklist completed: ShadowWire mainnet config, funded server wallet for swaps, Kamino wallet for yield, mainnet RPC. We document exactly what's needed in `docs/MAINNET_CHECKLIST.md`."

### Q: "Why build on Solana?"
**A:** "Speed and cost. ZK proofs are computationally expensive. Solana's low fees make it viable to do multiple private transfers per rebalance. Plus, ShadowWire is Solana-native."

### Q: "What makes this different from other yield aggregators?"
**A:** "Three things: (1) AI-powered allocation that adapts to market conditions, (2) ZK privacy so competitors can't see your strategy or front-run you, (3) Risk profiles that let users choose their exposure. Most yield aggregators are one-size-fits-all and fully transparent."

---

## DEMO FLOW CHECKLIST

Before presenting:
- [ ] Frontend running (`npm run dev`)
- [ ] Backend running (`cd backend && npm run dev`)
- [ ] Wallet extension ready (Phantom/Solflare)
- [ ] `.env` configured (GEMINI_API_KEY required for live AI)
- [ ] Browser DevTools closed (clean presentation)

Demo path:
1. Landing page → Connect Wallet
2. Dashboard → Show 4 vaults
3. AI Strategy → Trigger live Gemini call
4. Tech page → Show architecture + audit details
5. Return to Dashboard → Ready for questions

---

## KEY NUMBERS TO REMEMBER

- **4 vaults**: Reserve, Yield, Growth, Degen
- **3 risk profiles**: Low, Medium, High
- **1% fee**: USD1 ShadowWire transfers
- **60-second signature expiry**: Security feature
- **v1.1.15**: ShadowWire SDK version
- **Gemini 2.0 Flash**: AI model used

---

*Good luck with the presentation!*
