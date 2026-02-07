/**
 * Yield Vault Strategy
 * Deploys USD1 into Kamino lending for yield.
 * Kamino deposits/withdrawals use the user wallet (or KAMINO_WALLET_* if set);
 * rebalance moves USD1 to vault PDAs via ShadowWire separately.
 */

import { YieldStrategy, VaultStatus, StrategyExecutionResult } from "./types.js";
import { TxResult, LendingPosition } from "../protocols/types.js";
import { kamino } from "../protocols/index.js";
import { getVaultAddress } from "../vaults.js";
import { logger } from "../logger.js";

const log = (msg: string) => logger.info(msg, "YIELD");

class YieldVaultStrategy implements YieldStrategy {
    vaultId = "yield";
    name = "Yield Vault";
    description = "Optimized stablecoin farming via Kamino lending protocols";
    riskLevel = "low" as const;

    async deposit(walletAddress: string, amount: number): Promise<TxResult> {
        log("Deposit started");
        const result = await kamino.deposit(walletAddress, amount, "USD1-LENDING");
        if (result.success) log("Deposit successful");

        return result;
    }

    async withdraw(walletAddress: string, amount: number): Promise<TxResult> {
        log("Withdraw started");
        const result = await kamino.withdraw(walletAddress, amount, "USD1-LENDING");
        if (result.success) log("Withdrawal successful");

        return result;
    }

    async getBalance(walletAddress: string): Promise<number> {
        await kamino.loadPositionsFromChain(walletAddress);
        const position = kamino.getPosition(walletAddress);
        return position?.deposited || 0;
    }

    async getValue(walletAddress: string): Promise<number> {
        // Accrue any pending yield first
        await kamino.loadPositionsFromChain(walletAddress);
        kamino.accrueYield(walletAddress);
        return kamino.getTotalValue(walletAddress);
    }

    async getCurrentAPY(): Promise<number> {
        return kamino.getCurrentAPY("USD1-LENDING");
    }

    async getEarnedYield(walletAddress: string): Promise<number> {
        await kamino.loadPositionsFromChain(walletAddress);
        kamino.accrueYield(walletAddress);
        return kamino.getTotalEarned(walletAddress);
    }

    async compound(walletAddress: string): Promise<TxResult> {
        log("Compound");
        kamino.accrueYield(walletAddress);

        return {
            success: true,
            txSignature: `yield_compound_${Date.now()}`,
            timestamp: Date.now()
        };
    }

    async getPositions(walletAddress: string): Promise<LendingPosition[]> {
        await kamino.loadPositionsFromChain(walletAddress);
        return kamino.getAllPositions(walletAddress);
    }

    async getStatus(walletAddress: string): Promise<VaultStatus> {
        await kamino.loadPositionsFromChain(walletAddress);
        kamino.accrueYield(walletAddress);

        const deposited = await this.getBalance(walletAddress);
        const currentValue = await this.getValue(walletAddress);
        const earned = await this.getEarnedYield(walletAddress);
        const positions = await this.getPositions(walletAddress);

        return {
            deposited,
            currentValue,
            pnl: earned,
            pnlPercent: deposited > 0 ? (earned / deposited) * 100 : 0,
            positions,
            lastUpdated: Date.now()
        };
    }
}

// Export singleton instance
export const yieldStrategy = new YieldVaultStrategy();

// Execute yield vault strategy
export async function executeYieldStrategy(
    walletAddress: string,
    targetAmount: number,
    riskProfile: "low" | "medium" | "high" = "low"
): Promise<StrategyExecutionResult> {
    log("Executing strategy");

    await kamino.loadPositionsFromChain(walletAddress);

    const currentValue = await yieldStrategy.getValue(walletAddress);
    const difference = targetAmount - currentValue;

    const txSignatures: string[] = [];
    const unsignedTxs: string[] = [];

    if (Math.abs(difference) > 1) { // Only act if difference > $1
        if (difference > 0) {
            // Need to deposit more
            log("Depositing");
            const depositResult = await yieldStrategy.deposit(walletAddress, difference);
            if (!depositResult.success) {
                throw new Error(depositResult.error || "Kamino deposit failed");
            }
            if (depositResult.txSignature) {
                txSignatures.push(depositResult.txSignature);
            }
            if ((depositResult as any).unsigned_tx_base64) {
                unsignedTxs.push((depositResult as any).unsigned_tx_base64);
            }
        } else {
            // Need to withdraw
            log("Withdrawing");
            const withdrawResult = await yieldStrategy.withdraw(walletAddress, Math.abs(difference));
            if (!withdrawResult.success) {
                throw new Error(withdrawResult.error || "Kamino withdraw failed");
            }
            if (withdrawResult.txSignature) {
                txSignatures.push(withdrawResult.txSignature);
            }
            if ((withdrawResult as any).unsigned_tx_base64) {
                unsignedTxs.push((withdrawResult as any).unsigned_tx_base64);
            }
        }
    }

    // Compound any pending yield
    await yieldStrategy.compound(walletAddress);

    const finalValue = await yieldStrategy.getValue(walletAddress);
    const positions = await yieldStrategy.getPositions(walletAddress);

    return {
        vaultId: "yield",
        success: true,
        amountIn: targetAmount,
        amountOut: finalValue,
        txSignatures,
        unsignedTxs: unsignedTxs.length > 0 ? unsignedTxs : undefined,
        positions,
        timestamp: Date.now()
    };
}

// Get yield vault analytics
export async function getYieldAnalytics(walletAddress: string): Promise<{
    apy: number;
    earned24h: number;
    earnedTotal: number;
    projectedMonthly: number;
}> {
    const apy = await yieldStrategy.getCurrentAPY();
    const currentValue = await yieldStrategy.getValue(walletAddress);
    const earnedTotal = await yieldStrategy.getEarnedYield(walletAddress);

    // Calculate projections
    const dailyRate = apy / 365;
    const earned24h = currentValue * (dailyRate / 100);
    const projectedMonthly = currentValue * (dailyRate / 100) * 30;

    return {
        apy,
        earned24h,
        earnedTotal,
        projectedMonthly
    };
}
