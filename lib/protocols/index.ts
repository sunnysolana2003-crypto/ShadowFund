/**
 * Protocol Integration Index
 * Central export point for all DeFi protocol integrations
 */
import { logger } from "../logger";

export * from "./types";

// Jupiter - DEX Aggregator
import * as jupiter from "./jupiter";
export { jupiter };

// Kamino - Yield Farming
import * as kamino from "./kamino";
export { kamino };

// DexScreener - Token Discovery
import * as dexscreener from "./dexscreener";
export { dexscreener };

// Protocol status check
export async function checkProtocolHealth(): Promise<{
    jupiter: boolean;
    kamino: boolean;
    dexscreener: boolean;
}> {
    const results = {
        jupiter: false,
        kamino: false,
        dexscreener: false
    };

    try {
        // Check Jupiter
        const solPrice = await jupiter.getTokenPrice("So11111111111111111111111111111111111111112");
        results.jupiter = solPrice > 0;
    } catch {
        results.jupiter = false;
    }

    try {
        // Check Kamino (simulated - always available)
        results.kamino = true;
    } catch {
        results.kamino = false;
    }

    try {
        // Check DexScreener
        const trending = await dexscreener.getTrendingTokens(1);
        results.dexscreener = trending.length > 0;
    } catch {
        results.dexscreener = false;
    }

    return results;
}

export async function logProtocolStatus(): Promise<void> {
    const health = await checkProtocolHealth();
    logger.info("Protocol health", "Protocols", {
        jupiter: health.jupiter,
        kamino: health.kamino,
        dexscreener: health.dexscreener
    });
}
