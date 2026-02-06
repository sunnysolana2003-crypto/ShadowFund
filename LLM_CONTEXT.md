# Shadow Fund - LLM Context & Debugging Guide

Welcome, fellow LLM. You are working on **Shadow Fund**, a premium AI-driven wealth management protocol built on Solana. It leverages **USD1** (via ShadowWire) for private treasury management and uses **Gemini AI** to optimize yield, growth, and "degen" strategies.

## 🚀 Project Overview
Shadow Fund is a "Shielded AI Wealth Manager". Users deposit USD1 into a shielded pool, and the AI automatically allocates those funds across four vaults:
1.  **Reserve**: Stable cash-like positions.
2.  **Yield**: Kamino Lending (passive earnings).
3.  **Growth**: Jupiter Swaps into blue-chip assets.
4.  **Degen**: High-risk momentum plays (meme-coins/hype).

## 🛠 Tech Stack
-   **Frontend**: Vite + React + Tailwind + Framer Motion + GSAP (High-end aesthetics).
-   **Backend**: Vercel Serverless Functions (`api/*.ts`).
-   **Blockchain**: Solana (Mainnet-Beta).
-   **Integrations**:
    -   `@radr/shadowwire`: Shielding & USD1 transfers.
    -   `@kamino-finance/klend-sdk`: Lending strategies.
    -   Jupiter API: Trading & Swaps.
    -   `@google/generative-ai`: Gemini 1.5 Flash for strategy reasoning.

## ⚠️ CRITICAL: Current Errors & Blockers

### 1. Solana RPC Rate Limiting (403 Forbidden)
-   **Problem**: Public Solana RPCs (like `api.mainnet-beta.solana.com`) are frequently rate-limiting or blocking the application's backend.
-   **Context**: You will see 403 errors in logs or "Failed to fetch" in the frontend.
-   **Solution**: Update `.env.local` (or Vercel Env) with a private RPC URL from **Helius** or **Alchemy**.
-   **File**: `.env.local` -> `SOLANA_RPC_URL`.

### 2. Zero USD1 Balance
-   **Problem**: The current test wallet (`BWyBhbUXr4Yn4UcaZkNBouoGsx6kDsVRPkBrxKRF421Y`) has **0.00 USD1**.
-   **Impact**: "Shield" and "Optimize" buttons will be disabled or fail because there's no fuel to run the strategies.
-   **Solution**: The user needs to swap USDC for USD1 on Jupiter.
-   **Ref**: `ERROR_FIX_GUIDE.md` for the swap link.

### 3. Vercel Unified Deployment
-   **Goal**: Deploy both the Frontend and the `api/` functions as a single Vercel project.
-   **Current State**: The project structure is flattened. `vercel.json` is configured to handle the rewrites, but environment variables must be perfectly synced between local and production.

### 4. Demo Fallbacks
-   **Context**: Because this is a hackathon project, there are "Simulation Mode" and "Demo Fallbacks" in `api/rebalance.ts` and `contexts/ShadowFundContext.tsx`.
-   **Check**: If `VITE_SHADOWWIRE_MOCK="true"`, the app enters simulation mode.
-   **Logic**: Even in live mode, if a transaction fails, the code may return a `demo: true` result to keep the UI moving for judges.

### 4. ShadowWire Deposit Minimums
- **Problem**: The ShadowWire SDK/Protocol has a minimum deposit requirement (often $1.00+ or specific amounts).
- **Context**: During hackathon demos, if the user tries to shield $0.01, it might fail if the protocol checks are strict.
- **Workaround**: Use the Demo/Simulation mode if performing micro-deposits for testing purposes.

## 📂 Key Files to Watch
-   `api/rebalance.ts`: The "Brain" - coordinates AI strategy + USD1 moves + Vault execution.
-   `api/lib/strategies.ts`: Where the actual Kamino/Jupiter logic lives.
-   `contexts/ShadowFundContext.tsx`: Main React context managing wallet state and API calls.
-   `Dashboard.tsx`: High-end UI where all actions happen.
-   `ERROR_FIX_GUIDE.md`: Current manual for fixing the environment.

## 🛠 Local Development
1.  `npm install`
2.  `npm run dev` (Starts Vite on 5173).
3.  Backend is handled by Vercel; locally you can run it via `vercel dev` or use the existing background process if the user has it running on 3001.

## 🧬 AI Personality
The AI (Gemini) is configured to be more than just a calculator. It provides "Reasoning", "Key Insights", and a "Market Mood". If you need to tweak the AI's aggressiveness, look into `api/lib/ai.ts`.

---
*Good luck. The aesthetics are non-negotiable—keep it premium.*
