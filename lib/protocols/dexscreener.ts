/**
 * DexScreener Integration
 * Used for meme coin discovery and trading signals in the Degen vault.
 * Non-logging policy: no addresses or amounts in logs.
 */
import { MemeToken } from "./types.js";
import { logger } from "../logger.js";

const DEXSCREENER_API = "https://api.dexscreener.com/latest/dex";

const log = (msg: string) => logger.info(msg, "DexScreener");

// Risk scoring criteria
const RISK_WEIGHTS = {
    liquidity: 0.3,      // Higher liquidity = lower risk
    volume: 0.2,         // Higher volume = lower risk
    age: 0.2,            // Older = lower risk
    priceChange: 0.15,   // Extreme moves = higher risk
    fdv: 0.15            // Very low FDV = higher risk
};

/**
 * Get trending tokens on Solana
 */
export async function getTrendingTokens(limit: number = 20): Promise<MemeToken[]> {
    try {
        log("Fetching trending tokens");

        const response = await fetch(`${DEXSCREENER_API}/pairs/solana`);

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const pairs = data.pairs || [];

        // Fallback for devnet/mock mode
        if (pairs.length === 0) {
            log("Using mock data");
            const mockTokens: MemeToken[] = [
                { address: "WIF...mock", symbol: "WIF", name: "dogwifhat", price: 3.24, priceChange24h: 12.5, volume24h: 45000000, liquidity: 12000000, fdv: 3200000000, createdAt: Date.now() - 86400000 * 30, riskScore: 35 },
                { address: "POPCAT...mock", symbol: "POPCAT", name: "Popcat", price: 0.85, priceChange24h: -5.2, volume24h: 12000000, liquidity: 4500000, fdv: 850000000, createdAt: Date.now() - 86400000 * 60, riskScore: 42 },
                { address: "BONK...mock", symbol: "BONK", name: "Bonk", price: 0.000024, priceChange24h: 2.1, volume24h: 85000000, liquidity: 15000000, fdv: 1600000000, createdAt: Date.now() - 86400000 * 365, riskScore: 25 },
                { address: "MEW...mock", symbol: "MEW", name: "cat in a dogs world", price: 0.005, priceChange24h: 18.7, volume24h: 25000000, liquidity: 8000000, fdv: 450000000, createdAt: Date.now() - 86400000 * 15, riskScore: 48 }
            ];
            return mockTokens.slice(0, limit);
        }

        // Filter and transform pairs to MemeToken format
        const tokens: MemeToken[] = pairs
            .slice(0, limit * 2) // Get extra to filter
            .filter((pair: any) => {
                // Filter criteria for potential meme coins:
                const volume = Number(pair.volume?.h24 || 0);
                const liquidity = Number(pair.liquidity?.usd || 0);
                const priceChange = Number(pair.priceChange?.h24 || 0);

                return (
                    volume > 50000 &&           // Minimum $50k daily volume
                    liquidity > 10000 &&        // Minimum $10k liquidity
                    Math.abs(priceChange) > 5   // At least 5% price movement
                );
            })
            .map((pair: any) => transformToMemeToken(pair))
            .slice(0, limit);

        log("Trending tokens fetched");

        return tokens;
    } catch {
        logger.error("Trending tokens error", "DexScreener");
        return [];
    }
}

/**
 * Get new token launches (< 24 hours old)
 */
export async function getNewLaunches(limit: number = 10): Promise<MemeToken[]> {
    try {
        log("Fetching new launches");

        const response = await fetch(`${DEXSCREENER_API}/pairs/solana`);
        const data = await response.json();
        const pairs = data.pairs || [];

        const now = Date.now();
        const oneDayAgo = now - 24 * 60 * 60 * 1000;

        const newTokens: MemeToken[] = pairs
            .filter((pair: any) => {
                const createdAt = pair.pairCreatedAt || 0;
                const liquidity = Number(pair.liquidity?.usd || 0);

                return (
                    createdAt > oneDayAgo &&
                    liquidity > 5000 // Minimum $5k liquidity
                );
            })
            .map((pair: any) => transformToMemeToken(pair))
            .sort((a: MemeToken, b: MemeToken) => b.volume24h - a.volume24h)
            .slice(0, limit);

        log("New launches fetched");

        return newTokens;
    } catch (error) {
        logger.error("New launches error", "DexScreener");
        return [];
    }
}

/**
 * Get token info by address
 */
export async function getTokenInfo(address: string): Promise<MemeToken | null> {
    try {
        const response = await fetch(`${DEXSCREENER_API}/tokens/${address}`);
        const data = await response.json();

        if (!data.pairs || data.pairs.length === 0) {
            return null;
        }

        // Get the pair with highest liquidity
        const bestPair = data.pairs.reduce((best: any, pair: any) => {
            const pairLiquidity = Number(pair.liquidity?.usd || 0);
            const bestLiquidity = Number(best.liquidity?.usd || 0);
            return pairLiquidity > bestLiquidity ? pair : best;
        }, data.pairs[0]);

        return transformToMemeToken(bestPair);
    } catch (error) {
        logger.error("Token info error", "DexScreener");
        return null;
    }
}

/**
 * Calculate risk score for a token (0-100, higher = riskier)
 */
export function calculateRiskScore(token: MemeToken): number {
    let score = 50; // Base risk score

    // Liquidity factor (lower liquidity = higher risk)
    if (token.liquidity < 10000) score += 30;
    else if (token.liquidity < 50000) score += 20;
    else if (token.liquidity < 100000) score += 10;
    else if (token.liquidity > 500000) score -= 10;

    // Volume factor
    if (token.volume24h < 10000) score += 15;
    else if (token.volume24h > 500000) score -= 10;

    // Age factor (new tokens are riskier)
    const ageHours = (Date.now() - token.createdAt) / (1000 * 60 * 60);
    if (ageHours < 1) score += 25;
    else if (ageHours < 6) score += 15;
    else if (ageHours < 24) score += 10;
    else if (ageHours > 72) score -= 5;

    // Extreme price movements = higher risk
    const absChange = Math.abs(token.priceChange24h);
    if (absChange > 100) score += 20;
    else if (absChange > 50) score += 10;

    // FDV factor (very low or very high = risky)
    if (token.fdv < 100000) score += 15;
    else if (token.fdv > 100000000) score += 10;

    // Clamp to 0-100
    return Math.max(0, Math.min(100, score));
}

/**
 * Filter tokens by risk tolerance
 */
export function filterByRisk(
    tokens: MemeToken[],
    maxRisk: number = 70
): MemeToken[] {
    return tokens.filter(token => token.riskScore <= maxRisk);
}

/**
 * Get top momentum plays (high volume + positive price action)
 */
export async function getMomentumPlays(limit: number = 5): Promise<MemeToken[]> {
    const trending = await getTrendingTokens(50);

    return trending
        .filter(token =>
            token.priceChange24h > 20 &&      // Up at least 20%
            token.volume24h > 100000 &&       // High volume
            token.riskScore < 70              // Not too risky
        )
        .sort((a, b) => {
            // Score by combination of momentum and safety
            const scoreA = a.priceChange24h * (100 - a.riskScore) / 100;
            const scoreB = b.priceChange24h * (100 - b.riskScore) / 100;
            return scoreB - scoreA;
        })
        .slice(0, limit);
}

/**
 * Get potential dip buy opportunities
 */
export async function getDipBuyOpportunities(limit: number = 5): Promise<MemeToken[]> {
    const trending = await getTrendingTokens(50);

    return trending
        .filter(token =>
            token.priceChange24h < -20 &&     // Down at least 20%
            token.priceChange24h > -60 &&     // But not crashed completely
            token.liquidity > 50000 &&        // Still has liquidity
            token.riskScore < 65              // Not too risky
        )
        .sort((a, b) => a.priceChange24h - b.priceChange24h) // Most oversold first
        .slice(0, limit);
}

/**
 * Transform DexScreener pair data to MemeToken
 */
function transformToMemeToken(pair: any): MemeToken {
    const token: MemeToken = {
        address: pair.baseToken?.address || "",
        symbol: pair.baseToken?.symbol || "UNKNOWN",
        name: pair.baseToken?.name || "Unknown Token",
        price: Number(pair.priceUsd || 0),
        priceChange24h: Number(pair.priceChange?.h24 || 0),
        volume24h: Number(pair.volume?.h24 || 0),
        liquidity: Number(pair.liquidity?.usd || 0),
        fdv: Number(pair.fdv || 0),
        createdAt: pair.pairCreatedAt || Date.now(),
        riskScore: 50 // Will be calculated
    };

    // Calculate actual risk score
    token.riskScore = calculateRiskScore(token);

    return token;
}

/**
 * Get Solana DEX total volume (for market sentiment)
 */
export async function getTotalSolanaVolume(): Promise<number> {
    try {
        const response = await fetch(`${DEXSCREENER_API}/pairs/solana`);
        const data = await response.json();
        const pairs = data.pairs || [];

        return pairs
            .slice(0, 100)
            .reduce((total: number, pair: any) =>
                total + Number(pair.volume?.h24 || 0), 0
            );
    } catch (error) {
        logger.error("Volume fetch error", "DexScreener");
        return 0;
    }
}
