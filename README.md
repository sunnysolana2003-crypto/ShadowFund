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

---

## 🏆 USD1 INTEGRATION — CORE ARCHITECTURE

**USD1 isn't just "supported" — it's the foundation of the entire fund:**

### USD1 as Universal Unit of Account
- All 4 vaults denominate in USD1
- User deposits USD1 → AI allocates USD1 across vaults → Withdrawals return USD1
- No stablecoin fragmentation — one privacy-first primitive for everything

### USD1-Native Treasury Operations
| Vault | USD1 Flow |
|-------|-----------|
| **Reserve** | Holds pure USD1 (no swaps, maximum safety) |
| **Yield** | USD1 deployed to Kamino lending |
| **Growth** | USD1 → SOL/WETH/WBTC via Jupiter, profits return as USD1 |
| **Degen** | USD1 → meme tokens via Jupiter, gains consolidated to USD1 |

### ZK-Private USD1 Transfers
- Every rebalance moves USD1 between vault PDAs via ShadowWire
- Amounts are ZK-hidden — competitors can't front-run allocation changes
- 1% fee model respected throughout

### Non-Logging USD1 Policy
- Zero USD1 amounts in logs
- Zero wallet addresses in logs
- Zero transaction hashes in logs
- Institutional-grade privacy from app layer to blockchain

---

## ⚡ MAINNET READINESS — HONEST ASSESSMENT

### ✅ WORKS ON MAINNET TODAY

| Component | Status | Notes |
|-----------|--------|-------|
| **USD1 deposit → ShadowWire** | ✅ Ready | `shadowwire.deposit()` with USD1 mint |
| **USD1 withdraw ← ShadowWire** | ✅ Ready | `shadowwire.withdraw()` with USD1 mint |
| **ZK transfers between vaults** | ✅ Ready | `privateTransfer()` for internal moves |
| **Vault PDA derivation** | ✅ Ready | Deterministic addresses from wallet + vault ID |
| **AI Strategy (Gemini)** | ✅ Ready | Real API calls with market data |
| **Wallet signatures** | ✅ Ready | Ed25519 verification, 60s expiry |
| **Reserve vault** | ✅ Ready | USD1 only, no swaps needed |

### ⚠️ WORKS WITH CONFIGURATION

| Component | Requirement | How to Enable |
|-----------|-------------|---------------|
| **Yield vault (Kamino)** | Funded server wallet | Set `KAMINO_WALLET_PRIVATE_KEY` |
| **Growth vault (Jupiter)** | Funded server wallet | Set `SERVER_WALLET_SECRET` |
| **Degen vault (Jupiter)** | Funded server wallet | Set `SERVER_WALLET_SECRET` |

### ❌ NOT YET IMPLEMENTED

| Component | Issue | Status |
|-----------|-------|--------|
| **Growth/Degen withdrawals** | Token → USD1 sell swaps | Simulated (positions tracked, no real sell) |
| **Position persistence** | In-memory storage | Lost on restart (needs DB for production) |

---

## 🏭 PRODUCTION DEPLOYMENT

### Required Environment Variables

```env
# === CORE ===
NODE_ENV=production
SHADOWWIRE_MOCK=false                    # USE REAL SDK
SHADOWWIRE_CLUSTER=mainnet-beta
SOLANA_RPC_URL=https://your-helius-rpc   # Paid RPC recommended

# === AI ===
GEMINI_API_KEY=your_gemini_api_key

# === SECURITY ===
CORS_ORIGINS=https://your-frontend.vercel.app

# === YIELD VAULT (Kamino) ===
KAMINO_WALLET_PRIVATE_KEY=base58_encoded_private_key

# === GROWTH/DEGEN VAULTS (Jupiter) ===
SERVER_WALLET_SECRET=base64_encoded_keypair
```

---

## 🌾 SETTING UP KAMINO YIELD FARMING

The Yield vault uses **Kamino Finance** (Klend SDK) for lending.

### Step 1: Create a Dedicated Wallet

```bash
# Generate a new Solana keypair
solana-keygen new --outfile kamino-wallet.json

# Get the public key
solana-keygen pubkey kamino-wallet.json
```

### Step 2: Fund the Wallet

Transfer SOL (for transaction fees) and USD1 (for deposits) to this wallet.

- **Minimum SOL**: 0.1 SOL for transaction fees
- **USD1**: Amount you want to deploy to Kamino

### Step 3: Export Private Key

```bash
# Get the private key as base58
cat kamino-wallet.json
# Copy the array, convert to base58, or use directly
```

### Step 4: Set Environment Variable

```env
# Option A: Path to keypair file
KAMINO_WALLET_KEYPAIR_PATH=/path/to/kamino-wallet.json

# Option B: Private key directly (base58)
KAMINO_WALLET_PRIVATE_KEY=your_base58_private_key
```

### How It Works

1. **Rebalance** moves USD1 to the Yield vault PDA via ShadowWire
2. **Yield strategy** calls Kamino `deposit()` from the configured wallet
3. **Position tracked**: deposited amount, current value, APY, earned yield
4. **Withdraw**: Kamino `redeem()` returns funds to the wallet

### Kamino Markets

The integration uses Kamino's **main market** by default. Typical APY: 5-15% on stablecoin deposits.

---

## 📈 SETTING UP JUPITER SWAPS (Growth/Degen)

Growth and Degen vaults use **Jupiter Aggregator** for best-price swaps.

### Step 1: Create a Server Wallet

```bash
# Generate keypair
solana-keygen new --outfile server-wallet.json

# Get public key
solana-keygen pubkey server-wallet.json
```

### Step 2: Fund the Wallet

- **SOL**: 0.5+ SOL for transaction fees (swaps are frequent)
- **USD1**: Initial capital for swaps (or leave empty, rebalance will fund it)

### Step 3: Convert to Base64

```bash
# Convert keypair JSON to base64
cat server-wallet.json | base64
```

### Step 4: Set Environment Variable

```env
SERVER_WALLET_SECRET=your_base64_encoded_keypair
```

### How It Works

**Growth Vault:**
1. Rebalance allocates USD1 to Growth vault PDA
2. Strategy swaps USD1 → target tokens (SOL, WETH, WBTC)
3. Jupiter finds best route across all Solana DEXs
4. Positions tracked with entry price, current price, P&L

**Degen Vault:**
1. Rebalance allocates USD1 to Degen vault PDA
2. Strategy swaps USD1 → meme tokens (BONK, RADR, etc.)
3. Higher slippage tolerance (1% vs 0.5% for Growth)
4. Positions tracked with stop-loss levels

### Token Allocations

**Growth (Low Risk):**
```typescript
SOL: 40%, WETH: 30%, WBTC: 30%
```

**Degen (High Risk):**
```typescript
SOL: 30%, BONK: 25%, RADR: 20%, JIM: 15%, POKI: 10%
```

### Setting Custom Token Mints

For RADR-shielded tokens, set mints in environment:

```env
RADR_MINT=your_radr_mint_address
ORE_MINT=your_ore_mint_address
ANON_MINT=your_anon_mint_address
JIM_MINT=your_jim_mint_address
POKI_MINT=your_poki_mint_address
```

---

## 🔐 Non-Logging Policy

The backend **never logs** sensitive data:

| Never Logged | Why |
|--------------|-----|
| Wallet addresses | Privacy |
| USD1 amounts | Privacy |
| Transaction hashes | Privacy |
| Private keys | Security |
| Signatures | Security |

All logging goes through `backend/lib/logger.ts` which redacts sensitive keys automatically.

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
