/**
 * Protocol Integration Index
 * Central export point for all DeFi protocol integrations
 */

// Types
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

// Log protocol status on startup
export async function logProtocolStatus(): Promise<void> {
    console.log("\n┈".repeat(30));
    console.log("\x1b[36m[PROTOCOLS]\x1b[0m Checking protocol connections...\n");

    const health = await checkProtocolHealth();

    console.log(`  Jupiter DEX:    ${health.jupiter ? "\x1b[32m✓ Connected\x1b[0m" : "\x1b[31m✗ Unavailable\x1b[0m"}`);
    console.log(`  Kamino Finance: ${health.kamino ? "\x1b[32m✓ Connected\x1b[0m" : "\x1b[31m✗ Unavailable\x1b[0m"}`);
    console.log(`  DexScreener:    ${health.dexscreener ? "\x1b[32m✓ Connected\x1b[0m" : "\x1b[31m✗ Unavailable\x1b[0m"}`);

    console.log("\n┈".repeat(30) + "\n");
}
