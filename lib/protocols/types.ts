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
// - On mainnet-beta we use canonical mints. RADR-supported mints override via env (e.g. ORE_MINT).
const IS_DEVNET =
    (process.env.SOLANA_RPC_URL || "").includes("devnet") ||
    (process.env.SHADOWWIRE_CLUSTER || "").includes("devnet");

/** RADR Labs shielded supported tokens: symbol → decimals and fee (source: RADR Labs) */
export const RADR_SUPPORTED_TOKENS: ReadonlyArray<{ symbol: string; decimals: number; feePercent: number }> = [
    { symbol: "SOL", decimals: 9, feePercent: 0.5 },
    { symbol: "RADR", decimals: 9, feePercent: 0.3 },
    { symbol: "USDC", decimals: 6, feePercent: 1 },
    { symbol: "GLDr", decimals: 6, feePercent: 0.5 },
    { symbol: "SLVr", decimals: 6, feePercent: 0.5 },
    { symbol: "CPERr", decimals: 6, feePercent: 0.5 },
    { symbol: "ORE", decimals: 11, feePercent: 0.3 },
    { symbol: "BONK", decimals: 5, feePercent: 1 },
    { symbol: "JIM", decimals: 9, feePercent: 1 },
    { symbol: "GODL", decimals: 11, feePercent: 1 },
    { symbol: "HUSTLE", decimals: 9, feePercent: 0.3 },
    { symbol: "ZEC", decimals: 9, feePercent: 1 },
    { symbol: "CRT", decimals: 9, feePercent: 1 },
    { symbol: "BLACKCOIN", decimals: 6, feePercent: 1 },
    { symbol: "GIL", decimals: 6, feePercent: 1 },
    { symbol: "ANON", decimals: 9, feePercent: 1 },
    { symbol: "WLFI", decimals: 6, feePercent: 1 },
    { symbol: "USD1", decimals: 6, feePercent: 1 },
    { symbol: "AOL", decimals: 6, feePercent: 1 },
    { symbol: "IQLABS", decimals: 9, feePercent: 0.5 },
    { symbol: "SANA", decimals: 6, feePercent: 1 },
    { symbol: "POKI", decimals: 9, feePercent: 1 },
    { symbol: "RAIN", decimals: 6, feePercent: 2 },
    { symbol: "HOSICO", decimals: 9, feePercent: 1 },
    { symbol: "SKR", decimals: 6, feePercent: 0.5 },
];

export function getRADRDecimals(symbol: string): number {
    const t = RADR_SUPPORTED_TOKENS.find((x) => x.symbol === symbol);
    return t?.decimals ?? 9;
}

// Mints: env override per token (e.g. ORE_MINT, ANON_MINT); fallback placeholders for dev/demo
const SOL_MINT = "So11111111111111111111111111111111111111112";
const USDC_MINT = IS_DEVNET ? "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU" : "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const USD1_MINT = IS_DEVNET ? "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU" : "USD1ttGY1N17NEEHLmELoaybftRBUSErhqYiQzvEmuB";
const BONK_MINT = "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263";
const GLDR_MINT = process.env.GLDR_MINT || "AEv6xLECJ2KKmwFGX85mHb9S2c2BQE7dqE5midyrXHBb";
const SLVR_MINT = process.env.SLVR_MINT || "7C56WnJ94iEP7YeH2iKiYpvsS5zkcpP9rJBBEBoUGdzj";
const CPER_MINT = process.env.CPER_MINT || "C3VLBJB2FhEb47s1WEgroyn3BnSYXaezqtBuu5WNmUGw";

export const TOKENS = {
    USD1: USD1_MINT,
    USDC: USDC_MINT,
    SOL: SOL_MINT,
    WSOL: SOL_MINT,
    WETH: process.env.WETH_MINT || "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs",
    WBTC: process.env.WBTC_MINT || "3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh",
    BONK: BONK_MINT,
    GLDR: GLDR_MINT,
    SLVR: SLVR_MINT,
    CPER: CPER_MINT,
    RADR: process.env.RADR_MINT || SOL_MINT,
    ORE: process.env.ORE_MINT || SOL_MINT,
    ANON: process.env.ANON_MINT || SOL_MINT,
    JIM: process.env.JIM_MINT || SOL_MINT,
    GODL: process.env.GODL_MINT || SOL_MINT,
    HUSTLE: process.env.HUSTLE_MINT || SOL_MINT,
    ZEC: process.env.ZEC_MINT || SOL_MINT,
    CRT: process.env.CRT_MINT || SOL_MINT,
    BLACKCOIN: process.env.BLACKCOIN_MINT || SOL_MINT,
    GIL: process.env.GIL_MINT || SOL_MINT,
    WLFI: process.env.WLFI_MINT || SOL_MINT,
    AOL: process.env.AOL_MINT || SOL_MINT,
    IQLABS: process.env.IQLABS_MINT || SOL_MINT,
    SANA: process.env.SANA_MINT || SOL_MINT,
    POKI: process.env.POKI_MINT || SOL_MINT,
    RAIN: process.env.RAIN_MINT || SOL_MINT,
    HOSICO: process.env.HOSICO_MINT || SOL_MINT,
    SKR: process.env.SKR_MINT || SOL_MINT,
} as const;

/** Growth vault: RADR-shielded tokens only (SOL, RADR, ORE, ANON) */
export const GROWTH_ALLOCATION = {
    SOL: 40,
    RADR: 25,
    ORE: 20,
    ANON: 15,
} as const;

/** Degen vault: RADR-shielded meme/ecosystem tokens */
export const DEGEN_TOKENS = ["SOL", "BONK", "RADR", "JIM", "POKI"] as const;

/** RWA vault: tokenized precious metals via Remora Markets */
export const RWA_TOKENS = [
    { symbol: "GLDr", token: TOKENS.GLDR, min: 0.02, feePercent: 0.5, decimals: 6 },
    { symbol: "SLVr", token: TOKENS.SLVR, min: 0.05, feePercent: 0.5, decimals: 6 },
    { symbol: "CPERr", token: TOKENS.CPER, min: 0.1, feePercent: 0.5, decimals: 6 }
] as const;
