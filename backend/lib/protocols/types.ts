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

// Token mint addresses (Solana Devnet)
export const TOKENS = {
    USD1: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU", // Use Devnet USDC as test USD1
    USDC: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
    SOL: "So11111111111111111111111111111111111111112",
    WSOL: "So11111111111111111111111111111111111111112",
    WETH: "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs", // Generic Devnet WETH
    WBTC: "3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh", // Generic Devnet WBTC
} as const;

// Growth vault target allocation
export const GROWTH_ALLOCATION = {
    SOL: 50,  // 50% SOL
    WETH: 30, // 30% Wrapped ETH
    WBTC: 20, // 20% Wrapped BTC
} as const;
