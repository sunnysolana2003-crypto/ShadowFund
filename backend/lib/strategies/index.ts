/**
 * Strategy Index
 * Central export point for all vault strategies
 */

// Types
export * from "./types";

// Individual strategies
export { reserveStrategy, executeReserveStrategy } from "./reserve";
export { yieldStrategy, executeYieldStrategy, getYieldAnalytics } from "./yield";
export { growthStrategy, executeGrowthStrategy } from "./growth";
export { degenStrategy, executeDegenStrategy } from "./degen";

import { reserveStrategy } from "./reserve";
import { yieldStrategy, getYieldAnalytics } from "./yield";
import { growthStrategy } from "./growth";
import { degenStrategy } from "./degen";
import { VaultStats, StrategyExecutionResult } from "./types";

// Color-coded logging
const log = (msg: string, data?: any) => {
    console.log(`\x1b[35m[STRATEGY ORCHESTRATOR]\x1b[0m ${msg}`);
    if (data) console.log(`\x1b[35m  └─\x1b[0m`, JSON.stringify(data, null, 2));
};

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
    },
    signals: {
        memeHype: "high" | "medium" | "low";
    }
): Promise<{
    success: boolean;
    results: Record<string, StrategyExecutionResult>;
    errors: string[];
}> {
    log(`Executing all vault strategies`);
    log(`Total Value: $${totalValue}`);
    log(`Allocation:`, allocation);

    const results: Record<string, StrategyExecutionResult> = {};
    const errors: string[] = [];

    // Calculate target amounts
    const targets = {
        reserve: totalValue * (allocation.reserve / 100),
        yield: totalValue * (allocation.yield / 100),
        growth: totalValue * (allocation.growth / 100),
        degen: totalValue * (allocation.degen / 100),
    };

    log(`Target amounts:`, targets);

    // Execute strategies in order (reserve first as it's the source)
    try {
        // 1. Reserve Strategy
        log(`\n━━━ Reserve Vault ━━━`);
        const { executeReserveStrategy } = await import("./reserve");
        results.reserve = await executeReserveStrategy(walletAddress, targets.reserve);
    } catch (error) {
        errors.push(`Reserve: ${error instanceof Error ? error.message : "Unknown error"}`);
    }

    try {
        // 2. Yield Strategy
        log(`\n━━━ Yield Vault ━━━`);
        const { executeYieldStrategy } = await import("./yield");
        results.yield = await executeYieldStrategy(walletAddress, targets.yield, "low");
    } catch (error) {
        errors.push(`Yield: ${error instanceof Error ? error.message : "Unknown error"}`);
    }

    try {
        // 3. Growth Strategy
        log(`\n━━━ Growth Vault ━━━`);
        const { executeGrowthStrategy } = await import("./growth");
        results.growth = await executeGrowthStrategy(walletAddress, targets.growth);
    } catch (error) {
        errors.push(`Growth: ${error instanceof Error ? error.message : "Unknown error"}`);
    }

    try {
        // 4. Degen Strategy
        log(`\n━━━ Degen Vault ━━━`);
        const { executeDegenStrategy } = await import("./degen");
        results.degen = await executeDegenStrategy(walletAddress, targets.degen, signals.memeHype);
    } catch (error) {
        errors.push(`Degen: ${error instanceof Error ? error.message : "Unknown error"}`);
    }

    log(`\n━━━ Execution Complete ━━━`);
    log(`Results:`, {
        reserve: results.reserve?.success,
        yield: results.yield?.success,
        growth: results.growth?.success,
        degen: results.degen?.success,
        errors: errors.length
    });

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
    const [reserveStatus, yieldStatus, growthStatus, degenStatus] = await Promise.all([
        reserveStrategy.getStatus(walletAddress),
        yieldStrategy.getStatus(walletAddress),
        growthStrategy.getStatus(walletAddress),
        degenStrategy.getStatus(walletAddress)
    ]);

    const total =
        reserveStatus.currentValue +
        yieldStatus.currentValue +
        growthStatus.currentValue +
        degenStatus.currentValue;

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
