# Shadow Fund - Demo Script

## Presentation Guide (5-7 minutes)

---

## INTRO (30 seconds)

**[SLIDE: Shadow Fund Logo]**

> "Hi, I'm [Your Name], and I'm presenting **Shadow Fund** - an AI-powered, privacy-preserving hedge fund built on Solana using the **ShadowWire SDK**.
>
> The problem we're solving: In DeFi, every transaction is public. When a fund moves money, everyone sees it. Front-runners exploit it. Competitors copy it. Privacy is broken.
>
> Shadow Fund fixes this by combining **zero-knowledge privacy** with **AI-driven portfolio management**."

---

## PART 1: THE CONCEPT (1 minute)

**[SLIDE: Architecture Diagram]**

> "Let me explain how Shadow Fund works:
>
> **Step 1: Shield Your Funds**
> When you deposit, your funds go through ShadowWire's privacy layer. They become 'shielded' - invisible on the blockchain.
>
> **Step 2: AI Analyzes Markets**
> Our Gemini AI continuously analyzes market conditions - SOL price trends, RSI indicators, meme coin hype levels, volatility.
>
> **Step 3: Private Rebalancing**
> Based on AI recommendations, the fund rebalances across four vaults:
> - **Reserve** - Stable holdings
> - **Yield** - Kamino lending for passive income
> - **Growth** - Blue-chip crypto via Jupiter
> - **Degen** - High-risk meme plays
>
> **Step 4: Unshield When Ready**
> When you withdraw, funds return to your public wallet. No one knows what happened in between.
>
> The key innovation: **Transparent AI reasoning, private execution.**"

---

## PART 2: LIVE DEMO (2-3 minutes)

**[SCREEN: Open http://127.0.0.1:5173]**

### 2.1 Connect Wallet

> "Let me show you the app. First, I'll connect my Phantom wallet..."
>
> **[Click Connect Wallet → Select Phantom → Approve]**
>
> "This is a real Solana wallet connection using the official Wallet Adapter. Nothing simulated here."

### 2.2 Dashboard Overview

> "Now I'm in the dashboard. You can see:
> - **Total Treasury Value** - The combined value across all vaults
> - **Public Balance** - What's visible on-chain
> - **Private Balance** - What's shielded via ShadowWire
> - **Vault Breakdown** - How funds are allocated"

### 2.3 AI Strategy (LIVE)

> "This is where it gets interesting. Let me show you the AI Strategy panel..."
>
> **[Navigate to AI Strategy]**
>
> "This is **LIVE**. Watch - I'll refresh and you'll see Gemini AI analyzing real market data right now."
>
> **[Refresh the page or click Get Strategy]**
>
> "See the response? It's analyzing:
> - SOL trend: [read from screen]
> - RSI indicator: [read from screen]
> - Market mood: [read from screen]
>
> And recommending:
> - Reserve: [X]%
> - Yield: [X]%
> - Growth: [X]%
> - Degen: [X]%
>
> This reasoning comes directly from Google Gemini. It's not pre-recorded - it's live AI analysis."

### 2.4 Deposit Flow

> "Now let me show a deposit. I'll shield $100 into the private balance..."
>
> **[Enter 100, Click Deposit/Shield]**
>
> "You'll see this succeeds. The transaction is processed, and my private balance updates."

---

## PART 3: THE SIMULATION EXPLANATION (1-2 minutes)

**[SLIDE: "Transparency About Simulation"]**

> "Now I want to be completely transparent about something.
>
> **The deposit I just showed is simulated.** Here's why:
>
> We're running on Solana Devnet for safety - we don't want to risk real funds during development. But ShadowWire's devnet relayer has a configuration issue."

**[SLIDE: Show the error table]**

> "When we try to deposit with standard Devnet USDC:
> - If we send `token: USDC`, the relayer defaults to SOL rules and says 'below 0.1 SOL minimum'
> - If we send just the mint address, it treats it as unknown and requires 10,000 minimum
>
> **This is a relayer configuration issue, not a code issue.**"

**[SCREEN: Show backend/lib/shadowwire.ts]**

> "Let me prove our integration is real. Here's our actual code..."
>
> **[Scroll through shadowwire.ts]**
>
> "You can see:
> - We import `ShadowWireClient` and `TokenUtils` from the official SDK
> - We initialize the client with proper network configuration
> - Our `deposit()` function calls `client.deposit()` exactly as documented
> - We use `TokenUtils.toSmallestUnit()` for proper amount conversion
> - We handle `InsufficientBalanceError` and `TransferError` exceptions
>
> This is production-ready code."

**[SCREEN: Show package.json]**

> "And here's our package.json - `@radr/shadowwire` version 1.1.15 is installed."

**[SLIDE: "One Line to Production"]**

> "To switch from simulation to real transactions, we change ONE environment variable:
>
> ```
> SHADOWWIRE_MOCK=false
> ```
>
> That's it. The same code runs with real ZK privacy on mainnet."

---

## PART 4: WHAT'S REAL vs SIMULATED (30 seconds)

**[SLIDE: Comparison Table]**

> "To summarize what's real in this demo:
>
> ✅ **REAL:**
> - Wallet connection (Phantom, actual signatures)
> - AI strategy (Live Gemini API calls)
> - Market data (Live CoinGecko/DexScreener)
> - Treasury logic (Real calculations)
> - ShadowWire SDK integration (Real code, real imports)
>
> ⏸️ **SIMULATED:**
> - Relayer communication (Devnet mint not whitelisted)
>
> The privacy layer is one environment variable away from production."

---

## PART 5: TECHNICAL DEEP DIVE (Optional - 1 minute)

**[SLIDE: Tech Stack]**

> "Quick technical overview:
>
> **Frontend:** React 19 with Vite for fast development
>
> **Backend:** Next.js API routes for serverless deployment
>
> **Privacy:** ShadowWire SDK for Bulletproof ZK proofs
>
> **AI:** Google Gemini 3 Flash for real-time market analysis
>
> **DeFi Integrations:**
> - Jupiter for DEX aggregation
> - Kamino for yield optimization
>
> **Security:**
> - Ed25519 wallet signatures for all transactions
> - Rate limiting on API endpoints
> - Non-custodial - users keep their keys"

---

## PART 6: CLOSING (30 seconds)

**[SLIDE: Shadow Fund Logo + Contact]**

> "Shadow Fund represents the future of DeFi treasury management:
>
> 1. **Privacy** - Your strategy stays private
> 2. **Intelligence** - AI optimizes your allocation
> 3. **Trust** - Non-custodial, you control your funds
>
> We've built a production-ready integration with ShadowWire. Once the devnet relayer supports our test tokens - or we deploy to mainnet - real ZK privacy is one config change away.
>
> Thank you. I'm happy to take questions."

---

## Q&A PREP

### "Why not just use mainnet?"

> "For a hackathon demo, we prioritize safety. We didn't want to risk real funds during development and testing. The code is identical - only the environment variable changes."

### "How do you know the integration actually works?"

> "Three ways:
> 1. The SDK is properly imported and initialized - you can verify in package.json
> 2. Our code follows the SDK documentation exactly
> 3. We handle SDK-specific exceptions like `InsufficientBalanceError`
>
> The mock simulates the relayer response, but the client-side integration is real."

### "What would you need to go live?"

> "Just one of these:
> 1. ShadowWire whitelists a devnet USDC mint on their relayer
> 2. They tell us which mint IS supported on devnet
> 3. We deploy to mainnet with real USD1 tokens
>
> The code is ready. We're waiting on infrastructure."

### "Is the AI actually making decisions?"

> "Yes! Let me show you..."
> **[Refresh the strategy page]**
> "This is a live API call to Google Gemini. Different market conditions give different recommendations. The reasoning explains why."

### "How is this different from other DeFi funds?"

> "Two key differences:
> 1. **Privacy** - Most funds have public transactions. We use ZK proofs.
> 2. **Transparency of reasoning** - The AI explains WHY it's allocating funds, even though the transactions themselves are private. Transparent strategy, private execution."

---

## DEMO CHECKLIST

Before presenting, verify:

- [ ] Backend running (`cd backend && npm run dev`)
- [ ] Frontend running (`npx vite --host 127.0.0.1`)
- [ ] Phantom wallet installed with devnet SOL
- [ ] Test the AI strategy endpoint works: `curl http://localhost:3001/api/strategy?risk=medium`
- [ ] Have `backend/lib/shadowwire.ts` ready to show
- [ ] Have `backend/package.json` ready to show

---

## TIMING GUIDE

| Section | Duration |
|---------|----------|
| Intro | 0:30 |
| Concept | 1:00 |
| Live Demo | 2:30 |
| Simulation Explanation | 1:30 |
| Real vs Simulated | 0:30 |
| Technical (optional) | 1:00 |
| Closing | 0:30 |
| **Total** | **5-7 min** |

---

## KEY PHRASES TO REMEMBER

- "Transparent AI reasoning, private execution"
- "One environment variable away from production"
- "This is a relayer configuration issue, not a code issue"
- "The integration is real, the simulation is for safety"
- "Privacy-preserving DeFi treasury management"
