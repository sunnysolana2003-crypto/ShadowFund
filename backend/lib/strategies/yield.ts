/**
 * Yield Vault Strategy
 * Deploys USD1 into lending protocols for yield generation
 */

import { YieldStrategy, VaultStatus, StrategyExecutionResult } from "./types";
import { TxResult, LendingPosition } from "../protocols/types";
import { kamino } from "../protocols";
import { getVaultAddress } from "../vaults";

// Color-coded logging
const log = (msg: string, data?: any) => {
    console.log(`\x1b[33m[YIELD VAULT]\x1b[0m ${msg}`);
    if (data) console.log(`\x1b[33m  └─\x1b[0m`, JSON.stringify(data));
};

class YieldVaultStrategy implements YieldStrategy {
    vaultId = "yield";
    name = "Yield Vault";
    description = "Optimized stablecoin farming via Kamino lending protocols";
    riskLevel = "low" as const;

    async deposit(walletAddress: string, amount: number): Promise<TxResult> {
        log(`Depositing ${amount} USD1 into Kamino`);

        // Deposit into Kamino's USD1 lending strategy
        const result = await kamino.deposit(walletAddress, amount, "USD1-LENDING");

        if (result.success) {
            log(`Deposit successful`, {
                txSignature: result.txSignature,
                apy: `${kamino.getCurrentAPY("USD1-LENDING")}%`
            });
        }

        return result;
    }

    async withdraw(walletAddress: string, amount: number): Promise<TxResult> {
        log(`Withdrawing ${amount} USD1 from Kamino`);

        const result = await kamino.withdraw(walletAddress, amount, "USD1-LENDING");

        if (result.success) {
            log(`Withdrawal successful`);
        }

        return result;
    }

    async getBalance(walletAddress: string): Promise<number> {
        const position = kamino.getPosition(walletAddress);
        return position?.deposited || 0;
    }

    async getValue(walletAddress: string): Promise<number> {
        // Accrue any pending yield first
        kamino.accrueYield(walletAddress);
        return kamino.getTotalValue(walletAddress);
    }

    async getCurrentAPY(): Promise<number> {
        return kamino.getCurrentAPY("USD1-LENDING");
    }

    async getEarnedYield(walletAddress: string): Promise<number> {
        kamino.accrueYield(walletAddress);
        return kamino.getTotalEarned(walletAddress);
    }

    async compound(walletAddress: string): Promise<TxResult> {
        log(`Compounding yield for ${walletAddress.slice(0, 8)}...`);

        // In Kamino, yields are auto-compounded
        kamino.accrueYield(walletAddress);

        return {
            success: true,
            txSignature: `yield_compound_${Date.now()}`,
            timestamp: Date.now()
        };
    }

    async getPositions(walletAddress: string): Promise<LendingPosition[]> {
        return kamino.getAllPositions(walletAddress);
    }

    async getStatus(walletAddress: string): Promise<VaultStatus> {
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
    log(`Executing strategy: target ${targetAmount} USD1, risk: ${riskProfile}`);

    const currentValue = await yieldStrategy.getValue(walletAddress);
    const difference = targetAmount - currentValue;

    const txSignatures: string[] = [];

    if (Math.abs(difference) > 1) { // Only act if difference > $1
        if (difference > 0) {
            // Need to deposit more
            log(`Depositing additional ${difference} USD1`);
            const depositResult = await yieldStrategy.deposit(walletAddress, difference);
            if (depositResult.txSignature) {
                txSignatures.push(depositResult.txSignature);
            }
        } else {
            // Need to withdraw
            log(`Withdrawing ${Math.abs(difference)} USD1`);
            const withdrawResult = await yieldStrategy.withdraw(walletAddress, Math.abs(difference));
            if (withdrawResult.txSignature) {
                txSignatures.push(withdrawResult.txSignature);
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
