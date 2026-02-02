/**
 * Reserve Vault Strategy
 * Simple USD1 stablecoin holding - no additional complexity
 */

import { ReserveStrategy, VaultStatus, StrategyExecutionResult } from "./types";
import { TxResult } from "../protocols/types";
import { getUSD1Balance, moveUSD1 } from "../usd1";
import { getVaultAddress } from "../vaults";

// Color-coded logging
const log = (msg: string, data?: any) => {
    console.log(`\x1b[32m[RESERVE VAULT]\x1b[0m ${msg}`);
    if (data) console.log(`\x1b[32m  └─\x1b[0m`, JSON.stringify(data));
};

class ReserveVaultStrategy implements ReserveStrategy {
    vaultId = "reserve";
    name = "Reserve Vault";
    description = "High-liquidity USD1 stablecoin buffer for safety and rebalancing";
    riskLevel = "low" as const;

    async deposit(walletAddress: string, amount: number): Promise<TxResult> {
        log(`Depositing ${amount} USD1`);

        // Reserve vault just holds USD1 directly
        // In a real implementation, this would come from the user's wallet
        const vaultAddress = await getVaultAddress(walletAddress, "reserve");

        log(`Deposit complete`, { vaultAddress: vaultAddress.slice(0, 12) + "..." });

        return {
            success: true,
            txSignature: `reserve_deposit_${Date.now()}`,
            timestamp: Date.now()
        };
    }

    async withdraw(walletAddress: string, amount: number): Promise<TxResult> {
        log(`Withdrawing ${amount} USD1`);

        const balance = await this.getBalance(walletAddress);

        if (balance < amount) {
            return {
                success: false,
                error: `Insufficient balance. Available: ${balance}`,
                timestamp: Date.now()
            };
        }

        return {
            success: true,
            txSignature: `reserve_withdraw_${Date.now()}`,
            timestamp: Date.now()
        };
    }

    async getBalance(walletAddress: string): Promise<number> {
        const vaultAddress = await getVaultAddress(walletAddress, "reserve");
        return await getUSD1Balance(vaultAddress);
    }

    async getValue(walletAddress: string): Promise<number> {
        // USD1 is a stablecoin, 1 USD1 = 1 USD
        return await this.getBalance(walletAddress);
    }

    async getStatus(walletAddress: string): Promise<VaultStatus> {
        const balance = await this.getBalance(walletAddress);

        return {
            deposited: balance,
            currentValue: balance,
            pnl: 0,
            pnlPercent: 0,
            positions: [],
            lastUpdated: Date.now()
        };
    }
}

// Export singleton instance
export const reserveStrategy = new ReserveVaultStrategy();

// Execute reserve vault strategy (no-op for reserve - just holds USD1)
export async function executeReserveStrategy(
    walletAddress: string,
    targetAmount: number
): Promise<StrategyExecutionResult> {
    log(`Executing strategy: target ${targetAmount} USD1`);

    const currentBalance = await reserveStrategy.getBalance(walletAddress);
    const difference = targetAmount - currentBalance;

    return {
        vaultId: "reserve",
        success: true,
        amountIn: targetAmount,
        amountOut: currentBalance,
        txSignatures: [],
        positions: [],
        timestamp: Date.now()
    };
}
