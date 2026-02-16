/**
 * Strategy Index
 * Central export point for all vault strategies
 */

// Types
export * from "./types.js";

// Individual strategies
export { reserveStrategy, executeReserveStrategy } from "./reserve.js";
export { yieldStrategy, executeYieldStrategy, getYieldAnalytics } from "./yield.js";
export { growthStrategy, executeGrowthStrategy } from "./growth.js";
export { degenStrategy, executeDegenStrategy } from "./degen.js";
export { rwaStrategy, executeRwaStrategy } from "./rwa.js";

import { reserveStrategy } from "./reserve.js";
import { yieldStrategy, getYieldAnalytics } from "./yield.js";
import { growthStrategy } from "./growth.js";
import { degenStrategy } from "./degen.js";
import { rwaStrategy } from "./rwa.js";
import { VaultStats, StrategyExecutionResult } from "./types.js";
import { logger } from "../logger.js";

const log = (msg: string) => logger.info(msg, "STRATEGY");

/**
 * Execute all vault strategies based on AI allocation
 */
export async function executeAllStrategies(
    walletAddress: string,
    totalValue: number,
    allocation: {
        reserve: number;
        yield: number;
        growth: number;
        degen: number;
        rwa: number;
    },
    signals: {
        memeHype: "high" | "medium" | "low";
    }
): Promise<{
    success: boolean;
    results: Record<string, StrategyExecutionResult>;
    errors: string[];
}> {
    log("Executing all vault strategies");

    const results: Record<string, StrategyExecutionResult> = {};
    const errors: string[] = [];

    // Calculate target amounts
    const targets = {
        reserve: totalValue * (allocation.reserve / 100),
        yield: totalValue * (allocation.yield / 100),
        growth: totalValue * (allocation.growth / 100),
        degen: totalValue * (allocation.degen / 100),
        rwa: totalValue * (allocation.rwa / 100),
    };

    log("Targets set");

    // Execute strategies in order (reserve first as it's the source)
    try {
        // 1. Reserve Strategy
        log("Reserve vault");
        const { executeReserveStrategy } = await import("./reserve.js");
        results.reserve = await executeReserveStrategy(walletAddress, targets.reserve);
    } catch (error) {
        errors.push(`Reserve: ${error instanceof Error ? error.message : "Unknown error"}`);
    }

    try {
        // 2. Yield Strategy
        log("Yield vault");
        const { executeYieldStrategy } = await import("./yield.js");
        results.yield = await executeYieldStrategy(walletAddress, targets.yield, "low");
    } catch (error) {
        errors.push(`Yield: ${error instanceof Error ? error.message : "Unknown error"}`);
    }

    try {
        // 3. Growth Strategy
        log("Growth vault");
        const { executeGrowthStrategy } = await import("./growth.js");
        results.growth = await executeGrowthStrategy(walletAddress, targets.growth);
    } catch (error) {
        errors.push(`Growth: ${error instanceof Error ? error.message : "Unknown error"}`);
    }

    try {
        // 4. Degen Strategy
        log("Degen vault");
        const { executeDegenStrategy } = await import("./degen.js");
        results.degen = await executeDegenStrategy(walletAddress, targets.degen, signals.memeHype);
    } catch (error) {
        errors.push(`Degen: ${error instanceof Error ? error.message : "Unknown error"}`);
    }

    try {
        // 5. RWA Strategy
        log("RWA vault");
        const { executeRwaStrategy } = await import("./rwa.js");
        results.rwa = await executeRwaStrategy(walletAddress, targets.rwa);
    } catch (error) {
        errors.push(`RWA: ${error instanceof Error ? error.message : "Unknown error"}`);
    }

    log("Execution complete");

    return {
        success: errors.length === 0,
        results,
        errors
    };
}

/**
 * Get comprehensive vault statistics
 */
export async function getVaultStats(walletAddress: string): Promise<VaultStats> {
    // Run sequentially to reduce RPC burstiness (public Solana RPCs are easy to 429).
    // This is slower but dramatically more reliable for hackathon/demo environments.
    const reserveStatus = await reserveStrategy.getStatus(walletAddress);
    const yieldStatus = await yieldStrategy.getStatus(walletAddress);
    const growthStatus = await growthStrategy.getStatus(walletAddress);
    const degenStatus = await degenStrategy.getStatus(walletAddress);
    const rwaStatus = await rwaStrategy.getStatus(walletAddress);

    const total =
        reserveStatus.currentValue +
        yieldStatus.currentValue +
        growthStatus.currentValue +
        degenStatus.currentValue +
        rwaStatus.currentValue;

    const yieldAnalytics = await getYieldAnalytics(walletAddress);

    return {
        reserve: {
            balance: reserveStatus.currentValue,
            percentage: total > 0 ? (reserveStatus.currentValue / total) * 100 : 0
        },
        yield: {
            balance: yieldStatus.currentValue,
            percentage: total > 0 ? (yieldStatus.currentValue / total) * 100 : 0,
            apy: yieldAnalytics.apy,
            earned: yieldAnalytics.earnedTotal
        },
        growth: {
            balance: growthStatus.currentValue,
            percentage: total > 0 ? (growthStatus.currentValue / total) * 100 : 0,
            positions: growthStatus.positions,
            pnl: growthStatus.pnl
        },
        degen: {
            balance: degenStatus.currentValue,
            percentage: total > 0 ? (degenStatus.currentValue / total) * 100 : 0,
            positions: degenStatus.positions,
            pnl: degenStatus.pnl
        },
        rwa: {
            balance: rwaStatus.currentValue,
            percentage: total > 0 ? (rwaStatus.currentValue / total) * 100 : 0,
            positions: rwaStatus.positions,
            pnl: rwaStatus.pnl
        },
        total
    };
}

/**
 * Get all transaction signatures from strategy execution
 */
export function getAllTransactions(results: Record<string, StrategyExecutionResult>): string[] {
    const txs: string[] = [];

    for (const result of Object.values(results)) {
        if (result?.txSignatures) {
            txs.push(...result.txSignatures);
        }
    }

    return txs;
}
