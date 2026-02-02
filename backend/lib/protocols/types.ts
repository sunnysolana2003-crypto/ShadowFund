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
// NOTE: Using common "USDC-Dev" mint that may be whitelisted on ShadowWire's relayer
// Original mint 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU was NOT recognized by relayer
export const TOKENS = {
    USD1: "USD1ttGY1N17NEEHLmELoaybftRBUSErhqYiQzvEmuB",
    USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    SOL: "So11111111111111111111111111111111111111112",
    WSOL: "So11111111111111111111111111111111111111112",
    // RADR Shielded Assets & Memecoins
    RADR: "CzFvsLdUazabdiu9TYXujj4EY495fG7VgJJ3vQs6bonk",
    ORE: "oreoU2P8bN6jkk3jbaiVxYnG1dCXcYxwhwyK9jSybcp",
    ANON: "D25bi7oHQjqkVrzbfuM6k2gzVNHTSpBLhtakDCzCCDUB",
    BONK: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    JIM: "H9muD33usLGYv1tHvxCVpFwwVSn27x67tBQYH1ANbonk",
    GODL: "GodL6KZ9uuUoQwELggtVzQkKmU1LfqmDokPibPeDKkhF",
    HUSTLE: "HUSTLFV3U5Km8u66rMQExh4nLy7unfKHedEXVK1WgSAG",
    POKI: "6vK6cL9C66Bsqw7SC2hcCdkgm1UKBDUE6DCYJ4kubonk",
    HOSICO: "Dx2bQe2UPv4k3BmcW8G2KhaL5oKsxduM5XxLSV3Sbonk",
    RAIN: "3iC63FgnB7EhcPaiSaC51UkVweeBDkqu17SaRyy2pump",
    BLACKCOIN: "J3rYdme789g1zAysfbH9oP4zjagvfVM2PX7KJgFDpump",
} as const;

// Degen vault target tokens (RADR Supported Memes)
export const DEGEN_TOKENS = [
    "BONK", "JIM", "ORE", "ANON", "GODL", "HUSTLE", "POKI", "HOSICO", "RAIN", "BLACKCOIN"
] as const;

// Growth vault target allocation (Focused on RADR Shielded Tokens)
export const GROWTH_ALLOCATION = {
    SOL: 30,
    RADR: 30,
    ORE: 20,
    ANON: 20,
} as const;


