import { logger } from "../logger.js";

const COINGECKO = "https://api.coingecko.com/api/v3";
const DEXSCREENER = "https://api.dexscreener.com/latest/dex";

function rsi(prices: number[], period = 14): number {
    let gains = 0, losses = 0;
    for (let i = 1; i <= period; i++) {
        const diff = prices[i] - prices[i - 1];
        if (diff >= 0) gains += diff;
        else losses -= diff;
    }
    const rs = gains / Math.max(1e-6, losses);
    return 100 - 100 / (1 + rs);
}

function volatility(prices: number[]): number {
    const returns = prices.slice(1).map((p, i) => (p - prices[i]) / prices[i]);
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / returns.length;
    return Math.sqrt(variance);
}

export interface MarketSignals {
    solTrend: "bullish" | "bearish";
    solRSI: number;
    memeHype: "high" | "medium" | "low";
    volatility: "high" | "medium" | "low";
}

export async function getMarketSignals(): Promise<MarketSignals> {
    try {
        // SOL market data
        const solRes = await fetch(
            `${COINGECKO}/coins/solana/market_chart?vs_currency=usd&days=7&interval=hourly`
        );
        const sol = await solRes.json();

        const prices: number[] = sol.prices?.map((p: number[]) => p[1]) || [];

        if (prices.length < 15) {
            // Return default values if not enough data
            return {
                solTrend: "neutral" as any,
                solRSI: 50,
                memeHype: "medium",
                volatility: "medium"
            };
        }

        const solRSI = rsi(prices.slice(-15));
        const vol = volatility(prices.slice(-24));

        const solTrend =
            prices[prices.length - 1] > prices[prices.length - 24]
                ? "bullish"
                : "bearish";

        // Meme coin activity (volume proxy)
        const dexRes = await fetch(`${DEXSCREENER}/pairs/solana`);
        const dex = await dexRes.json();
        const totalMemeVol =
            dex.pairs?.slice(0, 50).reduce((a: number, p: any) => a + Number(p.volume?.h24 || 0), 0) || 0;

        const memeHype: "high" | "medium" | "low" =
            totalMemeVol > 50_000_000 ? "high" :
                totalMemeVol > 10_000_000 ? "medium" : "low";

        const volatilityLevel: "high" | "medium" | "low" =
            vol > 0.06 ? "high" : vol > 0.03 ? "medium" : "low";

        return {
            solTrend,
            solRSI,
            memeHype,
            volatility: volatilityLevel
        };
    } catch (error) {
        logger.error("Error fetching market signals", "Signals");
        // Return safe defaults on error
        return {
            solTrend: "bearish",
            solRSI: 50,
            memeHype: "low",
            volatility: "medium"
        };
    }
}
