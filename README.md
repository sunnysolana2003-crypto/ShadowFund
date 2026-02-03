# ShadowFund - AI-Powered Private Treasury

> Zero-log, non-custodial AI treasury for USD1 built on ShadowWire with Gemini AI strategy recommendations.

## 🌟 Overview

ShadowFund is a privacy-first DeFi treasury management system that combines:
- **ShadowWire SDK** - Private ZK transfers on Solana using Bulletproof proofs
- **Gemini AI** - Intelligent allocation recommendations powered by Google's Gemini 3 Flash
- **Real Wallet Integration** - Solana wallet adapter (Phantom, Solflare, Ledger)
- **4-Vault Architecture** - Reserve, Yield, Growth, Degen allocations

## 📁 Project Structure

```
shadowfund-design-system/
├── 📂 Frontend (Vite + React)
│   ├── App.tsx                 # Main app with wallet provider
│   ├── LandingPage.tsx         # Marketing landing page
│   ├── WalletConnect.tsx       # Wallet connection with Solana adapter
│   ├── Dashboard.tsx           # Treasury console with real balance
│   ├── AIStrategy.tsx          # AI strategy terminal view
│   ├── TechOverview.tsx        # Technology page (architecture + audit)
│   ├── TechStack.tsx           # Tech stack page (what we used)
│   ├── polyfills.ts            # Browser polyfills (Buffer) for Solana libs
│   ├── components/             # Reusable UI components
│   ├── contexts/
│   │   ├── WalletProvider.tsx      # Solana wallet adapter context
│   │   └── ShadowFundContext.tsx   # Global state management
│   └── services/api.ts         # API client service
│
└── 📂 backend/ (Next.js API)
    ├── pages/api/              # API Routes
    │   ├── treasury.ts         # GET /api/treasury
    │   ├── strategy.ts         # GET /api/strategy (Gemini AI)
    │   ├── rebalance.ts        # POST /api/rebalance
    │   ├── transfer.ts         # POST /api/transfer
    │   └── verify.ts           # GET /api/verify
    ├── lib/
    │   ├── ai/                 # AI Strategy Engine
    │   │   ├── gemini.ts       # Gemini AI integration
    │   │   ├── signals.ts      # Market data (CoinGecko/DexScreener)
    │   │   ├── strategy.ts     # Rule-based fallback
    │   │   ├── risk.ts         # Risk profile limits
    │   │   ├── macro.ts        # Macro mood analysis
    │   │   └── index.ts        # Main AI entry point
    │   ├── shadowwire.ts       # ShadowWire SDK integration
    │   ├── shadowwire-mock.ts  # Mock ShadowWire client (devnet relayer workaround)
    │   ├── vaults.ts           # Vault address derivation
    │   ├── usd1.ts             # USD1 operations
    │   ├── treasury.ts         # Treasury state management
    │   ├── config.ts           # Environment configuration
    │   └── logger.ts           # Structured logging
    ├── middleware/
    │   ├── requireSignature.ts # Wallet signature verification
    │   └── rateLimit.ts        # API rate limiting
    └── utils/
        └── verifySignature.ts  # Ed25519 signature verification
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- A Solana wallet (Phantom, Solflare, etc.)

### Installation

```bash
# Clone the repository
cd shadowfund-design-system

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend && npm install
```

### Environment Setup

**Backend** (`backend/.env.local`):
```env
# Gemini AI (required for AI-powered strategies)
GEMINI_API_KEY=your_gemini_api_key

# Optional
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
NODE_ENV=development

# ShadowWire devnet workaround (recommended for hackathon demo)
# true  = use in-memory mock client
# false = use real ShadowWire SDK client
SHADOWWIRE_MOCK=true
```

**Frontend** (`.env.local`):
```env
# Optional: set if backend runs on a different origin locally
VITE_API_URL=http://localhost:3001

# Optional: expose a UI “simulation” indicator (build-time)
VITE_SHADOWWIRE_MOCK=true
```

### Running the Application

```bash
# Terminal 1: Start Backend (port 3001)
cd backend && npm run dev

# Terminal 2: Start Frontend (Vite default: 5173)
npm run dev
```

## 🏭 Production Deployment

For **real capital** (mainnet), set the following:

| Variable | Purpose |
|----------|---------|
| `SHADOWWIRE_MOCK=false` | Use real ShadowWire SDK (no in-memory mock). |
| `SOLANA_RPC_URL` | Mainnet RPC (paid RPC recommended). |
| `SHADOWWIRE_CLUSTER=mainnet-beta` | ShadowWire mainnet. |
| `CORS_ORIGINS` | Comma-separated frontend origin(s), e.g. `https://yourapp.vercel.app`. |
| `SERVER_WALLET_SECRET` | Funded server keypair (base64) for Jupiter swaps and signing. |
| `KAMINO_WALLET_KEYPAIR_PATH` or `KAMINO_WALLET_PRIVATE_KEY` | Funded wallet for Yield vault Kamino deposits/withdrawals. |

**Yield vault:** Kamino deposits/withdrawals use the **user wallet** (or the Kamino keypair above if configured). Rebalance moves USD1 to vault PDAs via ShadowWire; the Yield strategy then deploys to Kamino from the configured wallet. For multi-instance backends, use Redis (or similar) for rate limiting instead of in-memory. See `docs/PRODUCTION_READINESS.md` for the full checklist.

### Non-logging policy

The backend **never logs** wallets, amounts, balances, signatures, addresses, or tx hashes. All logging goes through `backend/lib/logger.ts`, which redacts sensitive keys and, in production or when `LOG_POLICY=minimal` / `NON_LOGGING_POLICY=true`, omits payload data. Use only generic messages (e.g. "Transfer completed", "Deposit started") in code.

## 📡 API Reference

### GET /api/treasury
Fetch treasury state for a wallet.

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| wallet | string | Yes | Solana wallet address |
| risk | string | No | Risk profile: low, medium, high |

**Response:**
```json
{
  "totalUSD1": 2485910.42,
  "vaults": [
    { "id": "reserve", "address": "...", "balance": 994364.17 },
    { "id": "yield", "address": "...", "balance": 745773.13 },
    { "id": "growth", "address": "...", "balance": 497182.08 },
    { "id": "degen", "address": "...", "balance": 248591.04 }
  ],
  "risk": "medium"
}
```

---

### GET /api/strategy
Get AI-powered allocation recommendations using Gemini AI.

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| risk | string | No | Risk profile: low, medium, high |

**Response:**
```json
{
  "ok": true,
  "signals": {
    "solTrend": "bullish",
    "solRSI": 45.2,
    "memeHype": "medium",
    "volatility": "low"
  },
  "mood": "neutral",
  "allocation": {
    "reserve": 30,
    "yield": 40,
    "growth": 20,
    "degen": 10
  },
  "aiPowered": true,
  "reasoning": "With market indicators showing neutral momentum...",
  "confidence": 85,
  "keyInsights": [
    "SOL RSI at 45.2 suggests accumulation opportunity",
    "Medium meme activity favors degen strategies",
    "Low volatility supports yield farming"
  ],
  "marketAnalysis": "Solana is in consolidation phase...",
  "generatedAt": "2026-01-24T09:26:12.226Z"
}
```

---

### POST /api/rebalance
Execute treasury rebalance using AI strategy.

**Request Body:**
```json
{
  "wallet": "YOUR_WALLET_ADDRESS",
  "risk": "medium",
  "action": "rebalance",
  "timestamp": 1706097600000,
  "signature": "base58_encoded_signature"
}
```

**Response:**
```json
{
  "ok": true,
  "message": "USD1 rebalanced privately via ShadowWire",
  "strategy": { ... },
  "transfers": [
    { "vault": "growth", "direction": "in", "amount": 50000, "txHash": "..." }
  ],
  "fees": { "percentage": 1, "minimum": 0.01 }
}
```

---

### POST /api/transfer
Deposit or withdraw USD1 from ShadowWire.

**Request Body:**
```json
{
  "wallet": "YOUR_WALLET_ADDRESS",
  "amount": 100,
  "action": "deposit"  // or "withdraw"
}
```

---

### GET /api/verify
Verify a ZK proof for a transaction.

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| txHash | string | Yes | Transaction hash to verify |

## 🤖 Gemini AI Integration

The AI strategy engine uses Google's **Gemini 3 Flash Preview** model for intelligent allocation recommendations.

### How It Works

1. **Market Data Collection** - Fetches SOL price, RSI, volatility from CoinGecko/DexScreener
2. **AI Analysis** - Sends market context to Gemini with risk profile
3. **Strategy Generation** - Gemini returns JSON with allocation percentages
4. **Risk Enforcement** - Hard caps applied based on risk profile
5. **Fallback** - Rule-based strategy if AI unavailable

### AI Response Schema

```typescript
interface GeminiStrategyResult {
  allocation: {
    reserve: number;  // 0-100
    yield: number;    // 0-100
    growth: number;   // 0-100
    degen: number;    // 0-100
  };
  reasoning: string;
  confidence: number;  // 0-100
  marketMood: "risk-on" | "risk-off" | "neutral";
  keyInsights: string[];
}
```

### Configuration

```typescript
// backend/lib/ai/gemini.ts
const model = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview",
  generationConfig: {
    temperature: 0.5,
    maxOutputTokens: 2048,
    responseMimeType: "application/json"
  }
});
```

## 🔐 Security

### Wallet Signature Verification
All transfer operations require Ed25519 signatures:

```typescript
const timestamp = Date.now();
const message = `rebalance|${wallet}|${timestamp}`;
const signature = await walletSignMessage(message);
```

Signatures expire after 60 seconds.

### Rate Limiting
API endpoints are protected with rate limiting:
- **Default**: 60 requests per minute per IP
- Clean-up runs every 5 minutes

### CORS
Configured for frontend-backend communication:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
```

## 📦 ShadowWire SDK

Integration with `@radr/shadowwire` for private ZK transfers:

```typescript
import { ShadowWireClient, TokenUtils } from "@radr/shadowwire";

const client = new ShadowWireClient();

// Get private balance
const balance = await client.getBalance(wallet, "USD1");

// Private transfer (ZK hidden amount)
await client.transfer({
  sender, recipient, amount,
  token: "USD1",
  type: "internal"
});

// Fee info
client.getFeePercentage("USD1");  // 1%
client.getMinimumAmount("USD1"); // 0.01
```

## 🏗️ Production Deployment

### Build Commands

```bash
# Frontend
npm run build

# Backend
cd backend && npm run build
```

### Environment Variables (Production)

```env
# Required
GEMINI_API_KEY=your_production_key
NODE_ENV=production

# Recommended
SOLANA_RPC_URL=https://your-helius-or-quicknode-url
SHADOWWIRE_API_KEY=your_shadowwire_key
```

### Health Check

```bash
curl http://localhost:3001/api/strategy?risk=medium
```

## 🧪 Testing

### Manual API Test

```bash
# Test strategy endpoint with Gemini AI
curl "http://localhost:3001/api/strategy?risk=high"

# Test treasury endpoint
curl "http://localhost:3001/api/treasury?wallet=YOUR_WALLET&risk=medium"
```

## 📊 Risk Profiles

| Profile | Reserve | Yield | Growth | Degen |
|---------|---------|-------|--------|-------|
| Low     | 60%     | 50%   | 20%    | 5%    |
| Medium  | 50%     | 60%   | 40%    | 15%   |
| High    | 30%     | 70%   | 60%    | 30%   |

## 🔗 Links

- **ShadowWire SDK**: [@radr/shadowwire](https://www.npmjs.com/package/@radr/shadowwire)
- **Gemini AI**: [Google AI Studio](https://makersuite.google.com/)
- **Solana Wallet Adapter**: [GitHub](https://github.com/solana-labs/wallet-adapter)

## 📄 License

MIT
