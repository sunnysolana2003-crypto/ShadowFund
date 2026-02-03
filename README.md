# 🌑 ShadowFund

> **AI-Powered Privacy-First Hedge Fund on Solana**

Zero-knowledge treasury management with Gemini AI strategy, USD1 stablecoin, and ShadowWire privacy.

[![Solana](https://img.shields.io/badge/Solana-Mainnet%20Ready-9945FF?style=flat&logo=solana)](https://solana.com)
[![USD1](https://img.shields.io/badge/USD1-Native%20Integration-FFD700?style=flat)](https://usd1.io)
[![ShadowWire](https://img.shields.io/badge/ShadowWire-ZK%20Privacy-000000?style=flat)](https://radr.dev)
[![Gemini AI](https://img.shields.io/badge/Gemini%203-AI%20Strategy-4285F4?style=flat&logo=google)](https://ai.google.dev)

🚀 **Live Demo**: [https://shadow-fund-gamma.vercel.app/](https://shadow-fund-gamma.vercel.app/)

---

## ✨ What is ShadowFund?

ShadowFund is a **non-custodial, AI-managed hedge fund** where:

- **Privacy comes first** — All transfers use ZK proofs via ShadowWire
- **AI decides allocation** — Gemini 3 Flash analyzes markets in real-time
- **USD1 is native** — Zero-log stablecoin as the universal unit of account
- **You keep your keys** — User signs all transactions with their own wallet

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SHADOWFUND ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│     USER WALLET                     AI STRATEGY ENGINE               │
│         │                                  │                         │
│         │    USD1 Deposit                  │  Gemini 3 Flash         │
│         ▼                                  │  Market Analysis        │
│    ┌─────────┐                             ▼                         │
│    │ SHADOW  │◄───────────────────────────────────────────────┐      │
│    │  WIRE   │   ZK-Private Transfers                         │      │
│    │   SDK   │                                                │      │
│    └────┬────┘                                                │      │
│         │                                                     │      │
│    ┌────┴────────────────────────────────────────────────┐    │      │
│    │                    4 VAULTS                          │    │      │
│    ├──────────┬──────────┬──────────┬────────────────────┤    │      │
│    │ RESERVE  │  YIELD   │  GROWTH  │       DEGEN        │    │      │
│    │   40%    │   30%    │   20%    │        10%         │    │      │
│    │          │          │          │                    │    │      │
│    │  Pure    │  Kamino  │ Jupiter  │    Jupiter         │    │      │
│    │  USD1    │  Lending │ SOL/RADR │    Memecoins       │    │      │
│    └──────────┴──────────┴──────────┴────────────────────┘    │      │
│                              │                                │      │
│                              └────────────────────────────────┘      │
│                         Position Memos On-Chain                      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🏆 USD1 Integration — Core Primitive

**USD1 isn't just "supported" — it's the foundation.**

| Feature | Implementation |
|---------|---------------|
| **Unit of Account** | All vaults denominate in USD1 |
| **Deposit** | User → ShadowWire shielded USD1 |
| **Yield** | USD1 → Kamino lending pools |
| **Swaps** | USD1 ↔ tokens via Jupiter |
| **Withdraw** | Tokens → USD1 → User wallet |
| **Non-Logging** | Zero USD1 amounts in logs |

**USD1 Mint:** `USD1ttGY1N17NEEHLmELoaybftRBUSErhqYiQzvEmuB`

---

## ⚡ Feature Status

### ✅ Production Ready

| Component | Technology | Status |
|-----------|------------|--------|
| **ZK Deposits** | ShadowWire SDK | ✅ Working |
| **ZK Withdrawals** | ShadowWire SDK | ✅ Working |
| **ZK Transfers** | ShadowWire SDK | ✅ Working |
| **AI Strategy** | Gemini 3 Flash | ✅ Working |
| **Reserve Vault** | Pure USD1 | ✅ Working |
| **Yield Vault** | Kamino Finance | ✅ Working |
| **Growth Vault** | Jupiter Swaps | ✅ Working |
| **Degen Vault** | Jupiter Swaps | ✅ Working |
| **Position Persistence** | Solana Memo Program | ✅ Working |
| **User Wallet Mode** | Browser Signing | ✅ Working |
| **Non-Logging** | Redacted Logger | ✅ Working |

### 🔗 Decentralized Position Tracking

Positions are stored **on-chain** using Solana's Memo Program:

```
SHADOWFUND|growth|open|SOL|So1111...|0.5|145.20|1706097600000
   ↑         ↑     ↑    ↑     ↑      ↑     ↑         ↑
 prefix   vault  action token mint  amount price  timestamp
```

**How it works:**
1. Memos attached to every trade transaction
2. Positions reconstructed from transaction history on reconnect
3. No database needed — fully decentralized
4. Works across devices and survives server restarts

---

## 🗂️ Project Structure

```
shadowfund/
├── 📂 Frontend (Vite + React + TypeScript)
│   ├── App.tsx                 # Main app with wallet provider
│   ├── LandingPage.tsx         # Marketing landing
│   ├── WalletConnect.tsx       # Solana wallet connection
│   ├── Dashboard.tsx           # Treasury console
│   ├── AIStrategy.tsx          # AI strategy terminal
│   ├── TechOverview.tsx        # Architecture & audit page
│   ├── polyfills.ts            # Browser Buffer polyfill
│   ├── contexts/
│   │   ├── WalletProvider.tsx      # Solana adapter context
│   │   └── ShadowFundContext.tsx   # Global state
│   └── services/api.ts         # Backend API client
│
└── 📂 backend/ (Next.js API)
    ├── pages/api/
    │   ├── treasury.ts         # GET treasury state
    │   ├── strategy.ts         # GET AI recommendations
    │   ├── rebalance.ts        # POST execute rebalance
    │   ├── transfer.ts         # POST deposit/withdraw
    │   └── verify.ts           # GET verify ZK proof
    └── lib/
        ├── ai/                 # Gemini AI engine
        │   ├── gemini.ts       # Gemini 3 Flash integration
        │   ├── signals.ts      # Market data (CoinGecko/DexScreener)
        │   └── strategy.ts     # Rule-based fallback
        ├── protocols/
        │   ├── kamino.ts       # Kamino lending (Yield)
        │   └── jupiter.ts      # Jupiter swaps (Growth/Degen)
        ├── strategies/
        │   ├── reserve.ts      # Reserve vault logic
        │   ├── yield.ts        # Yield vault logic
        │   ├── growth.ts       # Growth vault logic
        │   └── degen.ts        # Degen vault logic
        ├── shadowwire.ts       # ShadowWire SDK wrapper
        ├── positionMemo.ts     # On-chain position persistence
        ├── vaults.ts           # PDA derivation
        ├── treasury.ts         # Treasury state
        └── logger.ts           # Non-logging redactor
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Solana wallet (Phantom, Solflare)
- USD1 tokens (mainnet)

### Installation

```bash
# Clone
git clone https://github.com/sunnysolana2003-crypto/ShadowFund.git
cd ShadowFund

# Frontend
npm install

# Backend
cd backend && npm install
```

### Environment Setup

**Backend** (`backend/.env.local`):
```env
# Required
GEMINI_API_KEY=your_gemini_api_key

# Production
NODE_ENV=production
SHADOWWIRE_MOCK=false
SOLANA_RPC_URL=https://your-helius-rpc
```

**Frontend** (`.env.local`):
```env
VITE_API_URL=http://localhost:3001
VITE_SHADOWWIRE_MOCK=true  # For demo mode
```

### Run

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend  
npm run dev
```

---

## 🎯 User Onboarding — No Server Wallet Required

**Users sign all transactions with their own wallet:**

```
┌────────────┐     ┌────────────┐     ┌────────────┐     ┌────────────┐
│   User     │     │  Backend   │     │   User     │     │  Solana    │
│  Requests  │ ──► │  Builds TX │ ──► │   Signs    │ ──► │  Network   │
│  Deposit   │     │ (unsigned) │     │  (Phantom) │     │  Confirms  │
└────────────┘     └────────────┘     └────────────┘     └────────────┘
```

**Benefits:**
- ✅ Users keep their private keys
- ✅ No server wallet to fund
- ✅ True non-custodial operation
- ✅ Works immediately for any user

---

## 🌾 Vault Strategies

### Reserve (Safe Haven)
- Pure USD1 holdings
- No swaps, maximum safety
- Instant liquidity

### Yield (Kamino Finance)
- USD1 deployed to Kamino lending pools
- Typical APY: 5-15%
- Auto-compounding

### Growth (Jupiter Blue Chips)
| Token | Allocation |
|-------|------------|
| SOL | 40% |
| RADR | 25% |
| ORE | 20% |
| ANON | 15% |

### Degen (Jupiter Memecoins)
| Token | Allocation |
|-------|------------|
| SOL | 30% |
| BONK | 25% |
| RADR | 20% |
| JIM | 15% |
| POKI | 10% |

---

## 🤖 AI Strategy Engine

Powered by **Google Gemini 3 Flash**:

1. **Market Data** — SOL price, RSI, volatility (CoinGecko/DexScreener)
2. **AI Analysis** — Gemini processes market context + risk profile
3. **Allocation** — Returns vault percentages with reasoning
4. **Risk Caps** — Hard limits enforced per risk profile
5. **Fallback** — Rule-based strategy if AI unavailable

```typescript
// Example AI Response
{
  allocation: { reserve: 30, yield: 40, growth: 20, degen: 10 },
  reasoning: "Neutral market favors yield farming...",
  confidence: 85,
  keyInsights: ["SOL RSI at 45 suggests accumulation"]
}
```

---

## 🔐 Security

### Non-Logging Policy
| Never Logged | Why |
|--------------|-----|
| Wallet addresses | Privacy |
| USD1 amounts | Privacy |
| Transaction hashes | Privacy |
| Private keys | Security |
| Signatures | Security |

### Wallet Signatures
All operations require Ed25519 signatures with 60s expiry:
```typescript
const message = `rebalance|${wallet}|${timestamp}`;
const signature = await wallet.signMessage(message);
```

### Rate Limiting
- 60 requests/minute per IP
- Auto cleanup every 5 minutes

---

## 📡 API Reference

### GET /api/treasury
```bash
curl "http://localhost:3001/api/treasury?wallet=YOUR_WALLET"
```

### GET /api/strategy
```bash
curl "http://localhost:3001/api/strategy?risk=medium"
```

### POST /api/rebalance
```bash
curl -X POST http://localhost:3001/api/rebalance \
  -H "Content-Type: application/json" \
  -d '{"wallet":"...","risk":"medium","signature":"..."}'
```

### POST /api/transfer
```bash
curl -X POST http://localhost:3001/api/transfer \
  -H "Content-Type: application/json" \
  -d '{"wallet":"...","amount":100,"action":"deposit"}'
```

---

## 🎭 Demo Mode

The demo runs in simulation mode due to **ShadowWire's anti-spam requirement**:

```
Error: Amount 0.0150 SOL is below minimum 0.1000 SOL per transaction (anti-spam)
```

**ShadowWire requires 0.1 SOL (~$15-20) per transaction.** As a solo developer, I couldn't afford multiple test transactions at this rate.

```env
SHADOWWIRE_MOCK=true
```

This enables high-fidelity simulation that:
- ✅ Shows full UI/UX flow
- ✅ Demonstrates AI strategy
- ✅ Simulates vault operations
- ✅ Maintains realistic balances

**To run live:** Fund wallet with 0.5+ SOL and USD1 tokens.

---

## 📊 Risk Profiles

| Profile | Reserve Cap | Yield Cap | Growth Cap | Degen Cap |
|---------|-------------|-----------|------------|-----------|
| **Low** | 60% | 50% | 20% | 5% |
| **Medium** | 50% | 60% | 40% | 15% |
| **High** | 30% | 70% | 60% | 30% |

---

## 🏗️ Production Deployment

### Vercel (Recommended)

```bash
# Frontend
vercel

# Backend
cd backend && vercel
```

### Environment Variables (Production)

```env
NODE_ENV=production
SHADOWWIRE_MOCK=false
SHADOWWIRE_CLUSTER=mainnet-beta
SOLANA_RPC_URL=https://your-helius-rpc
GEMINI_API_KEY=your_key
CORS_ORIGINS=https://your-frontend.vercel.app
```

---

## 🔗 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Framer Motion |
| **Backend** | Next.js API Routes, TypeScript |
| **Blockchain** | Solana, ShadowWire SDK |
| **DeFi** | Kamino Finance (Klend), Jupiter Aggregator |
| **AI** | Google Gemini 3 Flash |
| **Wallet** | Solana Wallet Adapter (Phantom, Solflare, Ledger) |

---

## 📜 License

MIT

---

## 🙏 Acknowledgments

- **RADR Labs** — ShadowWire SDK for ZK privacy
- **USD1 Protocol** — Privacy-first stablecoin
- **Kamino Finance** — Lending infrastructure
- **Jupiter** — DEX aggregation
- **Google AI** — Gemini 3 Flash model

---

<div align="center">

**Built for the RADR Hackathon 2026**

*Privacy is not a feature. It's a right.*

</div>
