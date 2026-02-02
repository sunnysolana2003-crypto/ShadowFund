/**
 * Protocol Integration Types
 * Shared types for all DeFi protocol integrations
 */

export interface TxResult {
    success: boolean;
    txSignature?: string;
    error?: string;
    timestamp: number;
}

export interface TokenInfo {
    mint: string;
    symbol: string;
    decimals: number;
    price?: number;
}

export interface Position {
    token: TokenInfo;
    amount: number;
    valueUSD: number;
    entryPrice: number;
    currentPrice: number;
    pnl: number;
    pnlPercent: number;
}

export interface SwapParams {
    inputMint: string;
    outputMint: string;
    amount: number;
    slippageBps?: number; // Default 50 = 0.5%
}

export interface SwapQuote {
    inputAmount: number;
    outputAmount: number;
    priceImpact: number;
    fee: number;
    route: string;
}

export interface LendingPosition {
    protocol: string;
    asset: string;
    deposited: number;
    currentValue: number;
    apy: number;
    earnedYield: number;
}

export interface MemeToken {
    address: string;
    symbol: string;
    name: string;
    price: number;
    priceChange24h: number;
    volume24h: number;
    liquidity: number;
    fdv: number;
    createdAt: number;
    riskScore: number;
}

export interface DegenPosition extends Position {
    stopLossPrice?: number;
    takeProfitPrice?: number;
    strategy: "momentum" | "dip-buy" | "new-launch";
}

// Token mint addresses
// - On devnet we treat devnet-USDC as USD1 for demo/simulation flows.
// - On mainnet-beta we use canonical mints.
const IS_DEVNET =
    (process.env.SOLANA_RPC_URL || "").includes("devnet") ||
    (process.env.SHADOWWIRE_CLUSTER || "").includes("devnet");

export const TOKENS = {
    USD1: IS_DEVNET
        ? "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU" // Devnet USDC (demo USD1)
        : "USD1ttGY1N17NEEHLmELoaybftRBUSErhqYiQzvEmuB", // Mainnet USD1
    USDC: IS_DEVNET
        ? "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU" // Devnet USDC
        : "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // Mainnet USDC
    SOL: "So11111111111111111111111111111111111111112",
    WSOL: "So11111111111111111111111111111111111111112",
    WETH: "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs", // Generic Devnet WETH
    WBTC: "3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh", // Generic Devnet WBTC
    // Meme tokens (placeholders on mainnet; override via env if needed)
    BONK: IS_DEVNET
        ? "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263" // Bonk mint (commonly used mainnet mint; devnet placeholder)
        : "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    RADR: process.env.RADR_MINT || "So11111111111111111111111111111111111111112",
} as const;

// Growth vault target allocation
export const GROWTH_ALLOCATION = {
    SOL: 50,  // 50% SOL
    WETH: 30, // 30% Wrapped ETH
    WBTC: 20, // 20% Wrapped BTC
} as const;

// Degen vault target tokens
export const DEGEN_TOKENS = ["SOL", "BONK", "RADR"] as const;
